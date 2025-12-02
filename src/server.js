require('dotenv').config();
const express = require('express');
const cors = require('cors');
const { testConnection } = require('./config/database');
const characterRoutes = require('./routes/characterRoutes');

const app = express();
const PORT = process.env.PORT || 3000;
const API_VERSION = process.env.API_VERSION || 'v1';

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Request logging middleware
app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} - ${req.method} ${req.url}`);
  next();
});

// API Routes
app.use(`/api/${API_VERSION}`, characterRoutes);

// Root endpoint
app.get('/', (req, res) => {
  res.json({
    success: true,
    message: 'Fictional Profile Generation API',
    version: '1.0.0',
    api_version: API_VERSION,
    database: 'MySQL',
    documentation: {
      endpoints: {
        random: {
          url: `/api/${API_VERSION}/character/random`,
          method: 'GET',
          description: 'Generate a completely random character'
        },
        seeded: {
          url: `/api/${API_VERSION}/character/{seed}`,
          method: 'GET',
          description: 'Generate a deterministic character based on seed',
          example: `/api/${API_VERSION}/character/myseed123`
        },
        custom: {
          url: `/api/${API_VERSION}/character`,
          method: 'GET',
          description: 'Generate a character with custom parameters',
          parameters: {
            gender: 'male, female, non-binary, other',
            age: 'integer (1-120)',
            occupation: 'string',
            hair_color: 'string',
            eye_color: 'string',
            height_cm: 'integer',
            build: 'string',
            fields: 'comma-separated list of fields to return',
            count: 'number of characters to generate (max 100)'
          },
          examples: [
            `/api/${API_VERSION}/character?gender=male&age=25`,
            `/api/${API_VERSION}/character?fields=name,age,gender`,
            `/api/${API_VERSION}/character?count=10`
          ]
        },
        traits: {
          url: `/api/${API_VERSION}/traits`,
          method: 'GET',
          description: 'Get all available traits and options'
        },
        schema: {
          url: `/api/${API_VERSION}/schema`,
          method: 'GET',
          description: 'Get JSON schema for character object'
        },
        stats: {
          url: `/api/${API_VERSION}/stats`,
          method: 'GET',
          description: 'Get API usage statistics'
        }
      }
    }
  });
});

// Health check endpoint
app.get('/health', async (req, res) => {
  const dbConnected = await testConnection();
  res.json({
    success: true,
    status: 'healthy',
    database: dbConnected ? 'connected' : 'disconnected',
    timestamp: new Date().toISOString()
  });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({
    success: false,
    error: 'Endpoint not found',
    message: `The endpoint ${req.method} ${req.url} does not exist`
  });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('Error:', err.stack);
  res.status(500).json({
    success: false,
    error: 'Internal server error',
    message: process.env.NODE_ENV === 'development' ? err.message : 'Something went wrong'
  });
});

// Start server
const startServer = async () => {
  try {
    // Test database connection
    const connected = await testConnection();
    if (!connected) {
      console.error('Failed to connect to database. Please check your configuration.');
      process.exit(1);
    }

    app.listen(PORT, () => {
      console.log('='.repeat(50));
      console.log(`🚀 Fictional Profile Generation API`);
      console.log('='.repeat(50));
      console.log(`Environment: ${process.env.NODE_ENV || 'development'}`);
      console.log(`Server running on: http://localhost:${PORT}`);
      console.log(`API Base URL: http://localhost:${PORT}/api/${API_VERSION}`);
      console.log(`Database: MySQL (${process.env.DB_NAME})`);
      console.log('='.repeat(50));
      console.log('\nAvailable endpoints:');
      console.log(`  GET http://localhost:${PORT}/`);
      console.log(`  GET http://localhost:${PORT}/health`);
      console.log(`  GET http://localhost:${PORT}/api/${API_VERSION}/character/random`);
      console.log(`  GET http://localhost:${PORT}/api/${API_VERSION}/character/:seed`);
      console.log(`  GET http://localhost:${PORT}/api/${API_VERSION}/character`);
      console.log(`  GET http://localhost:${PORT}/api/${API_VERSION}/traits`);
      console.log(`  GET http://localhost:${PORT}/api/${API_VERSION}/schema`);
      console.log(`  GET http://localhost:${PORT}/api/${API_VERSION}/stats`);
      console.log('='.repeat(50));
    });
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
};

startServer();