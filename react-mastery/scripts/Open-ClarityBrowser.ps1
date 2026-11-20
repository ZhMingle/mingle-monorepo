function Get-ClarityBrowserAddress($window) {
    $edit = [Windows.Automation.PropertyCondition]::new(
        [Windows.Automation.AutomationElement]::ControlTypeProperty, [Windows.Automation.ControlType]::Edit)
    $walker = [Windows.Automation.TreeWalker]::ControlViewWalker
    foreach ($element in $window.FindAll([Windows.Automation.TreeScope]::Descendants, $edit)) {
        $parent = $walker.GetParent($element)
        while ($parent -and $parent.Current.ControlType -ne [Windows.Automation.ControlType]::Document) {
            if ($parent.Current.ControlType -eq [Windows.Automation.ControlType]::ToolBar) {
                $pattern = $null
                if ($element.TryGetCurrentPattern([Windows.Automation.ValuePattern]::Pattern, [ref]$pattern)) {
                    return $pattern.Current.Value
                }
            }
            if ($parent.Equals($window)) { break }
            $parent = $walker.GetParent($parent)
        }
    }
}

function Test-ClarityBrowserAddress([string]$address, [Uri]$target) {
    $resolved = $null
    return ([Uri]::TryCreate($address, [UriKind]::Absolute, [ref]$resolved) -and
        $resolved.Scheme -eq $target.Scheme -and $resolved.Host -eq $target.Host -and
        $resolved.Port -eq $target.Port -and $resolved.AbsolutePath -eq '/')
}

function Get-ClarityBrowserTabs($window, $tabType) {
    $walker = [Windows.Automation.TreeWalker]::ControlViewWalker
    foreach ($tab in $window.FindAll([Windows.Automation.TreeScope]::Descendants, $tabType)) {
        $parent = $walker.GetParent($tab)
        while ($parent -and !$parent.Equals($window) -and $parent.Current.ControlType -ne [Windows.Automation.ControlType]::Document) {
            $parent = $walker.GetParent($parent)
        }
        if (!$parent -or !$parent.Equals($window)) { continue }
        $pattern = $null
        if ($tab.TryGetCurrentPattern([Windows.Automation.SelectionItemPattern]::Pattern, [ref]$pattern)) {
            [PSCustomObject]@{ Name = $tab.Current.Name; Pattern = $pattern; WasSelected = $pattern.Current.IsSelected }
        }
    }
}

function Use-ClarityBrowserTab([Uri]$target, [switch]$ActivateOnly) {
    Add-Type -AssemblyName UIAutomationClient, UIAutomationTypes, System.Windows.Forms
    if (!('ClarityBrowserWindow' -as [type])) {
        Add-Type @'
using System;
using System.Runtime.InteropServices;
public static class ClarityBrowserWindow {
    [DllImport("user32.dll")] public static extern IntPtr GetForegroundWindow();
    [DllImport("user32.dll")] public static extern bool IsIconic(IntPtr handle);
    [DllImport("user32.dll")] public static extern bool ShowWindowAsync(IntPtr handle, int command);
    [DllImport("user32.dll")] public static extern bool SetForegroundWindow(IntPtr handle);
}
'@
    }
    $foreground = [ClarityBrowserWindow]::GetForegroundWindow()
    $browserIds = @(Get-Process -Name msedge,chrome,brave,vivaldi,opera,firefox -ErrorAction SilentlyContinue | Select-Object -ExpandProperty Id)
    if (!$browserIds.Count) { return $false }
    $desktop = [Windows.Automation.AutomationElement]::RootElement
    $windows = $desktop.FindAll([Windows.Automation.TreeScope]::Children, [Windows.Automation.Condition]::TrueCondition) |
        Where-Object { $_.Current.ProcessId -in $browserIds -and $_.Current.NativeWindowHandle } |
        Sort-Object { [IntPtr]$_.Current.NativeWindowHandle -ne $foreground }
    $tabType = [Windows.Automation.PropertyCondition]::new(
        [Windows.Automation.AutomationElement]::ControlTypeProperty, [Windows.Automation.ControlType]::TabItem)
    foreach ($window in $windows) {
        try {
            $handle = [IntPtr]$window.Current.NativeWindowHandle
            $matched = Test-ClarityBrowserAddress (Get-ClarityBrowserAddress $window) $target
            if (!$matched) {
                $tabs = Get-ClarityBrowserTabs $window $tabType
                $selected = $tabs | Where-Object WasSelected | Select-Object -First 1
                try {
                    foreach ($tab in $tabs) {
                        if ($tab.WasSelected -or $tab.Name -notlike '*Clarity*Developer Learning Lab*') { continue }
                        $tab.Pattern.Select()
                        for ($attempt = 0; $attempt -lt 5; $attempt++) {
                            if (Test-ClarityBrowserAddress (Get-ClarityBrowserAddress $window) $target) {
                                $matched = $true
                                break
                            }
                            Start-Sleep -Milliseconds 100
                        }
                        if ($matched) { break }
                    }
                } finally {
                    if (!$matched -and $selected) { $selected.Pattern.Select() }
                }
            }
            if (!$matched) { continue }
            if ([ClarityBrowserWindow]::IsIconic($handle)) {
                $null = [ClarityBrowserWindow]::ShowWindowAsync($handle, 9)
            }
            $null = [ClarityBrowserWindow]::SetForegroundWindow($handle)
            if ([ClarityBrowserWindow]::GetForegroundWindow() -ne $handle) {
                $null = (New-Object -ComObject WScript.Shell).AppActivate($window.Current.ProcessId)
                $null = [ClarityBrowserWindow]::SetForegroundWindow($handle)
            }
            if ($ActivateOnly) { return $true }
            if ([ClarityBrowserWindow]::GetForegroundWindow() -eq $handle) {
                [Windows.Forms.SendKeys]::SendWait('^r')
                return $true
            }
            Write-Warning 'Found the existing Clarity tab, but Windows prevented refreshing it.'
            return $true
        } catch [Windows.Automation.ElementNotAvailableException] {
            continue
        }
    }
    return $false
}
