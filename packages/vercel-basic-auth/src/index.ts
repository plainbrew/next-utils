export type VercelEnvTarget = "only-production" | "all" | "disabled";

export type BasicAuthOptions = {
  username: string | undefined;
  password: string | undefined;
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
  /**
   * 組み込みの環境判定後、認証チェック前に呼ばれるコールバック
   * - true を返すと通常の認証フローに進む
   * - false を返すと認証失敗 (401) を返す
   */
  beforeAuth?: (request: Request) => boolean;
  /**
   * 認証成功後に呼ばれるコールバック
   * - true を返すと通過する
   * - false を返すと認証失敗 (401) を返す
   */
  afterAuth?: (request: Request) => boolean;
};

export function basicAuth(
  request: Request,
  {
    username: authUsername,
    password: authPassword,
    vercelEnvTarget = "only-production",
    dev = false,
    beforeAuth,
    afterAuth,
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

  if (beforeAuth && !beforeAuth(request)) {
    return unauthorized();
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

  if (!authUsername || !authPassword) {
    throw new Error(
      "@plainbrew/vercel-basic-auth: username and password must not be empty or undefined",
    );
  }

  const authorization = request.headers.get("authorization");
  if (!authorization) {
    return unauthorized();
  }

  const matched = authorization.match(/^Basic\s+(.+)$/i);
  if (!matched) {
    return unauthorized();
  }

  try {
    const decoded = atob(matched[1]);
    const separatorIndex = decoded.indexOf(":");
    if (separatorIndex < 0) {
      return unauthorized();
    }
    const username = decoded.slice(0, separatorIndex);
    const password = decoded.slice(separatorIndex + 1);
    if (username !== authUsername || password !== authPassword) {
      return unauthorized();
    }
  } catch {
    return unauthorized();
  }

  if (afterAuth && !afterAuth(request)) {
    return unauthorized();
  }

  return null;
}
