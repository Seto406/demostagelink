# Performance Optimization: Admin Panel User Pagination

## Baseline
- **Current Behavior:** The `fetchUsers` function fetches all profiles from the database in a single query (`.select("*")`).
- **Complexity:** O(N) where N is the number of users.
- **Impact:**
    - **Network Payload:** Grows linearly with the user base. For 1000 users, if each profile is ~0.5KB, the payload is ~500KB. For 10,000 users, it's ~5MB.
    - **Rendering:** React has to reconcile and render a table with N rows. This can cause UI freezing and slow interactions.
    - **Database Load:** Reading all rows puts unnecessary load on the database.

## Optimization
- **Implemented Solution:** Server-side pagination using Supabase's `.range(from, to)` and `limit`.
- **Complexity:** O(1) (fetching a constant number of rows, e.g., 10).
- **Benefits:**
    - **Network Payload:** Constant size (approx 5KB for 10 users).
    - **Rendering:** Fast and responsive UI with a fixed number of DOM elements.
    - **Scalability:** The solution works efficiently regardless of whether there are 100 or 1,000,000 users.
