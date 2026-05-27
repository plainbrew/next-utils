/**
 * Type-safe href generator for Next.js App Router
 *
 * @example
 * type Routes = "/" | "/users/" | "/users/[id]/";
 * type RouteParamsMap = {
 *   "/": Record<string, never>;
 *   "/users/": Record<string, never>;
 *   "/users/[id]/": { id: string };
 * };
 *
 * const { $href } = defineTypedHref.routes<Routes, RouteParamsMap>();
 *
 * $href({ route: "/" })
 * // => "/"
 *
 * $href({ route: "/users/[id]/", routeParams: { id: "42" } })
 * // => "/users/42/"
 *
 * $href({ route: "/users/", searchParams: { q: "hello" }, hash: "top" })
 * // => "/users/?q=hello#top"
 *
 * // With branded option — $href returns TypedHref instead of string:
 * const { $href } = defineTypedHref
 *   .routes<Routes, RouteParamsMap>()
 *   .withOptions({ branded: true });
 */
import { resolveRoutePath } from "./common/resolveRoutePath";
import type { HrefOptions, HrefReturn, RouteIdentityFor, TypedHref } from "./common/types";

export type { TypedHref };

type PathOptionsFor<
  T extends string,
  Routes extends string,
  RouteParamsMap extends Record<Routes, Record<string, unknown>>,
> = RouteIdentityFor<T, Routes, RouteParamsMap> & {
  searchParams?: ConstructorParameters<typeof URLSearchParams>[0];
  hash?: string;
};

type WithTypedHrefRoutes<
  Routes extends string,
  RouteParamsMap extends Record<Routes, Record<string, unknown>>,
  Options extends HrefOptions,
> = {
  withOptions: <const NewOptions extends HrefOptions>(
    opts: NewOptions,
  ) => WithTypedHrefRoutes<Routes, RouteParamsMap, NewOptions>;
  $href: <T extends Routes>(
    pathOptions: PathOptionsFor<T, Routes, RouteParamsMap>,
  ) => HrefReturn<Options>;
};

type TypedHrefBuilder = {
  routes: <
    Routes extends string,
    RouteParamsMap extends Record<Routes, Record<string, unknown>>,
  >() => WithTypedHrefRoutes<Routes, RouteParamsMap, {}>;
};

function createWithTypedHrefRoutes<
  Routes extends string,
  RouteParamsMap extends Record<Routes, Record<string, unknown>>,
  Options extends HrefOptions = {},
>(_options?: Options): WithTypedHrefRoutes<Routes, RouteParamsMap, Options> {
  function $href<T extends Routes>(
    pathOptions: PathOptionsFor<T, Routes, RouteParamsMap>,
  ): HrefReturn<Options> {
    const path = resolveRoutePath(
      pathOptions as { route: T; routeParams?: Record<string, string | string[] | undefined> },
    );
    const search = pathOptions.searchParams
      ? `?${new URLSearchParams(pathOptions.searchParams).toString()}`
      : "";
    const hash = pathOptions.hash ? `#${pathOptions.hash}` : "";
    return (path + search + hash) as HrefReturn<Options>;
  }

  return {
    withOptions<const NewOptions extends HrefOptions>(opts: NewOptions) {
      return createWithTypedHrefRoutes<Routes, RouteParamsMap, NewOptions>(opts);
    },
    $href,
  };
}

export const defineTypedHref: TypedHrefBuilder = {
  routes<Routes extends string, RouteParamsMap extends Record<Routes, Record<string, unknown>>>() {
    return createWithTypedHrefRoutes<Routes, RouteParamsMap>();
  },
};
