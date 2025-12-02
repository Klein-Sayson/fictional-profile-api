require('dotenv').config();
const mysql = require('mysql2/promise');
const traits = require('../data/traits.json');

async function seedData() {
  let connection;
  
  try {
    connection = await mysql.createConnection({
      host: process.env.DB_HOST || 'localhost',
      port: process.env.DB_PORT || 3306,
      user: process.env.DB_USER || 'root',
      password: process.env.DB_PASSWORD,
      database: process.env.DB_NAME || 'fictional_profiles'
    });

    console.log('Connected to database');

    // Clear existing reference data
    await connection.query('DELETE FROM available_traits');
    console.log('Cleared existing reference data');

    // Prepare data for insertion
    const traitsToInsert = [];

    // Add personality traits
    traits.personality_traits.forEach(trait => {
      traitsToInsert.push(['personality_trait', trait]);
    });

    // Add occupations
    traits.occupations.forEach(occupation => {
      traitsToInsert.push(['occupation', occupation]);
    });

    // Add hobbies
    traits.hobbies.forEach(hobby => {
      traitsToInsert.push(['hobby', hobby]);
    });

    // Add hair colors
    traits.hair_colors.forEach(color => {
      traitsToInsert.push(['hair_color', color]);
    });

    // Add eye colors
    traits.eye_colors.forEach(color => {
      traitsToInsert.push(['eye_color', color]);
    });

    // Add builds
    traits.builds.forEach(build => {
      traitsToInsert.push(['build', build]);
    });

    // Insert all traits
    const insertQuery = 'INSERT INTO available_traits (category, value) VALUES ?';
    await connection.query(insertQuery, [traitsToInsert]);

    console.log(`✅ Successfully seeded ${traitsToInsert.length} reference traits`);
    console.log('\nBreakdown:');
    console.log(`- Personality traits: ${traits.personality_traits.length}`);
    console.log(`- Occupations: ${traits.occupations.length}`);
    console.log(`- Hobbies: ${traits.hobbies.length}`);
    console.log(`- Hair colors: ${traits.hair_colors.length}`);
    console.log(`- Eye colors: ${traits.eye_colors.length}`);
    console.log(`- Builds: ${traits.builds.length}`);

  } catch (error) {
    console.error('❌ Error seeding data:', error.message);
    process.exit(1);
  } finally {
    if (connection) {
      await connection.end();
    }
  }
}

// Run seed
seedData();