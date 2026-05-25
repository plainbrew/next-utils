import { generatePath } from "./generatePath";

export function resolveRoutePath<T extends string>(
  options: { route: T; routeParams?: Record<string, string | string[] | undefined> } | { route: T },
): string {
  if (!("routeParams" in options) || options.routeParams == null) return options.route;
  return generatePath(options.route, options.routeParams);
}
