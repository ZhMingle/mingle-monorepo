# Free local neural speech

Clarity uses [Kokoro JS](https://github.com/hexgrad/kokoro/tree/main/kokoro.js) 1.2.1 with the Apache-2.0 [Kokoro 82M ONNX model](https://huggingface.co/onnx-community/Kokoro-82M-v1.0-ONNX), quantized for CPU inference. Heart is the default US voice; Emma supplies British English. This is AI-generated speech.

On the owner's Windows computer, install once with Node 24 and pnpm:

```powershell
cd local-speech
pnpm install --ignore-workspace
cd ..
node local-speech/speech.mjs
```

The last command downloads the model into ignored `data/speech-models/` and writes `data/kokoro-preview.wav`. Then run `Start.bat`. The configured cloud bridge loads the model and runs a separate speech worker alongside its Codex workers. Keep this computer awake for new audio. Model loading retries on failure; missing dependencies leave AI coaching operational.

Words and saved examples are selected by card ID on the authenticated backend. Only the selected English text and voice travel to the local worker. PCM WAV clips return through the authenticated bridge and are cached privately in the persistent cloud SQLite database (up to 120 clips / 32 MiB, least-recently-used eviction). Cached clips remain playable when the computer is offline. Evicted clips regenerate when requested. No paid speech API, API key or separate speech API bill is involved; existing hosting still applies.

The optional package and model are excluded from the cloud Docker image. Speech leases, 120-second deadlines, input/audio size limits and a bounded queue protect the bridge. Reading buttons show preparation, playback and completion without inserting a player into the page. If autoplay is blocked, tap the same reading button again or the floating Play action; the prepared clip is reused. Byte-range responses remain available for mobile playback. Browser speech remains an explicitly selected backup; model failures never silently switch to a system voice.
