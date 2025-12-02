const { pool } = require('../config/database');

class Character {
  static async create(characterData) {
    const connection = await pool.getConnection();
    
    try {
      await connection.beginTransaction();

      // Insert main character data
      const [result] = await connection.query(
        `INSERT INTO characters 
        (name, age, gender, occupation, background, hair_color, eye_color, height_cm, build, seed) 
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          characterData.name,
          characterData.age,
          characterData.gender,
          characterData.occupation,
          characterData.background,
          characterData.appearance.hair_color,
          characterData.appearance.eye_color,
          characterData.appearance.height_cm,
          characterData.appearance.build,
          characterData.seed || null
        ]
      );

      const characterId = result.insertId;

      // Insert personality traits
      if (characterData.personality_traits && characterData.personality_traits.length > 0) {
        const traitsData = characterData.personality_traits.map(trait => [characterId, trait]);
        await connection.query(
          'INSERT INTO personality_traits (character_id, trait) VALUES ?',
          [traitsData]
        );
      }

      // Insert hobbies
      if (characterData.hobbies && characterData.hobbies.length > 0) {
        const hobbiesData = characterData.hobbies.map(hobby => [characterId, hobby]);
        await connection.query(
          'INSERT INTO hobbies (character_id, hobby) VALUES ?',
          [hobbiesData]
        );
      }

      await connection.commit();
      return characterId;

    } catch (error) {
      await connection.rollback();
      throw error;
    } finally {
      connection.release();
    }
  }

  static async findById(id) {
    const [characters] = await pool.query(
      `SELECT * FROM characters WHERE id = ?`,
      [id]
    );

    if (characters.length === 0) {
      return null;
    }

    return await this.buildCharacterObject(characters[0]);
  }

  static async findBySeed(seed) {
    const [characters] = await pool.query(
      `SELECT * FROM characters WHERE seed = ? LIMIT 1`,
      [seed]
    );

    if (characters.length === 0) {
      return null;
    }

    return await this.buildCharacterObject(characters[0]);
  }

  static async buildCharacterObject(characterRow) {
    // Get personality traits
    const [traits] = await pool.query(
      'SELECT trait FROM personality_traits WHERE character_id = ?',
      [characterRow.id]
    );

    // Get hobbies
    const [hobbies] = await pool.query(
      'SELECT hobby FROM hobbies WHERE character_id = ?',
      [characterRow.id]
    );

    return {
      id: characterRow.id,
      name: characterRow.name,
      age: characterRow.age,
      gender: characterRow.gender,
      occupation: characterRow.occupation,
      background: characterRow.background,
      appearance: {
        hair_color: characterRow.hair_color,
        eye_color: characterRow.eye_color,
        height_cm: characterRow.height_cm,
        build: characterRow.build
      },
      personality_traits: traits.map(t => t.trait),
      hobbies: hobbies.map(h => h.hobby),
      seed: characterRow.seed,
      created_at: characterRow.created_at
    };
  }

  static async getAvailableTraits() {
    const [rows] = await pool.query(
      'SELECT category, value FROM available_traits ORDER BY category, value'
    );

    const traits = {};
    rows.forEach(row => {
      if (!traits[row.category]) {
        traits[row.category] = [];
      }
      traits[row.category].push(row.value);
    });

    return traits;
  }

  static async count() {
    const [result] = await pool.query('SELECT COUNT(*) as total FROM characters');
    return result[0].total;
  }

  static async deleteAll() {
    await pool.query('DELETE FROM characters');
  }
}

module.exports = Character;