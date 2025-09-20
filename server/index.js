const express = require('express');
const multer = require('multer');
const cors = require('cors');
const helmet = require('helmet');
const compression = require('compression');
const rateLimit = require('express-rate-limit');
const sharp = require('sharp');
const potrace = require('potrace');
const ImageTracer = require('imagetracerjs');
const path = require('path');
const fs = require('fs').promises;
require('dotenv').config();

// Polyfills for ImageTracer in Node.js environment
global.Image = class {
  constructor() {
    this.onload = null;
    this.onerror = null;
    this.src = null;
    this.width = 0;
    this.height = 0;
  }
  
  set src(value) {
    this._src = value;
    // Simulate immediate load for data URLs
    if (this.onload && value && value.startsWith('data:')) {
      // Extract dimensions from data URL if possible
      this.width = 100; // Default width
      this.height = 100; // Default height
      setTimeout(() => this.onload(), 0);
    }
  }
  
  get src() {
    return this._src;
  }
};

// Simple document polyfill for ImageTracer
global.document = {
  createElement: function(tagName) {
    if (tagName === 'canvas') {
      return {
        width: 0,
        height: 0,
        getContext: function(type) {
          return {
            createImageData: function(width, height) {
              return {
                data: new Uint8ClampedArray(width * height * 4),
                width: width,
                height: height
              };
            },
            getImageData: function(x, y, width, height) {
              return {
                data: new Uint8ClampedArray(width * height * 4),
                width: width,
                height: height
              };
            },
            putImageData: function() {},
            drawImage: function() {}
          };
        }
      };
    }
    return {};
  }
};

const app = express();
const PORT = process.env.PORT || 3001;

// Security middleware
app.use(helmet());
app.use(compression());
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:5173',
  credentials: true
}));

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
  message: 'Too many requests from this IP, please try again later.'
});
app.use('/api/', limiter);

// Premium rate limiting
const premiumLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 1000, // Higher limit for premium users
  skip: (req) => req.headers['x-user-tier'] === 'pro' || req.headers['x-user-tier'] === 'enterprise'
});

// Body parsing
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// File upload configuration
const storage = multer.memoryStorage();
const upload = multer({
  storage,
  limits: {
    fileSize: 200 * 1024 * 1024, // 200MB max
    files: 100 // Max 100 files
  },
  fileFilter: (req, file, cb) => {
    const allowedTypes = ['image/png', 'image/jpeg', 'image/jpg'];
    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Invalid file type. Only PNG and JPEG are allowed.'));
    }
  }
});

// Premium tier configuration
const PREMIUM_TIERS = {
  free: { maxFileSize: 5 * 1024 * 1024, maxBatchSize: 3 },
  pro: { maxFileSize: 50 * 1024 * 1024, maxBatchSize: 25 },
  enterprise: { maxFileSize: 200 * 1024 * 1024, maxBatchSize: 100 }
};

// Middleware to check premium limits
const checkPremiumLimits = (req, res, next) => {
  const userTier = req.headers['x-user-tier'] || 'free';
  const tier = PREMIUM_TIERS[userTier] || PREMIUM_TIERS.free;
  
  req.userTier = userTier;
  req.tierLimits = tier;
  
  // Check file count
  if (req.files && req.files.length > tier.maxBatchSize) {
    return res.status(400).json({
      error: 'Batch size limit exceeded',
      message: `Your ${userTier} plan allows up to ${tier.maxBatchSize} files per batch`,
      upgrade: userTier === 'free'
    });
  }
  
  // Check individual file sizes
  if (req.files) {
    for (const file of req.files) {
      if (file.size > tier.maxFileSize) {
        return res.status(400).json({
          error: 'File size limit exceeded',
          message: `File "${file.originalname}" exceeds ${tier.maxFileSize / (1024 * 1024)}MB limit for ${userTier} plan`,
          upgrade: userTier !== 'enterprise'
        });
      }
    }
  }
  
  next();
};

