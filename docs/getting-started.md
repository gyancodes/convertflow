# Getting Started with ConvertFlow

This guide will help you get started with ConvertFlow and convert your first PNG to SVG.

## What is ConvertFlow?

ConvertFlow is a powerful, browser-based PNG to SVG converter that uses advanced vectorization algorithms to convert raster images into scalable vector graphics. Unlike simple embedding converters, ConvertFlow creates true vector paths from your images.

## Why Convert PNG to SVG?

### Benefits of SVG Format

- **Infinite Scalability**: SVG images look crisp at any size
- **Smaller File Sizes**: Often smaller than equivalent PNG files
- **Editable**: Can be modified with code or design tools
- **SEO Friendly**: Text in SVGs is searchable and accessible
- **CSS Styleable**: Colors and styles can be changed with CSS
- **Animation Ready**: Perfect for web animations and interactions

### Best Use Cases

- **Logos and Branding**: Company logos, brand marks
- **Icons**: UI icons, navigation elements
- **Simple Graphics**: Illustrations with solid colors
- **Line Art**: Drawings, sketches, technical diagrams
- **Web Graphics**: Images that need to scale across devices

## Your First Conversion

### Step 1: Access ConvertFlow

Simply visit [ConvertFlow](https://convertflow.vercel.app) in any modern web browser. No downloads or installations required!

### Step 2: Configure Settings (Optional)

Before uploading your image, you can adjust the conversion settings:

- **Algorithm**: Choose "Auto" for best results, or select specific algorithms:
  - **Shapes**: Best for logos and simple graphics
  - **Photo**: Optimized for photographs
  - **LineArt**: Perfect for drawings and sketches

- **Color Count**: Reduce colors for simpler output (2-256 colors)
- **Smoothing**: Control how smooth the vector paths are
- **Path Simplification**: Balance between detail and file size

### Step 3: Upload Your PNG

- **Drag & Drop**: Simply drag your PNG file onto the upload area
- **Click to Browse**: Click the upload area to select files from your computer
- **Multiple Files**: You can upload up to 20 files at once

#### File Requirements
- **Format**: PNG files only
- **Size**: Up to 10MB per file
- **Dimensions**: Recommended maximum 4096x4096 pixels

### Step 4: Start Conversion

Click the "Start Conversion" button to begin processing. You'll see:

- **Progress Indicators**: Visual progress through each processing stage
- **Stage Information**: Current processing step (preprocessing, quantizing, etc.)
- **Time Estimates**: Approximate time remaining

### Step 5: Download Your SVG

Once conversion is complete:

- **Preview**: Compare your original PNG with the converted SVG
- **Download**: Click "Download SVG" to save the file
- **Batch Download**: For multiple files, download all as a ZIP archive

## Tips for Best Results

### Image Preparation

1. **Clean Images**: Remove noise and artifacts before conversion
2. **High Contrast**: Images with clear edges convert better
3. **Solid Colors**: Avoid gradients and complex textures
4. **Appropriate Size**: Don't use unnecessarily large images

### Settings Optimization

1. **Start with Auto**: Let the algorithm choose the best settings
2. **Adjust Color Count**: Reduce for simpler graphics, increase for complex images
3. **Try Different Algorithms**: Test shapes/photo/lineart for best results
4. **Fine-tune Smoothing**: Balance between accuracy and smoothness

### Common Workflows

#### For Logos and Icons
```
Algorithm: Shapes
Color Count: 8-16
Smoothing: Medium
Path Simplification: 1.0-2.0
```

#### For Photographs
```
Algorithm: Photo
Color Count: 32-64
Smoothing: High
Path Simplification: 0.5-1.0
```

#### For Line Art
```
Algorithm: LineArt
Color Count: 4-8
Smoothing: Low
Path Simplification: 1.0-3.0
```

## Browser Compatibility

ConvertFlow works on all modern browsers:

- ✅ Chrome 80+
- ✅ Firefox 75+
- ✅ Safari 13+
- ✅ Edge 80+
- ✅ Mobile browsers (iOS Safari, Chrome Mobile)

### Required Features
- Canvas API support
- Web Workers (for background processing)
- File API (for file handling)
- Modern JavaScript (ES2020+)

## Privacy and Security

### Your Data is Safe

- **No Uploads**: Files never leave your device
- **Client-Side Processing**: All conversion happens in your browser
- **No Tracking**: We don't collect or store any personal data
- **No Registration**: Use the tool without creating accounts

### How It Works

1. You select files on your device
2. JavaScript reads the files locally
3. Processing happens in your browser's memory
4. Results are generated and offered for download
5. No data is transmitted to any server

## Next Steps

- Read the [User Guide](./user-guide.md) for detailed feature explanations
- Learn about [Algorithms](./algorithms.md) to understand the conversion process
- Check [Troubleshooting](./troubleshooting.md) if you encounter issues
- Explore the [API Reference](./api-reference.md) for developers

## Need Help?

If you're having trouble or have questions:

1. Check our [FAQ](../README.md#faq) for common questions
2. Review the [Troubleshooting Guide](./troubleshooting.md)
3. Open an issue on [GitHub](https://github.com/gyancodes/convertflow/issues)
4. Contact us through the website

Welcome to ConvertFlow! We hope you create amazing SVG graphics.