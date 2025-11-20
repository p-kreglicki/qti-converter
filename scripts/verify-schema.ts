import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';

// Load environment variables from .env.local
dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
    console.error('Error: Missing Supabase environment variables in .env.local');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function verifySchema() {
    console.log('🔍 Verifying database schema...\n');

    try {
        // Check if tables exist by querying information_schema
        const { data: tables, error: tablesError } = await supabase
            .rpc('exec_sql', {
                sql: `
          SELECT table_name 
          FROM information_schema.tables 
          WHERE table_schema = 'public' 
          AND table_type = 'BASE TABLE'
          ORDER BY table_name;
        `
            });

        // If RPC doesn't exist, try direct query approach
        // We'll check each table individually
        const expectedTables = [
            'profiles',
            'conversions',
            'questions',
            'exports',
            'audit_logs',
            'usage_tracking'
        ];

        console.log('📋 Checking tables...');
        const tableResults: Record<string, boolean> = {};

        for (const tableName of expectedTables) {
            try {
                const { error } = await supabase
                    .from(tableName)
                    .select('*')
                    .limit(0);

                if (error) {
                    if (error.code === '42P01') {
                        // Table doesn't exist
                        tableResults[tableName] = false;
                        console.log(`  ❌ ${tableName} - NOT FOUND`);
                    } else if (error.code === 'PGRST301') {
                        // Permission denied but table exists
                        tableResults[tableName] = true;
                        console.log(`  ⚠️  ${tableName} - EXISTS (RLS enabled)`);
                    } else {
                        tableResults[tableName] = true;
                        console.log(`  ✅ ${tableName} - EXISTS`);
                    }
                } else {
                    tableResults[tableName] = true;
                    console.log(`  ✅ ${tableName} - EXISTS`);
                }
            } catch (err) {
                tableResults[tableName] = false;
                console.log(`  ❌ ${tableName} - ERROR: ${err}`);
            }
        }

        console.log('\n📊 Summary:');
        const existingTables = Object.values(tableResults).filter(Boolean).length;
        console.log(`  ${existingTables}/${expectedTables.length} tables found`);

        if (existingTables === expectedTables.length) {
            console.log('\n✅ Schema verification PASSED!');
            console.log('All required tables are present.');
        } else {
            console.log('\n⚠️  Schema verification INCOMPLETE!');
            console.log('Some tables are missing. Please check the schema.sql file.');
            process.exit(1);
        }

        // Check RLS policies
        console.log('\n🔒 Checking Row Level Security...');
        const rlsTables = ['profiles', 'conversions', 'questions', 'exports', 'usage_tracking'];

        for (const tableName of rlsTables) {
            try {
                // Try to query without auth - should fail if RLS is enabled
                const { error } = await supabase
                    .from(tableName)
                    .select('*')
                    .limit(1);

                if (error && (error.code === 'PGRST301' || error.message.includes('policy'))) {
                    console.log(`  ✅ ${tableName} - RLS enabled`);
                } else if (!error) {
                    console.log(`  ⚠️  ${tableName} - RLS may not be properly configured (query succeeded without auth)`);
                } else {
                    console.log(`  ℹ️  ${tableName} - ${error.message}`);
                }
            } catch (err) {
                console.log(`  ℹ️  ${tableName} - Unable to verify RLS`);
            }
        }

        console.log('\n✅ Database verification complete!');

    } catch (err) {
        console.error('\n❌ Verification failed:', err);
        process.exit(1);
    }
}

verifySchema();
