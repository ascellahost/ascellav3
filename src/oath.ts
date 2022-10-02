import { Context, Hono } from "hono";
import { extension } from "mime-types";
import {
  authError,
  badRequest,
  basicData,
  notFound,
  serverError,
} from "./errors";
import { genVanity } from "./urlStyle";
import { verifyKey } from "discord-interactions";
import type { DiscordInteraction } from "discordeno/types";
import { InteractionTypes } from "discordeno/types";
import { AscellaContext, commands, handleCommand } from "./commands/mod";
import { Styles, UploadLimits } from "common/build/main";
import { getHeaderDefaults, stringInject } from "./utils";
import { getOrm } from "./orm";
import { Value } from "@sinclair/typebox/value";

export const oath = new Hono<{ Bindings: Bindings }>();

const callback = (host: string) => `${host}/api/discord/callback`;

const generateDiscordAuthUrl = (host: string, clientId: string) => {
  const BASE_INVITE_URL =
    `https://discord.com/oauth2/authorize?client_id=${clientId}` as const;
  return (
    `${BASE_INVITE_URL}&redirect_uri=${
      encodeURIComponent(callback(host))
    }&response_type=code&scope=identify` as const
  );
};

oath.get("/auth", async (c) => {
  const invite = generateDiscordAuthUrl(c.env.HOST, c.env.CLIENT_ID);
  return Response.redirect(invite, 302);
});

oath.get("/callback", async (c) => {
  const url = new URL(c.req.url);
  // fetch returnCode set in the URL parameters.
  const returnCode = url.searchParams.get("code")!;
  console.log("returnCode =>", returnCode);

  // initializing data object to be pushed to Discord's token endpoint.
  // the endpoint returns access & refresh tokens for the user.
  const dataObject = {
    client_id: c.env.CLIENT_ID,
    client_secret: c.env.CLIENT_SECRET,
    grant_type: "authorization_code",
    redirect_uri: callback(c.env.HOST),
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

  // redirect user to front page with cookies set
  const access_token_expires_in = new Date(Date.now() + response.expires_in); // 10 minutes
  const refresh_token_expires_in = new Date(
    Date.now() + 30 * 24 * 60 * 60 * 1000,
  ); // 30 days
  console.log("redirect to / with cookies");
  return new Response(undefined, {
    headers: {
      "Set-Cookie": [
        `access_token=${response.access_token}; Expires=${access_token_expires_in.toUTCString()}; HttpOnly; Path=/`,
        `refresh_token=${response.refresh_token}; Expires=${refresh_token_expires_in.toUTCString()}; HttpOnly; Path=/`,
      ].join(","),
      "Location": "/",
    },
  });
});
oath.get("/refresh", async (c) => {
  const url = new URL(c.req.url);
  const disco_refresh_token = url.searchParams.get("code");
  if (!disco_refresh_token) {
    return serverError("No refresh token found");
  }

  // initializing data object to be pushed to Discord's token endpoint.
  // quite similar to what we set up in callback.js, expect with different grant_type.
  const dataObject = {
    client_id: c.env.CLIENT_ID,
    client_secret: c.env.CLIENT_SECRET,
    redirect_uri: callback(c.env.HOST),
    grant_type: "refresh_token",
    refresh_token: disco_refresh_token,
    scope: "identify guilds",
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
  const refresh_token_expires_in = new Date(
    Date.now() + 30 * 24 * 60 * 60 * 1000,
  ); // 30 days
  console.log("set refreshed cookies");

  return new Response(
    JSON.stringify({ disco_access_token: response.access_token }),
    {
      headers: {
        "Set-Cookie": [
          `access_token=${response.access_token}; Expires=${access_token_expires_in.toUTCString()}; HttpOnly; Path=/`,
          `refresh_token=${response.refresh_token}; Expires=${refresh_token_expires_in.toUTCString()}; HttpOnly; Path=/`,
        ].join(","),
        "Location": "/",
      },
    },
  );
});
oath.get("/signout", async (c) => {
  return new Response(undefined, {
    headers: {
      "Set-Cookie": [
        `disco_access_token=deleted; Path=/; Max-Age=-1`,
        `disco_refresh_token=deleted; Path=/; Max-Age=-1`,
      ].join(","),
      "Location": "/",
    },
  });
});
export default oath;
