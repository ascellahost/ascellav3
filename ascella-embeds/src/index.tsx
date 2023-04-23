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
    const name = new URL(req.url).pathname.split("/").at(-1) || "";

    if (headers.some((x) => req.headers.get("user-agent")?.toLowerCase().includes(x)) || req.url.endsWith("+")) {
      const r = await fetch(`https://api.ascella.host/api/v3/files/${name}`);
      if (r.ok) {
        const rson = (await r.json()) as any;
        if (rson.redirect) {
          return Response.redirect(rson.redirect);
        }
        const meta = [
          ["og:title", rson.embed.title],
          ["description", rson.embed.description],
          ["og:description", rson.embed.description],
          ["color", rson.embed.color],
          ["theme-color", rson.embed.color],
          ["og:site_name", rson.embed.sitename],
          ["og:site_name-url", rson.embed.sitenameUrl],
          ["og:author", rson.embed.author],
          ["og:author-url", rson.embed.authorUrl],
          ["og:image", rson.raw],
          ["twitter:image:src", rson.raw],
          ["twitter:card", "summary_large_image"],
          ["viewport", "width=device-width, initial-scale=1"],
        ]
          .filter((x) => x[1])
          .map((x) => `<meta name="${x[0]}" content="${x[1]}">`)
          .join("");
        const data = `<!DOCTYPE html><html lang="en">
<head>${rson.embed.title && `<title>${rson.embed.title}</title>`}
<meta charset="UTF-8">
<meta http-equiv="X-UA-Compatible" content="IE=edge">${meta}
</head>
<body>
<img src="${rson.raw}">
</body>
</html>`;

        return new Response(data, {
          headers: {
            "content-type": "text/html; charset=UTF-8",
          },
        });
      }
    }
    return Response.redirect(`https://ascella.host/view/${name}`, 301);
  },
};
