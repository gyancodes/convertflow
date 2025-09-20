# Railway Deployment Guide

## Project Structure

The project is organized with separate packages:
```
convertflow/
├── client/          # Frontend React application
│   ├── package.json # Client dependencies
│   └── src/         # React components and logic
├── server/          # Backend Node.js API
│   ├── package.json # Server dependencies
│   └── index.js     # Express server
└── package.json     # Root package for managing both
```

## Quick Start

### 1. Backend Deployment (Server)

1. **Create Railway Account**: Go to [railway.app](https://railway.app) and sign up
2. **New Project**: Click "New Project" → "Deploy from GitHub repo"
3. **Select Repository**: Choose your ConvertFlow repository
4. **Configure Service**: 
   - Set root directory to `server`
   - Railway will detect `server/railway.json` automatically
5. **Set Environment Variables**:
   ```
   NODE_ENV=production
   FRONTEND_URL=https://your-frontend-domain.com
   JWT_SECRET=your-secure-random-string-here
   ```
6. **Deploy**: Railway will automatically build and deploy your backend

### 2. Frontend Deployment

#### Option A: Railway (Recommended)
1. **Add Frontend Service**: In your Railway project, click "New Service"
2. **Connect Same Repo**: Select your repository again
3. **Configure Service**:
   - Set root directory to `client`
   - Railway will auto-detect Vite configuration
4. **Set Environment Variables**:
   ```
   VITE_API_URL=https://your-backend-service.railway.app
   ```

#### Option B: Netlify/Vercel
1. Connect your repository to Netlify or Vercel
2. Set root directory: `client`
3. Set build command: `npm run build`
4. Set publish directory: `client/dist`
5. Add environment variable: `VITE_API_URL=https://your-backend-service.railway.app`

### 3. Update Configuration

After both services are deployed:

1. **Update Backend FRONTEND_URL**: Set to your frontend domain
2. **Update Frontend VITE_API_URL**: Set to your backend Railway URL
3. **Test**: Visit your frontend URL and test image conversion

## Environment Variables Reference

### Backend (server/.env)
```
NODE_ENV=production
PORT=3001
FRONTEND_URL=https://your-frontend-domain.com
JWT_SECRET=your-secure-random-string
```

### Frontend (client/.env.local)
```
VITE_API_URL=https://your-backend-service.railway.app
```

## Railway Configuration

The project includes `server/railway.json` with:
- ✅ NIXPACKS builder
- ✅ Health check at `/api/health`
- ✅ Automatic restart on failure
- ✅ Proper start command

## Local Development

### Start Both Services
```bash
# From root directory
npm run dev
```

### Start Separately
```bash
# Terminal 1: Start server
cd server
npm run dev

# Terminal 2: Start client
cd client
npm run dev
```

## Troubleshooting

### Common Issues:
1. **CORS Errors**: Ensure `FRONTEND_URL` is set correctly in backend
2. **API Not Found**: Verify `VITE_API_URL` points to correct Railway backend
3. **Build Failures**: Check that all dependencies are in respective `package.json` files
4. **Root Directory**: Ensure Railway services point to correct directories (`client` or `server`)

### Health Check:
Your backend includes a health endpoint at `/api/health` that Railway uses to monitor service status.

## Support

- Railway Docs: [docs.railway.app](https://docs.railway.app)
- ConvertFlow Issues: [GitHub Issues](./issues)