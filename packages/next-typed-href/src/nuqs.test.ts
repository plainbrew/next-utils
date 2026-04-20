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
