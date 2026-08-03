# Deployment Guide — xbare.top

## 1. Supabase Setup
1. Create a project at supabase.com
2. Go to SQL Editor, run in order:
   - schema.sql
   - schema_admin.sql
   - schema_files.sql
   - schema_payments.sql
   - schema_settings_extended.sql
3. Go to Authentication → Providers → enable Email
4. Go to Authentication → URL Configuration → set Site URL to your domain
5. Copy Project URL and anon/service_role keys into .env.local

## 2. Backblaze B2 Setup
1. Create a bucket (Private) at backblaze.com
2. Create an Application Key scoped to that bucket
3. Copy Key ID, Application Key, Bucket ID, Bucket Name into .env.local

## 3. Resend Setup
1. Create account at resend.com
2. Verify your sending domain (add DNS records they provide)
3. Copy API key into .env.local as RESEND_API_KEY

## 4. Stripe Setup
1. Get Secret Key from Stripe Dashboard → Developers → API Keys
2. Create webhook endpoint: https://yourdomain.com/api/webhooks/stripe
   - Event: checkout.session.completed
3. Copy webhook signing secret into .env.local

## 5. SSLCommerz Setup
1. Register at sslcommerz.com (sandbox first, then live)
2. Copy Store ID and Store Password into .env.local

## 6. Vercel Deployment
1. Push code to GitHub
2. Import repo at vercel.com/new
3. Add all environment variables from .env.local to Vercel Project Settings
4. Set CRON_SECRET as an environment variable (Vercel auto-includes it in cron requests)
5. Deploy

## 7. Cloudflare DNS Setup
1. Add your domain to Cloudflare
2. Add a CNAME record pointing to cname.vercel-dns.com (or A record per Vercel's instructions)
3. Enable "Proxied" (orange cloud) for CDN + DDoS protection
4. SSL/TLS mode: Full (strict)

## 8. Post-Deploy Checklist
- [ ] Test signup/login/email verification flow
- [ ] Test file upload end-to-end (check file appears in B2 bucket)
- [ ] Test short link creation and redirect
- [ ] Test password-protected file access
- [ ] Trigger cron manually once: curl -H "Authorization: Bearer YOUR_CRON_SECRET" https://yourdomain.com/api/cron/cleanup-expired
- [ ] Test Stripe checkout in test mode
- [ ] Test SSLCommerz in sandbox mode
- [ ] Promote your admin user: run in Supabase SQL Editor:
      update public.users set role = 'admin' where email = 'you@example.com';
