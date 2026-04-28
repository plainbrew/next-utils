---
"@plainbrew/next-typed-href": minor
---

feat(nuqs): add `requiredSearchParams` option to `defineTypedHrefWithNuqs`

### Breaking change

`defineTypedHrefWithNuqs` is now a 3-level curried function. An options call has been inserted as the second level:

```ts
// before
defineTypedHrefWithNuqs<Routes, RouteParamsMap>()(nuqsMap);

// after
defineTypedHrefWithNuqs<Routes, RouteParamsMap>()()(nuqsMap);
```

### New feature

Pass `{ requiredSearchParams: true }` in the second call to enforce that `searchParams` is provided for routes with nuqs parsers defined.

Fields without `.withDefault()` become required; fields with `.withDefault()` remain optional.

```ts
const { $href } = defineTypedHrefWithNuqs<Routes, RouteParamsMap>()({ requiredSearchParams: true })(
  {
    "/search": {
      q: parseAsString, // required
      page: parseAsInteger.withDefault(1), // optional
    },
  },
);

$href({ route: "/search", searchParams: { q: "hello" } }); // OK
$href({ route: "/search", searchParams: { q: "hello", page: 2 } }); // OK
$href({ route: "/search" }); // Type error
$href({ route: "/search", searchParams: { page: 2 } }); // Type error
```
