
const { createClient } = require('@supabase/supabase-js');

const SUPABASE_URL = 'https://udkpzsdkrgpmmkznwwjn.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVka3B6c2RrcmdwbW1rem53d2puIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzAxNzUyMTIsImV4cCI6MjA4NTc1MTIxMn0.6SGpkHNB2ytWjREC0blMpk3MGXlqSx_bjKKslW9wqNk';

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

const DEPARTMENTS = [
    { dept_name: 'Umum', is_active: true },
    { dept_name: 'Keuangan', is_active: true },
    { dept_name: 'HR & Relawan', is_active: true },
];

async function seedDepartments() {
    console.log('Seeding departments...');

    for (const dept of DEPARTMENTS) {
        // Check if exists
        const { data: existing, error: fetchError } = await supabase
            .from('departments')
            .select('id')
            .eq('dept_name', dept.dept_name)
            .single();

        if (fetchError && fetchError.code !== 'PGRST116') { // PGRST116 is 'not found'
            console.error(`Error checking ${dept.dept_name}:`, fetchError.message);
            continue;
        }

        if (existing) {
            console.log(`Department '${dept.dept_name}' already exists.`);
        } else {
            const { error: insertError } = await supabase
                .from('departments')
                .insert([dept]);

            if (insertError) {
                console.error(`Error inserting ${dept.dept_name}:`, insertError.message);
            } else {
                console.log(`Successfully added '${dept.dept_name}'.`);
            }
        }
    }
}

seedDepartments();
