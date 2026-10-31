import Foundation

struct UsageReading {
    let text: String
    let compactText: String
    static func parse(_ result: [String: Any]) throws -> UsageReading {
        let buckets = result["rateLimitsByLimitId"] as? [String: [String: Any]]
        let entries: [(String, [String: Any])]
        if let buckets, !buckets.isEmpty { entries = buckets.sorted { $0.key < $1.key }.map { ($0.key, $0.value) } }
        else if let legacy = result["rateLimits"] as? [String: Any] { entries = [("codex", legacy)] }
        else { throw NSError(domain: "No subscription usage returned. Sign in to Codex.", code: 1) }
        let lines = entries.flatMap { name, bucket in
            ["primary", "secondary"].compactMap { key -> String? in
                guard let window = bucket[key] as? [String: Any] else { return nil }
                let minutes = (window["windowDurationMins"] as? NSNumber)?.intValue ?? 0
                let period = minutes > 0 ? (minutes == 10080 ? "Weekly" : minutes % 1440 == 0 ? "\(minutes / 1440)d" : minutes % 60 == 0 ? "\(minutes / 60)h" : "\(minutes)m") : "Window"
                let left = (window["usedPercent"] as? NSNumber).map { String(format: "%.0f%% left", max(0, min(100, 100 - $0.doubleValue))) } ?? "Unavailable"
                var reset = ""
                if let stamp = window["resetsAt"] as? NSNumber {
                    let date = Date(timeIntervalSince1970: stamp.doubleValue)
                    reset = date <= Date() ? " · reset due, refresh to confirm" : " · resets \(date.formatted(date: .abbreviated, time: .shortened))"
                }
                return "\(name) \(period): \(left)\(reset)"
            }
        }
        guard !lines.isEmpty else { throw NSError(domain: "Usage windows unavailable", code: 1) }
        let main = entries.first(where: { $0.0 == "codex" })?.1 ?? entries[0].1
        let compact = [("primary", "5h"), ("secondary", "Weekly")].map { key, fallback in
            guard let window = main[key] as? [String: Any] else { return "\(fallback): Unavailable" }
            let minutes = (window["windowDurationMins"] as? NSNumber)?.intValue
            let period = minutes == 10080 ? "Weekly" : minutes == 300 ? "5h" : minutes.map { "\($0)m" } ?? fallback
            let left = (window["usedPercent"] as? NSNumber).map { String(format: "%.0f%% left", max(0, min(100, 100 - $0.doubleValue))) } ?? "Unavailable"
            return "\(period): \(left)"
        }.joined(separator: "\n")
        return UsageReading(text: lines.joined(separator: "\n"), compactText: compact)
    }
}

// All methods are called on one background queue. No model turns or auth files are read.
final class UsageClient: @unchecked Sendable {
    private var process: Process?
    private var input: FileHandle?
    private var output: FileHandle?
    private var buffer = Data()
    private var nextID = 0
    func close() { try? input?.close(); if process?.isRunning == true { process?.terminate() }; process = nil; input = nil; output = nil; buffer = Data() }
    private func send(_ message: [String: Any]) throws {
        var data = try JSONSerialization.data(withJSONObject: message); data.append(10)
        try input?.write(contentsOf: data)
    }
    private func request(_ method: String, _ params: Any) throws -> [String: Any] {
        nextID += 1; let id = nextID
        try send(["id": id, "method": method, "params": params])
        let deadline = Date().addingTimeInterval(10)
        while Date() < deadline {
            while let newline = buffer.firstIndex(of: 10) {
                let line = buffer.prefix(upTo: newline); buffer.removeSubrange(...newline)
                guard let value = try? JSONSerialization.jsonObject(with: line) as? [String: Any], value["id"] as? Int == id else { continue }
                if value["error"] != nil { throw NSError(domain: "Codex usage request failed. Check sign-in.", code: 2) }
                return value["result"] as? [String: Any] ?? [:]
            }
            guard let output else { break }
            var descriptor = pollfd(fd: output.fileDescriptor, events: Int16(POLLIN), revents: 0)
            if poll(&descriptor, 1, 200) > 0 {
                let data = output.availableData
                if data.isEmpty { break }
                buffer.append(data)
                if buffer.count > 4_000_000 { break }
            }
        }
        throw NSError(domain: "Codex usage timed out; will retry", code: 3)
    }
    func read(path: String) throws -> UsageReading {
        do {
            if process?.isRunning != true {
                close()
                let paths = [path] + (ProcessInfo.processInfo.environment["PATH"] ?? "").split(separator: ":").map { "\($0)/codex" } + ["/opt/homebrew/bin/codex", "/usr/local/bin/codex", "/Applications/Codex.app/Contents/Resources/codex", "/Applications/ChatGPT.app/Contents/Resources/codex-cli/CodexCLI.app/Contents/MacOS/codex"]
                guard let executable = paths.first(where: { !$0.isEmpty && FileManager.default.isExecutableFile(atPath: $0) }) else { throw NSError(domain: "Codex CLI not found. Use Choose Codex CLI.", code: 4) }
                let child = Process(); child.executableURL = URL(fileURLWithPath: executable); child.arguments = ["app-server"]
                let stdin = Pipe(), stdout = Pipe()
                child.standardInput = stdin; child.standardOutput = stdout; child.standardError = FileHandle.nullDevice
                try child.run(); process = child; input = stdin.fileHandleForWriting; output = stdout.fileHandleForReading
                _ = try request("initialize", ["clientInfo": ["name": "rise_macos", "version": "1.0.0"]])
                try send(["method": "initialized", "params": [:]])
            }
            return try UsageReading.parse(request("account/rateLimits/read", NSNull()))
        } catch { close(); throw error }
    }
    deinit { close() }
}
