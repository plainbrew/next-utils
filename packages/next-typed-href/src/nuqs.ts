import type { inferParserType, SingleParserBuilder } from "nuqs";
import { createSerializer } from "nuqs/server";

import { resolveRoutePath } from "./common/resolveRoutePath";
import type {
  HrefReturn,
  RequireExplicitRoutesArgs,
  RouteIdentityFor,
  TypedHref,
} from "./common/types";

export type { TypedHref };

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
  /**
   * When `true`, `$href()` returns `TypedHref` instead of `string`.
   *
   * `TypedHref` is a branded type that distinguishes `$href()` output from plain strings at the
   * type level, while remaining assignable to `string` so existing code is unaffected.
   *
   * @default false
   *
   * @example
   * import type { TypedHref } from "@plainbrew/next-typed-href";
   *
   * const { $href } = defineTypedHrefWithNuqs
   *   .routes<Routes, RouteParamsMap>()
   *   .withOptions({ branded: true })
   *   .nuqs({ ... });
   *
   * type LinkProps = { href: TypedHref };
   *
   * // ✓ $href() result passes through
   * <SafeLink href={$href({ route: "/" })} />
   *
   * // ✗ plain string causes a compile error
   * <SafeLink href="/" />
   */
  branded?: boolean;
};

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
> = RouteIdentityFor<T, Routes, RouteParamsMap> &
  SearchParamsOptions<T, NuqsMap, Options> & { hash?: string };

type WithRoutes<
  Routes extends string,
  RouteParamsMap extends Record<Routes, Record<string, unknown>>,
  Options extends NuqsBuilderOptions,
> = {
  withOptions: <const NewOptions extends NuqsBuilderOptions>(
    opts: NewOptions,
  ) => WithRoutes<Routes, RouteParamsMap, NewOptions>;
  nuqs: <NuqsMap extends NuqsParsersMap<Routes>>(
    nuqsMap: NuqsMap,
  ) => {
    $href: <T extends Routes>(
      options: PathOptionsFor<T, Routes, RouteParamsMap, NuqsMap, Options>,
    ) => HrefReturn<Options>;
  };
};

type TypedHrefWithNuqsBuilder = {
  routes: <Routes extends string, RouteParamsMap extends Record<Routes, Record<string, unknown>>>(
    ...typeArguments: RequireExplicitRoutesArgs<Routes>
  ) => WithRoutes<Routes, RouteParamsMap, {}>;
};

function createWithRoutes<
  Routes extends string,
  RouteParamsMap extends Record<Routes, Record<string, unknown>>,
  Options extends NuqsBuilderOptions,
>(): WithRoutes<Routes, RouteParamsMap, Options> {
  return {
    // `_opts` is used only at the type level to capture `NewOptions`.
    withOptions<const NewOptions extends NuqsBuilderOptions>(_opts: NewOptions) {
      return createWithRoutes<Routes, RouteParamsMap, NewOptions>();
    },
    nuqs<NuqsMap extends NuqsParsersMap<Routes>>(nuqsMap: NuqsMap) {
      // Precompute one serializer per route so `$href` doesn't rebuild it on each call.
      type Serializer = (values: Record<string, unknown>) => string;
      const serializers: Record<string, Serializer> = {};
      for (const route in nuqsMap) {
        const parsers = (nuqsMap as NuqsParsersMap<string>)[route];
        if (parsers) serializers[route] = createSerializer(parsers) as Serializer;
      }

      function $href<T extends Routes>(
        options: PathOptionsFor<T, Routes, RouteParamsMap, NuqsMap, Options>,
      ): HrefReturn<Options> {
        const path = resolveRoutePath(
          options as {
            route: T;
            routeParams?: Record<string, string | string[] | undefined>;
          },
        );

        const serializer = serializers[options.route];
        let search = "";

        if (options.searchParams != null) {
          if (serializer) {
            search = serializer(options.searchParams as Record<string, unknown>);
          } else {
            const sp = new URLSearchParams(
              options.searchParams as ConstructorParameters<typeof URLSearchParams>[0],
            ).toString();
            search = sp ? `?${sp}` : "";
          }
        }

        const hash = options.hash ? `#${options.hash}` : "";
        return (path + search + hash) as HrefReturn<Options>;
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
