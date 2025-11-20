import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';

// Load environment variables from .env.local
dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

console.log('Testing connection to:', supabaseUrl);

if (!supabaseUrl || !supabaseAnonKey) {
    console.error('Error: Missing Supabase environment variables in .env.local');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function testConnection() {
    try {
        // Try to fetch data from a system table or just check health
        // Since we might not have tables yet, we can check auth or just a simple query
        // We'll try to get the session, which should work even if empty
        const { data, error } = await supabase.auth.getSession();

        if (error) {
            console.error('Connection failed:', error.message);
            process.exit(1);
        }

        console.log('Supabase connection successful!');
        console.log('Session check result:', data ? 'OK' : 'No Data');

    } catch (err) {
        console.error('Unexpected error:', err);
        process.exit(1);
    }
}

testConnection();
