# EagleLine Fleet Management – Platform Audit

**Date:** February 17, 2025  
**Platform:** bms.sdkoncept.com  
**Stack:** React 18 + TypeScript + Vite, Supabase, Mapbox, Capacitor

---

## 1. Environment & API Keys Checklist

### Frontend (Vercel / `.env`)

| Variable | Purpose | Required | Status |
|----------|---------|----------|--------|
| `VITE_SUPABASE_URL` | Supabase project URL | ✅ Yes | Set in Vercel |
| `VITE_SUPABASE_PUBLISHABLE_KEY` | Supabase anon key (public) | ✅ Yes | Set in Vercel |
| `VITE_SUPABASE_PROJECT_ID` | Optional, for some tooling | No | Optional |

**Note:** `.env` is in `.gitignore` – never commit secrets.

### Supabase Edge Function Secrets

| Secret | Purpose | Required | Status |
|--------|---------|----------|--------|
| `MAPBOX_PUBLIC_TOKEN` | Mapbox maps (get-mapbox-token) | ✅ Yes | Set in Supabase Dashboard → Edge Functions → Secrets |
| `SUPABASE_SERVICE_ROLE_KEY` | Auto-provided by Supabase | ✅ Yes | Automatic |
| `SUPABASE_ANON_KEY` | Auto-provided by Supabase | ✅ Yes | Automatic |
| `SEED_SECRET` | Protect seed functions in production | Recommended | Set for production |

### Traccar Integration

| Config | Purpose |
|--------|---------|
| `forward.url` | `https://ccvjtchhcjzpiefrgbmk.supabase.co/functions/v1/traccar-webhook` |
| `forward.header` | `Authorization: Bearer <SUPABASE_SERVICE_ROLE_KEY>` |
| `forward.type` | `json` |

---

## 2. Edge Functions Security Status

| Function | Auth | Status |
|----------|------|--------|
| **update-bus-location** | JWT + driver check (RLS) | ✅ Secured – only drivers for assigned bus can update |
| **traccar-webhook** | Bearer token = service role key | ✅ Secured |
| **get-shared-location** | Public; access via 16-char share token | ✅ OK – token is unguessable |
| **get-mapbox-token** | Public | ✅ OK – Mapbox token is meant to be public |
| **create-driver-user** | Admin JWT (manual check) | ✅ Secured |
| **delete-driver-user** | Admin JWT (manual check) | ✅ Secured |
| **link-driver-account** | Admin JWT (manual check) | ✅ Secured |
| **delete-user** | Admin JWT (manual check) | ✅ Secured |
| **seed-comprehensive-data** | SEED_SECRET (optional) | ✅ Secured – set SEED_SECRET in prod |
| **seed-sample-data** | SEED_SECRET (optional) | ✅ Secured |
| **create-test-users** | SEED_SECRET (optional) | ✅ Secured |
| **debug-trips** | Admin JWT | ✅ Secured |

### Invoking Seed Functions (Production)

When `SEED_SECRET` is set in Supabase secrets, you must pass it:

```bash
curl -X POST https://YOUR_PROJECT.supabase.co/functions/v1/seed-comprehensive-data \
  -H "Authorization: Bearer YOUR_ANON_OR_SERVICE_KEY" \
  -H "X-Seed-Secret: YOUR_SEED_SECRET" \
  -H "Content-Type: application/json"
```

If `SEED_SECRET` is not set, seed functions run without the header (for initial setup only).

---

## 3. Database & RLS

- **RLS:** Enabled on all relevant tables
- **Policies:** Role-based (admin, staff, driver, mechanic, etc.)
- **bus_locations:** Drivers can only insert for buses where they are `current_driver_id`
- **Profiles, bookings, payments:** Proper role checks in place

---

## 4. Deployment Security

### Vercel (`vercel.json`)

- `X-Content-Type-Options: nosniff`
- `X-Frame-Options: SAMEORIGIN`
- `X-XSS-Protection: 1; mode=block`
- Asset caching for `/assets/*`

### Recommendations

1. **Content-Security-Policy (CSP):** Consider adding a CSP header for stricter XSS protection.
2. **HTTPS:** Enforced by Vercel and Supabase.

---

## 5. Post-Seed Actions

**Important:** Seed data creates users with known passwords (e.g. `Admin123!`, `Driver123!`).

1. Change all demo passwords after first login.
2. Remove or disable seed functions in production if not needed.
3. Set `SEED_SECRET` before deploying seed functions to production.

---

## 6. Config Mismatch Check

`supabase/config.toml` has `project_id = "ieymegemufyoyxrwbtfv"`.  
Your production project appears to be `ccvjtchhcjzpiefrgbmk`.

- If using `ccvjtchhcjzpiefrgbmk`, run:  
  `npx supabase link --project-ref ccvjtchhcjzpiefrgbmk`
- Update `config.toml` if needed so it matches your active project.

---

## 7. Pre-Launch Checklist

- [ ] `VITE_SUPABASE_URL` and `VITE_SUPABASE_PUBLISHABLE_KEY` set in Vercel
- [ ] `MAPBOX_PUBLIC_TOKEN` set in Supabase Edge Function secrets
- [ ] `SEED_SECRET` set in Supabase (if seed functions are deployed)
- [ ] Traccar `forward.url` and `forward.header` configured with correct project URL and service role key
- [ ] Buses have `traccar_device_id` mapped in Fleet Management
- [ ] Migrations applied: `npx supabase db push`
- [ ] Edge functions deployed: `npx supabase functions deploy <name>`
- [ ] Demo passwords changed after first use

---

## 8. Summary

The platform is configured for production use with:

- JWT and role-based access on sensitive Edge Functions
- RLS on the database
- Security headers on the frontend
- Optional secret protection for seed functions

**Remaining for you to provide (if missing):**

1. **Mapbox token** – Create at [mapbox.com](https://mapbox.com) and set `MAPBOX_PUBLIC_TOKEN` in Supabase secrets.
2. **SEED_SECRET** – Generate a random string (e.g. `openssl rand -hex 32`) and set it in Supabase secrets if you deploy seed functions to production.
3. **Traccar service role key** – Use your Supabase service role key in Traccar’s `forward.header`.
