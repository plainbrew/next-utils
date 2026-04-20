import { defineTypedHrefWithNuqs } from "@plainbrew/next-typed-href/nuqs";
import { parseAsInteger, parseAsString } from "nuqs/server";

type Routes = "/" | "/search";

type RouteParamsMap = {
  "/": Record<string, never>;
  "/search": Record<string, never>;
};

export const { $href } = defineTypedHrefWithNuqs<Routes, RouteParamsMap>()({
  "/search": {
    q: parseAsString,
    page: parseAsInteger,
  },
});
