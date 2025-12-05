const names = require('../data/names.json');
const traits = require('../data/traits.json');

class CharacterGenerator {
  constructor(seed = null) {
    this.seed = seed;
    if (seed) {
      this.rng = this.seededRandom(seed);
    } else {
      // Wrap Math.random to ensure context safety
      this.rng = () => Math.random();
    }
  }

  // --- 1. Deterministic Random Generator (Mulberry32 + FNV-1a Hash) ---
  seededRandom(seed) {
    // Hash the string seed to get a unique starting integer
    let h = 0x811c9dc5;
    const strSeed = String(seed);
    
    for (let i = 0; i < strSeed.length; i++) {
        h ^= strSeed.charCodeAt(i);
        h = Math.imul(h, 0x01000193);
    }
    
    let a = h >>> 0; // Force 32-bit unsigned integer

    // Return the Mulberry32 function
    return function() {
      a += 0x6D2B79F5;
      let t = Math.imul(a ^ (a >>> 15), 1 | a);
      t = t + Math.imul(t ^ (t >>> 7), 61 | t) ^ t;
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    }
  }

  randomChoice(array) {
    if (!array || array.length === 0) return null;
    return array[Math.floor(this.rng() * array.length)];
  }

  randomInt(min, max) {
    return Math.floor(this.rng() * (max - min + 1)) + min;
  }

  randomSample(array, count) {
    if (!array || array.length === 0) return [];
    const shuffled = [...array].sort(() => this.rng() - 0.5);
    return shuffled.slice(0, Math.min(count, array.length));
  }

  generate(options = {}) {
    // Determine gender
    let gender = options.gender;
    if (!gender || !['male', 'female', 'non-binary', 'other'].includes(gender)) {
      gender = this.randomChoice(['male', 'female', 'non-binary', 'other']);
    }
    
    // --- 2. Name Logic (Prioritizes user input) ---
    let fullName;

    if (options.name) {
      // Use the name provided in the API request
      fullName = options.name;
    } else {
      // Generate a random name
      let firstName;
      if (gender === 'male') {
        firstName = this.randomChoice(names.male);
      } else if (gender === 'female') {
        firstName = this.randomChoice(names.female);
      } else {
        firstName = this.randomChoice([...names.male, ...names.female]);
      }
      
      const lastName = this.randomChoice(names.surnames);
      fullName = `${firstName} ${lastName}`;
    }

    // Generate age
    const age = options.age 
      ? parseInt(options.age) 
      : this.randomInt(18, 65);

    // Generate character object
    const character = {
      name: fullName,
      age: age,
      gender: gender,
      occupation: options.occupation || this.randomChoice(traits.occupations),
      background: this.generateBackground(fullName, age, gender),
      appearance: {
        hair_color: options.hair_color || this.randomChoice(traits.hair_colors),
        eye_color: options.eye_color || this.randomChoice(traits.eye_colors),
        height_cm: options.height_cm 
          ? parseInt(options.height_cm)
          : this.randomInt(150, 200),
        build: options.build || this.randomChoice(traits.builds)
      },
      personality_traits: this.randomSample(traits.personality_traits, 3),
      hobbies: this.randomSample(traits.hobbies, this.randomInt(2, 4)),
      seed: this.seed
    };

    return character;
  }

  generateBackground(name, age, gender) {
    const backgrounds = [
      `Grew up in a small coastal town, ${name} learned early on to be self-reliant and resourceful.`,
      `Raised in a bustling metropolitan area, ${name} was always surrounded by diverse cultures and perspectives.`,
      `Coming from a family of artists, creativity has always been a central part of ${name}'s life.`,
      `With a military background, ${name} developed strong discipline and a structured approach to life.`,
      `${name} spent childhood years in university libraries, fostering a deep love for learning and knowledge.`,
      `Growing up on a farm, ${name} learned the value of hard work and connection to nature.`,
      `As a first-generation immigrant, ${name} brings a unique perspective shaped by multiple cultures.`,
      `${name} was raised by a single parent who instilled values of perseverance and independence.`,
      `Moving frequently as a child, ${name} became adaptable and skilled at making new friends.`,
      `${name} grew up in a tight-knit community where everyone looked out for one another.`
    ];
    
    return this.randomChoice(backgrounds);
  }

  generateMultiple(count, options = {}) {
    const characters = [];
    for (let i = 0; i < count; i++) {
      // Create sub-seed to ensure every character is unique but deterministic
      const subSeed = this.seed ? `${this.seed}_${i}` : null;
      const gen = new CharacterGenerator(subSeed);
      characters.push(gen.generate(options));
    }
    return characters;
  }

  // --- 3. Filter Fields Helper ---
  filterFields(data, fields) {
    if (!fields || fields.length === 0) {
      return data;
    }

    // Handle Array (for generateMultiple)
    if (Array.isArray(data)) {
      return data.map(item => this.filterFields(item, fields));
    }

    // Handle Single Object
    const filtered = {};
    fields.forEach(field => {
      // 1. Check top-level fields (e.g., name, gender, id)
      if (data.hasOwnProperty(field)) {
        filtered[field] = data[field];
      }
      // 2. Check nested appearance fields specifically (optional helper)
      else if (['hair_color', 'eye_color', 'height_cm', 'build'].includes(field)) {
        if (!filtered.appearance) filtered.appearance = {};
        if (data.appearance) {
          filtered.appearance[field] = data.appearance[field];
        }
      }
    });
    
    return filtered;
  }
}

module.exports = CharacterGenerator;