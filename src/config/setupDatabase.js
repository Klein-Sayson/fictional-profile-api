require('dotenv').config();
const mysql = require('mysql2/promise');

async function setupDatabase() {
  let connection;
  
  try {
    // Connect without database to create it
    connection = await mysql.createConnection({
      host: process.env.DB_HOST || 'localhost',
      port: process.env.DB_PORT || 3306,
      user: process.env.DB_USER || 'root',
      password: process.env.DB_PASSWORD
    });

    console.log('Connected to MySQL server');

    // Create database if not exists
    const dbName = process.env.DB_NAME || 'fictional_profiles';
    await connection.query(`CREATE DATABASE IF NOT EXISTS ${dbName}`);
    console.log(`Database '${dbName}' created or already exists`);

    // Use the database
    await connection.query(`USE ${dbName}`);

    // Create characters table
    await connection.query(`
      CREATE TABLE IF NOT EXISTS characters (
        id INT AUTO_INCREMENT PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        age INT NOT NULL,
        gender ENUM('male', 'female', 'non-binary', 'other') NOT NULL,
        occupation VARCHAR(255),
        background TEXT,
        hair_color VARCHAR(50),
        eye_color VARCHAR(50),
        height_cm INT,
        build VARCHAR(50),
        seed VARCHAR(255),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        INDEX idx_gender (gender),
        INDEX idx_age (age),
        INDEX idx_seed (seed)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `);
    console.log('Table "characters" created');

    // Create personality_traits table
    await connection.query(`
      CREATE TABLE IF NOT EXISTS personality_traits (
        id INT AUTO_INCREMENT PRIMARY KEY,
        character_id INT NOT NULL,
        trait VARCHAR(100) NOT NULL,
        FOREIGN KEY (character_id) REFERENCES characters(id) ON DELETE CASCADE,
        INDEX idx_character_id (character_id)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `);
    console.log('Table "personality_traits" created');

    // Create hobbies table
    await connection.query(`
      CREATE TABLE IF NOT EXISTS hobbies (
        id INT AUTO_INCREMENT PRIMARY KEY,
        character_id INT NOT NULL,
        hobby VARCHAR(100) NOT NULL,
        FOREIGN KEY (character_id) REFERENCES characters(id) ON DELETE CASCADE,
        INDEX idx_character_id (character_id)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `);
    console.log('Table "hobbies" created');

    // Create reference data tables for available options
    await connection.query(`
      CREATE TABLE IF NOT EXISTS available_traits (
        id INT AUTO_INCREMENT PRIMARY KEY,
        category VARCHAR(50) NOT NULL,
        value VARCHAR(100) NOT NULL,
        UNIQUE KEY unique_trait (category, value),
        INDEX idx_category (category)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `);
    console.log('Table "available_traits" created');

    console.log('\n✅ Database setup completed successfully!');
    console.log('Run "npm run seed-data" to populate reference data');

  } catch (error) {
    console.error('❌ Error setting up database:', error.message);
    process.exit(1);
  } finally {
    if (connection) {
      await connection.end();
    }
  }
}

// Run setup
setupDatabase();