// Conversion functions
async function convertWithImageTracer(buffer, options = {}) {
  try {
    const defaultOptions = {
      ltres: 1,
      qtres: 1,
      pathomit: 8,
      colorsampling: 1,
      numberofcolors: 16,
      mincolorratio: 0.02,
      colorquantcycles: 3,
      scale: 1,
      simplifytolerance: 0,
      roundcoords: 1,
      lcpr: 0,
      qcpr: 0,
      desc: false,
      viewbox: false,
      blurradius: 0,
      blurdelta: 20
    };
    
    const mergedOptions = { ...defaultOptions, ...options };
    
    // Convert buffer to base64 data URL
    const base64 = buffer.toString('base64');
    const mimeType = buffer[0] === 0x89 ? 'image/png' : 'image/jpeg';
    const dataUrl = `data:${mimeType};base64,${base64}`;
    
    return new Promise((resolve, reject) => {
      try {
        const svgString = ImageTracer.imageToSVG(dataUrl, mergedOptions);
        resolve(svgString);
      } catch (error) {
        reject(error);
      }
    });
  } catch (error) {
    throw new Error(`ImageTracer conversion failed: ${error.message}`);
  }
}

async function convertWithPotrace(buffer, options = {}) {
  try {
    // Convert to PNG if JPEG
    let processedBuffer = buffer;
    if (buffer[0] !== 0x89) { // Not PNG
      processedBuffer = await sharp(buffer).png().toBuffer();
    }
    
    const defaultOptions = {
      threshold: 128,
      optTolerance: 0.2,
      turdSize: 2,
      turnPolicy: 'black',
      alphaMax: 1.0,
      optCurve: true,
      color: 'auto',
      background: 'transparent'
    };
    
    const mergedOptions = { ...defaultOptions, ...options };
    
    return new Promise((resolve, reject) => {
      potrace.trace(processedBuffer, mergedOptions, (err, svg) => {
        if (err) {
          reject(err);
        } else {
          resolve(svg);
        }
      });
    });
  } catch (error) {
    throw new Error(`Potrace conversion failed: ${error.message}`);
  }
}

async function wrapImageInSvg(buffer, filename) {
  try {
    const metadata = await sharp(buffer).metadata();
    const base64 = buffer.toString('base64');
    const mimeType = buffer[0] === 0x89 ? 'image/png' : 'image/jpeg';
    
    const svg = `<?xml version="1.0" encoding="UTF-8"?>
<svg width="${metadata.width}" height="${metadata.height}" 
     viewBox="0 0 ${metadata.width} ${metadata.height}" 
     xmlns="http://www.w3.org/2000/svg" 
     xmlns:xlink="http://www.w3.org/1999/xlink">
  <title>${filename}</title>
  <image width="${metadata.width}" height="${metadata.height}" 
         xlink:href="data:${mimeType};base64,${base64}"/>
</svg>`;
    
    return svg;
  } catch (error) {
    throw new Error(`SVG wrapping failed: ${error.message}`);
  }
}

// API Routes

// Health check
app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'ok', 
    timestamp: new Date().toISOString(),
    version: '1.0.0'
  });
});

// Get premium tiers
app.get('/api/premium/tiers', (req, res) => {
  res.json({
    tiers: Object.keys(PREMIUM_TIERS).map(key => ({
      id: key,
      ...PREMIUM_TIERS[key]
    }))
  });
});

// Available engines information
app.get('/api/engines', (req, res) => {
  res.json({
    engines: ['potrace', 'imagetracer'],
    capabilities: {
      potrace: {
        description: 'High-quality bitmap to vector tracing using Potrace algorithm',
        options: ['threshold', 'turdSize', 'alphaMax', 'optCurve', 'optTolerance', 'turnPolicy'],
        formats: ['SVG'],
        bestFor: 'Line art, logos, simple graphics'
      },
      imagetracer: {
        description: 'Color bitmap to vector tracing with multiple color support',
        options: ['ltres', 'qtres', 'scale', 'strokewidth', 'numberofcolors'],
        formats: ['SVG'],
        bestFor: 'Complex images, photographs, multi-color graphics'
      }
    }
  });
});

