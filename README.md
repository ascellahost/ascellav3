# Ascella (to the clouds)

This is Ascella but fully rewritten to work with the Cloudflare ecosystem

## Status

- [x] Backend
- [ ] Embed Service
- [ ] Website

## Developing

Create a .env file with the following contents (available on the discord dashboard):

```env
# .env
CLIENT_ID=
CLIENT_PUB=
CLIENT_SECRET=
CLIENT_TOKEN=
```

### Creating the tables

Open `BACKEND_URL/discord?token=CLIENT_TOKEN` in your browser to create the tables and initialize the commands.

### Running the backend

```bash
pnpm i
pnpm dev
```
