
import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://udkpzsdkrgpmmkznwwjn.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVka3B6c2RrcmdwbW1rem53d2puIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzAxNzUyMTIsImV4cCI6MjA4NTc1MTIxMn0.6SGpkHNB2ytWjREC0blMpk3MGXlqSx_bjKKslW9wqNk';

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

const users = [
    { email: 'staff@demo.com', password: '123456', role: 'Staff' },
    { email: 'spv@demo.com', password: '123456', role: 'Supervisor' },
    { email: 'manager@demo.com', password: '123456', role: 'Manager' },
    { email: 'owner@demo.com', password: '123456', role: 'Owner' }
];

async function createUsers() {
    console.log('Starting user creation...');

    for (const user of users) {
        console.log(`Creating ${user.email}...`);
        const { data, error } = await supabase.auth.signUp({
            email: user.email,
            password: user.password,
        });

        if (error) {
            console.error(`Error creating ${user.email}:`, error.message);
        } else {
            console.log(`Success! User ID: ${data.user?.id}`);
        }
    }

    console.log('Done.');
}

createUsers();
