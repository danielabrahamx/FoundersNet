### Refactor: Remove Database and Simplify Backend

**Date:** 2025-10-29

**Changes:**

- **Removed PostgreSQL Database:** The backend has been refactored to remove the dependency on a PostgreSQL database. The application now fetches all data directly from the Solana blockchain, which simplifies the architecture for the hackathon.
- **Deleted Files:** The following files, which were related to the database and mock routes, have been deleted:
    - `server/routes.ts`
    - `server/storage.ts`
    - `server/db.ts`
- **Updated Server Configuration:** The main server file (`server/index.ts`) has been updated to use the Solana-native routes (`server/routes-solana.ts`).
- **Removed Dependencies:** The following npm packages related to the database and session management have been removed from `package.json`:
    - `@neondatabase/serverless`
    - `connect-pg-simple`
    - `drizzle-orm`
    - `drizzle-zod`
    - `express-session`
    - `passport`
    - `passport-local`
    - `drizzle-kit`
    - `@types/connect-pg-simple`
    - `@types/express-session`
    - `@types/passport`
    - `@types/passport-local`
- **Updated Environment:** The `DATABASE_URL` has been removed from the `.env` file.
