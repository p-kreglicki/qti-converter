# Supabase Database Setup

## Applying the Schema

You have two options to apply the database schema:

### Option 1: Using Supabase Dashboard (Recommended for beginners)

1. Go to your Supabase project dashboard
2. Navigate to **SQL Editor** in the left sidebar
3. Click **New Query**
4. Copy the contents of `supabase/schema.sql`
5. Paste into the SQL editor
6. Click **Run** to execute

### Option 2: Using Supabase CLI (Recommended for production)

```bash
# Install Supabase CLI if you haven't
npm install -g supabase

# Login to Supabase
supabase login

# Link to your project
supabase link --project-ref YOUR_PROJECT_REF

# Apply migrations
supabase db push
```

## Verifying the Setup

After applying the schema, verify that all tables were created:

```sql
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public'
ORDER BY table_name;
```

You should see:
- audit_logs
- conversions
- exports
- profiles
- questions
- usage_tracking

## Testing RLS Policies

To test that Row Level Security is working:

```sql
-- Check that RLS is enabled
SELECT tablename, rowsecurity 
FROM pg_tables 
WHERE schemaname = 'public';
```

All tables should have `rowsecurity = true`.

## Next Steps

After the schema is applied:
1. Test the connection using `npm run test:db`
2. Create a test user via Supabase Auth
3. Verify that the profile is created automatically (you may need to set up a trigger for this)
