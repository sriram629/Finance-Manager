# Hero and branding design

## Direction
Preserve Finance Manager's violet identity, add a calm public entry point, and keep decorative assets small. The public page follows the system light/dark preference. Existing authenticated and auth-page themes are preserved.

## Page plan
- Compact navigation with a 32px logo, Features, Log in, and Create account.
- Split hero: a clear value proposition alongside a static, explicitly labeled example overview of income, expenses, and schedules.
- Feature rows explain existing schedule import, expense/receipt tracking, and report export capabilities.
- Closing account CTA and compact branded footer.
- Single-column layout on mobile, visible focus styles, chart text alternative, and reduced-motion support.

## Routing and performance
`/` renders the public hero, including for signed-in users. Signed-in visitors get dashboard CTAs. `/login`, `/register`, and `/forgot-password` remain directly accessible; protected routes retain their authentication guard. Password-reset return links explicitly use `/login`.

Auth routes are lazy-loaded. The previous 19 MB PNG background import is replaced with a CSS grid and restrained violet radial gradient, eliminating its network and decoding cost. The original unused source image is retained, but is absent from the production build. No new runtime dependencies were added.

## Brand assets
The shared Brand component fixes the displayed logo at 32px and uses a 96px PNG for sharp high-density displays. Browser favicon, legacy ICO, Apple touch icon, manifest icons, Open Graph, and Twitter metadata use the new logo. The obsolete Create React App public/index.html is removed; client/index.html remains Vite's entry point.

Logo generated using the built-in image generation tool. Prompt: "Use case: logo-brand. Create one compact app logo symbol for Finance Manager, a personal income, work schedule and expense tracker. A crisp white geometric F whose horizontal strokes subtly suggest a stepped financial chart, contained in a solid violet rounded square (#7452dd), flat vector-like design. The symbol must be very simple and recognizable at 16 to 32 pixels. Square canvas, logo occupies 90 percent of canvas, centered, transparent outside the rounded square. No text or wordmark, no mockup, no shadows, no gradients, no extra symbols. Save a usable logo asset."

## Validation
- Production build, TypeScript, and ESLint passed.
- Browser: landing route, compact loaded logos, 390px mobile width without overflow, create-account link, sign-in link, forgot-password and return-to-login links verified.
- No browser console errors observed during those checks.
- Authentication submissions and third-party OAuth were not exercised against production services.
- Lighthouse could not run because the sandbox prevented Chrome's automated launch; browser review used the built-in browser instead. No Lighthouse score is claimed.

## Deployment
Merge the review branch and deploy the frontend through the existing Render workflow. Share the origin URL `/` for the landing page; `/login` intentionally remains the login page. Social metadata currently uses the supplied development Render origin; update those absolute image URLs if the production origin differs.
