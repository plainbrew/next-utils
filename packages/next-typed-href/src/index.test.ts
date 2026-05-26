import { describe, expect, expectTypeOf, test } from "vitest";

import { defineTypedHref } from "./index";
import type { TypedHref } from "./index";

type Routes = "/" | "/users" | "/users/[id]" | "/posts/[...slug]" | "/docs/[[...path]]" | "/search";

type RouteParamsMap = {
  "/": Record<string, never>;
  "/users": Record<string, never>;
  "/users/[id]": { id: string };
  "/posts/[...slug]": { slug: string[] };
  "/docs/[[...path]]": { path?: string[] };
  "/search": Record<string, never>;
};

const { $href } = defineTypedHref.routes<Routes, RouteParamsMap>();

describe("static routes", () => {
  test("returns route as-is when no params", () => {
    expect($href({ route: "/" })).toBe("/");
  });

  test("returns route with searchParams", () => {
    expect($href({ route: "/search", searchParams: { q: "hello" } })).toBe("/search?q=hello");
  });

  test("returns route with hash", () => {
    expect($href({ route: "/users", hash: "top" })).toBe("/users#top");
  });

  test("returns route with searchParams and hash", () => {
    expect($href({ route: "/search", searchParams: { q: "test" }, hash: "anchor" })).toBe(
      "/search?q=test#anchor",
    );
  });
});

describe("dynamic segments [slug]", () => {
  test("replaces segment with param value", () => {
    expect($href({ route: "/users/[id]", routeParams: { id: "42" } })).toBe("/users/42");
  });

  test("encodes special characters in param", () => {
    expect($href({ route: "/users/[id]", routeParams: { id: "hello world" } })).toBe(
      "/users/hello%20world",
    );
  });

  test("combines with searchParams", () => {
    expect(
      $href({
        route: "/users/[id]",
        routeParams: { id: "1" },
        searchParams: { tab: "profile" },
      }),
    ).toBe("/users/1?tab=profile");
  });

  test("combines with hash", () => {
    expect($href({ route: "/users/[id]", routeParams: { id: "1" }, hash: "info" })).toBe(
      "/users/1#info",
    );
  });
});

describe("catch-all segments [...slug]", () => {
  test("joins array with /", () => {
    expect(
      $href({
        route: "/posts/[...slug]",
        routeParams: { slug: ["a", "b", "c"] },
      }),
    ).toBe("/posts/a/b/c");
  });

  test("encodes special characters in each segment", () => {
    expect(
      $href({
        route: "/posts/[...slug]",
        routeParams: { slug: ["hello world", "foo&bar"] },
      }),
    ).toBe("/posts/hello%20world/foo%26bar");
  });

  test("does not throw for empty array", () => {
    expect(() =>
      $href({
        route: "/posts/[...slug]",
        routeParams: { slug: [] },
      }),
    ).not.toThrow();
  });
});

describe("optional catch-all segments [[...path]]", () => {
  test("returns route without segment when param is undefined", () => {
    expect($href({ route: "/docs/[[...path]]", routeParams: { path: undefined } })).toBe("/docs/");
  });

  test("joins array with / when param is provided", () => {
    expect(
      $href({
        route: "/docs/[[...path]]",
        routeParams: { path: ["intro", "setup"] },
      }),
    ).toBe("/docs/intro/setup");
  });
});

describe("branded option", () => {
  const { $href: $hrefBranded } = defineTypedHref
    .routes<Routes, RouteParamsMap>()
    .withOptions({ branded: true });

  test("returns TypedHref when branded: true", () => {
    const result: TypedHref = $hrefBranded({ route: "/" });
    expect(result).toBe("/");
  });

  test("branded result is assignable to string", () => {
    const result: string = $hrefBranded({ route: "/" });
    expect(result).toBe("/");
  });

  test("default $href() is not assignable to TypedHref (type error)", () => {
    // @ts-expect-error: string is not TypedHref
    const _: TypedHref = $href({ route: "/" });
  });

  test("plain string is not assignable to TypedHref (type error)", () => {
    // @ts-expect-error: plain string is not TypedHref
    const _: TypedHref = "/";
  });
});

describe("searchParams formats", () => {
  test("accepts URLSearchParams instance", () => {
    const sp = new URLSearchParams({ key: "value" });
    expect($href({ route: "/search", searchParams: sp })).toBe("/search?key=value");
  });

  test("accepts array of pairs", () => {
    expect(
      $href({
        route: "/search",
        searchParams: [
          ["a", "1"],
          ["b", "2"],
        ],
      }),
    ).toBe("/search?a=1&b=2");
  });

  test("no searchParams means no ? in output", () => {
    expect($href({ route: "/" })).not.toContain("?");
  });

  test("no hash means no # in output", () => {
    expect($href({ route: "/" })).not.toContain("#");
  });
});

describe("routes() requires explicit type arguments", () => {
  test("calling routes() without type arguments is a type error at the call site", () => {
    // @ts-expect-error: routes<Routes, RouteParamsMap>() requires explicit type arguments
    defineTypedHref.routes();
  });

  test("routes<R, M>() with explicit type arguments compiles", () => {
    expectTypeOf(defineTypedHref.routes<Routes, RouteParamsMap>()).toHaveProperty("$href");
  });
});
