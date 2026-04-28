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

export type DefineTypedHrefWithNuqsOptions = {
  requireSearchParams?: boolean;
};

type RouteHasParams<
  T extends string,
  RouteParamsMap extends Record<string, Record<string, unknown>>,
> = RouteParamsMap[T] extends Record<string, never> ? false : true;

type SearchParamsFor<T extends string, NuqsMap extends NuqsParsersMap<string>> =
  NuqsMap[T] extends Record<string, AnyParserBuilder>
    ? ParserValues<NuqsMap[T]>
    : ConstructorParameters<typeof URLSearchParams>[0];

type RouteHasNuqsParsers<T extends string, NuqsMap extends NuqsParsersMap<string>> =
  NuqsMap[T] extends Record<string, AnyParserBuilder> ? true : false;

type SearchParamsOptions<
  T extends string,
  NuqsMap extends NuqsParsersMap<string>,
  Options extends DefineTypedHrefWithNuqsOptions,
> = Options["requireSearchParams"] extends true
  ? RouteHasNuqsParsers<T, NuqsMap> extends true
    ? { searchParams: SearchParamsFor<T, NuqsMap> }
    : { searchParams?: SearchParamsFor<T, NuqsMap> }
  : { searchParams?: SearchParamsFor<T, NuqsMap> };

type PathOptionsFor<
  T extends string,
  Routes extends string,
  RouteParamsMap extends Record<Routes, Record<string, unknown>>,
  NuqsMap extends NuqsParsersMap<Routes>,
  Options extends DefineTypedHrefWithNuqsOptions,
> = T extends Routes
  ? (RouteHasParams<T, RouteParamsMap> extends true
      ? { route: T; routeParams: RouteParamsMap[T] }
      : { route: T }) &
      SearchParamsOptions<T, NuqsMap, Options> & { hash?: string }
  : never;

type InnerFn<
  Routes extends string,
  RouteParamsMap extends Record<Routes, Record<string, unknown>>,
  Options extends DefineTypedHrefWithNuqsOptions,
> = <NuqsMap extends NuqsParsersMap<Routes>>(
  nuqsMap: NuqsMap,
) => {
  $href: <T extends Routes>(
    options: PathOptionsFor<T, Routes, RouteParamsMap, NuqsMap, Options>,
  ) => string;
};

/**
 * Type-safe href generator for Next.js App Router with nuqs integration.
 *
 * Routes that have nuqs parsers defined accept typed searchParams values.
 * Routes without parsers fall back to standard URLSearchParams input.
 *
 * Pass `{ requireSearchParams: true }` in the second call to make `searchParams`
 * required on routes that have nuqs parsers defined.
 *
 * @example
 * const { $href } = defineTypedHrefWithNuqs<Routes, RouteParamsMap>()()({
 *   "/search": { q: parseAsString, page: parseAsInteger },
 * });
 *
 * $href({ route: "/search", searchParams: { q: "hello", page: 2 } })
 * // => "/search?q=hello&page=2"
 *
 * @example requireSearchParams
 * const { $href } = defineTypedHrefWithNuqs<Routes, RouteParamsMap>()({ requireSearchParams: true })({
 *   "/search": { q: parseAsString, page: parseAsInteger },
 * });
 *
 * $href({ route: "/search", searchParams: { q: "hello" } }) // OK
 * $href({ route: "/search" }) // Type error: searchParams is required
 */
export function defineTypedHrefWithNuqs<
  Routes extends string,
  RouteParamsMap extends Record<Routes, Record<string, unknown>>,
>() {
  return function <const Options extends DefineTypedHrefWithNuqsOptions = {}>(
    _options?: Options,
  ): InnerFn<Routes, RouteParamsMap, Options> {
    return function <NuqsMap extends NuqsParsersMap<Routes>>(nuqsMap: NuqsMap) {
      function $href<T extends Routes>(
        options: PathOptionsFor<T, Routes, RouteParamsMap, NuqsMap, Options>,
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
            search = createSerializer(routeParsers)(
              options.searchParams as Record<string, unknown>,
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
  };
}
