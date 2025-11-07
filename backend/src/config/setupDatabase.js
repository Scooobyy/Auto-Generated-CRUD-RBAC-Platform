const { pool } = require('./database');

const setupDatabase = async () => {
  try {
    // Create tables if they don't exist
    await pool.query(`
      -- Users table
      CREATE TABLE IF NOT EXISTS users (
        id SERIAL PRIMARY KEY,
        username VARCHAR(50) UNIQUE NOT NULL,
        email VARCHAR(100) UNIQUE NOT NULL,
        password VARCHAR(255) NOT NULL,
        role VARCHAR(20) DEFAULT 'Viewer',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );

      -- Model definitions table
      CREATE TABLE IF NOT EXISTS model_definitions (
        id SERIAL PRIMARY KEY,
        name VARCHAR(100) UNIQUE NOT NULL,
        table_name VARCHAR(100) UNIQUE NOT NULL,
        definition JSONB NOT NULL,
        created_by INTEGER REFERENCES users(id),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );

      -- Dynamic data will be stored in tables created on-the-fly
    `);

    console.log('✅ Database tables created successfully');

    // Create default admin user
    const bcrypt = require('bcryptjs');
    const hashedPassword = await bcrypt.hash('admin123', 12);
    
    await pool.query(
      'INSERT INTO users (username, email, password, role) VALUES ($1, $2, $3, $4) ON CONFLICT (username) DO NOTHING',
      ['admin', 'admin@example.com', hashedPassword, 'Admin']
    );

    console.log('✅ Default admin user created (admin/admin123)');
    
  } catch (error) {
    console.error('❌ Database setup failed:', error);
  } finally {
    pool.end();
  }
};

setupDatabase();