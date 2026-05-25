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
 */
import { generatePath } from "./common/generatePath";

type TypedHrefBuilder = {
  routes: <
    Routes extends string,
    RouteParamsMap extends Record<Routes, Record<string, unknown>>,
  >() => {
    $href: <T extends Routes>(options: PathOptionsFor<T, Routes, RouteParamsMap>) => string;
  };
};

type RouteHasParams<
  T extends string,
  RouteParamsMap extends Record<string, Record<string, unknown>>,
> = RouteParamsMap[T] extends Record<string, never> ? false : true;

type PathOptionsFor<
  T extends string,
  Routes extends string,
  RouteParamsMap extends Record<Routes, Record<string, unknown>>,
> = T extends Routes
  ? RouteHasParams<T, RouteParamsMap> extends true
    ? {
        route: T;
        routeParams: RouteParamsMap[T];
        searchParams?: ConstructorParameters<typeof URLSearchParams>[0];
        hash?: string;
      }
    : {
        route: T;
        searchParams?: ConstructorParameters<typeof URLSearchParams>[0];
        hash?: string;
      }
  : never;

function createRoutes<
  Routes extends string,
  RouteParamsMap extends Record<Routes, Record<string, unknown>>,
>() {
  function resolvePath<T extends Routes>(
    options: PathOptionsFor<T, Routes, RouteParamsMap>,
  ): string {
    if (!("routeParams" in options)) return options.route;

    const { routeParams } = options as unknown as {
      route: T;
      routeParams: Record<string, string | string[] | undefined>;
    };

    return generatePath(options.route, routeParams);
  }

  function $href<T extends Routes>(options: PathOptionsFor<T, Routes, RouteParamsMap>): string {
    const path = resolvePath(options);
    const search = options.searchParams
      ? `?${new URLSearchParams(options.searchParams).toString()}`
      : "";
    const hash = options.hash ? `#${options.hash}` : "";
    return path + search + hash;
  }

  return { $href };
}

export const defineTypedHref: TypedHrefBuilder = {
  routes: createRoutes,
};
