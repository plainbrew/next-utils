import { defineTypedHrefWithNuqs } from "@plainbrew/next-typed-href/nuqs";

import type { AppRoutes, ParamsOf } from "@/../.next/types/routes";
import { searchParams as searchSearchParams } from "@/app/search/searchParams";

type AppRouteParamsMap = { [Route in AppRoutes]: ParamsOf<Route> };

export const { $href } = defineTypedHrefWithNuqs<AppRoutes, AppRouteParamsMap>()()({
  "/search": searchSearchParams,
});
