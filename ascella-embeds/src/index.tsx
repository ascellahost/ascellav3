import { jsx,Fragment } from 'hono/jsx'
export interface Env {
  BACKEND_URL: string;

}

const headers = [
  "discord",
  "github",
  "twitter",
  "youtube",
  "instagram",
  "linkedin",
  "github",
  "twitter",
  "youtube",
  "instagram",
  "linkedin",
  "element",
  "revolt",
  "curl",
  "matrix",
  "cinny",
  "reddit",
];

export default {
  async fetch(
    req: Request,
    env: Env,
  ): Promise<Response> {
    const name = new URL(req.url).pathname.split("/").at(-1) || "";
    if (name.includes(".")) {
      const [id, ext] = name.split(".");
      return Response.redirect(
        `https://ascella.wtf/v2/ascella/view/${id}.${ext}`,
      );
    }
    if (
      headers.some((x) =>
        req.headers.get("user-agent")?.toLowerCase().includes(x)
      )
    ) {
      const r = await fetch(
        `https://ascella.wtf/v2/ascella/view/${name}/stats`,
      );

      if (r.ok) {
        const rson = await r.json() as any;
        if (rson.redirect) {
          return Response.redirect(rson.redirect);
        }
       
        let data = <Fragment>
          <html>
            <head>
              <title>{rson.embed.title}</title>
              {rson.embed.description &&   <meta name="description" content={rson.embed.description} />}
              <meta name="theme-color" content={rson.embed.color} />
              <meta name="viewport" content="width=device-width, initial-scale=1" />

              <meta property="og:title" content={rson.embed.title} />
              <meta property="og:description" content={rson.embed.description} />
              <meta property="color" content={rson.embed.color} />
              <meta property="og:site_name" content={rson.embed.sitename} />
              <meta property="og:site_name-url" content={rson.embed.sitenameUrl} />
              <meta property="og:author" content={rson.embed.author} />
              <meta property="og:author-url" content={rson.embed.authorUrl} />

              <meta property="og:image" content={rson.raw} />
            </head>

            <body>
              <img src={rson.raw} />
            </body>
          </html>
        </Fragment>
        return new Response(
          data,
          {
            headers: {
              "content-type": "text/html; charset=UTF-8",
            },
          },
        );
      }
    }
    return Response.redirect(`https://ascella.host/${name}`, 301);
  },
};
