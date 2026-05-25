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

export type NuqsBuilderOptions = {
  /**
   * When `true`, `searchParams` becomes required on routes that have nuqs parsers defined.
   *
   * Among the required route's search params, fields whose parser has `.withDefault()` are optional;
   * fields without `.withDefault()` (i.e. those whose inferred type includes `null`) are required.
   *
   * @default false
   *
   * @example
   * const { $href } = defineTypedHrefWithNuqs
   *   .routes<Routes, RouteParamsMap>()
   *   .withOptions({ requiredSearchParams: true })
   *   .nuqs({
   *     "/search": {
   *       q: parseAsString,                    // required (no withDefault)
   *       page: parseAsInteger.withDefault(1), // optional (has withDefault)
   *     },
   *   });
   *
   * $href({ route: "/search", searchParams: { q: "hello" } })          // OK
   * $href({ route: "/search" })                                         // Type error: searchParams is required
   * $href({ route: "/search", searchParams: { page: 2 } })             // Type error: q is required
   */
  requiredSearchParams?: boolean;
};

type RouteHasParams<
  T extends string,
  RouteParamsMap extends Record<string, Record<string, unknown>>,
> = RouteParamsMap[T] extends Record<string, never> ? false : true;

type SearchParamsFor<
  T extends string,
  NuqsMap extends NuqsParsersMap<string>,
  Options extends NuqsBuilderOptions,
> =
  NuqsMap[T] extends Record<string, AnyParserBuilder>
    ? Options["requiredSearchParams"] extends true
      ? RequiredParserValues<NuqsMap[T]>
      : ParserValues<NuqsMap[T]>
    : ConstructorParameters<typeof URLSearchParams>[0];

type RouteHasNuqsParsers<T extends string, NuqsMap extends NuqsParsersMap<string>> =
  NuqsMap[T] extends Record<string, AnyParserBuilder> ? true : false;

type SearchParamsOptions<
  T extends string,
  NuqsMap extends NuqsParsersMap<string>,
  Options extends NuqsBuilderOptions,
> = Options["requiredSearchParams"] extends true
  ? RouteHasNuqsParsers<T, NuqsMap> extends true
    ? { searchParams: SearchParamsFor<T, NuqsMap, Options> }
    : { searchParams?: SearchParamsFor<T, NuqsMap, Options> }
  : { searchParams?: SearchParamsFor<T, NuqsMap, Options> };

type PathOptionsFor<
  T extends string,
  Routes extends string,
  RouteParamsMap extends Record<Routes, Record<string, unknown>>,
  NuqsMap extends NuqsParsersMap<Routes>,
  Options extends NuqsBuilderOptions,
> = T extends Routes
  ? (RouteHasParams<T, RouteParamsMap> extends true
      ? { route: T; routeParams: RouteParamsMap[T] }
      : { route: T }) &
      SearchParamsOptions<T, NuqsMap, Options> & { hash?: string }
  : never;

type WithRoutes<
  Routes extends string,
  RouteParamsMap extends Record<Routes, Record<string, unknown>>,
  Options extends NuqsBuilderOptions,
> = {
  withOptions: <NewOptions extends NuqsBuilderOptions>(
    opts: NewOptions,
  ) => WithRoutes<Routes, RouteParamsMap, NewOptions>;
  nuqs: <NuqsMap extends NuqsParsersMap<Routes>>(
    nuqsMap: NuqsMap,
  ) => {
    $href: <T extends Routes>(
      options: PathOptionsFor<T, Routes, RouteParamsMap, NuqsMap, Options>,
    ) => string;
  };
};

type TypedHrefWithNuqsBuilder = {
  routes: <
    Routes extends string,
    RouteParamsMap extends Record<Routes, Record<string, unknown>>,
  >() => WithRoutes<Routes, RouteParamsMap, {}>;
};

function createWithRoutes<
  Routes extends string,
  RouteParamsMap extends Record<Routes, Record<string, unknown>>,
  Options extends NuqsBuilderOptions,
>(): WithRoutes<Routes, RouteParamsMap, Options> {
  return {
    // `_opts` is used only at the type level to capture `NewOptions`.
    // Calling `.withOptions()` again overwrites the previous options.
    withOptions<NewOptions extends NuqsBuilderOptions>(_opts: NewOptions) {
      return createWithRoutes<Routes, RouteParamsMap, NewOptions>();
    },
    nuqs<NuqsMap extends NuqsParsersMap<Routes>>(nuqsMap: NuqsMap) {
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
    },
  };
}

/**
 * Builder for type-safe href generators for Next.js App Router with nuqs integration.
 *
 * Routes that have nuqs parsers defined accept typed searchParams values.
 * Routes without parsers fall back to standard URLSearchParams input.
 *
 * Chaining: `.routes<R, M>()` is the only entry point. `.withOptions()` may
 * be called before `.nuqs()`; calling `.withOptions()` more than once
 * replaces the previously supplied options.
 *
 * @example
 * const { $href } = defineTypedHrefWithNuqs
 *   .routes<AppRoutes, AppRouteParamsMap>()
 *   .nuqs({ "/search": { q: parseAsString, page: parseAsInteger } });
 *
 * $href({ route: "/search", searchParams: { q: "hello", page: 2 } })
 * // => "/search?q=hello&page=2"
 */
export const defineTypedHrefWithNuqs: TypedHrefWithNuqsBuilder = {
  routes() {
    return createWithRoutes();
  },
};
