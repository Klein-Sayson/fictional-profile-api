const CharacterGenerator = require('../services/characterGenerator'); // Ensure capitalization matches your file
const Character = require('../models/Character');

/**
 * Generate a random character
 * GET /api/v1/character/random
 */
exports.generateRandom = async (req, res) => {
  try {
    const generator = new CharacterGenerator();
    const character = generator.generate();
    
    // Save to database
    const characterId = await Character.create(character);
    
    res.json({
      success: true,
      data: {
        ...character,
        id: characterId
      }
    });
  } catch (error) {
    console.error('Error generating random character:', error);
    res.status(500).json({ 
      success: false,
      error: 'Failed to generate character',
      message: error.message 
    });
  }
};

/**
 * Generate a character with a seed (deterministic)
 * GET /api/v1/character/:seed
 */
exports.generateWithSeed = async (req, res) => {
  try {
    const { seed } = req.params;
    
    // Check if character with this seed already exists in DB
    const existingCharacter = await Character.findBySeed(seed);
    if (existingCharacter) {
      return res.json({
        success: true,
        data: existingCharacter,
        cached: true
      });
    }
    
    // Generate new character with seed
    const generator = new CharacterGenerator(seed);
    const character = generator.generate();
    
    // Save to database
    const characterId = await Character.create(character);
    
    res.json({
      success: true,
      data: {
        ...character,
        id: characterId
      },
      cached: false
    });
  } catch (error) {
    console.error('Error generating seeded character:', error);
    res.status(500).json({ 
      success: false,
      error: 'Failed to generate character',
      message: error.message 
    });
  }
};

/**
 * Generate a character with custom parameters
 * GET /api/v1/character?gender=male&age=25&fields=name,age
 */
exports.generateCustom = async (req, res) => {
  try {
    // 1. Extract query params
    const options = { ...req.query };
    
    // 2. Parse 'fields' if it exists (e.g., "name,gender" -> ["name", "gender"])
    const fields = options.fields ? options.fields.split(',').map(f => f.trim()) : null;
    
    const count = parseInt(options.count) || 1;
    
    // Cleanup options passed to generator
    delete options.fields;
    delete options.count;
    
    // Validate count
    const maxCount = parseInt(process.env.MAX_CHARACTERS_PER_REQUEST) || 100;
    if (count > maxCount) {
      return res.status(400).json({ 
        success: false,
        error: `Count cannot exceed ${maxCount}` 
      });
    }
    
    const generator = new CharacterGenerator();
    
    // Case A: Single Character
    if (count === 1) {
      // Generate (will respect options.name if provided)
      const character = generator.generate(options);
      
      // Save
      const characterId = await Character.create(character);
      
      // Combine Data
      const responseData = {
        ...character,
        id: characterId
      };
      
      // Filter & Return
      res.json({
        success: true,
        data: fields ? generator.filterFields(responseData, fields) : responseData
      });

    // Case B: Multiple Characters
    } else {
      const characters = generator.generateMultiple(count, options);
      
      const savedCharacters = [];
      for (const char of characters) {
        const charId = await Character.create(char);
        savedCharacters.push({
          ...char,
          id: charId
        });
      }
      
      // Filter & Return
      res.json({
        success: true,
        count: savedCharacters.length,
        data: fields 
          ? generator.filterFields(savedCharacters, fields)
          : savedCharacters
      });
    }
  } catch (error) {
    console.error('Error generating custom character:', error);
    res.status(500).json({ 
      success: false,
      error: 'Failed to generate character',
      message: error.message 
    });
  }
};

/**
 * Get available traits and options
 * GET /api/v1/traits
 */
exports.getTraits = async (req, res) => {
  try {
    const dbTraits = await Character.getAvailableTraits();
    
    res.json({
      success: true,
      data: {
        personality_traits: dbTraits.personality_trait || [],
        occupations: dbTraits.occupation || [],
        hobbies: dbTraits.hobby || [],
        appearance: {
          hair_colors: dbTraits.hair_color || [],
          eye_colors: dbTraits.eye_color || [],
          builds: dbTraits.build || []
        },
        genders: ['male', 'female', 'non-binary', 'other']
      }
    });
  } catch (error) {
    console.error('Error fetching traits:', error);
    res.status(500).json({ 
      success: false,
      error: 'Failed to fetch traits',
      message: error.message 
    });
  }
};

/**
 * Get JSON schema
 */
exports.getSchema = (req, res) => {
  const schema = {
    type: "object",
    properties: {
      id: { type: "integer" },
      name: { type: "string" },
      age: { type: "integer", minimum: 1, maximum: 120 },
      gender: { type: "string", enum: ["male", "female", "non-binary", "other"] },
      occupation: { type: "string" },
      background: { type: "string" },
      appearance: {
        type: "object",
        properties: {
          hair_color: { type: "string" },
          eye_color: { type: "string" },
          height_cm: { type: "integer" },
          build: { type: "string" }
        },
        required: ["hair_color", "eye_color", "height_cm", "build"]
      },
      personality_traits: { type: "array", items: { type: "string" } },
      hobbies: { type: "array", items: { type: "string" } },
      seed: { type: "string", nullable: true },
      created_at: { type: "string", format: "date-time" }
    },
    required: ["name", "age", "gender", "appearance", "personality_traits", "hobbies"]
  };
  
  res.json({ success: true, data: schema });
};

/**
 * Get Stats
 */
exports.getStats = async (req, res) => {
  try {
    const totalCharacters = await Character.count();
    
    res.json({
      success: true,
      data: {
        total_characters_generated: totalCharacters,
        api_version: process.env.API_VERSION || 'v1',
        database: 'MySQL'
      }
    });
  } catch (error) {
    console.error('Error fetching stats:', error);
    res.status(500).json({ 
      success: false,
      error: 'Failed to fetch statistics',
      message: error.message 
    });
  }
};