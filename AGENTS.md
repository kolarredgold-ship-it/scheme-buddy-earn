# Architecture rules
- Homepage scheme and blog reads use keyed TanStack Query caching, bounded requests, and explicit retry states to avoid repeated reads and indefinite loading.
- The homepage blog request starts near the viewport to keep below-the-fold data from competing with initial content.