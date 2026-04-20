/**
 * Type-safe href generator for Next.js App Router
 *
 * @template Routes - Union type of all route paths (with trailing slash)
 * @template RouteParamsMap - Map from route to its dynamic segment params `{ [Route in Routes]: ParamsOf<Route> }`
 * @returns Object with `$href` function for generating type-safe URLs
 *
 * @example
 * type Routes = "/" | "/users/" | "/users/[id]/";
 * type RouteParamsMap = {
 *   "/": Record<string, never>;
 *   "/users/": Record<string, never>;
 *   "/users/[id]/": { id: string };
 * };
 *
 * const { $href } = defineTypedHref<Routes, RouteParamsMap>();
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
import { generatePath } from "./_generatePath";

export function defineTypedHref<
  Routes extends string,
  RouteParamsMap extends Record<Routes, Record<string, unknown>>,
>() {
  type RouteHasParams<T extends Routes> =
    RouteParamsMap[T] extends Record<string, never> ? false : true;

  type PathOptionsFor<T extends Routes> = T extends Routes
    ? RouteHasParams<T> extends true
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

  function resolvePath<T extends Routes>(options: PathOptionsFor<T>): string {
    if (!("routeParams" in options)) return options.route;

    const { routeParams } = options as unknown as {
      route: T;
      routeParams: Record<string, string | string[] | undefined>;
    };

    return generatePath(options.route, routeParams);
  }

  function $href<T extends Routes>(options: PathOptionsFor<T>): string {
    const path = resolvePath(options);
    const search = options.searchParams
      ? `?${new URLSearchParams(options.searchParams).toString()}`
      : "";
    const hash = options.hash ? `#${options.hash}` : "";
    return path + search + hash;
  }

  return { $href };
}
