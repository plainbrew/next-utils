export type RouteHasParams<
  T extends string,
  RouteParamsMap extends Record<string, Record<string, unknown>>,
> = RouteParamsMap[T] extends Record<string, never> ? false : true;

export type RouteIdentityFor<
  T extends string,
  Routes extends string,
  RouteParamsMap extends Record<Routes, Record<string, unknown>>,
> = T extends Routes
  ? RouteHasParams<T, RouteParamsMap> extends true
    ? { route: T; routeParams: RouteParamsMap[T] }
    : { route: T }
  : never;
