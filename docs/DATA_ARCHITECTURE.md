# Data architecture (Firebase Spark / free tier)

Budgety stays on the **Firebase Spark (free) plan**. That rules out products that require **Blaze** billing (Firebase SQL Connect / Data Connect, Cloud SQL, Cloud Functions beyond limited use, etc.).

## Chosen stack

| Layer | Service | Plan |
| --- | --- | --- |
| Auth (sign-in, Google, claims) | Firebase Authentication | Spark |
| App data | **Cloud Firestore** | Spark |
| Admin user list / delete / roles | Firebase Auth **Admin SDK** via Next.js `/api/admin/*` | Spark (Admin SDK does not require Blaze by itself) |
| Hosting of the Next app | Vercel (or similar) | Outside Firebase |

**Not used:** Realtime Database, Firebase SQL Connect, Cloud Functions as the primary data layer.

## Why Firestore on Spark

- Per-user collections (`userId` + date/category indexes) match the product.
- Client `onSnapshot` listeners power the live dashboard without a backend DB.
- Security rules enforce ownership without Blaze.
- Spark quotas are enough for personal / early multi-user finance apps if you keep queries scoped and avoid unbounded scans.

## Spark practices → how Budgety implements them

| Practice | Implementation |
| --- | --- |
| **User-scoped queries + date indexes** | All collections filter `userId == auth.uid`. Transactions use composite indexes `(userId, date)` / `(userId, category, date)` / `(userId, imported)` in `firestore.indexes.json`. |
| **Avoid all-time history in the live sync** | Transaction listener + fetch use `orderBy(date desc)` + `limit(TRANSACTIONS_PAGE_SIZE)` (250). Older pages load via `fetchOlderTransactions` / “load more”. Small catalogs (budgets, categories, …) listen to the full user set (usually tiny). |
| **Reports/aggregates on the client** | Dashboard charts, analytics, and budget progress read from Redux (`transactions.items`), not extra Firestore aggregate queries. |
| **Careful bulk imports** | Writes chunked at `WRITE_BATCH_CHUNK` (400) with a short pause between chunks. Hard cap `IMPORT_MAX_ROWS` (1500) in UI + API. Cleanup of imports queries `imported == true` instead of scanning all transactions. |

Constants live in `src/constants/firestore.ts` (`FIRESTORE_QUERY`).

### Expensive one-shots (use sparingly)

- **Apply rules to all history** — `fetchAllTransactions` is unbounded by design for that job only.
- Prefer “Undo last import” (`deleteTransactionsByIds`) over “delete all imported” when possible.

## Explicit non-goals (while on Spark)

- Firebase SQL Connect / Cloud SQL
- Realtime Database as the ledger store
- Migrating finance data off Firestore

If you later need heavy SQL aggregations or Blaze-only products, revisit storage then. Until then, **Firestore + Auth is the intended production path.**
