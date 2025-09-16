# Changelog

## [0.2.0] - 2025-09-16

### Added

- Optional **dependency array (`deps`)** support in `useShallowSelector`.
  - Allows selectors to update only when dependencies change.
  - Provides finer control for cases where selectors depend on props or external values.

### Fixed

- Further stabilized subscription logic to work correctly with dependency-aware selectors.

### Deprecated

- Version `0.1.3` is superseded by `0.2.0`.  
  Please upgrade if you need dependency array support.

---

## [0.1.3] - 2025-09-16

### Fixed

- Prevented infinite render loops caused by selector resubscribing on every re-render.
- Fixed stability issues in `useShallowSelector` by ensuring subscriptions are only created once.

### Changed

- Selectors are now always updated via ref internally.
- This avoids unexpected resubscriptions and keeps behavior consistent with React’s expectations.

### Deprecated

- Version `0.1.2` is now deprecated due to critical render loop issues. Please upgrade to `0.1.3`.
