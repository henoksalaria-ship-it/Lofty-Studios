# Lofty Studios Command Center

The production foundation for Lofty Studios' operating system: pipeline, tasks, finance, content planning, performance tracking, role management, and secure website-to-pipeline lead intake.

## What is built

- Supabase email/password authentication with a first-owner setup flow and protected app routes.
- Row-level access controls for owner, admin, sales, editor, finance, and viewer roles.
- Live dashboard driven by deals, tasks, finance records, and calendar events.
- Drag-and-drop pipeline stages that persist immediately.
- Company/contact/deal creation with an automatic follow-up task.
- Company directory with contacts, open deal counts, active stage, and open value.
- Outreach logging for calls, emails, DMs, meetings, proposals, and automatic follow-up tasks.
- Finance records with database-calculated remaining balance plus cash flow, collection, savings, revenue, and pipeline goals.
- Calendar events linked to deals, event status updates, and content ideas that can be dragged into the next seven days to create calendar events.
- Owner-controlled Settings role hub that creates teammate password access for admin, sales, editor, finance, and viewer roles.
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

4. In Supabase Dashboard > API settings, make sure the `public` schema is exposed to the Data API. The migrations grant only `authenticated` database access and enable RLS on every exposed application table.
5. Enable Email authentication and password sign-in in Supabase Dashboard > Authentication > Providers. The app does not depend on magic links for login.
6. Run the app:

   ```powershell
   npm run dev
   ```

The first user opens the login page, chooses First setup, creates their password, and becomes the workspace owner. After activation, owner creation is closed. Future users are created in Settings by the owner with an initial password and a role.

## Website lead intake

The public website must call this endpoint from its server-side form handler, not from browser JavaScript, so `LOFTY_LEAD_INGEST_SECRET` never reaches visitors.

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
- Enable Supabase Auth leaked password protection in the dashboard.
- Set the production app URL and auth redirect URLs.
- Deploy to Vercel or another Node-compatible host with the same environment variables, including `SUPABASE_SERVICE_ROLE_KEY`.
- Keep `SUPABASE_SERVICE_ROLE_KEY` server-only. It is used exclusively by server routes.
- Store files under `lofty-files/<workspace-id>/...`; the migration creates a private bucket with workspace-aware policies.
