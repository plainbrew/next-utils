# @plainbrew/next-typed-href

## 0.2.0

### Minor Changes

- [#28](https://github.com/plainbrew/next-utils/pull/28) [`4b54edb`](https://github.com/plainbrew/next-utils/commit/4b54edb72d4c121b2b581ce5c628a4399d9a0b4a) Thanks [@amotarao](https://github.com/amotarao)! - feat: Add defineTypedHrefWithNuqs for type-safe searchParams with nuqs parsers

- [#46](https://github.com/plainbrew/next-utils/pull/46) [`eaeb183`](https://github.com/plainbrew/next-utils/commit/eaeb183e73bc418c56ad391923556c1340941119) Thanks [@amotarao](https://github.com/amotarao)! - fix: Support withDefault parsers in defineTypedHrefWithNuqs; null is now a type error for non-nullable params, and values equal to the default are omitted from the URL

### Patch Changes

- [#27](https://github.com/plainbrew/next-utils/pull/27) [`100e61f`](https://github.com/plainbrew/next-utils/commit/100e61f99e666ff2d226e89b90055a29898de585) Thanks [@amotarao](https://github.com/amotarao)! - chore: Extract path generation logic into a shared helper with no changes to public interface

- [#47](https://github.com/plainbrew/next-utils/pull/47) [`b70eee1`](https://github.com/plainbrew/next-utils/commit/b70eee10d269fb9fbd9d27ae02ac7a71be25d65b) Thanks [@amotarao](https://github.com/amotarao)! - refactor: move RouteHasParams/SearchParamsFor/PathOptionsFor types inside defineTypedHrefWithNuqs closure

## 0.1.0

### Minor Changes

- [#24](https://github.com/plainbrew/next-utils/pull/24) [`ae13af7`](https://github.com/plainbrew/next-utils/commit/ae13af7cdab2ef80fc3799ac4eba8d92b59da2d3) Thanks [@amotarao](https://github.com/amotarao)! - Add initial release of @plainbrew/next-typed-href
