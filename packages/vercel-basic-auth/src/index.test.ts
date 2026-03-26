import { afterEach, describe, expect, it } from "vitest";

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

afterEach(() => {
  delete process.env.NODE_ENV;
  delete process.env.VERCEL;
  delete process.env.VERCEL_ENV;
});

describe("NODE_ENV=development", () => {
  it("dev=false (default) のとき null を返す", () => {
    process.env.NODE_ENV = "development";
    const req = makeRequest();
    expect(basicAuth(req, { username: USERNAME, password: PASSWORD })).toBeNull();
  });

  it("dev=true のとき認証チェックをする", () => {
    process.env.NODE_ENV = "development";
    const req = makeRequest();
    const res = basicAuth(req, { username: USERNAME, password: PASSWORD, dev: true });
    expect(res?.status).toBe(401);
  });
});

describe("Vercel 環境 (VERCEL=1)", () => {
  it("vercelEnvTarget=disabled のとき null を返す", () => {
    process.env.VERCEL = "1";
    process.env.VERCEL_ENV = "production";
    const req = makeRequest();
    expect(
      basicAuth(req, { username: USERNAME, password: PASSWORD, vercelEnvTarget: "disabled" }),
    ).toBeNull();
  });

  it("vercelEnvTarget=only-production (default) で VERCEL_ENV=preview のとき null を返す", () => {
    process.env.VERCEL = "1";
    process.env.VERCEL_ENV = "preview";
    const req = makeRequest();
    expect(basicAuth(req, { username: USERNAME, password: PASSWORD })).toBeNull();
  });

  it("vercelEnvTarget=only-production で VERCEL_ENV=production のとき認証チェックをする", () => {
    process.env.VERCEL = "1";
    process.env.VERCEL_ENV = "production";
    const req = makeRequest();
    const res = basicAuth(req, { username: USERNAME, password: PASSWORD });
    expect(res?.status).toBe(401);
  });

  it("vercelEnvTarget=all で VERCEL_ENV=preview のとき認証チェックをする", () => {
    process.env.VERCEL = "1";
    process.env.VERCEL_ENV = "preview";
    const req = makeRequest();
    const res = basicAuth(req, { username: USERNAME, password: PASSWORD, vercelEnvTarget: "all" });
    expect(res?.status).toBe(401);
  });
});

describe("認証ヘッダーのバリデーション", () => {
  it("Authorization ヘッダーなしのとき 401 を返す", () => {
    const req = makeRequest();
    const res = basicAuth(req, { username: USERNAME, password: PASSWORD });
    expect(res?.status).toBe(401);
    expect(res?.headers.get("WWW-Authenticate")).toBe("Basic");
  });

  it("Authorization ヘッダーに値がないとき 401 を返す", () => {
    const req = makeRequest("Basic");
    const res = basicAuth(req, { username: USERNAME, password: PASSWORD });
    expect(res?.status).toBe(401);
  });

  it("不正な base64 のとき 401 を返す", () => {
    const req = makeRequest("Basic !!invalid!!");
    const res = basicAuth(req, { username: USERNAME, password: PASSWORD });
    expect(res?.status).toBe(401);
  });

  it("ユーザー名が違うとき 401 を返す", () => {
    const req = makeRequest(makeBasicAuthHeader("wrong", PASSWORD));
    const res = basicAuth(req, { username: USERNAME, password: PASSWORD });
    expect(res?.status).toBe(401);
  });

  it("パスワードが違うとき 401 を返す", () => {
    const req = makeRequest(makeBasicAuthHeader(USERNAME, "wrong"));
    const res = basicAuth(req, { username: USERNAME, password: PASSWORD });
    expect(res?.status).toBe(401);
  });

  it("正しい認証情報のとき null を返す", () => {
    const req = makeRequest(makeBasicAuthHeader(USERNAME, PASSWORD));
    expect(basicAuth(req, { username: USERNAME, password: PASSWORD })).toBeNull();
  });
});
