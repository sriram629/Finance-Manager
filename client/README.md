# Finance Manager Frontend

React 18.3 and TypeScript frontend built with Vite. See the [root README](../README.md) for backend configuration, business rules, and deployment instructions.

## Local development

Use Node.js 22.12+ and run these commands from `client/`:

```bash
npm ci
npm run dev
```

The frontend runs at `http://localhost:8080`. Start the backend separately on port 5050. Create `client/.env` with:

```dotenv
VITE_API_URL=http://localhost:5050/api
```

The API URL includes `/api`. Backend credentials belong in server settings. Vite exposes `VITE_` variables to the browser.

## Validation and production build

```bash
npm run lint
npx tsc --noEmit -p tsconfig.app.json
npm run build
```

The output directory is `dist`. `npm run preview` previews the built frontend; it does not start the API. Configure `VITE_API_URL` before building for a separately hosted backend. The root Dockerfile builds with `/api` and serves frontend and API from the same origin.

## Source layout

- `src/pages/`: landing, authentication, dashboard, schedules, expenses, reports, settings
- `src/components/`: shared layout and UI
- `src/context/`: authentication state
- `src/api/axios.ts`: request configuration and bearer-token handling
- `src/lib/socialLogin.ts`: browser verifier and OAuth redirect

Dashboard data uses TanStack Query; charts use Recharts. See the root README's monthly-salary limitation before relying on totals.
