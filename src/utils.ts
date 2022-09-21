export let getHeaderDefaults = (
  user: Record<string, any>,
  headers: Headers,
) => {
  let defaults: Record<string, any> = {
    ...user,
  };
  ["domain", "append", "vanity", "ext"].forEach((x) =>
    defaults[x] = headers.get(`x-ascella-${x}`) || defaults[x]
  );
  let style = parseInt(headers.get("x-ascella-style")!);
  if (style) {
    defaults.url_style = style;
  }
  let autodelete = parseInt(headers.get("x-ascella-autodelete")!);
  if (autodelete) {
    defaults.autodelete = autodelete;
  }
  let length = parseInt(headers.get("x-ascella-vanity-length")!);
  if (length) {
    defaults.length = length;
  }
  defaults.embed = {};

  [
    "color",
    "title",
    "description",
    "sitename",
    "sitename-url",
    "author",
    "author-url",
  ].forEach((x) => {
    let val = headers.get(`x-ascella-og-${x}`);
    if (val) defaults.embed[x] = val;
  });

  return defaults;
};
