import { defineTypedHrefWithNuqs } from "@plainbrew/next-typed-href/nuqs";
import { parseAsInteger, parseAsString } from "nuqs/server";

import type { AppRoutes, ParamsOf } from "@/../.next/types/routes";

type AppRouteParamsMap = { [Route in AppRoutes]: ParamsOf<Route> };

export const { $href } = defineTypedHrefWithNuqs<AppRoutes, AppRouteParamsMap>()({
  "/search": {
    q: parseAsString,
    page: parseAsInteger,
  },
});
