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
