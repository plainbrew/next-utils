---
"@plainbrew/next-typed-href": minor
---

refactor: replace triple-curry with builder pattern, add `.withOptions()`

### Breaking changes

Both `defineTypedHref` and `defineTypedHrefWithNuqs` now use a builder pattern
inspired by tRPC's `initTRPC.context<T>().create()`.

#### `defineTypedHref`

```ts
// before
defineTypedHref<Routes, RouteParamsMap>();

// after
defineTypedHref.routes<Routes, RouteParamsMap>();
```

#### `defineTypedHrefWithNuqs`

```ts
// before
defineTypedHrefWithNuqs<Routes, RouteParamsMap>()(nuqsMap);
defineTypedHrefWithNuqs<Routes, RouteParamsMap>()({ requiredSearchParams: true })(nuqsMap);

// after
defineTypedHrefWithNuqs.routes<Routes, RouteParamsMap>().nuqs(nuqsMap);
defineTypedHrefWithNuqs
  .routes<Routes, RouteParamsMap>()
  .withOptions({ requiredSearchParams: true })
  .nuqs(nuqsMap);
```

### New feature: `.withOptions()`

`requiredSearchParams: true` を渡すと、nuqs パーサーが定義されているルートで `searchParams` が必須になる。

- `.withDefault()` なし → フィールドが required（`null` は渡せる）
- `.withDefault()` あり → フィールドが optional

```ts
const { $href } = defineTypedHrefWithNuqs
  .routes<Routes, RouteParamsMap>()
  .withOptions({ requiredSearchParams: true })
  .nuqs({
    "/search": {
      q: parseAsString, // required (no withDefault)
      page: parseAsInteger.withDefault(1), // optional (has withDefault)
    },
  });

$href({ route: "/search", searchParams: { q: "hello" } }); // OK
$href({ route: "/search" }); // Type error: searchParams is required
$href({ route: "/search", searchParams: { page: 2 } }); // Type error: q is required
```
