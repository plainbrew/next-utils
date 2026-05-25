import { generatePath } from "./generatePath";

/**
 * Resolves the path portion of an href from a `$href` options object.
 *
 * - When `routeParams` is provided, substitutes dynamic segments via {@link generatePath}.
 * - Otherwise returns `route` as-is (static route, no substitution).
 *
 * Shared by `defineTypedHref` and `defineTypedHrefWithNuqs` so the
 * `"routeParams" in options ? generatePath(...) : route` branch lives in one place.
 *
 * @example
 * resolveRoutePath({ route: "/" });
 * // => "/"
 *
 * resolveRoutePath({ route: "/users/[id]", routeParams: { id: "42" } });
 * // => "/users/42"
 */
export function resolveRoutePath<T extends string>(
  options: { route: T; routeParams?: Record<string, string | string[] | undefined> } | { route: T },
): string {
  if (!("routeParams" in options) || options.routeParams == null) return options.route;
  return generatePath(options.route, options.routeParams);
}
