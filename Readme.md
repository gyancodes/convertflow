# ConvertFlow

Professional PNG/JPEG to SVG converter with dual-engine processing and batch conversion capabilities.

## Features

- **Dual Engine Processing**: Potrace (smooth curves) and ImageTracer (color preservation)
- **Batch Conversion**: Process multiple files simultaneously
- **Premium Tiers**: Free, Pro, and Enterprise plans with different limits
- **Server-Side Processing**: Reliable backend API with rate limiting
- **Advanced Options**: Customizable conversion settings per engine
- **ZIP Downloads**: Batch download converted files

## Tech Stack

- **Frontend**: React 18 + TypeScript + Vite + Tailwind CSS
- **Backend**: Node.js + Express + Sharp + Potrace + ImageTracer
- **Deployment**: Railway (backend) + Vercel (frontend)

## Quick Start

```bash
# Install dependencies
npm run install:all

# Start development servers
npm run dev
```

## API Endpoints

### Single File Conversion
```
POST /api/convert/single
Content-Type: multipart/form-data

Body:
- file: Image file (PNG/JPEG)
- engine: 'potrace' | 'imagetracer'
- mode: 'vectorize' | 'wrapper'
```

### Batch Conversion
```
POST /api/convert/batch
Content-Type: multipart/form-data

Body:
- files: Array of image files
- engine: 'potrace' | 'imagetracer'
```


## Deployment

### Railway (Backend)
1. Create Railway project
2. Set root directory: `server`
3. Environment variables:
   ```
   NODE_ENV=production
   FRONTEND_URL=https://your-vercel-app.vercel.app
   JWT_SECRET=your-secure-secret
   ```

### Vercel (Frontend)
1. Create Vercel project
2. Set root directory: `client`
3. Environment variables:
   ```
   VITE_API_URL=https://your-railway-app.railway.app
   ```

## Scripts

```bash
npm run dev              # Start both services
npm run dev:client       # Client only
npm run dev:server       # Server only
npm run build           # Build client
npm run test            # Run tests
```

## License

MIT
