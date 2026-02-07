# Deployment Guide

This guide covers deploying the AI Comparison App to various platforms.

## Prerequisites

- Node.js 18+ installed
- Git repository set up
- API keys for Mem0 and Zep AI

## Environment Variables

Set these environment variables in your deployment platform:

```
NODE_ENV=production
PORT=3001 (or let the platform assign it)
VITE_MEM0_API_URL=https://api.mem0.ai (optional, has default)
VITE_ZEP_API_URL=https://api.getzep.com (optional, has default)
```

**Note:** API keys should be configured by users in the app's Settings page, not as environment variables for security.

## Deployment Options

### Option 1: Railway (Recommended - Easiest)

1. Go to [railway.app](https://railway.app) and sign up/login
2. Click "New Project" → "Deploy from GitHub repo"
3. Select your repository
4. Railway will automatically detect the `railway.json` config
5. Add environment variables if needed
6. Deploy!

Railway will:
- Build the app automatically
- Serve both frontend and backend
- Provide a public URL

### Option 2: Render

1. Go to [render.com](https://render.com) and sign up/login
2. Click "New" → "Web Service"
3. Connect your GitHub repository
4. Render will use the `render.yaml` config automatically
5. Set environment variables in the dashboard
6. Deploy!

### Option 3: Vercel

**Note:** Vercel requires separate setup for the backend. You may need to use Vercel Serverless Functions.

1. Go to [vercel.com](https://vercel.com) and sign up/login
2. Import your GitHub repository
3. Vercel will use `vercel.json` config
4. Set environment variables
5. Deploy!

### Option 4: Docker (Any Platform)

Build and run with Docker:

```bash
# Build the image
docker build -t ai-comparison-app .

# Run the container
docker run -p 3001:3001 -e NODE_ENV=production ai-comparison-app
```

Works on:
- AWS ECS/Fargate
- Google Cloud Run
- Azure Container Instances
- DigitalOcean App Platform
- Any Docker-compatible platform

### Option 5: Traditional VPS (Ubuntu/Debian)

1. SSH into your server
2. Install Node.js 18+
3. Clone your repository
4. Install dependencies: `npm ci --production`
5. Build the app: `npm run build`
6. Use PM2 to run: `pm2 start npm --name "ai-comparison" -- start`
7. Set up Nginx reverse proxy (optional but recommended)

## Local Production Build Test

Test the production build locally:

```bash
# Build the app
npm run build

# Start the production server
npm start
```

Visit `http://localhost:3001` to test.

## Important Notes

1. **API Keys**: Users configure API keys in the app's Settings page. Don't hardcode them.
2. **CORS**: The backend proxy handles CORS automatically.
3. **Port**: The server uses `process.env.PORT` or defaults to 3001.
4. **Static Files**: In production, the Express server serves the built React app.

## Troubleshooting

### Build Fails
- Ensure Node.js 18+ is installed
- Check that all dependencies are in `package.json`
- Review build logs for specific errors

### API Calls Fail
- Verify the backend proxy is running
- Check CORS settings
- Ensure API keys are configured in Settings

### Port Issues
- Make sure the PORT environment variable is set
- Check platform-specific port configuration

## Support

For issues, check:
- Build logs in your deployment platform
- Browser console for frontend errors
- Server logs for backend errors
