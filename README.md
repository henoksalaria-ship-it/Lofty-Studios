# Lofty Studios Command Center

The production foundation for Lofty Studios’ operating system: pipeline, tasks, finance, content planning, performance tracking, and secure website-to-pipeline lead intake.

## What is built

- Passwordless Supabase authentication, workspace onboarding, and protected app routes.
- Row-level access controls for owner, admin, sales, editor, finance, and viewer roles.
- Live dashboard driven by deals, tasks, finance records, and calendar events.
- Drag-and-drop pipeline stages that persist immediately.
- Company/contact/deal creation with an automatic follow-up task.
- Finance records with database-calculated remaining balance.
- Content ideas that can be dragged into the next seven days to create calendar events.
- Performance data model and dashboard-ready analyzer screen.
- A secure `POST /api/leads` endpoint for the main Lofty Studios website.

## Local setup

1. Create a Supabase project.
2. Copy `.env.example` to `.env.local` and fill in the project values. Never commit `.env.local`.
3. Authenticate and link the CLI to that project:

   ```powershell
   npx supabase login
   npx supabase link --project-ref YOUR_PROJECT_REF
   npx supabase db push
   ```

4. In Supabase Dashboard → API settings, make sure the `public` schema is exposed to the Data API. The migration grants only `authenticated` database access and enables RLS on every exposed application table.
5. Enable Email authentication in Supabase Dashboard → Authentication → Providers, then add your production URL, `http://localhost:3000/auth/callback`, and `http://localhost:3000/auth/confirm` to the redirect URL allow-list.
6. For the most reliable email sign-in, customize the Supabase email template link to use token hash confirmation:

   ```html
   <a href="{{ .SiteURL }}/auth/confirm?token_hash={{ .TokenHash }}&type=email&next=/dashboard">Sign in to Lofty Studios</a>
   ```

   Keep `{{ .ConfirmationURL }}` available if you prefer the default PKCE link flow; the app supports both `/auth/callback` and `/auth/confirm`.
7. Run the app:

   ```powershell
   npm run dev
   ```

The first signed-in person creates the Lofty workspace and becomes its owner.

## Website lead intake

The public website must call this endpoint from its server-side form handler—not from browser JavaScript—so `LOFTY_LEAD_INGEST_SECRET` never reaches visitors.

`POST /api/leads`

Required request header:

```text
x-lofty-ingest-secret: <LOFTY_LEAD_INGEST_SECRET>
```

Required JSON fields:

```json
{
  "workspace_slug": "lofty-studios-xxxxxx",
  "company_name": "Example Company",
  "contact_person": "Aster Bekele"
}
```

Optional fields include `email`, `phone`, `website`, `social_handle`, `industry`, `service_requested`, `budget_amount`, `message`, `how_they_found_us`, and `initial_stage` (`cold_leads` or `open_deals`). The endpoint deduplicates companies, creates the contact and deal, logs the website submission, and assigns a high-priority follow-up task.

## Production release checklist

- Run `npx supabase db advisors` after linking the project and resolve all security findings.
- Configure an email sender domain in Supabase Auth before inviting the team.
- Set the production app URL and auth redirect URLs.
- Deploy to Vercel (or another Node-compatible host) with the same environment variables.
- Keep `SUPABASE_SERVICE_ROLE_KEY` server-only. It is used exclusively by the website lead intake route.
- Store files under `lofty-files/<workspace-id>/...`; the migration creates a private bucket with workspace-aware policies.
