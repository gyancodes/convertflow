# Troubleshooting Guide

This guide helps you resolve common issues when using ConvertFlow.

## Common Issues and Solutions

### Conversion Quality Issues

#### Problem: SVG doesn't look like the original PNG

**Symptoms:**
- Missing details in the converted SVG
- Colors look different
- Shapes are distorted or simplified too much

**Solutions:**

1. **Try Different Algorithms**
   ```
   For logos/icons: Use "Shapes" algorithm
   For photos: Use "Photo" algorithm  
   For drawings: Use "LineArt" algorithm
   For mixed content: Use "Auto" algorithm
   ```

2. **Increase Color Count**
   - Start with 16 colors, increase to 32-64 for complex images
   - For simple graphics, 8-16 colors is usually sufficient
   - For photographs, try 64-128 colors

3. **Adjust Path Simplification**
   - Lower values (0.5-1.0) preserve more detail
   - Higher values (2.0-5.0) create simpler paths
   - Start with 1.0 and adjust based on results

4. **Modify Smoothing Level**
   - Low: Preserves sharp edges and corners
   - Medium: Balanced approach (recommended)
   - High: Very smooth curves, may lose detail

#### Problem: SVG file is too large

**Symptoms:**
- File size larger than original PNG
- Slow loading in browsers or applications
- Performance issues when using the SVG

**Solutions:**

1. **Reduce Color Count**
   - Lower the color count to 8-16 for simple graphics
   - Use 4-8 colors for very simple logos

2. **Increase Path Simplification**
   - Use values between 2.0-5.0 to reduce path complexity
   - Higher values create fewer path points

3. **Use Appropriate Algorithm**
   - "Shapes" algorithm typically produces smaller files
   - Avoid "Photo" algorithm for simple graphics

4. **Enable Higher Smoothing**
   - High smoothing reduces the number of path points
   - Creates smoother curves with fewer control points

#### Problem: Important details are missing

**Symptoms:**
- Small text is unreadable
- Fine lines disappear
- Important features are lost

**Solutions:**

1. **Increase Color Count**
   - Use 32-64 colors to preserve more detail
   - For text-heavy images, try 64-128 colors

2. **Lower Path Simplification**
   - Use values between 0.1-0.5 for maximum detail
   - Accept larger file sizes for better quality

3. **Use Appropriate Algorithm**
   - "LineArt" for text and line drawings
   - "Photo" for complex detailed images

4. **Prepare Source Image**
   - Increase contrast before conversion
   - Ensure text is large enough (minimum 12px)
   - Clean up noise and artifacts

### Processing Issues

#### Problem: Conversion fails or crashes

**Symptoms:**
- Browser becomes unresponsive
- Error messages during processing
- Conversion stops unexpectedly

**Solutions:**

1. **Reduce Image Size**
   ```
   Maximum recommended: 4096x4096 pixels
   For batch processing: 2048x2048 pixels
   Large images: Resize before uploading
   ```

2. **Process Fewer Files**
   - Try processing 1-2 files at a time
   - Avoid batch processing very large images
   - Close other browser tabs to free memory

3. **Use Simpler Settings**
   - Reduce color count to 8-16
   - Increase path simplification to 2.0-3.0
   - Use "Shapes" algorithm for faster processing

4. **Check Browser Compatibility**
   - Update to latest browser version
   - Try a different browser (Chrome recommended)
   - Ensure JavaScript is enabled

#### Problem: Processing is very slow

**Symptoms:**
- Conversion takes several minutes
- Browser becomes sluggish
- Progress seems stuck

**Solutions:**

1. **Enable Web Workers**
   - Check "Use Web Worker" in performance settings
   - Keeps UI responsive during processing
   - Available in modern browsers

2. **Optimize Image Size**
   - Resize large images before uploading
   - Recommended maximum: 2048x2048 for fast processing
   - Use appropriate resolution for your use case

3. **Adjust Settings for Speed**
   ```
   Algorithm: Shapes (fastest)
   Color Count: 8-16 (lower is faster)
   Path Simplification: 2.0-3.0 (higher is faster)
   Smoothing: Medium or High
   ```

4. **System Optimization**
   - Close unnecessary browser tabs
   - Close other applications
   - Ensure sufficient RAM available

#### Problem: Memory warnings or out of memory errors

**Symptoms:**
- "Memory warning" messages
- Browser crashes or freezes
- System becomes unresponsive

**Solutions:**

1. **Reduce Image Dimensions**
   - Resize images to 1024x1024 or smaller
   - Process images individually, not in batches
   - Use image editing software to resize first

2. **Lower Processing Settings**
   ```
   Color Count: 4-8 (minimum)
   Path Simplification: 3.0-5.0 (maximum)
   Algorithm: Shapes (most efficient)
   ```

3. **System Optimization**
   - Close all other browser tabs
   - Restart browser before processing
   - Ensure at least 4GB RAM available

4. **Use Alternative Approach**
   - Process images in smaller batches
   - Convert one file at a time
   - Consider using desktop software for very large images

### Browser-Specific Issues

#### Chrome/Chromium Issues

**Problem: Web Workers not working**
- Solution: Check if site is served over HTTPS or localhost
- Solution: Disable browser extensions that might interfere
- Solution: Clear browser cache and cookies

**Problem: File download issues**
- Solution: Check download permissions in browser settings
- Solution: Disable popup blockers for the site
- Solution: Try right-click "Save As" on download links

