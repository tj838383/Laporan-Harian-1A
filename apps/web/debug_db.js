
// @ts-nocheck
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://udkpzsdkrgpmmkznwwjn.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVka3B6c2RrcmdwbW1rem53d2puIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzAxNzUyMTIsImV4cCI6MjA4NTc1MTIxMn0.6SGpkHNB2ytWjREC0blMpk3MGXlqSx_bjKKslW9wqNk';

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkColumns() {
    console.log('Checking daily_reports structure...');
    const { data, error } = await supabase
        .from('daily_reports')
        .select('*')
        .limit(1);

    if (error) {
        console.error('Error fetching data:', error);
        return;
    }

    if (data && data.length > 0) {
        const keys = Object.keys(data[0]);
        console.log('Available columns:', keys);
        console.log('Has approved_by_spv:', keys.includes('approved_by_spv'));
        console.log('Has approved_by_manager:', keys.includes('approved_by_manager'));
    } else {
        console.log('No reports found to check structure.');
        // Check metadata if possible or insert dummy? No, assume empty table means we can't check keys easily with simple select *
        // Try to select specific columns, if error -> column missing
        const { error: colError } = await supabase
            .from('daily_reports')
            .select('approved_by_spv')
            .limit(1);

        if (colError) {
            console.log('Column check approved_by_spv failed:', colError.message);
        } else {
            console.log('Column approved_by_spv exists (select succeeded)');
        }
    }
}

checkColumns();
