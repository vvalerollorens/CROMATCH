# Local OCR assets

Tesseract.js 6.0.1 worker and Tesseract.js-core 6 LSTM embedded WebAssembly builds are vendored from the pinned npm packages. The Spanish fast model is from https://github.com/naptha/tessdata/tree/gh-pages/4.0.0_fast (spa.traineddata.gz). Apache-2.0 licenses are included. Images are processed locally in a Web Worker; neither photos nor OCR text are sent to any external service. The model and engine are loaded on demand from this site's own origin. Language caching may use IndexedDB, independently of the album's localStorage record.
