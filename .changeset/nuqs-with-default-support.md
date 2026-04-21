---
"@plainbrew/next-typed-href": patch
---

fix: Support withDefault parsers in defineTypedHrefWithNuqs; null is now a type error for non-nullable params, and values equal to the default are omitted from the URL
