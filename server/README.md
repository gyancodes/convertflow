# ConvertFlow Server API

A high-performance Node.js API for converting PNG and JPEG images to SVG format with advanced vectorization capabilities.

## Features

- **Multiple Conversion Engines**: ImageTracer.js and Potrace support
- **Premium Tier System**: Free, Pro, and Enterprise plans with different limits
- **Batch Processing**: Convert multiple files simultaneously
- **Rate Limiting**: Protect against abuse with configurable limits
- **Security**: Helmet, CORS, and input validation
- **File Size Management**: Configurable limits per tier
- **Compression**: Built-in response compression

## Quick Start

### Installation

```bash
cd server
npm install
```

### Configuration

1. Copy the environment template:
```bash
cp .env.example .env
```

2. Edit `.env` with your configuration:
```env
PORT=3001
NODE_ENV=development
FRONTEND_URL=http://localhost:5173
```

### Running the Server

Development mode:
```bash
npm run dev
```

Production mode:
```bash
npm start
```

## API Endpoints

### Health Check
```
GET /api/health
```

### Premium Tiers
```
GET /api/premium/tiers
```

### Single File Conversion
```
POST /api/convert/single
Content-Type: multipart/form-data

Headers:
- x-user-tier: free|pro|enterprise (optional, defaults to 'free')

Body:
- file: Image file (PNG/JPEG)
- mode: 'wrapper' | 'vectorize' (optional, defaults to 'vectorize')
- engine: 'imagetracer' | 'potrace' (optional, defaults to 'imagetracer')
- Additional options based on engine
```

### Batch Conversion
```
POST /api/convert/batch
Content-Type: multipart/form-data

Headers:
- x-user-tier: free|pro|enterprise (optional, defaults to 'free')

Body:
- files: Array of image files (PNG/JPEG)
- mode: 'wrapper' | 'vectorize' (optional, defaults to 'vectorize')
- engine: 'imagetracer' | 'potrace' (optional, defaults to 'imagetracer')
- Additional options based on engine
```

## Premium Tiers

| Tier | Max File Size | Max Batch Size | Rate Limit |
|------|---------------|----------------|------------|
| Free | 5MB | 3 files | 100 req/15min |
| Pro | 50MB | 25 files | 1000 req/15min |
| Enterprise | 200MB | 100 files | 1000 req/15min |

## Conversion Options

### ImageTracer.js Options
- `numberofcolors`: Number of colors (default: 16)
- `ltres`: Line threshold (default: 1)
- `qtres`: Quad threshold (default: 1)
- `scale`: Scale factor (default: 1)
- `pathomit`: Path omit threshold (default: 8)

### Potrace Options
- `threshold`: Threshold value (default: 128)
- `optTolerance`: Optimization tolerance (default: 0.2)
- `turdSize`: Turd size (default: 2)
- `turnPolicy`: Turn policy (default: 'black')

## Error Handling

The API returns structured error responses:

```json
{
  "error": "Error type",
  "message": "Detailed error message",
  "upgrade": true // If upgrade is recommended
}
```

## Security Features

- **Helmet**: Security headers
- **CORS**: Cross-origin resource sharing
- **Rate Limiting**: Per-IP request limits
- **File Validation**: Type and size checking
- **Input Sanitization**: Secure parameter handling

## Performance

- **Compression**: Gzip compression for responses
- **Memory Management**: Efficient buffer handling
- **Concurrent Processing**: Async/await for batch operations
- **Error Recovery**: Graceful error handling

## Monitoring

The server includes built-in monitoring:
- Health check endpoint
- Processing time tracking
- Success/failure metrics
- File size analytics

## Development

### Adding New Conversion Engines

1. Create a new conversion function in `index.js`
2. Add engine option to the conversion endpoints
3. Update documentation

### Extending Premium Features

1. Modify `PREMIUM_TIERS` configuration
2. Update `checkPremiumLimits` middleware
3. Add new tier validation logic

## Deployment

### Railway (Recommended)

This project is configured for Railway deployment with `railway.json`. Simply connect your repository to Railway and it will automatically deploy.

### Environment Variables

Set these in production:
- `NODE_ENV=production`
- `PORT=3001`
- `FRONTEND_URL=https://your-domain.com`
- `JWT_SECRET=secure-random-string`

## License

MIT License - see LICENSE file for details.