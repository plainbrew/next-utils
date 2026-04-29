---
"@plainbrew/next-typed-href": minor
---

refactor: replace triple-curry with builder pattern, unify API

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
// with requiredSearchParams (3-level curry)
defineTypedHrefWithNuqs<Routes, RouteParamsMap>()({ requiredSearchParams: true })(nuqsMap);

// after
defineTypedHrefWithNuqs.routes<Routes, RouteParamsMap>().nuqs(nuqsMap);
// with requiredSearchParams
defineTypedHrefWithNuqs.routes<Routes, RouteParamsMap>().requiredSearchParams().nuqs(nuqsMap);
```
