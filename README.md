# AI Comparison App - Mem0 vs Zep

A modern web application for comparing and documenting the best use cases of Mem0 AI and Zep AI.

## Features

- 🚀 Interactive chat interfaces for both Mem0 and Zep AI
- 📊 Side-by-side comparison view
- 📝 Documentation and note-taking for use cases
- 🎨 Modern, sleek UI with Tailwind CSS
- ⚡ Fast and responsive design

## Setup

1. Install dependencies:
```bash
npm install
```

2. Create a `.env` file in the root directory:
```
VITE_MEM0_API_KEY=your_mem0_api_key
VITE_ZEP_API_KEY=your_zep_api_key
VITE_MEM0_API_URL=https://api.mem0.ai
VITE_ZEP_API_URL=https://api.getzep.com
```

3. Start the development servers (backend + frontend):
```bash
npm run dev:all
```

Or run separately:
```bash
# Terminal 1 - Backend
npm run dev:server

# Terminal 2 - Frontend
npm run dev
```

## Production Build

Build and run in production mode:

```bash
# Build the app
npm run build

# Start production server
npm start
```

## Deployment

This app is ready to deploy to various platforms:

- **Railway** - Easiest option, see `railway.json`
- **Render** - See `render.yaml`
- **Vercel** - See `vercel.json`
- **Docker** - See `Dockerfile`
- **Any Node.js hosting** - Just run `npm start` after building

See [DEPLOYMENT.md](./DEPLOYMENT.md) for detailed deployment instructions.

## API Integration

This app integrates with:
- **Mem0 AI**: Memory management for AI applications
- **Zep AI**: Context engineering and temporal memory

Both APIs require authentication via API keys. Users can configure API keys in the Settings page of the app, or you can set them via environment variables for development.

**Note:** For security, API keys should be configured by users in the app, not hardcoded in the deployment.
