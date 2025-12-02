# Fictional Profile Generation API

A RESTful API that generates detailed fictional character profiles with customizable attributes. Built with Node.js, Express, and MySQL.

## Features

- 🎲 Generate random fictional characters
- 🔐 Deterministic generation using seeds
- ⚙️ Customizable character attributes
- 📊 Field filtering for optimized responses
- 🔢 Bulk character generation
- 💾 MySQL database storage
- 📖 Comprehensive API documentation

## Prerequisites

- Node.js (v14 or higher)
- MySQL (v5.7 or higher)
- npm or yarn

## Installation

### 1. Clone or create the project

```bash
mkdir fictional-profile-api
cd fictional-profile-api
```

### 2. Install dependencies

```bash
npm install express mysql2 dotenv cors
npm install --save-dev nodemon
```

### 3. Configure environment

Create a `.env` file in the root directory:

```env
PORT=3000
NODE_ENV=development

DB_HOST=localhost
DB_PORT=3306
DB_USER=root
DB_PASSWORD=your_mysql_password
DB_NAME=fictional_profiles

API_VERSION=v1
MAX_CHARACTERS_PER_REQUEST=100
```

### 4. Set up MySQL database

Make sure MySQL is running, then execute:

```bash
npm run setup-db
```

### 5. Seed reference data

```bash
npm run seed-data
```

### 6. Start the server

```bash
# Development mode with auto-reload
npm run dev

# Production mode
npm start
```

The API will be available at `http://localhost:3000`

## API Endpoints

### 1. Generate Random Character

```http
GET /api/v1/character/random
```

**Response:**
```json
{
  "success": true,
  "data": {
    "id": 1,
    "name": "Alex Morgan",
    "age": 28,
    "gender": "male",
    "occupation": "Software Developer",
    "background": "Grew up in a small coastal town...",
    "appearance": {
      "hair_color": "brown",
      "eye_color": "green",
      "height_cm": 178,
      "build": "athletic"
    },
    "personality_traits": ["curious", "reserved", "analytical"],
    "hobbies": ["chess", "hiking", "coding"],
    "seed": null
  }
}
```

### 2. Generate Character with Seed

```http
GET /api/v1/character/{seed}
```

**Example:**
```bash
curl http://localhost:3000/api/v1/character/myseed123
```

This endpoint generates the same character every time for a given seed value.

### 3. Generate Custom Character

```http
GET /api/v1/character?[parameters]
```

**Available Parameters:**
- `gender` - male, female, non-binary, other
- `age` - integer (1-120)
- `occupation` - string
- `hair_color` - string
- `eye_color` - string
- `height_cm` - integer
- `build` - string
- `fields` - comma-separated list of fields to return
- `count` - number of characters (1-100)

**Examples:**

Generate male character aged 30:
```bash
curl "http://localhost:3000/api/v1/character?gender=male&age=30"
```

Return only specific fields:
```bash
curl "http://localhost:3000/api/v1/character?fields=name,age,occupation"
```

Generate 10 characters:
```bash
curl "http://localhost:3000/api/v1/character?count=10"
```

### 4. Get Available Traits

```http
GET /api/v1/traits
```

Returns all available options for character generation.

### 5. Get JSON Schema

```http
GET /api/v1/schema
```

Returns the JSON schema definition for the character object.

### 6. Get Statistics

```http
GET /api/v1/stats
```

Returns API usage statistics including total characters generated.

### 7. Health Check

```http
GET /health
```

Returns API health status and database connection status.

## Database Schema

### Characters Table
- `id` - Primary key
- `name` - Character full name
- `age` - Character age
- `gender` - Character gender
- `occupation` - Character occupation
- `background` - Character background story
- `hair_color`, `eye_color`, `height_cm`, `build` - Appearance attributes
- `seed` - Optional seed for deterministic generation
- `created_at` - Timestamp

### Personality Traits Table
- Links personality traits to characters (one-to-many)

### Hobbies Table
- Links hobbies to characters (one-to-many)

### Available Traits Table
- Reference table for all available trait options

## Testing with cURL

```bash
# Random character
curl http://localhost:3000/api/v1/character/random

# Seeded character
curl http://localhost:3000/api/v1/character/12345

# Custom parameters
curl "http://localhost:3000/api/v1/character?gender=female&age=25"

# Multiple characters
curl "http://localhost:3000/api/v1/character?count=5"

# Get traits
curl http://localhost:3000/api/v1/traits

# Get schema
curl http://localhost:3000/api/v1/schema
```

## Testing with Postman

1. Import the API into Postman
2. Set base URL: `http://localhost:3000/api/v1`
3. Test each endpoint with different parameters

## Project Structure

```
fictional-profile-api/
├── src/
│   ├── config/
│   │   ├── database.js          # MySQL connection
│   │   ├── setupDatabase.js     # Database initialization
│   │   └── seedData.js          # Data seeding
│   ├── controllers/
│   │   └── characterController.js
│   ├── models/
│   │   └── Character.js
│   ├── routes/
│   │   └── characterRoutes.js
│   ├── services/
│   │   └── characterGenerator.js
│   ├── data/
│   │   ├── names.json
│   │   └── traits.json
│   └── server.js
├── .env
├── .gitignore
├── package.json
└── README.md
```

## Future Enhancements

- [ ] Add authentication/API keys
- [ ] Implement rate limiting
- [ ] Add character relationships
- [ ] Support for character images
- [ ] Export to various formats (PDF, CSV)
- [ ] Add more detailed attributes
- [ ] Implement search and filtering
- [ ] Add character history/lineage
- [ ] Support for different cultural backgrounds
- [ ] Add webhook support

## Troubleshooting

### Database Connection Issues

```bash
# Test MySQL connection
mysql -u root -p

# Check if database exists
SHOW DATABASES;

# Verify tables
USE fictional_profiles;
SHOW TABLES;
```

### Port Already in Use

Change the `PORT` in `.env` file or kill the process using the port:

```bash
# Find process
lsof -i :3000

# Kill process
kill -9 [PID]
```

## License

MIT

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.