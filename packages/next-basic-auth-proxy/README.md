# @plainbrew/next-basic-auth-proxy

Basic Auth handler for Next.js `proxy.ts`.

## Install

```sh
pnpm add @plainbrew/next-basic-auth-proxy
```

## Usage

`proxy.ts`:

```ts
import { basicAuth } from "@plainbrew/next-basic-auth-proxy";
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export default async function proxy(request: NextRequest) {
  const authResponse = basicAuth(request, {
    username: process.env.BASIC_AUTH_USER ?? "",
    password: process.env.BASIC_AUTH_PASSWORD ?? "",
    // dev: true, // ローカル開発環境でも Basic 認証を適用する場合
  });
  if (authResponse) return authResponse;

  return NextResponse.next();
}
```

## Environment Variables

| Variable            | Description           |
| ------------------- | --------------------- |
| `BASIC_AUTH_TARGET` | `all` or `production` |

### `BASIC_AUTH_TARGET`

| Value        | Behavior                                    |
| ------------ | ------------------------------------------- |
| `all`        | Apply Basic Auth to all Vercel environments |
| `production` | Apply Basic Auth to Vercel production only  |

## Options

| Option     | Type      | Required | Description                                                  |
| ---------- | --------- | -------- | ------------------------------------------------------------ |
| `username` | `string`  | ✓        | Basic Auth username                                          |
| `password` | `string`  | ✓        | Basic Auth password                                          |
| `dev`      | `boolean` |          | Apply Basic Auth in `NODE_ENV=development`. Default: `false` |

### Notes

- Basic Auth is only applied on Vercel (`VERCEL=1`) by default. Local development is skipped unless `dev: true`.
- `BASIC_AUTH_TARGET` is required when running on Vercel. An error is thrown if it is missing or invalid.
