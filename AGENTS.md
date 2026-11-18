# Architecture rules
- Homepage scheme and blog reads use keyed TanStack Query caching, bounded requests, and explicit retry states to avoid repeated reads and indefinite loading.
- The homepage blog request starts near the viewport to keep below-the-fold data from competing with initial content.
- Shared interview-bank reads require a profile matching the authenticated user through RLS, so registration is checked without treating shared questions as user-owned data.
- Guided report forms pass structured formatting and chapter preferences to the existing generator; history opens that same quality-gated viewer to avoid divergent export behavior.
- Report chapter requests claim allowance by an owned report ID through an idempotent RPC, so retries and resumed parts do not consume additional report credits.