# ConvertFlow - Advanced PNG to SVG Converter

🎨 **True Vectorization Technology**  
A sophisticated web application that converts PNG images into scalable vector graphics using advanced computer vision algorithms.

---

## ✨ Features

### Core Conversion Capabilities
- 🎯 **True Vector Conversion**: Advanced algorithms convert raster images to actual vector paths
- 🎨 **Smart Color Quantization**: Intelligent color reduction with K-means clustering
- 🔍 **Edge Detection**: Sophisticated edge detection for precise path generation
- 📐 **Path Optimization**: Automatic path simplification and smoothing
- 🌈 **Transparency Support**: Full alpha channel preservation
- 🚀 **Multiple Algorithms**: Auto-selection based on image type (shapes, photos, line art)

### User Experience
- 💫 **Batch Processing**: Convert multiple files simultaneously
- 🔒 **100% Client-Side**: All processing happens locally - no uploads needed
- 📊 **Real-time Progress**: Detailed progress tracking with stage indicators
- 🖼️ **Live Preview**: Side-by-side comparison of original and converted images
- 📱 **Responsive Design**: Optimized for all devices and screen sizes
- ⚡ **Web Workers**: Background processing for smooth UI performance

### Advanced Features
- 🧠 **Memory Monitoring**: Real-time memory usage tracking and optimization
- 🔧 **Configurable Settings**: Fine-tune conversion parameters
- 📦 **Batch Download**: ZIP archive support for multiple files
- 🛡️ **Error Recovery**: Intelligent fallback mechanisms
- 📈 **Performance Analytics**: Built-in performance monitoring
- 🎛️ **Algorithm Selection**: Choose optimal algorithm for your image type

## 🏗️ Architecture

### Tech Stack
- **Frontend**: React 18 + TypeScript
- **Build Tool**: Vite
- **Styling**: Tailwind CSS + CSS Modules
- **Icons**: Lucide React
- **Testing**: Vitest + Testing Library
- **Processing**: Web Workers for background tasks
- **File Handling**: JSZip for batch downloads

### Core Services
- **ImageProcessor**: Canvas-based image manipulation
- **ColorQuantizer**: K-means clustering for color reduction
- **EdgeDetector**: Sobel and Canny edge detection algorithms
- **Vectorizer**: Path generation and optimization
- **SvgGenerator**: SVG markup generation with optimization
- **WorkerManager**: Web Worker orchestration

## 🚀 Getting Started

### Prerequisites
- Node.js (v18 or higher)
- npm or yarn

### Installation
```bash
# Clone the repository
git clone <repository-url>
cd convertflow

# Install dependencies
npm install

# Start development server
npm run dev
```

### Available Scripts
```bash
npm run dev      # Start development server
npm run build    # Build for production
npm run preview  # Preview production build
npm run test     # Run tests
npm run lint     # Run ESLint
```

## 🎛️ Configuration Options

### Vectorization Settings
- **Color Count**: 2-256 colors (default: 16)
- **Smoothing Level**: Low/Medium/High path smoothing
- **Path Simplification**: 0.1-10.0 tolerance (default: 1.0)
- **Transparency**: Preserve alpha channel
- **Algorithm**: Auto/Shapes/Photo/LineArt selection

### Performance Settings
- **Web Workers**: Enable background processing
- **Memory Monitoring**: Track and optimize memory usage
- **Batch Size**: Configure simultaneous processing limit

## 🔬 Algorithms

### Auto Selection
Automatically chooses the best algorithm based on image characteristics:
- **Shapes**: Optimized for geometric shapes and logos
- **Photo**: Best for photographic content
- **LineArt**: Specialized for line drawings and sketches

### Processing Pipeline
1. **Preprocessing**: Image loading and validation
2. **Color Quantization**: K-means clustering for color reduction
3. **Edge Detection**: Sobel/Canny algorithms for edge identification
4. **Vectorization**: Path generation from edge data
5. **Optimization**: Path simplification and SVG generation

## 🧪 Testing

Comprehensive test suite covering:
- Unit tests for core algorithms
- Integration tests for user workflows
- Performance benchmarks
- Error handling scenarios

```bash
npm run test        # Run all tests
npm run test:run    # Run tests once
```

## 📊 Performance

### Optimizations
- Web Worker processing for non-blocking UI
- Memory monitoring and garbage collection
- Progressive rendering for large images
- Intelligent algorithm selection
- Canvas-based image processing

### Browser Support
- Modern browsers with Canvas and Web Worker support
- Progressive enhancement for older browsers
- Responsive design for mobile devices

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests for new functionality
5. Submit a pull request

## 📄 License

This project is licensed under the MIT License.

## 🔗 Links

- [Live Demo](https://convertflow.vercel.app)
- [Documentation](./docs)
- [Issue Tracker](./issues)
