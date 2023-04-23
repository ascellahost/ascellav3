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
  async fetch(req: Request, env: Env): Promise<Response> {
    let path = new URL(req.url).pathname;
    if (path == "robots.txt") return new Response("User-agent: *\nDisallow: /", { headers: { "content-type": "text/plain" } });
    const name = path.split("/").at(-1) || "";

    if (headers.some((x) => req.headers.get("user-agent")?.toLowerCase().includes(x)) || req.url.endsWith("+")) {
      const r = await fetch(`https://api.ascella.host/api/v3/files/${name}`);
      if (r.ok) {
        const rson = (await r.json()) as any;
        if (rson.redirect) {
          return Response.redirect(rson.redirect);
        }
        const { embed } = rson;
        const meta = [
          ["og:title", embed.title],
          ["description", embed.description],
          ["og:description", embed.description],
          ["color", embed.color],
          ["theme-color", embed.color],
          ["og:site_name", embed.sitename],
          ["og:site_name-url", embed.sitenameUrl],
          ["og:author", embed.author],
          ["og:author-url", embed.authorUrl],
          ["og:image", rson.raw],
          ["twitter:image:src", rson.raw],
          ["twitter:card", "summary_large_image"],
          ["viewport", "width=device-width, initial-scale=1"],
        ]
          .filter(([, value]) => value)
          .map(([name, content]) => `<meta name="${name}" content="${content}">`)
          .join("");
        const data =
          `<!DOCTYPE html><html lang="en">` +
          `<head>${rson.embed.title && `<title>${rson.embed.title}</title>`}` +
          `<meta charset="UTF-8">` +
          `<meta http-equiv="X-UA-Compatible" content="IE=edge">${meta}` +
          `</head>` +
          `<body>` +
          `<img src="${rson.raw}">` +
          `</body>` +
          `</html>`;

        return new Response(data, {
          headers: {
            "content-type": "text/html; charset=UTF-8",
          },
        });
      }
    }
    return Response.redirect(`https://ascella.host/v/${name}`, 301);
  },
};
