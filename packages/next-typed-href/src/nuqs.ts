import type { inferParserType, SingleParserBuilder } from "nuqs";
import { createSerializer } from "nuqs/server";

import { generatePath } from "./common/generatePath";

type AnyParserBuilder = SingleParserBuilder<any>;

type NuqsParsersMap<Routes extends string> = Partial<
  Record<Routes, Record<string, AnyParserBuilder>>
>;

type ParserValues<Parsers extends Record<string, AnyParserBuilder>> = {
  [K in keyof Parsers]?: inferParserType<Parsers[K]>;
};

/**
 * Type-safe href generator for Next.js App Router with nuqs integration.
 *
 * Routes that have nuqs parsers defined accept typed searchParams values.
 * Routes without parsers fall back to standard URLSearchParams input.
 *
 * The function is curried — call it once with explicit type parameters to get
 * a route-specific factory, then call that factory with your parsers map.
 * TypeScript cannot infer the third type parameter alongside explicit ones
 * (microsoft/TypeScript#26242), so the two-step form is required.
 *
 * @example
 * // Recommended: store the factory and call it once
 * const withNuqs = defineTypedHrefWithNuqs<Routes, RouteParamsMap>();
 * const { $href } = withNuqs({
 *   "/search": { q: parseAsString, page: parseAsInteger },
 * });
 *
 * $href({ route: "/search", searchParams: { q: "hello", page: 2 } })
 * // => "/search?q=hello&page=2"
 *
 * $href({ route: "/search", searchParams: { q: "hello", page: null } })
 * // => "/search?q=hello"
 */
export function defineTypedHrefWithNuqs<
  Routes extends string,
  RouteParamsMap extends Record<Routes, Record<string, unknown>>,
>() {
  type RouteHasParams<T extends Routes> =
    RouteParamsMap[T] extends Record<string, never> ? false : true;

  return function <NuqsMap extends NuqsParsersMap<Routes>>(nuqsMap: NuqsMap) {
    type SearchParamsFor<T extends Routes> =
      NuqsMap[T] extends Record<string, AnyParserBuilder>
        ? ParserValues<NuqsMap[T]>
        : ConstructorParameters<typeof URLSearchParams>[0];

    type PathOptionsFor<T extends Routes> = T extends Routes
      ? RouteHasParams<T> extends true
        ? {
            route: T;
            routeParams: RouteParamsMap[T];
            searchParams?: SearchParamsFor<T>;
            hash?: string;
          }
        : {
            route: T;
            searchParams?: SearchParamsFor<T>;
            hash?: string;
          }
      : never;

    function $href<T extends Routes>(options: PathOptionsFor<T>): string {
      const path =
        "routeParams" in options
          ? generatePath(
              options.route,
              options.routeParams as Record<string, string | string[] | undefined>,
            )
          : options.route;

      const routeParsers = (nuqsMap as NuqsParsersMap<string>)[options.route];
      let search = "";

      if (options.searchParams != null) {
        if (routeParsers) {
          search = createSerializer(routeParsers)(options.searchParams as Record<string, unknown>);
        } else {
          const sp = new URLSearchParams(
            options.searchParams as ConstructorParameters<typeof URLSearchParams>[0],
          ).toString();
          search = sp ? `?${sp}` : "";
        }
      }

      const hash = options.hash ? `#${options.hash}` : "";
      return path + search + hash;
    }

    return { $href };
  };
}
