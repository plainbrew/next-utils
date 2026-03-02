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
  const basicAuthResponse = basicAuth(request, {
    username: process.env.BASIC_AUTH_USER ?? "",
    password: process.env.BASIC_AUTH_PASSWORD ?? "",
    // vercelEnvTarget: "all", // Apply Basic Auth to all Vercel environments
    // dev: true, // Apply Basic Auth in local development
  });
  if (basicAuthResponse) return basicAuthResponse;

  return NextResponse.next();
}
```

## Options

| Option            | Type      | Required | Default             | Description                                |
| ----------------- | --------- | -------- | ------------------- | ------------------------------------------ |
| `username`        | `string`  | ✓        |                     | Basic Auth username                        |
| `password`        | `string`  | ✓        |                     | Basic Auth password                        |
| `vercelEnvTarget` | `string`  |          | `'only-production'` | Vercel environments to apply Basic Auth    |
| `dev`             | `boolean` |          | `false`             | Apply Basic Auth in `NODE_ENV=development` |

### `vercelEnvTarget`

| Value             | Behavior                                      |
| ----------------- | --------------------------------------------- |
| `only-production` | Apply Basic Auth to Vercel production only    |
| `all`             | Apply Basic Auth to all Vercel environments   |
| `disabled`        | Disable Basic Auth on all Vercel environments |

### Notes

- Basic Auth is only applied on Vercel (`VERCEL=1`) by default. Local development is skipped unless `dev: true`.
