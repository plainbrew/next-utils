import { afterEach, describe, expect, test } from "vitest";

import { basicAuth } from "./index";

const USERNAME = "user";
const PASSWORD = "pass";

function makeRequest(authHeader?: string): Request {
  const headers: Record<string, string> = {};
  if (authHeader !== undefined) {
    headers["authorization"] = authHeader;
  }
  return new Request("https://example.com", { headers });
}

function makeBasicAuthHeader(username: string, password: string): string {
  return `Basic ${btoa(`${username}:${password}`)}`;
}

const ORIGINAL_ENV = {
  NODE_ENV: process.env.NODE_ENV,
  VERCEL: process.env.VERCEL,
  VERCEL_ENV: process.env.VERCEL_ENV,
};

afterEach(() => {
  for (const key of Object.keys(ORIGINAL_ENV) as (keyof typeof ORIGINAL_ENV)[]) {
    if (ORIGINAL_ENV[key] === undefined) {
      delete process.env[key];
    } else {
      process.env[key] = ORIGINAL_ENV[key];
    }
  }
});

describe("NODE_ENV=development", () => {
  test("dev=false (default) のとき null を返す", () => {
    process.env.NODE_ENV = "development";
    const req = makeRequest();
    expect(basicAuth(req, { username: USERNAME, password: PASSWORD })).toBeNull();
  });

  test("dev=true のとき認証チェックをする", () => {
    process.env.NODE_ENV = "development";
    const req = makeRequest();
    const res = basicAuth(req, { username: USERNAME, password: PASSWORD, dev: true });
    expect(res?.status).toBe(401);
  });
});

describe("Vercel 環境 (VERCEL=1)", () => {
  test("vercelEnvTarget=disabled のとき null を返す", () => {
    process.env.VERCEL = "1";
    process.env.VERCEL_ENV = "production";
    const req = makeRequest();
    expect(
      basicAuth(req, { username: USERNAME, password: PASSWORD, vercelEnvTarget: "disabled" }),
    ).toBeNull();
  });

  test("vercelEnvTarget=only-production (default) で VERCEL_ENV=preview のとき null を返す", () => {
    process.env.VERCEL = "1";
    process.env.VERCEL_ENV = "preview";
    const req = makeRequest();
    expect(basicAuth(req, { username: USERNAME, password: PASSWORD })).toBeNull();
  });

  test("vercelEnvTarget=only-production で VERCEL_ENV=production のとき認証チェックをする", () => {
    process.env.VERCEL = "1";
    process.env.VERCEL_ENV = "production";
    const req = makeRequest();
    const res = basicAuth(req, { username: USERNAME, password: PASSWORD });
    expect(res?.status).toBe(401);
  });

  test("vercelEnvTarget=all で VERCEL_ENV=preview のとき認証チェックをする", () => {
    process.env.VERCEL = "1";
    process.env.VERCEL_ENV = "preview";
    const req = makeRequest();
    const res = basicAuth(req, { username: USERNAME, password: PASSWORD, vercelEnvTarget: "all" });
    expect(res?.status).toBe(401);
  });
});

describe("username/password のバリデーション", () => {
  test("username が undefined のとき Error を throw する", () => {
    const req = makeRequest();
    expect(() => basicAuth(req, { username: undefined, password: PASSWORD })).toThrow();
  });

  test("password が undefined のとき Error を throw する", () => {
    const req = makeRequest();
    expect(() => basicAuth(req, { username: USERNAME, password: undefined })).toThrow();
  });

  test("username が空文字のとき Error を throw する", () => {
    const req = makeRequest();
    expect(() => basicAuth(req, { username: "", password: PASSWORD })).toThrow();
  });

  test("password が空文字のとき Error を throw する", () => {
    const req = makeRequest();
    expect(() => basicAuth(req, { username: USERNAME, password: "" })).toThrow();
  });

  test("NODE_ENV=development (dev=false) で username が undefined でも null を返す", () => {
    process.env.NODE_ENV = "development";
    const req = makeRequest();
    expect(basicAuth(req, { username: undefined, password: undefined })).toBeNull();
  });

  test("Vercel disabled で username が undefined でも null を返す", () => {
    process.env.VERCEL = "1";
    process.env.VERCEL_ENV = "production";
    const req = makeRequest();
    expect(
      basicAuth(req, { username: undefined, password: undefined, vercelEnvTarget: "disabled" }),
    ).toBeNull();
  });

  test("Vercel only-production で VERCEL_ENV=preview のとき username が undefined でも null を返す", () => {
    process.env.VERCEL = "1";
    process.env.VERCEL_ENV = "preview";
    const req = makeRequest();
    expect(basicAuth(req, { username: undefined, password: undefined })).toBeNull();
  });
});

describe("認証ヘッダーのバリデーション", () => {
  test("Authorization ヘッダーなしのとき 401 を返す", () => {
    const req = makeRequest();
    const res = basicAuth(req, { username: USERNAME, password: PASSWORD });
    expect(res?.status).toBe(401);
    expect(res?.headers.get("WWW-Authenticate")).toBe("Basic");
  });

  test("Authorization ヘッダーに値がないとき 401 を返す", () => {
    const req = makeRequest("Basic");
    const res = basicAuth(req, { username: USERNAME, password: PASSWORD });
    expect(res?.status).toBe(401);
  });

  test("不正な base64 のとき 401 を返す", () => {
    const req = makeRequest("Basic !!invalid!!");
    const res = basicAuth(req, { username: USERNAME, password: PASSWORD });
    expect(res?.status).toBe(401);
  });

  test("ユーザー名が違うとき 401 を返す", () => {
    const req = makeRequest(makeBasicAuthHeader("wrong", PASSWORD));
    const res = basicAuth(req, { username: USERNAME, password: PASSWORD });
    expect(res?.status).toBe(401);
  });

  test("パスワードが違うとき 401 を返す", () => {
    const req = makeRequest(makeBasicAuthHeader(USERNAME, "wrong"));
    const res = basicAuth(req, { username: USERNAME, password: PASSWORD });
    expect(res?.status).toBe(401);
  });

  test("正しい認証情報のとき null を返す", () => {
    const req = makeRequest(makeBasicAuthHeader(USERNAME, PASSWORD));
    expect(basicAuth(req, { username: USERNAME, password: PASSWORD })).toBeNull();
  });
});
