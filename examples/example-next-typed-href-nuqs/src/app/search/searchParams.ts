import { parseAsInteger, parseAsString } from "nuqs/server";

export const searchParams = {
  q: parseAsString,
  page: parseAsInteger.withDefault(1),
};
