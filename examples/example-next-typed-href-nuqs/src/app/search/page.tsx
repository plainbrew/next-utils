"use client";

import Link from "next/link";
import { useQueryStates } from "nuqs";
import { Suspense } from "react";

import { $href } from "@/lib/href";

import { searchParams } from "./searchParams";

function SearchContent() {
  const [{ q, page }, setParams] = useQueryStates(searchParams);

  return (
    <>
      <div>
        <input
          type="text"
          placeholder="Search query"
          value={q ?? ""}
          onChange={(e) => setParams({ q: e.target.value || null, page: 1 })}
        />
      </div>

      <p>
        Current: q={q || "(empty)"}, page={page}
      </p>

      <nav>
        {page > 1 && (
          <Link href={$href({ route: "/search", searchParams: { q, page: page - 1 } })}>
            ← Prev
          </Link>
        )}{" "}
        <Link href={$href({ route: "/search", searchParams: { q, page: page + 1 } })}>Next →</Link>
      </nav>
    </>
  );
}

export default function SearchPage() {
  return (
    <main>
      <h1>Search</h1>

      <Suspense>
        <SearchContent />
      </Suspense>

      <p>
        <Link href={$href({ route: "/" })}>← Back to home</Link>
      </p>
    </main>
  );
}
