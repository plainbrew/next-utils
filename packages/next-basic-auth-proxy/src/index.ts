/* eslint-disable n/no-process-env */

export type VercelEnvTarget = "only-production" | "all" | "disabled";

export type BasicAuthOptions = {
  username: string;
  password: string;
  /**
   * Vercel 環境のどの範囲で Basic 認証を適用するか
   * @default 'only-production'
   */
  vercelEnvTarget?: VercelEnvTarget;
  /**
   * NODE_ENV=development でも Basic 認証を適用するか
   * @default false
   */
  dev?: boolean;
};

export function basicAuth(
  request: Request,
  {
    username: authUsername,
    password: authPassword,
    vercelEnvTarget = "only-production",
    dev = false,
  }: BasicAuthOptions,
): Response | null {
  function unauthorized() {
    return new Response("Auth required", {
      status: 401,
      headers: {
        "WWW-Authenticate": "Basic",
      },
    });
  }

  if (process.env.NODE_ENV === "development") {
    if (!dev) {
      return null;
    }
  }

  if (process.env.VERCEL === "1") {
    if (vercelEnvTarget === "disabled") {
      return null;
    }
    if (vercelEnvTarget === "only-production" && process.env.VERCEL_ENV !== "production") {
      return null;
    }
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
    const [username, password] = atob(authValue).split(":");
    if (username !== authUsername || password !== authPassword) {
      return unauthorized();
    }
  } catch {
    return unauthorized();
  }

  return null;
}
