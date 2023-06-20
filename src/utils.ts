export let getHeaderDefaults = (user: Record<string, any>, headers: Headers) => {
  let defaults: Record<string, any> = {
    ...user,
  };
  ["domain", "append", "vanity", "ext"].forEach((x) => (defaults[x] = headers.get(`ascella-${x}`) || defaults[x]));
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

  ["color", "title", "description", "sitename", "sitename-url", "author", "author-url"].forEach((x) => {
    let val = headers.get(`ascella-og-${x}`);
    if (val) defaults.embed[x] = val;
  });

  return defaults;
};
export function stringInject(str: string, data: Record<string, any>): string {
  return (str ?? "").replace(/({([^}]+)})/g, function (i) {
    let key = i.replace(/{/, "").replace(/}/, "");
    if (data[key] == null) {
      return i;
    }
    return data[key];
  });
}


export function getRandomVibrantHexColor() {
  const hue = Math.floor(Math.random() * 360);
  const saturation = Math.floor(Math.random() * 41) + 60; // Set saturation between 60% and 100%
  const lightness = Math.floor(Math.random() * 31) + 40; // Set lightness between 40% and 70%

  const chroma = (1 - Math.abs(2 * lightness / 100 - 1)) * saturation / 100;
  const x = chroma * (1 - Math.abs(((hue / 60) % 2) - 1));
  const m = lightness / 100 - chroma / 2;

  const rgb = [hue + 120, hue, hue - 120].map(color => {
    const k = (color / 60) % 6;
    const val = chroma * Math.max(0, Math.min(k, 4 - k, 1)) + m;
    return Math.round(val * 255);
  });

  const hex = rgb.map(v => v.toString(16).padStart(2, '0')).join('');
  return `#${hex}`;
}