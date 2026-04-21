import type { inferParserType, SingleParserBuilder } from "nuqs";

import { generatePath } from "./common/generatePath";

type AnyParserBuilder = SingleParserBuilder<any>;

type NuqsParsersMap<Routes extends string> = Partial<
  Record<Routes, Record<string, AnyParserBuilder>>
>;

type ParserValues<Parsers extends Record<string, AnyParserBuilder>> = {
  [K in keyof Parsers]?: inferParserType<Parsers[K]> | null;
};

type SearchParamsFor<T extends string, NuqsMap extends NuqsParsersMap<T>> =
  NuqsMap[T] extends Record<string, AnyParserBuilder>
    ? ParserValues<NuqsMap[T]>
    : ConstructorParameters<typeof URLSearchParams>[0];

type RouteHasParams<
  T extends string,
  RouteParamsMap extends Record<string, Record<string, unknown>>,
> = RouteParamsMap[T] extends Record<string, never> ? false : true;

type PathOptionsFor<
  T extends string,
  RouteParamsMap extends Record<string, Record<string, unknown>>,
  NuqsMap extends NuqsParsersMap<string>,
> = T extends string
  ? RouteHasParams<T, RouteParamsMap> extends true
    ? {
        route: T;
        routeParams: RouteParamsMap[T];
        searchParams?: SearchParamsFor<T, NuqsMap>;
        hash?: string;
      }
    : {
        route: T;
        searchParams?: SearchParamsFor<T, NuqsMap>;
        hash?: string;
      }
  : never;

function serializeNuqsSearchParams(
  values: Record<string, unknown>,
  parsers: Record<string, AnyParserBuilder>,
): string {
  const entries: [string, string][] = [];
  for (const [key, value] of Object.entries(values)) {
    if (value === null || value === undefined) continue;
    const parser = parsers[key];
    const serialized = parser ? parser.serialize(value) : String(value);
    entries.push([key, serialized]);
  }
  return entries.length > 0 ? `?${new URLSearchParams(entries).toString()}` : "";
}

/**
 * Type-safe href generator for Next.js App Router with nuqs integration.
 *
 * Routes that have nuqs parsers defined accept typed searchParams values.
 * Routes without parsers fall back to standard URLSearchParams input.
 *
 * @example
 * const { $href } = defineTypedHrefWithNuqs<Routes, RouteParamsMap>()({
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
  return function <NuqsMap extends NuqsParsersMap<Routes>>(nuqsMap: NuqsMap) {
    function $href<T extends Routes>(options: PathOptionsFor<T, RouteParamsMap, NuqsMap>): string {
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
          search = serializeNuqsSearchParams(
            options.searchParams as Record<string, unknown>,
            routeParsers,
          );
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
