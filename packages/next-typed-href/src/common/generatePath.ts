/**
 * Substitutes dynamic segments in a Next.js App Router path template with values
 * from `routeParams`. Values are URL-encoded.
 *
 * Supported segment forms:
 * - Dynamic segments `[slug]` — replaced with the encoded string value.
 * - Catch-all `[...rest]` — replaced with `/`-joined encoded array values.
 * - Optional catch-all `[[...rest]]` — empty when the value is `undefined`,
 *   otherwise behaves like catch-all.
 *
 * Throws when a required param is missing or has the wrong type
 * (e.g. a non-array passed to a catch-all segment).
 *
 * @example
 * generatePath("/users/[id]", { id: "42" });
 * // => "/users/42"
 *
 * generatePath("/blog/[...slug]", { slug: ["2026", "hello"] });
 * // => "/blog/2026/hello"
 *
 * generatePath("/docs/[[...path]]", { path: undefined });
 * // => "/docs/"
 */
export function generatePath<T extends string>(
  route: T,
  routeParams: Record<string, string | string[] | undefined>,
): string {
  return (
    route
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
