import { Hono } from "hono";
import { internalError, serverError } from "./errors";
import { getOrm } from "./orm";
import { genVanity } from "./urlStyle";
import { UploadLimits } from "common/src";

export const oauth = new Hono<{ Bindings: Bindings }>();

const callback = (host: string) => `https://${host}/oauth/callback`;

const generateDiscordAuthUrl = (host: string, clientId: string) => {
  const BASE_INVITE_URL = `https://discord.com/oauth2/authorize?client_id=${clientId}` as const;
  return `${BASE_INVITE_URL}&redirect_uri=${encodeURIComponent(callback(host))}&response_type=code&scope=identify` as const;
};

oauth.get("/auth", async (c) => {
  let host = new URL(APP_URL).host;
  const invite = generateDiscordAuthUrl(host, CLIENT_ID);
  return Response.redirect(invite, 302);
});

oauth.get("/callback", async (c) => {
  let { users } = getOrm(c.env.ASCELLA_DB);

  let host = new URL(APP_URL).host;

  const url = new URL(c.req.url);
  // fetch returnCode set in the URL parameters.
  const returnCode = url.searchParams.get("code")!;
  console.log("returnCode =>", returnCode);

  // initializing data object to be pushed to Discord's token endpoint.
  // the endpoint returns access & refresh tokens for the user.
  const dataObject = {
    client_id: CLIENT_ID,
    client_secret: CLIENT_SECRET,
    grant_type: "authorization_code",
    redirect_uri: callback(host),
    code: returnCode,
    scope: "identify",
  };

  // performing a Fetch request to Discord's token endpoint
  const request = await fetch("https://discord.com/api/oauth2/token", {
    method: "POST",
    body: new URLSearchParams(dataObject),
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
  });

  const response = await request.json<Record<string, any>>();

  // redirect to front page in case of error
  if (response.error) {
    console.log("redirect to / due error");
    return Response.redirect("/", 302);
  }

  let result: Record<string, string> = await fetch("https://discordapp.com/api/users/@me", {
    headers: {
      Authorization: `Bearer ${response.access_token}`,
    },
  }).then((r) => r.json());
  let id = result.id;
  if (!id) return internalError();
  let user = await users.First({
    where: {
      email: `${id}@disco`,
    },
  });
  if (!user) {
    await users.InsertOne({
      domain: "i.ascella.host",
      email: `${id}@disco`,
      name: result.username || genVanity(1),
      token: genVanity(1, 12),
      uuid: genVanity(2),
      upload_limit: UploadLimits.User,
    });
    user = await users.First({
      where: {
        email: `${id}@disco`,
      },
    });
  } else {
    user.token = genVanity(1, 12);
    await users.Update({
      where: {
        email: `${id}@disco`,
      },
      data: {
        token: user.token,
      },
    });
  }

  return Response.redirect(`https://ascella.host/token?token=${user?.token}`, 302);

  // redirect user to front page with cookies set
  // const access_token_expires_in = new Date(Date.now() + response.expires_in); // 10 minutes
  // const refresh_token_expires_in = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000); // 30 days
  // console.log("redirect to / with cookies");
});
oauth.get("/refresh", async (c) => {
  let host = new URL(APP_URL).host;

  const url = new URL(c.req.url);
  const disco_refresh_token = url.searchParams.get("code");
  if (!disco_refresh_token) {
    return serverError("No refresh token found");
  }

  // initializing data object to be pushed to Discord's token endpoint.
  // quite similar to what we set up in callback.js, expect with different grant_type.
  const dataObject = {
    client_id: CLIENT_ID,
    client_secret: CLIENT_SECRET,
    redirect_uri: callback(host),
    grant_type: "refresh_token",
    refresh_token: disco_refresh_token,
    scope: "identify",
  };

  // performing a Fetch request to Discord's token endpoint
  const request = await fetch("https://discord.com/api/oauth2/token", {
    method: "POST",
    body: new URLSearchParams(dataObject),
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
  });

  const response = await request.json<Record<string, string>>();

  if (response.error) {
    return serverError(response.error);
  }

  // redirect user to front page with cookies set
  const access_token_expires_in = new Date(Date.now() + response.expires_in); // 10 minutes
  const refresh_token_expires_in = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000); // 30 days
  console.log("set refreshed cookies");
  let result: Record<string, string> = await fetch("https://discordapp.com/api/users/@me", {
    headers: {
      Authorization: `Bearer ${response.access_token}`,
    },
  }).then((r) => r.json());
  let id = result.id;

  return new Response(JSON.stringify({}), {
    headers: {
      "Set-Cookie": [
        `access_token=${response.access_token}; Expires=${access_token_expires_in.toUTCString()}; HttpOnly; Path=/`,
        `refresh_token=${response.refresh_token}; Expires=${refresh_token_expires_in.toUTCString()}; HttpOnly; Path=/`,
      ].join(","),
    },
  });
});
oauth.get("/signout", async (c) => {
  return new Response(undefined, {
    headers: {
      "Set-Cookie": [`disco_access_token=deleted; Path=/; Max-Age=-1`, `disco_refresh_token=deleted; Path=/; Max-Age=-1`].join(","),
      Location: "/",
    },
  });
});
export default oauth;
