---
"@plainbrew/next-typed-href": minor
---

feat: require explicit type arguments on `.routes()`

`defineTypedHref.routes()` and `defineTypedHrefWithNuqs.routes()` now require
explicit `<Routes, RouteParamsMap>` type arguments. Calling them without type
arguments fails with a TypeScript error **at the call site** — previously
`Routes` would silently widen to `string`, defeating the type-safety the
library promises.

```ts
// ❌ Type error AT this line:
//    "Expected 1 arguments, but got 0."
//    Hover shows the missing parameter's name and message.
defineTypedHref.routes();

// ✅ OK
defineTypedHref.routes<Routes, RouteParamsMap>();
```

The mechanism is a conditional rest parameter: when `string extends Routes`
(i.e. no type argument was supplied), `routes` requires a single phantom
argument whose name and type spell out the fix. When `Routes` is a proper
literal union, the rest tuple is empty and the call is nullary as before.

This is a type-level change only — no runtime behavior changes. Existing
callers that already pass explicit type arguments are unaffected.
