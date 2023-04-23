# Ascella (to the clouds)

This is Ascella but fully rewritten to work with the Cloudflare ecosystem

## Status

- [x] Backend
- [ ] Embed Service
- [ ] Website

## Developing

Create a env.json

```json
{
  "default": {
    "CLIENT_ID": "",
    "CLIENT_PUB": "",
    "CLIENT_SECRET": "",
    "CLIENT_TOKEN": "",
    "SENTRY_DSN": "",
    "DEBUG": false
  },
  "development": {
    "APP_URL": "http://127.0.0.1:8787",
    "DEBUG": true
  },
  "staging": {
    "APP_URL": "https://staging.ascella.host"
  },
  "production": {
    "APP_URL": "https://api.ascella.host"
  }
}
```

### Creating the tables

Open `BACKEND_URL/discord?token=CLIENT_TOKEN` in your browser to create the tables and initialize the commands.

### Running the backend

```bash
pnpm i
pnpm dev
```
