const express = require('express');
const dynamicRoutes = require('../utils/dynamicRoutes');
const modelGenerator = require('../utils/modelGenerator');

const router = express.Router();

// Load all existing models and generate their routes
const loadExistingModels = async () => {
  try {
    const models = await modelGenerator.getAllModels();
    console.log(`📦 Loading ${models.length} existing models...`);
    
    for (const model of models) {
      try {
        // Parse definition with error handling
        let definition;
        try {
          definition = typeof model.definition === 'string' 
            ? JSON.parse(model.definition) 
            : model.definition;
        } catch (error) {
          console.warn(`⚠️  Could not parse definition for ${model.name}, using default`);
          definition = {
            fields: [],
            rbac: {
              'Admin': ['create', 'read', 'update', 'delete'],
              'Manager': ['create', 'read', 'update'],
              'Viewer': ['read']
            }
          };
        }
        
        const modelDefinition = {
          name: model.name,
          table_name: model.table_name, // Use table_name from database
          definition: definition
        };
        
        dynamicRoutes.generateCRUDRoutes(modelDefinition);
        console.log(`✅ Routes loaded for: ${model.name}`);
      } catch (modelError) {
        console.error(`❌ Failed to load routes for ${model.name}:`, modelError);
      }
    }
  } catch (error) {
    console.error('❌ Error loading existing models:', error);
  }
};

// Initialize by loading existing models
loadExistingModels();

// Use the dynamic routes
router.use('/', dynamicRoutes.getRouter());

module.exports = router;