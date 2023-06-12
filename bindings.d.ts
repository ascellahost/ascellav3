type Bindings = {
  ASCELLA_DATA: R2Bucket;
  ASCELLA_DB: D1Database;
  ASCELLA_KV: KVNamespace;
};
declare var CLIENT_ID: string;
declare var CLIENT_SECRET: string;
declare var CLIENT_PUB: string;
declare var CLIENT_TOKEN: string;
declare var CLOUDFLARE_API_TOKEN: string;
declare var APP_URL: string;
declare var SENTRY_DSN: string;
declare var DEBUG: boolean;
declare var GUILD_STATS_ID: string;
declare var GUILD_ID: string
declare var ADMIN_SECRET: string

declare var ulid: (timestamp?: number) => string;
