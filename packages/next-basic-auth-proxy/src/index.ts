/* eslint-disable n/no-process-env */

export function basicAuth(request: Request): Response | null {
  function unauthorized() {
    return new Response("Auth required", {
      status: 401,
      headers: {
        "WWW-Authenticate": "Basic",
      },
    });
  }

  // Vercel 環境でない場合は認証不要
  if (process.env.VERCEL !== "1") {
    return null;
  }

  // BASIC_AUTH_TARGET のバリデーション
  if (
    !process.env.BASIC_AUTH_TARGET ||
    !["all", "production"].includes(process.env.BASIC_AUTH_TARGET)
  ) {
    throw new Error("BASIC_AUTH_TARGET must be 'all' or 'production'");
  }

  // production ターゲットでも、production 環境以外では認証スキップ
  if (process.env.BASIC_AUTH_TARGET === "production" && process.env.VERCEL_ENV !== "production") {
    return null;
  }

  const authUser = process.env.BASIC_AUTH_USER;
  if (!authUser) {
    throw new Error("BASIC_AUTH_USER is not set");
  }

  const authPassword = process.env.BASIC_AUTH_PASSWORD;
  if (!authPassword) {
    throw new Error("BASIC_AUTH_PASSWORD is not set");
  }

  const authorization = request.headers.get("authorization");
  if (!authorization) {
    return unauthorized();
  }

  const authValue = authorization.split(" ")[1];
  if (authValue === undefined) {
    return unauthorized();
  }

  try {
    const [user, password] = atob(authValue).split(":");
    if (user !== authUser || password !== authPassword) {
      return unauthorized();
    }
  } catch {
    return unauthorized();
  }

  return null;
}
