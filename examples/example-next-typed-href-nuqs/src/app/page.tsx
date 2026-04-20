import Link from "next/link";

import { $href } from "@/lib/href";

export default function HomePage() {
  return (
    <main>
      <h1>next-typed-href + nuqs example</h1>
      <ul>
        <li>
          <Link href={$href({ route: "/search" })}>Search (no params)</Link>
        </li>
        <li>
          <Link href={$href({ route: "/search", searchParams: { q: "hello" } })}>
            Search: q=hello
          </Link>
        </li>
        <li>
          <Link href={$href({ route: "/search", searchParams: { q: "next.js", page: 2 } })}>
            Search: q=next.js, page=2
          </Link>
        </li>
        <li>
          <Link href={$href({ route: "/search", searchParams: { q: "typed", page: null } })}>
            Search: q=typed, page=null (omitted)
          </Link>
        </li>
      </ul>
    </main>
  );
}
