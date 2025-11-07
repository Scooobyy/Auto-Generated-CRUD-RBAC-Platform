const express = require('express');
const { authenticate, authorize } = require('../middleware/auth');
const modelGenerator = require('../utils/modelGenerator');

const router = express.Router();

// All model routes require authentication
router.use(authenticate);

// Get all models
router.get('/', async (req, res) => {
  try {
    const models = await modelGenerator.getAllModels();
    
    // Parse JSON definitions
    const parsedModels = models.map(model => ({
      ...model,
      definition: typeof model.definition === 'string' 
        ? JSON.parse(model.definition) 
        : model.definition
    }));

    res.json({ 
      success: true,
      models: parsedModels 
    });
  } catch (error) {
    console.error('Get models error:', error);
    res.status(500).json({ 
      success: false,
      error: 'Failed to fetch models' 
    });
  }
});

// Create new model
router.post('/', authorize(['Admin', 'Manager']), async (req, res) => {
  try {
    const { name, fields, ownerField, rbac } = req.body;
    const userId = req.user.id;

    console.log('Creating model:', { name, fields, ownerField, rbac });

    // Validate input
    if (!name || !fields || !Array.isArray(fields)) {
      return res.status(400).json({ 
        success: false,
        error: 'Model name and fields array are required' 
      });
    }

    // Validate fields
    for (const field of fields) {
      if (!field.name || !field.type) {
        return res.status(400).json({
          success: false,
          error: 'Each field must have a name and type'
        });
      }
    }

    // Check if model already exists
    const existingModel = await modelGenerator.getModelByName(name);
    if (existingModel) {
      return res.status(400).json({ 
        success: false,
        error: 'Model with this name already exists' 
      });
    }

    // Create model definition
    const modelDefinition = {
      name,
      fields,
      ownerField: ownerField || null,
      rbac: rbac || {
        'Admin': ['create', 'read', 'update', 'delete'],
        'Manager': ['create', 'read', 'update'],
        'Viewer': ['read']
      }
    };

    // Create database table
    const tableName = await modelGenerator.createModelTable(modelDefinition);
    console.log('Table created:', tableName);
    
    // Save to database
    const savedModel = await modelGenerator.saveModelDefinition(modelDefinition, userId);
    console.log('Model saved to database');
    
    // Save to file
    const filePath = await modelGenerator.saveModelToFile(modelDefinition);
    console.log('Model saved to file:', filePath);

    // ✅ FIXED: Register dynamic routes for this model (MOVED INSIDE THE FUNCTION)
    const dynamicRoutes = require('../utils/dynamicRoutes');
    dynamicRoutes.generateCRUDRoutes({
      name: savedModel.name,
      tableName: tableName,
      definition: modelDefinition
    });

    res.status(201).json({
      success: true,
      message: 'Model created successfully',
      model: {
        ...savedModel,
        definition: typeof savedModel.definition === 'string' 
          ? JSON.parse(savedModel.definition) 
          : savedModel.definition
      },
      tableName,
      filePath
    });

  } catch (error) {
    console.error('Create model error:', error);
    res.status(500).json({ 
      success: false,
      error: 'Failed to create model: ' + error.message 
    });
  }
});

// Get model by name
router.get('/:name', async (req, res) => {
  try {
    const { name } = req.params;
    const model = await modelGenerator.getModelByName(name);
    
    if (!model) {
      return res.status(404).json({ 
        success: false,
        error: 'Model not found' 
      });
    }

    res.json({
      success: true,
      model: {
        ...model,
        definition: typeof model.definition === 'string' 
          ? JSON.parse(model.definition) 
          : model.definition
      }
    });
  } catch (error) {
    console.error('Get model error:', error);
    res.status(500).json({ 
      success: false,
      error: 'Failed to fetch model' 
    });
  }
});

// Delete model
router.delete('/:name', authorize(['Admin']), async (req, res) => {
  try {
    const { name } = req.params;
    
    const model = await modelGenerator.getModelByName(name);
    if (!model) {
      return res.status(404).json({
        success: false,
        error: 'Model not found'
      });
    }

    await modelGenerator.deleteModel(name);

    res.json({
      success: true,
      message: 'Model deleted successfully'
    });
  } catch (error) {
    console.error('Delete model error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to delete model: ' + error.message
    });
  }
});

module.exports = router;