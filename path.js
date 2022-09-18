export function extname(path) {
  const re = /(?:\.([^.]+))?$/;
  return re.exec(path)[1];
}
