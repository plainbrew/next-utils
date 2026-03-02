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

### Notes

- Basic Auth is only applied on Vercel (`VERCEL=1`). Local development is always skipped.
- `BASIC_AUTH_TARGET` is required when running on Vercel. An error is thrown if it is missing or invalid.
