# ConvertFlow - Image to SVG Converter

Advanced web application that converts PNG images into scalable vector graphics using computer vision algorithms.

## Features

- **True Vector Conversion**: Converts raster images to actual vector paths
- **Smart Color Quantization**: Intelligent color reduction with K-means clustering
- **Batch Processing**: Convert multiple files simultaneously
- **Client-Side Processing**: All processing happens locally - no uploads needed
- **Real-time Preview**: Side-by-side comparison of original and converted images
- **Web Workers**: Background processing for smooth UI performance

## Tech Stack

- **Frontend**: React 18 + TypeScript + Vite + Tailwind CSS
- **Backend**: Node.js + Express + Jimp
- **Processing**: Canvas API + Web Workers
- **Testing**: Vitest + Testing Library

## Quick Start

### Prerequisites
- Node.js (v18 or higher)

### Installation
```bash
# Clone repository
git clone <repository-url>
cd convertflow

# Install dependencies
npm run install:all

# Start development servers
npm run dev
```

### Available Scripts
```bash
npm run dev              # Start both client and server
npm run dev:client       # Start client only
npm run dev:server       # Start server only
npm run build           # Build for production
npm run test            # Run tests
```

## Project Structure

```
convertflow/
├── client/             # Frontend React application
│   ├── src/           # React components and logic
│   └── package.json   # Client dependencies
├── server/            # Backend Node.js API
│   ├── index.js       # Express server
│   └── package.json   # Server dependencies
└── package.json       # Root management scripts
```

## Deployment

### Railway (Recommended)

#### Backend Deployment
1. Create Railway account at [railway.app](https://railway.app)
2. Create new project → Deploy from GitHub repo
3. Configure service:
   - Root directory: `server`
   - Auto-detects `railway.json`
4. Set environment variables:
   ```
   NODE_ENV=production
   FRONTEND_URL=https://your-frontend-domain.com
   JWT_SECRET=your-secure-random-string
   ```

#### Frontend Deployment
1. Add new service in Railway project
2. Connect same repository
3. Configure service:
   - Root directory: `client`
   - Auto-detects Vite configuration
4. Set environment variables:
   ```
   VITE_API_URL=https://your-backend-service.railway.app
   ```

### Alternative: Netlify/Vercel (Frontend)
1. Connect repository to Netlify/Vercel
2. Set build settings:
   - Root directory: `client`
   - Build command: `npm run build`
   - Publish directory: `client/dist`
3. Environment variables:
   ```
   VITE_API_URL=https://your-backend-service.railway.app
   ```

### Environment Variables

**Backend (.env)**
```
NODE_ENV=production
PORT=3001
FRONTEND_URL=https://your-frontend-domain.com
JWT_SECRET=your-secure-random-string
```

**Frontend (.env.local)**
```
VITE_API_URL=https://your-backend-service.railway.app
```

## Local Development

### Start Both Services
```bash
npm run dev
```

### Start Separately
```bash
# Terminal 1: Server
cd server && npm run dev

# Terminal 2: Client  
cd client && npm run dev
```

## Browser Support

- Modern browsers with Canvas and Web Worker support
- Chrome 60+, Firefox 55+, Safari 12+, Edge 79+

## License

MIT License
