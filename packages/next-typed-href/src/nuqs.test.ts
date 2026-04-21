import { parseAsBoolean, parseAsInteger, parseAsString } from "nuqs/server";
import { describe, expect, test } from "vitest";

import { defineTypedHrefWithNuqs } from "./nuqs";

type Routes = "/" | "/users/[id]" | "/search" | "/posts";

type RouteParamsMap = {
  "/": Record<string, never>;
  "/users/[id]": { id: string };
  "/search": Record<string, never>;
  "/posts": Record<string, never>;
};

const { $href } = defineTypedHrefWithNuqs<Routes, RouteParamsMap>()({
  "/search": {
    q: parseAsString,
    page: parseAsInteger,
    featured: parseAsBoolean,
  },
});

describe("nuqs-typed searchParams", () => {
  test("serializes string param", () => {
    expect($href({ route: "/search", searchParams: { q: "hello" } })).toBe("/search?q=hello");
  });

  test("serializes integer param", () => {
    expect($href({ route: "/search", searchParams: { page: 2 } })).toBe("/search?page=2");
  });

  test("serializes boolean param", () => {
    expect($href({ route: "/search", searchParams: { featured: true } })).toBe(
      "/search?featured=true",
    );
  });

  test("serializes multiple params", () => {
    expect($href({ route: "/search", searchParams: { q: "next", page: 3 } })).toBe(
      "/search?q=next&page=3",
    );
  });

  test("skips null values", () => {
    expect($href({ route: "/search", searchParams: { q: "hello", page: null } })).toBe(
      "/search?q=hello",
    );
  });

  test("skips undefined values", () => {
    expect($href({ route: "/search", searchParams: { q: "hello", page: undefined } })).toBe(
      "/search?q=hello",
    );
  });

  test("returns no query string when all values are null", () => {
    expect($href({ route: "/search", searchParams: { q: null, page: null } })).toBe("/search");
  });

  test("works without searchParams", () => {
    expect($href({ route: "/search" })).toBe("/search");
  });

  test("appends hash", () => {
    expect($href({ route: "/search", searchParams: { q: "hello" }, hash: "results" })).toBe(
      "/search?q=hello#results",
    );
  });
});

describe("non-nuqs routes fall back to standard URLSearchParams", () => {
  test("accepts plain object", () => {
    expect($href({ route: "/posts", searchParams: { page: "1" } })).toBe("/posts?page=1");
  });

  test("accepts URLSearchParams instance", () => {
    const sp = new URLSearchParams({ key: "value" });
    expect($href({ route: "/posts", searchParams: sp })).toBe("/posts?key=value");
  });
});

describe("type errors on wrong param types", () => {
  test("rejects number for string param (q)", () => {
    // @ts-expect-error: q expects string, not number
    $href({ route: "/search", searchParams: { q: 123 } });
  });

  test("rejects string for integer param (page)", () => {
    // @ts-expect-error: page expects number, not string
    $href({ route: "/search", searchParams: { page: "2" } });
  });

  test("rejects number for boolean param (featured)", () => {
    // @ts-expect-error: featured expects boolean, not number
    $href({ route: "/search", searchParams: { featured: 1 } });
  });

  test("rejects unknown param key", () => {
    // @ts-expect-error: unknown is not a defined key for /search
    $href({ route: "/search", searchParams: { unknown: "value" } });
  });
});

describe("dynamic segments work with nuqs searchParams", () => {
  test("resolves route params and adds nuqs-typed searchParams", () => {
    const { $href: $hrefWithUser } = defineTypedHrefWithNuqs<Routes, RouteParamsMap>()({
      "/users/[id]": { tab: parseAsString },
    });

    expect(
      $hrefWithUser({
        route: "/users/[id]",
        routeParams: { id: "42" },
        searchParams: { tab: "profile" },
      }),
    ).toBe("/users/42?tab=profile");
  });
});

describe("withDefault pattern", () => {
  const { $href: $hrefWD } = defineTypedHrefWithNuqs<Routes, RouteParamsMap>()({
    "/search": {
      q: parseAsString.withDefault(""),
      page: parseAsInteger.withDefault(1),
    },
  });

  test("serializes string param with withDefault", () => {
    expect($hrefWD({ route: "/search", searchParams: { q: "hello" } })).toBe("/search?q=hello");
  });

  test("serializes integer param with withDefault", () => {
    expect($hrefWD({ route: "/search", searchParams: { page: 2 } })).toBe("/search?page=2");
  });

  test("serializes multiple withDefault params", () => {
    expect($hrefWD({ route: "/search", searchParams: { q: "next", page: 3 } })).toBe(
      "/search?q=next&page=3",
    );
  });

  test("skips undefined values for withDefault params", () => {
    expect($hrefWD({ route: "/search", searchParams: { q: "hello", page: undefined } })).toBe(
      "/search?q=hello",
    );
  });

  test("omits param when value equals default", () => {
    expect($hrefWD({ route: "/search", searchParams: { page: 1 } })).toBe("/search");
  });

  test("omits default-value params while keeping non-default ones", () => {
    expect($hrefWD({ route: "/search", searchParams: { q: "hello", page: 1 } })).toBe(
      "/search?q=hello",
    );
  });

  test("rejects null for withDefault param (type error)", () => {
    // @ts-expect-error: withDefault makes the type non-nullable, null is not allowed
    $hrefWD({ route: "/search", searchParams: { q: null } });
  });
});

describe("withDefault with dynamic segments", () => {
  test("resolves route params and adds withDefault searchParams", () => {
    const { $href: $hrefUserWD } = defineTypedHrefWithNuqs<Routes, RouteParamsMap>()({
      "/users/[id]": { tab: parseAsString.withDefault("profile") },
    });

    expect(
      $hrefUserWD({
        route: "/users/[id]",
        routeParams: { id: "42" },
        searchParams: { tab: "settings" },
      }),
    ).toBe("/users/42?tab=settings");
  });
});
