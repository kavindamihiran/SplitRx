
import pool from '../config/database';
import { HashingService } from '../crypto/hashing';

async function resetAdminPassword() {
    const email = process.env.TARGET_EMAIL || 'admin@splitrx.com';
    const newPassword = process.env.NEW_PASSWORD;
    const isReset = process.argv.includes('--reset');

    console.log(`Password Reset Tool`);
    console.log(`===================`);

    if (!newPassword) {
        console.error('❌ Error: NEW_PASSWORD environment variable is required.');
        console.log('Usage: NEW_PASSWORD="MyNewPassword123!" npm run reset:admin');
        process.exit(1);
    }

    console.log(`Target Email: ${email}`);

    try {
        // limit connection time
        const client = await pool.connect();

        try {
            // Check if user exists first
            const userCheck = await client.query('SELECT id, role, full_name FROM users WHERE email = $1', [email]);

            if (userCheck.rows.length === 0) {
                console.error(`❌ User with email ${email} does not exist in the database.`);
                process.exit(1);
            }

            const user = userCheck.rows[0];
            console.log(`Found user: ${user.full_name} (${user.role}) - ID: ${user.id}`);

            // Hash new password
            console.log('Hashing new password...');
            const passwordHash = await HashingService.hashPassword(newPassword);

            // Update user
            console.log('Updating database...');
            await client.query(
                `UPDATE users SET password_hash = $1, is_active = true WHERE email = $2`,
                [passwordHash, email]
            );

            console.log('\n✅ Password reset successfully!');
            console.log(`📧 Email:    ${email}`);
            console.log(`🔑 Password: [HIDDEN]`);
            console.log('\n⚠️  Please change this password immediately after logging in.');

        } finally {
            client.release();
        }
    } catch (error) {
        console.error('❌ Error resetting password:', error);
        process.exit(1);
    } finally {
        await pool.end();
        process.exit(0);
    }
}

resetAdminPassword();
