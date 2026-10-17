# Backend deployment

For a Render web service, set the **Root Directory** to `backend`, the **Build
Command** to `npm run build:render`, and the **Start Command** to `npm start`.

The Render build command uses `npm ci --include=dev` so TypeScript and the
backend's `@types/*` packages are installed for compilation even when
`NODE_ENV=production`. The production start command runs the compiled server.
