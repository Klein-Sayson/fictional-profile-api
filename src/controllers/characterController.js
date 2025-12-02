const CharacterGenerator = require('../services/characterGenerator');
const Character = require('../models/Character');
const traits = require('../data/traits.json');

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
    
    // Check if character with this seed already exists
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
    const options = { ...req.query };
    const fields = options.fields ? options.fields.split(',').map(f => f.trim()) : null;
    const count = parseInt(options.count) || 1;
    
    // Remove non-generation parameters
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
    
    // Generate single or multiple characters
    if (count === 1) {
      const character = generator.generate(options);
      const characterId = await Character.create(character);
      
      const responseData = {
        ...character,
        id: characterId
      };
      
      res.json({
        success: true,
        data: fields ? generator.filterFields(responseData, fields) : responseData
      });
    } else {
      const characters = generator.generateMultiple(count, options);
      
      // Save all characters
      const savedCharacters = [];
      for (const char of characters) {
        const charId = await Character.create(char);
        savedCharacters.push({
          ...char,
          id: charId
        });
      }
      
      res.json({
        success: true,
        count: savedCharacters.length,
        data: fields 
          ? savedCharacters.map(c => generator.filterFields(c, fields))
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
    // Get traits from database
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
 * Get JSON schema for the character object
 * GET /api/v1/schema
 */
exports.getSchema = (req, res) => {
  const schema = {
    type: "object",
    properties: {
      id: { 
        type: "integer",
        description: "Unique identifier for the character"
      },
      name: { 
        type: "string",
        description: "Full name of the character"
      },
      age: { 
        type: "integer", 
        minimum: 1, 
        maximum: 120,
        description: "Age in years"
      },
      gender: { 
        type: "string", 
        enum: ["male", "female", "non-binary", "other"],
        description: "Gender identity"
      },
      occupation: { 
        type: "string",
        description: "Current profession or job"
      },
      background: { 
        type: "string",
        description: "Brief background story"
      },
      appearance: {
        type: "object",
        properties: {
          hair_color: { type: "string" },
          eye_color: { type: "string" },
          height_cm: { 
            type: "integer",
            description: "Height in centimeters"
          },
          build: { type: "string" }
        },
        required: ["hair_color", "eye_color", "height_cm", "build"]
      },
      personality_traits: { 
        type: "array", 
        items: { type: "string" },
        description: "List of personality characteristics"
      },
      hobbies: { 
        type: "array", 
        items: { type: "string" },
        description: "List of hobbies and interests"
      },
      seed: {
        type: "string",
        nullable: true,
        description: "Seed value for deterministic generation"
      },
      created_at: {
        type: "string",
        format: "date-time",
        description: "Timestamp of character creation"
      }
    },
    required: ["name", "age", "gender", "appearance", "personality_traits", "hobbies"]
  };
  
  res.json({
    success: true,
    data: schema
  });
};

/**
 * Get API statistics
 * GET /api/v1/stats
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