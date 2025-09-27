# sso.broker

Cloudflare Pages/Workers application acting as both an OIDC client and provider.

## Features
- OIDC client and provider at sso.broker
- Dynamic OIDC provider registration (e.g., apple.sso.broker)
- Apple login integration
- Forwards user email to OIDC client for seamless sign-in

## Getting Started
1. Install dependencies: `npm install`
2. Start local development: `npm run start`
3. Deploy using Wrangler to Cloudflare Workers

## Project Structure
- `src/worker.js`: Cloudflare Worker entry point
- `wrangler.toml`: Cloudflare Worker configuration
- `package.json`: Project metadata and scripts

## Next Steps
- Implement OIDC provider logic
- Integrate Apple login
- Add dynamic registration endpoints
- Forward user email to OIDC client
