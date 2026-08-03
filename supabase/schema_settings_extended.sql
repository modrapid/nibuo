insert into public.settings (key, value) values
  ('site_logo_url', ''),
  ('upload_limit_mb', '1024'),
  ('allowed_extensions', 'jpg,jpeg,png,gif,webp,mp4,webm,pdf,zip,rar,doc,docx,txt'),
  ('expiry_options', '1d,3d,7d,14d'),
  ('smtp_host', ''),
  ('smtp_port', '587'),
  ('smtp_user', ''),
  ('resend_from_email', 'noreply@xbare.top'),
  ('cloudflare_zone_id', '')
on conflict (key) do nothing;