#### Firefox Issues

**Problem: Slower processing than Chrome**
- This is normal - Firefox has slightly slower Canvas performance
- Solution: Use smaller images or simpler settings
- Solution: Enable Web Workers for better performance

**Problem: SVG preview not showing**
- Solution: Update Firefox to latest version
- Solution: Check if SVG support is enabled
- Solution: Try refreshing the page

#### Safari Issues

**Problem: Web Workers limited functionality**
- Safari has some Web Worker limitations
- Solution: Disable Web Workers in settings if issues occur
- Solution: Process smaller batches of files

**Problem: File handling issues**
- Solution: Update to latest Safari version
- Solution: Try drag-and-drop instead of file picker
- Solution: Check file permissions

#### Mobile Browser Issues

**Problem: Performance issues on mobile**
- Mobile devices have limited processing power
- Solution: Use very small images (max 1024x1024)
- Solution: Use simple settings (low color count, high simplification)
- Solution: Process one file at a time

**Problem: Interface issues on small screens**
- Solution: Use landscape orientation
- Solution: Zoom out to see full interface
- Solution: Use desktop version when possible

### File-Related Issues

#### Problem: "Invalid file format" error

**Symptoms:**
- Error when uploading files
- Files not accepted by upload area

**Solutions:**

1. **Check File Format**
   - Only PNG files are supported
   - File extension must be .png
   - Ensure file is not corrupted

2. **File Size Limits**
   - Maximum 10MB per file
   - Maximum 20 files per batch
   - Compress large PNG files if needed

3. **File Integrity**
   - Try opening file in image editor first
   - Re-save as PNG if file seems corrupted
   - Check if file downloaded completely

#### Problem: Transparent backgrounds become white

**Symptoms:**
- PNG transparency is lost
- Background becomes solid white

**Solutions:**

1. **Enable Transparency Preservation**
   - Check "Preserve Transparency" in settings
   - This should be enabled by default

2. **Check Source Image**
   - Verify PNG actually has transparency
   - Some PNGs have white backgrounds, not transparency

3. **Algorithm Selection**
   - All algorithms support transparency
   - "Photo" algorithm handles complex transparency better

#### Problem: Colors look different in SVG

**Symptoms:**
- Colors appear washed out or different
- Color accuracy is poor

**Solutions:**

1. **Increase Color Count**
   - Use more colors to preserve color accuracy
   - Try 32-64 colors for better color reproduction

2. **Check Color Profile**
   - SVG uses sRGB color space
   - Source PNG might use different color profile

3. **Algorithm Selection**
   - "Photo" algorithm preserves colors better
   - "Auto" algorithm usually makes good choices

## Error Messages

### "Processing failed: Image too large"
- **Cause**: Image exceeds maximum dimensions
- **Solution**: Resize image to 4096x4096 pixels or smaller

### "Processing failed: Out of memory"
- **Cause**: Insufficient browser memory
- **Solution**: Close other tabs, reduce image size, use simpler settings

### "Processing failed: Invalid image data"
- **Cause**: Corrupted or invalid PNG file
- **Solution**: Re-save image as PNG, check file integrity

### "Processing failed: Browser not supported"
- **Cause**: Browser lacks required features
- **Solution**: Update browser, try Chrome/Firefox/Safari/Edge

### "Web Worker not supported"
- **Cause**: Browser or environment doesn't support Web Workers
- **Solution**: Disable Web Workers in settings, processing will work in main thread

## Performance Optimization

### For Best Speed
```
Algorithm: Shapes
Color Count: 8
Path Simplification: 3.0
Smoothing: High
Web Workers: Enabled
```

### For Best Quality
```
Algorithm: Auto or Photo
Color Count: 32-64
Path Simplification: 0.5-1.0
Smoothing: Low or Medium
Transparency: Enabled
```

### For Balanced Results
```
Algorithm: Auto
Color Count: 16
Path Simplification: 1.0-2.0
Smoothing: Medium
Web Workers: Enabled
```

## Getting Help

If you're still experiencing issues:

1. **Check Browser Console**
   - Press F12 to open developer tools
   - Look for error messages in Console tab
   - Include these in bug reports

2. **Try Different Settings**
   - Test with default settings first
   - Change one setting at a time
   - Note which settings cause issues

3. **Test with Simple Images**
   - Try with a simple logo or icon first
   - Verify basic functionality works
   - Then try with your problematic image

4. **Report Issues**
   - Open an issue on [GitHub](https://github.com/gyancodes/convertflow/issues)
   - Include browser version and operating system
   - Describe steps to reproduce the problem
   - Include error messages if any

5. **Community Support**
   - Check existing GitHub issues for similar problems
   - Ask questions in the discussions section
   - Share your solutions to help others

## System Requirements

### Minimum Requirements
- Modern browser (Chrome 80+, Firefox 75+, Safari 13+, Edge 80+)
- 2GB RAM available to browser
- JavaScript enabled
- Canvas API support

### Recommended Requirements
- Chrome 90+ or equivalent modern browser
- 4GB+ RAM available to browser
- Fast internet connection (for loading the application)
- Desktop or laptop computer (mobile works but with limitations)

### Optimal Performance
- Latest Chrome or Chromium-based browser
- 8GB+ system RAM
- Desktop computer with dedicated graphics
- SSD storage for faster file operations