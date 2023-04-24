export const basicData = (status: number, message: string, success?: boolean, opts?: Record<string, any>) => {
  if (success == undefined) {
    success = status > 200 && status < 299;
  }
  return {
    status,
    message,
    success,
    donate: "Like ascella? consider supporting me on github https://github.com/sponsors/Tricked-dev/",
    ...opts,
  } as const;
};
export const basicResponse = (...args: [...data: Parameters<typeof basicData>, headers?: Record<string, any>]): Response => {
  let headers = {};
  if (args.length == 5) {
    headers = args.pop() as Record<string, any>;
  }
  const content = basicData(...(args as unknown as Parameters<typeof basicData>));
  return Response.json(content, {
    status: content.status,
    headers: {
      "content-type": "application/json",
      ...headers,
    },
  });
};
export const authError = (msg?: string) => {
  return Response.json(basicData(401, msg ?? "Unauthorized"), { status: 401 });
};
export const notFound = () => {
  return Response.json(basicData(404, "Not Found"), { status: 404 });
};
export const internalError = () => {
  return Response.json(basicData(500, "Internal Server Error"), {
    status: 500,
  });
};
export const badRequest = (message = "Bad Request") => {
  return Response.json(basicData(400, message), { status: 400 });
};
export const forbidden = () => {
  return Response.json(basicData(403, "Forbidden"), { status: 403 });
};
export const rateLimitReached = (timeLeft: number) => {
  return Response.json(basicData(429, `Rate limit reached. Try again in ${timeLeft} seconds`), { status: 429 });
};
export const serverError = (message: string) => {
  return Response.json(basicData(500, message), { status: 500 });
};
