-- The "downloads" counter is already incremented via an RPC function
-- called increment_file_downloads (created directly in the Supabase SQL
-- editor at some point — it isn't tracked in this repo's other schema
-- files). This adds the matching function for "views", which was never
-- created, so the views column always stayed at 0.
--
-- Run this once in the Supabase SQL editor (Dashboard -> SQL Editor).

create or replace function public.increment_file_views(p_file_id uuid)
returns void
language sql
as $$
  update public.files
  set views = views + 1
  where id = p_file_id;
$$;
