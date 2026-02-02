
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const supabaseUrl = Deno.env.get("SUPABASE_URL");
const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

if (!supabaseUrl || !supabaseKey) {
    console.error("Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY");
    Deno.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkUser(email: string) {
    const { data: { users }, error } = await supabase.auth.admin.listUsers();

    if (error) {
        console.error("Error listing users:", error);
        return;
    }

    const user = users.find(u => u.email === email);

    if (!user) {
        console.log(`User ${email} NOT FOUND in Auth.`);
        return;
    }

    console.log("=== User Found ===");
    console.log("ID:", user.id);
    console.log("Email:", user.email);
    console.log("Confirmed At:", user.email_confirmed_at);
    console.log("Last Sign In:", user.last_sign_in_at);
    console.log("App Metadata:", user.app_metadata);
    console.log("User Metadata:", user.user_metadata);
    console.log("Role:", user.role);

    // Try to update password to a known simple value to test
    const testPass = "teste123";
    console.log(`\nAttempting to set password to '${testPass}'...`);

    const { data: updateData, error: updateError } = await supabase.auth.admin.updateUserById(user.id, {
        password: testPass,
        email_confirm: true
    });

    if (updateError) {
        console.error("Error updating password:", updateError);
    } else {
        console.log("Password updated successfully!");
        console.log("New Confirmed At:", updateData.user.email_confirmed_at);
        console.log(`\nASK USER TO TRY LOGIN WITH: ${email} / ${testPass}`);
    }
}

const emailToCheck = "jailsonrcoach@gmail.com";
console.log(`Checking status for ${emailToCheck}...`);
await checkUser(emailToCheck);
