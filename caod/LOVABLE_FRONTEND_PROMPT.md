# Admin Integration Prompt

This project already contains a working app and a backend admin API. The goal is to keep the existing app build exactly as it is and only integrate the admin features already added in the project.

## Preserve the current app visual design

- Do not redesign the app.
- Do not change the existing layout, spacing, pages, routes, nav, forms, cards, controls, or styling decisions.
- Do not add new pages, sections, dashboards, modals, tables, or workflows.
- Do not alter the current app structure or visual identity.
- Only connect the app to the existing admin functionality when a matching UI already exists.

## Admin API reference

The backend exposes these protected admin endpoints:

```text
X-Admin-Key: <admin key from the existing secure configuration>
```

Use this header on every admin request.

- `GET /admin/dashboard` - totals for citizens, records, verifications, and institutions.
- `GET /admin/institutions` - list institutions with id, name, domain, status, and created_at.
- `POST /admin/institutions?name={name}&domain={domain}` - add a new institution. Valid domains: `education`, `employment`, `finance`, `healthcare`.
- `POST /admin/institutions/{institution_id}/suspend` - suspend an institution.
- `POST /admin/institutions/{institution_id}/reactivate` - reactivate an institution.
- `GET /admin/institutions/{institution_id}/records` - list records issued by an institution.
- `GET /admin/citizens/search?root_id={root_id}` - search a citizen by root ID.
- `GET /admin/consent/audit` - view recent consent-share audit data.
- `GET /admin/verifications/log` - view recent verification attempts.

## Security rules

- Never hard-code any admin key, Supabase key, service-role key, or secret in the frontend source.
- Never expose secrets or credentials in the browser.
- Do not invent new endpoints or change request/response formats.
- Do not expose citizen names, birth dates, record contents, private keys, or institution private keys in any admin display unless the existing UI already does so intentionally.

## Implementation rules

- Keep the current frontend code and design intact.
- If the current frontend does not already contain an admin panel or admin controls, do not create one.
- If admin UI already exists in the app, only connect it to the existing backend endpoints and keep its current structure and appearance.
- Keep all existing business logic and API behavior unchanged.
- Treat this as an integration task, not a redesign task.

## Final requirement

Build the admin integration without changing the visual design of the app. The goal is functional backend connectivity without introducing new screens, layout changes, branding changes, or visual rebuilds.
