import { parseAsInteger, parseAsString } from "nuqs";

export const searchParams = {
  q: parseAsString,
  page: parseAsInteger,
};
