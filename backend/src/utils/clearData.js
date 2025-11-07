const { pool } = require('../config/database');

async function clearAllData() {
  try {
    console.log('🧹 Clearing all data...');

    // Step 1: Get admin user ID first
    const adminResult = await pool.query("SELECT id FROM users WHERE username = 'admin'");
    const adminId = adminResult.rows[0]?.id;
    
    if (!adminId) {
      throw new Error('Admin user not found');
    }

    // Step 2: Update model_definitions to point to admin (to maintain foreign key integrity)
    await pool.query('UPDATE model_definitions SET created_by = $1', [adminId]);
    console.log('✅ Updated model definitions to point to admin');

    // Step 3: Clear data from all model tables
    const modelsResult = await pool.query('SELECT table_name FROM model_definitions');
    const modelTables = modelsResult.rows.map(row => row.table_name);

    let totalCleared = 0;
    for (const tableName of modelTables) {
      try {
        await pool.query(`TRUNCATE TABLE ${tableName} RESTART IDENTITY`);
        console.log(`✅ Cleared data from: ${tableName}`);
        totalCleared++;
      } catch (error) {
        console.error(`❌ Failed to clear ${tableName}:`, error.message);
      }
    }

    // Step 4: Now clear users (except admin)
    const usersResult = await pool.query("DELETE FROM users WHERE username != 'admin'");
    console.log(`✅ Cleared ${usersResult.rowCount} users (admin kept)`);

    console.log(`🎉 Data clearing complete! Cleared ${totalCleared} model tables.`);
    
  } catch (error) {
    console.error('❌ Data clearing failed:', error);
  } finally {
    pool.end();
  }
}

clearAllData();