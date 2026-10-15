# Architecture rules
- Homepage scheme and blog reads use keyed TanStack Query caching, bounded requests, and explicit retry states to avoid repeated reads and indefinite loading.
- The homepage blog request starts near the viewport to keep below-the-fold data from competing with initial content.
- Shared interview-bank reads require a profile matching the authenticated user through RLS, so registration is checked without treating shared questions as user-owned data.