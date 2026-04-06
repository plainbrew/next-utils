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

  function generatePath<T extends Routes>(options: PathOptionsFor<T>): string {
    if (!("routeParams" in options)) return options.route;

    const { routeParams } = options as unknown as {
      route: T;
      routeParams: Record<string, string | string[] | undefined>;
    };

    return (
      options.route
        // Optional Catch-all Segments [[...rest]]
        .replace(/\[\[\.\.\.(.+?)\]\]/g, (match) => {
          const key = match.replace(/[[\].]/g, "");
          const value = routeParams[key];

          if (value === undefined) return "";

          if (Array.isArray(value)) {
            return value.map((v) => encodeURIComponent(v)).join("/");
          }

          throw new Error(`Invalid optional catch-all param: ${key} with value: ${String(value)}`);
        })
        // Catch-all Segments [...rest]
        .replace(/\[\.\.\.(.+?)\]/g, (match) => {
          const key = match.replace(/[[\].]/g, "");

          if (!(key in routeParams)) throw new Error(`Missing catch-all param: ${key}`);
          const value = routeParams[key];

          if (Array.isArray(value)) {
            return value.map((v) => encodeURIComponent(v)).join("/");
          }

          throw new Error(`Invalid catch-all param: ${key} with value: ${String(value)}`);
        })
        // Dynamic Segments [slug]
        .replace(/\[(.+?)\]/g, (match) => {
          const key = match.replace(/[[\]]/g, "");

          if (!(key in routeParams)) throw new Error(`Missing route param: ${key}`);
          const value = routeParams[key];

          if (typeof value === "string") {
            return encodeURIComponent(value);
          }

          throw new Error(`Invalid route param: ${key} with value: ${String(value)}`);
        })
    );
  }

  function $href<T extends Routes>(options: PathOptionsFor<T>): string {
    const path = generatePath(options);
    const search = options.searchParams
      ? `?${new URLSearchParams(options.searchParams).toString()}`
      : "";
    const hash = options.hash ? `#${options.hash}` : "";
    return path + search + hash;
  }

  return { $href };
}
