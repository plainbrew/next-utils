/**
 * Regression verification: withOptions<NewOptions> lacks `const` modifier.
 *
 * The old triple-curry used `<const Options extends ...>` which preserved literal
 * types even when options are stored in a variable. The new withOptions() method
 * uses `<NewOptions extends NuqsBuilderOptions>` without `const`, so TypeScript
 * widens `true` → `boolean` for variable usage, breaking the `extends true` check
 * in SearchParamsOptions.
 */
import { parseAsInteger, parseAsString } from "nuqs/server";
import { describe, expectTypeOf, test } from "vitest";

import { defineTypedHrefWithNuqs } from "./nuqs";

type Routes = "/search" | "/";
type RouteParamsMap = {
  "/search": Record<string, never>;
  "/": Record<string, never>;
};

describe("withOptions const modifier regression", () => {
  test("inline literal: searchParams is required (this passes even without const)", () => {
    const { $href } = defineTypedHrefWithNuqs
      .routes<Routes, RouteParamsMap>()
      .withOptions({ requiredSearchParams: true })
      .nuqs({ "/search": { q: parseAsString } });

    // searchParams must be required — calling without it should be a type error
    // @ts-expect-error: searchParams is required
    $href({ route: "/search" });

    // This should be fine
    expectTypeOf($href).parameter(0).toMatchTypeOf<{ searchParams: { q: string | null } }>();
  });

  test("variable opts: searchParams should still be required (FAILS without const modifier)", () => {
    // When stored in a variable without `as const`, TypeScript widens:
    //   { requiredSearchParams: true }  →  { requiredSearchParams: boolean }
    // Without `const` on the type param, NewOptions = { requiredSearchParams: boolean },
    // and `boolean extends true` is false → searchParams becomes optional.
    const opts = { requiredSearchParams: true };

    const { $href } = defineTypedHrefWithNuqs
      .routes<Routes, RouteParamsMap>()
      .withOptions(opts)
      .nuqs({ "/search": { q: parseAsString, page: parseAsInteger } });

    // This SHOULD be a type error (searchParams required) but is NOT,
    // because without `const`, Options["requiredSearchParams"] widens to `boolean`,
    // causing SearchParamsOptions to fall through to the optional branch.
    //
    // Remove the @ts-expect-error below to see the regression:
    // if withOptions had `const NewOptions`, this line would be a type error.
    //
    // With the regression present: no type error here (searchParams is optional).
    // With `const` fixed: this becomes a type error and the @ts-expect-error is needed.

    // Check: is searchParams required or optional on the resulting $href?
    type HrefParam = Parameters<typeof $href>[0];

    // If `const` is missing, searchParams is OPTIONAL → HrefParam includes { route: "/search" } without searchParams
    // If `const` is present, searchParams is REQUIRED → this type assertion would fail
    expectTypeOf<{ route: "/search" }>().toMatchTypeOf<HrefParam>();
    //                                  ^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
    // This should NOT match if requiredSearchParams is truly enforced (searchParams would be required).
    // If this expectation PASSES, the regression is confirmed: searchParams is optional when it shouldn't be.
  });

  test("variable opts with as const: searchParams is required (workaround)", () => {
    const opts = { requiredSearchParams: true } as const;

    const { $href } = defineTypedHrefWithNuqs
      .routes<Routes, RouteParamsMap>()
      .withOptions(opts)
      .nuqs({ "/search": { q: parseAsString } });

    // With `as const`, TypeScript preserves `true` literal → this IS a type error
    // @ts-expect-error: searchParams is required when opts has requiredSearchParams: true (as const)
    $href({ route: "/search" });
  });
});
