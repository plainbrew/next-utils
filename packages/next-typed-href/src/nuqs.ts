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

// null extends inferParserType<T> means no .withDefault() → required field
type RequiredParserValues<Parsers extends Record<string, AnyParserBuilder>> = {
  [K in keyof Parsers as null extends inferParserType<Parsers[K]> ? K : never]: inferParserType<
    Parsers[K]
  >;
} & {
  [K in keyof Parsers as null extends inferParserType<Parsers[K]> ? never : K]?: inferParserType<
    Parsers[K]
  >;
};

type RouteHasParams<
  T extends string,
  RouteParamsMap extends Record<string, Record<string, unknown>>,
> = RouteParamsMap[T] extends Record<string, never> ? false : true;

type SearchParamsFor<
  T extends string,
  NuqsMap extends NuqsParsersMap<string>,
  IsRequired extends boolean,
> =
  NuqsMap[T] extends Record<string, AnyParserBuilder>
    ? IsRequired extends true
      ? RequiredParserValues<NuqsMap[T]>
      : ParserValues<NuqsMap[T]>
    : ConstructorParameters<typeof URLSearchParams>[0];

type RouteHasNuqsParsers<T extends string, NuqsMap extends NuqsParsersMap<string>> =
  NuqsMap[T] extends Record<string, AnyParserBuilder> ? true : false;

type SearchParamsOptions<
  T extends string,
  NuqsMap extends NuqsParsersMap<string>,
  IsRequired extends boolean,
> = IsRequired extends true
  ? RouteHasNuqsParsers<T, NuqsMap> extends true
    ? { searchParams: SearchParamsFor<T, NuqsMap, IsRequired> }
    : { searchParams?: SearchParamsFor<T, NuqsMap, IsRequired> }
  : { searchParams?: SearchParamsFor<T, NuqsMap, IsRequired> };

type PathOptionsFor<
  T extends string,
  Routes extends string,
  RouteParamsMap extends Record<Routes, Record<string, unknown>>,
  NuqsMap extends NuqsParsersMap<Routes>,
  IsRequired extends boolean,
> = T extends Routes
  ? (RouteHasParams<T, RouteParamsMap> extends true
      ? { route: T; routeParams: RouteParamsMap[T] }
      : { route: T }) &
      SearchParamsOptions<T, NuqsMap, IsRequired> & { hash?: string }
  : never;

/**
 * Builder for type-safe href generators for Next.js App Router with nuqs integration.
 *
 * Routes that have nuqs parsers defined accept typed searchParams values.
 * Routes without parsers fall back to standard URLSearchParams input.
 *
 * @example
 * const { $href } = defineTypedHrefWithNuqs
 *   .routes<AppRoutes, AppRouteParamsMap>()
 *   .nuqs({ "/search": { q: parseAsString, page: parseAsInteger } });
 *
 * $href({ route: "/search", searchParams: { q: "hello", page: 2 } })
 * // => "/search?q=hello&page=2"
 *
 * $href({ route: "/search", searchParams: { q: "hello", page: null } })
 * // => "/search?q=hello"
 *
 * @example with required searchParams
 * const { $href } = defineTypedHrefWithNuqs
 *   .routes<AppRoutes, AppRouteParamsMap>()
 *   .requiredSearchParams()
 *   .nuqs({
 *     "/search": {
 *       q: parseAsString,                    // required (no withDefault)
 *       page: parseAsInteger.withDefault(1), // optional (has withDefault)
 *     },
 *   });
 *
 * $href({ route: "/search", searchParams: { q: "hello" } })          // OK (page is optional)
 * $href({ route: "/search", searchParams: { q: "hello", page: 2 } }) // OK
 * $href({ route: "/search" })                                         // Type error: searchParams is required
 * $href({ route: "/search", searchParams: { page: 2 } })             // Type error: q is required
 */
class TypedHrefBuilder<
  Routes extends string,
  RouteParamsMap extends Record<Routes, Record<string, unknown>>,
  IsRequired extends boolean,
> {
  routes<Routes extends string, RouteParamsMap extends Record<Routes, Record<string, unknown>>>() {
    return new TypedHrefBuilder<Routes, RouteParamsMap, false>();
  }

  requiredSearchParams() {
    return new TypedHrefBuilder<Routes, RouteParamsMap, true>();
  }

  nuqs<NuqsMap extends NuqsParsersMap<Routes>>(nuqsMap: NuqsMap) {
    function $href<T extends Routes>(
      options: PathOptionsFor<T, Routes, RouteParamsMap, NuqsMap, IsRequired>,
    ): string {
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
  }
}

export const defineTypedHrefWithNuqs = new TypedHrefBuilder<never, Record<never, never>, false>();
