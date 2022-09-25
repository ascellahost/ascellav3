export let getHeaderDefaults = (
  user: Record<string, any>,
  headers: Headers,
) => {
  let defaults: Record<string, any> = {
    ...user,
  };
  ["domain", "append", "vanity", "ext"].forEach((x) =>
    defaults[x] = headers.get(`ascella-${x}`) || defaults[x]
  );
  let style = parseInt(headers.get("ascella-style")!);
  if (style) {
    defaults.url_style = style;
  }
  let autodelete = parseInt(headers.get("ascella-autodelete")!);
  if (autodelete) {
    defaults.autodelete = autodelete;
  }
  let length = parseInt(headers.get("ascella-vanity-length")!);
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
    let val = headers.get(`ascella-og-${x}`);
    if (val) defaults.embed[x] = val;
  });

  return defaults;
};
export function stringInject(
  str: string,
  data: Record<string, any>,
): string {
  return str.replace(/({([^}]+)})/g, function (i) {
    let key = i.replace(/{/, "").replace(/}/, "");
    if (data[key] == null) {
      return i;
    }
    return data[key];
  });
}