// Single file conversion
app.post('/api/convert/single', 
  premiumLimiter,
  upload.single('file'),
  checkPremiumLimits,
  async (req, res) => {
    try {
      if (!req.file) {
        return res.status(400).json({ error: 'No file provided' });
      }
      
      const { mode = 'vectorize', engine = 'imagetracer', options: optionsStr, ...otherOptions } = req.body;
      const startTime = Date.now();
      
      // Parse options if provided as JSON string
      let options = {};
      if (optionsStr) {
        try {
          options = JSON.parse(optionsStr);
        } catch (e) {
          console.warn('Failed to parse options JSON:', e);
          options = {};
        }
      }
      
      // Merge with any other options passed directly
      options = { ...options, ...otherOptions };
      
      let svgContent;
      
      switch (mode) {
        case 'wrapper':
          svgContent = await wrapImageInSvg(req.file.buffer, req.file.originalname);
          break;
        case 'vectorize':
          if (engine === 'potrace') {
            svgContent = await convertWithPotrace(req.file.buffer, options);
          } else {
            svgContent = await convertWithImageTracer(req.file.buffer, options);
          }
          break;
        default:
          return res.status(400).json({ error: 'Invalid conversion mode' });
      }
      
      const processingTime = Date.now() - startTime;
      const outputSize = Buffer.byteLength(svgContent, 'utf8');
      
      res.json({
        success: true,
        filename: req.file.originalname.replace(/\.(png|jpe?g)$/i, '.svg'),
        originalSize: req.file.size,
        outputSize,
        compressionRatio: ((req.file.size - outputSize) / req.file.size * 100).toFixed(2),
        processingTime,
        svgContent,
        metadata: {
          mode,
          engine,
          userTier: req.userTier
        }
      });
      
    } catch (error) {
      console.error('Conversion error:', error);
      res.status(500).json({ 
        error: 'Conversion failed', 
        message: error.message 
      });
    }
  }
);

// Batch conversion
app.post('/api/convert/batch',
  premiumLimiter,
  upload.array('files', 100),
  checkPremiumLimits,
  async (req, res) => {
    try {
      if (!req.files || req.files.length === 0) {
        return res.status(400).json({ error: 'No files provided' });
      }
      
      const { mode = 'vectorize', engine = 'imagetracer', options: optionsStr, ...otherOptions } = req.body;
      const startTime = Date.now();
      
      // Parse options if provided as JSON string
      let options = {};
      if (optionsStr) {
        try {
          options = JSON.parse(optionsStr);
        } catch (e) {
          console.warn('Failed to parse options JSON:', e);
          options = {};
        }
      }
      
      // Merge with any other options passed directly
      options = { ...options, ...otherOptions };
      
      const results = [];
      
      for (const file of req.files) {
        try {
          let svgContent;
          
          switch (mode) {
            case 'wrapper':
              svgContent = await wrapImageInSvg(file.buffer, file.originalname);
              break;
            case 'vectorize':
              if (engine === 'potrace') {
                svgContent = await convertWithPotrace(file.buffer, options);
              } else {
                svgContent = await convertWithImageTracer(file.buffer, options);
              }
              break;
            default:
              throw new Error('Invalid conversion mode');
          }
          
          const outputSize = Buffer.byteLength(svgContent, 'utf8');
          
          results.push({
            success: true,
            filename: file.originalname.replace(/\.(png|jpe?g)$/i, '.svg'),
            originalFilename: file.originalname,
            originalSize: file.size,
            outputSize,
            compressionRatio: ((file.size - outputSize) / file.size * 100).toFixed(2),
            svgContent
          });
          
        } catch (error) {
          results.push({
            success: false,
            filename: file.originalname,
            error: error.message
          });
        }
      }
      
      const processingTime = Date.now() - startTime;
      const successCount = results.filter(r => r.success).length;
      
      res.json({
        success: true,
        totalFiles: req.files.length,
        successCount,
        failureCount: req.files.length - successCount,
        processingTime,
        results,
        metadata: {
          mode,
          engine,
          userTier: req.userTier
        }
      });
      
    } catch (error) {
      console.error('Batch conversion error:', error);
      res.status(500).json({ 
        error: 'Batch conversion failed', 
        message: error.message 
      });
    }
  }
);

// Error handling middleware
app.use((error, req, res, next) => {
  if (error instanceof multer.MulterError) {
    if (error.code === 'LIMIT_FILE_SIZE') {
      return res.status(400).json({
        error: 'File too large',
        message: 'File size exceeds the maximum allowed limit'
      });
    }
    if (error.code === 'LIMIT_FILE_COUNT') {
      return res.status(400).json({
        error: 'Too many files',
        message: 'Number of files exceeds the maximum allowed limit'
      });
    }
  }
  
  console.error('Server error:', error);
  res.status(500).json({ 
    error: 'Internal server error',
    message: process.env.NODE_ENV === 'development' ? error.message : 'Something went wrong'
  });
});

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({ error: 'Endpoint not found' });
});

// Start server
app.listen(PORT, () => {
  console.log(`ConvertFlow API server running on port ${PORT}`);
  console.log(`Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log(`Frontend URL: ${process.env.FRONTEND_URL || 'http://localhost:5173'}`);
});

module.exports = app;