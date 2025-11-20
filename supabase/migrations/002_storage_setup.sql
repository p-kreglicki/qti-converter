-- Create the 'uploads' bucket if it doesn't exist
insert into storage.buckets (id, name, public)
values ('uploads', 'uploads', false)
on conflict (id) do nothing;

-- NOTE: We removed 'alter table storage.objects enable row level security;' 
-- because it causes permission errors and RLS is enabled by default on storage.objects.

-- Drop policies if they exist to allow re-running the script
drop policy if exists "Authenticated users can upload files" on storage.objects;
drop policy if exists "Users can view their own files" on storage.objects;
drop policy if exists "Users can update their own files" on storage.objects;
drop policy if exists "Users can delete their own files" on storage.objects;

-- Policy: Authenticated users can upload files to their own folder
-- We enforce that the file path must start with the user's ID: {user_id}/{filename}
create policy "Authenticated users can upload files"
on storage.objects for insert
to authenticated
with check (
  bucket_id = 'uploads' and
  (storage.foldername(name))[1] = auth.uid()::text
);

-- Policy: Users can view their own files
create policy "Users can view their own files"
on storage.objects for select
to authenticated
using (
  bucket_id = 'uploads' and
  (storage.foldername(name))[1] = auth.uid()::text
);

-- Policy: Users can update their own files
create policy "Users can update their own files"
on storage.objects for update
to authenticated
using (
  bucket_id = 'uploads' and
  (storage.foldername(name))[1] = auth.uid()::text
);

-- Policy: Users can delete their own files
create policy "Users can delete their own files"
on storage.objects for delete
to authenticated
using (
  bucket_id = 'uploads' and
  (storage.foldername(name))[1] = auth.uid()::text
);
