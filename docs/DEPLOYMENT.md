# Self-deployment checklist

No deployment is configured or performed by this repository.

When you decide to deploy:

1. Choose a Node.js host supporting Next.js and a PostgreSQL 16 provider.
2. Create separate staging and production databases.
3. Generate a unique `SESSION_SECRET`; configure all required environment variables.
4. Run `npm run db:migrate` against the target database.
5. Build with `npm run build` and start with `npm start`.
6. Add TLS, database backups, uptime/error monitoring and a shared rate limiter.
7. Configure an approved image-storage host if replacing local assets.
8. Change or remove development seed credentials.
9. Complete and legally review contact, privacy, return and sale terms.
10. Run the CI commands and an end-to-end COD test before directing traffic.

Possible infrastructure includes a VPS/container platform plus managed PostgreSQL, or a compatible serverless Node host. No provider-specific runtime is required, and no commerce platform is involved.
