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
$href({ route: "/users/[id]", routeParams: { id: "42" } });
// => "/users/42"

// With search params
$href({ route: "/users", searchParams: { page: "2" } });
// => "/users?page=2"

// With hash
$href({ route: "/users/[id]", routeParams: { id: "1" }, hash: "profile" });
// => "/users/1#profile"

// Catch-all segment
$href({ route: "/posts/[...slug]", routeParams: { slug: ["2024", "hello"] } });
// => "/posts/2024/hello"
```

## Supported segment types

| Segment            | Example route       | `routeParams` type    |
| ------------------ | ------------------- | --------------------- |
| Dynamic            | `/users/[id]`       | `{ id: string }`      |
| Catch-all          | `/posts/[...slug]`  | `{ slug: string[] }`  |
| Optional catch-all | `/docs/[[...path]]` | `{ path?: string[] }` |

### Notes

- All param values are automatically URL-encoded.
- `searchParams` accepts anything that `URLSearchParams` accepts (plain object, array of pairs, or `URLSearchParams` instance).
- `hash` should be specified without the leading `#`.
- Optional catch-all segments (`[[...param]]`) resolve to an empty string when `undefined` is passed.

## nuqs integration

For routes with typed search params powered by [nuqs](https://nuqs.47ng.com/), use the `./nuqs` entry point:

```sh
pnpm add @plainbrew/next-typed-href nuqs
```

`lib/href.ts`:

```ts
import { defineTypedHrefWithNuqs } from "@plainbrew/next-typed-href/nuqs";
import { parseAsInteger, parseAsString } from "nuqs/server";
import type { AppRoutes, ParamsOf } from "@/../.next/types/routes";

type AppRouteParamsMap = { [Route in AppRoutes]: ParamsOf<Route> };

const withNuqs = defineTypedHrefWithNuqs<AppRoutes, AppRouteParamsMap>();

export const { $href } = withNuqs({
  "/search": {
    q: parseAsString,
    page: parseAsInteger,
  },
});
```

### Usage

```ts
import { $href } from "@/lib/href";

// nuqs-typed search params
$href({ route: "/search", searchParams: { q: "hello", page: 2 } });
// => "/search?q=hello&page=2"

// null / undefined values are omitted
$href({ route: "/search", searchParams: { q: "hello", page: null } });
// => "/search?q=hello"

// Routes without parsers fall back to standard URLSearchParams
$href({ route: "/posts", searchParams: { page: "1" } });
// => "/posts?page=1"

// Dynamic segment + nuqs search params
$href({ route: "/users/[id]", routeParams: { id: "42" }, searchParams: { tab: "profile" } });
// => "/users/42?tab=profile"
```

### `withDefault` pattern

Parsers wrapped with `.withDefault()` make the type non-nullable and omit the key from the URL when the value equals the default:

```ts
const withNuqs = defineTypedHrefWithNuqs<AppRoutes, AppRouteParamsMap>();

export const { $href } = withNuqs({
  "/search": {
    q: parseAsString.withDefault(""),
    page: parseAsInteger.withDefault(1),
  },
});

// Value differs from default → included
$href({ route: "/search", searchParams: { q: "hello", page: 2 } });
// => "/search?q=hello&page=2"

// Value equals default → omitted (consistent with nuqs URL semantics)
$href({ route: "/search", searchParams: { q: "hello", page: 1 } });
// => "/search?q=hello"

// null is a type error for withDefault params
$href({ route: "/search", searchParams: { q: null } });
// => TypeError: Type 'null' is not assignable to type 'string | undefined'
```

### nuqs integration notes

- `null` and `undefined` values are omitted from the query string.
- Values are serialized using nuqs' `createSerializer`, which respects `withDefault` behavior.
- When a `withDefault` param value equals the default, the key is cleared from the URL.
- `null` is a type error for `withDefault` params (the type is non-nullable).
- Routes without a parser defined fall back to standard `URLSearchParams` behavior.
- `nuqs` is a peer dependency and is optional for projects not using this entry point.
