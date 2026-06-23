# PDF HTML Forge

A production-ready browser-only Progressive Web App that converts uploaded PDF files into highly visually accurate offline HTML exports.

## Features

### Core Functionality
- **Visual Fidelity Mode**: Renders each PDF page to a high-quality image, preserving exact visual appearance
- **Experimental Structured HTML Mode**: Extracts text and produces semantic-ish HTML with lower visual fidelity
- **Offline Capable**: Works completely offline after initial load
- **PWA**: Installable as a Progressive Web App

### Conversion Options
- **Render Scale**: 1x, 2x, 3x, 4x for quality vs. file size trade-off
- **Selectable Text Layer**: Optional transparent text layer above rendered images
- **Include Original PDF**: Option to include the original PDF in the exported ZIP

### Security Features
- **Strict CSP**: Content Security Policy prevents XSS attacks
- **HTML Escaping**: All extracted PDF text is properly escaped
- **Browser-only**: No backend, no remote processing, no data upload
- **Memory Safety**: Processes pages sequentially to reduce memory risk

## Installation

### Prerequisites
- Node.js 18+ 
- npm 9+

### Setup

```bash
# Clone the repository
git clone https://github.com/youh4ck3dme/AAA-pdf--convertor.git
cd AAA-pdf--convertor

# Install dependencies
npm install

# Start development server
npm run dev

# Build for production
npm run build

# Run tests
npm run test

# Run tests with coverage
npm run test:coverage
```

## Usage

1. **Upload PDF**: Drag and drop a PDF file or click to browse
2. **Configure Settings**: Choose conversion mode, scale, and options
3. **Convert**: The app automatically starts conversion
4. **Preview**: View thumbnails of converted pages
5. **Export**: Download the HTML ZIP file

## Project Structure

```
src/
├── components/
│   ├── UploadZone.tsx      # PDF upload component
│   ├── SettingsPanel.tsx   # Conversion settings
│   ├── ProgressPanel.tsx    # Progress display and controls
│   ├── PreviewGrid.tsx      # Page preview thumbnails
│   └── ModeExplainer.tsx   # Mode explanation component
├── lib/
│   ├── pdfWorker.ts        # PDF.js worker setup
│   ├── pdfConverter.ts     # PDF to image/text conversion
│   ├── htmlExport.ts       # HTML/CSS/ZIP generation
│   ├── escapeHtml.ts       # HTML escaping utilities
│   ├── fileSize.ts         # File size formatting
│   └── canvasToBlob.ts     # Canvas to blob conversion
├── types.ts                # TypeScript type definitions
├── App.tsx                 # Main application component
├── main.tsx               # Application entry point
└── styles.css             # Global styles

test/
├── setup.ts               # Test setup
├── escapeHtml.test.ts     # HTML escaping tests
└── fileSize.test.ts       # File size formatting tests

public/
└── favicon.svg            # App favicon

# Configuration files
package.json
vite.config.ts
tsconfig.json
manifest.webmanifest
```

## Technical Details

### Stack
- **Framework**: Vite + React + TypeScript
- **PDF Processing**: pdfjs-dist
- **ZIP Generation**: JSZip
- **File Download**: file-saver
- **PWA**: vite-plugin-pwa

### Security
- **CSP**: Strict Content Security Policy in generated HTML
- **XSS Protection**: All PDF text content is HTML-escaped
- **No Backend**: Everything runs in the browser
- **Memory Management**: Pages processed sequentially, resources cleaned up

### Performance
- **Lazy Loading**: Preview images load as they come into view
- **Memory Efficient**: Canvas resources are released after use
- **Progressive**: Shows progress during conversion

## Limitations

### Visual Fidelity Mode
- Text is part of the image (not editable without text layer)
- Larger file size due to images
- Text selection requires the text layer option

### Structured HTML Mode (Experimental)
- Lower visual fidelity - layout may not match original
- Complex layouts, columns, and positioning may be lost
- Images and graphics are not preserved
- Fonts and styling may differ from original

## Browser Support

- Chrome 90+
- Firefox 88+
- Safari 14+
- Edge 90+
- Mobile browsers with PDF.js support

## License

MIT License - see LICENSE file for details.

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Run tests: `npm run test`
5. Run build: `npm run build`
6. Submit a pull request

## Credits

- [PDF.js](https://mozilla.github.io/pdf.js/) - PDF rendering library
- [Vite](https://vitejs.dev/) - Build tool
- [React](https://react.dev/) - UI library
- [JSZip](https://stuk.github.io/jszip/) - ZIP file generation
- [file-saver](https://github.com/eligrey/FileSaver.js/) - File download

## Changelog

### v1.0.0
- Initial release
- Visual Fidelity Mode with image rendering
- Experimental Structured HTML Mode
- PWA support with offline capabilities
- Comprehensive security features
- Full test coverage for utility functions
