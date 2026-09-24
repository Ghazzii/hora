# Self-deployment checklist

No deployment is configured or performed by this repository.

When you decide to deploy:

1. Create a Supabase project and copy its pooled and direct PostgreSQL connection strings into the host's encrypted environment variables.
2. Choose a Node.js host supporting Next.js; durable disk storage is not required because Supabase stores the data.
3. Generate a unique `SESSION_SECRET`; configure all required environment variables.
4. Run `npm run db:migrate` against the target database.
5. Build with `npm run build` and start with `npm start`.
6. Add TLS, database backups, uptime/error monitoring and a shared rate limiter.
7. Configure an approved image-storage host if replacing local assets.
8. Change or remove development seed credentials.
9. Complete and legally review contact, privacy, return and sale terms.
10. Run the CI commands and an end-to-end COD test before directing traffic.

Supabase's free tier is suitable for an early store, but it pauses inactive projects and lacks automatic backups. Export the database regularly and upgrade before relying on it for sustained commercial traffic. No commerce platform is involved.
