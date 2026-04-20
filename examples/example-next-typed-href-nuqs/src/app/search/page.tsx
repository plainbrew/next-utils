"use client";

import Link from "next/link";
import { useQueryStates } from "nuqs";

import { $href } from "@/lib/href";

import { searchParams } from "./searchParams";

export default function SearchPage() {
  const [{ q, page }, setParams] = useQueryStates({
    q: searchParams.q.withDefault(""),
    page: searchParams.page.withDefault(1),
  });

  return (
    <main>
      <h1>Search</h1>

      <div>
        <input
          type="text"
          placeholder="Search query"
          value={q}
          onChange={(e) => setParams({ q: e.target.value || null, page: 1 })}
        />
      </div>

      <p>
        Current: q={q || "(empty)"}, page={page}
      </p>

      <nav>
        {page > 1 && (
          <Link href={$href({ route: "/search", searchParams: { q: q || null, page: page - 1 } })}>
            ← Prev
          </Link>
        )}{" "}
        <Link href={$href({ route: "/search", searchParams: { q: q || null, page: page + 1 } })}>
          Next →
        </Link>
      </nav>

      <p>
        <Link href={$href({ route: "/" })}>← Back to home</Link>
      </p>
    </main>
  );
}
