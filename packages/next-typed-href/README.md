# @plainbrew/next-typed-href

Type-safe href generator for Next.js App Router.

## Install

```sh
pnpm add @plainbrew/next-typed-href
```

## Setup

Define your routes and params map, then create a `$href` function:

`lib/href.ts`:

```ts
import { defineTypedHref } from "@plainbrew/next-typed-href";
import type { AppRoutes, ParamsOf } from "@/../.next/types/routes";

type AppRouteParamsMap = { [Route in AppRoutes]: ParamsOf<Route> };

export const { $href } = defineTypedHref<AppRoutes, AppRouteParamsMap>();
```

## Usage

```ts
import { $href } from "@/lib/href";

// Static route
$href({ route: "/" });
// => "/"

// Dynamic segment
$href({ route: "/users/[id]/", routeParams: { id: "42" } });
// => "/users/42/"

// With search params
$href({ route: "/users/", searchParams: { page: "2" } });
// => "/users/?page=2"

// With hash
$href({ route: "/users/[id]/", routeParams: { id: "1" }, hash: "profile" });
// => "/users/1/#profile"

// Catch-all segment
$href({ route: "/posts/[...slug]/", routeParams: { slug: ["2024", "hello"] } });
// => "/posts/2024/hello/"
```

## Supported segment types

| Segment            | Example route        | `routeParams` type    |
| ------------------ | -------------------- | --------------------- |
| Dynamic            | `/users/[id]/`       | `{ id: string }`      |
| Catch-all          | `/posts/[...slug]/`  | `{ slug: string[] }`  |
| Optional catch-all | `/docs/[[...path]]/` | `{ path?: string[] }` |

### Notes

- All param values are automatically URL-encoded.
- `searchParams` accepts anything that `URLSearchParams` accepts (plain object, array of pairs, or `URLSearchParams` instance).
- `hash` should be specified without the leading `#`.
- Optional catch-all segments (`[[...param]]`) resolve to an empty string when `undefined` is passed.
