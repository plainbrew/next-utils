/* eslint-disable n/no-process-env */

export type VercelEnvTarget = "only-production" | "all";

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

export function basicAuth(request: Request, options: BasicAuthOptions): Response | null {
  function unauthorized() {
    return new Response("Auth required", {
      status: 401,
      headers: {
        "WWW-Authenticate": "Basic",
      },
    });
  }

  const isDev = options.dev === true && process.env.NODE_ENV === "development";

  // Vercel 環境でなく、dev モードでもない場合は認証不要
  if (process.env.VERCEL !== "1" && !isDev) {
    return null;
  }

  // Vercel 環境の場合のみ vercelEnvTarget を検証
  if (!isDev) {
    const vercelEnvTarget = options.vercelEnvTarget ?? "only-production";

    // only-production ターゲットでも、production 環境以外では認証スキップ
    if (vercelEnvTarget === "only-production" && process.env.VERCEL_ENV !== "production") {
      return null;
    }
  }

  const { username: authUser, password: authPassword } = options;

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
