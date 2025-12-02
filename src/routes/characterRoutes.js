const express = require('express');
const router = express.Router();
const characterController = require('../controllers/characterController');

/**
 * @route   GET /api/v1/character/random
 * @desc    Generate a completely random character
 * @access  Public
 */
router.get('/character/random', characterController.generateRandom);

/**
 * @route   GET /api/v1/character/:seed
 * @desc    Generate or retrieve a character with a specific seed
 * @access  Public
 */
router.get('/character/:seed', characterController.generateWithSeed);

/**
 * @route   GET /api/v1/character
 * @desc    Generate a character with optional parameters
 * @query   gender, age, occupation, hair_color, eye_color, height_cm, build, fields, count
 * @access  Public
 * @example /api/v1/character?gender=male&age=30
 * @example /api/v1/character?fields=name,age,gender
 * @example /api/v1/character?count=5
 */
router.get('/character', characterController.generateCustom);

/**
 * @route   GET /api/v1/traits
 * @desc    Get all available traits and options
 * @access  Public
 */
router.get('/traits', characterController.getTraits);

/**
 * @route   GET /api/v1/schema
 * @desc    Get JSON schema for character object
 * @access  Public
 */
router.get('/schema', characterController.getSchema);

/**
 * @route   GET /api/v1/stats
 * @desc    Get API usage statistics
 * @access  Public
 */
router.get('/stats', characterController.getStats);

module.exports = router;