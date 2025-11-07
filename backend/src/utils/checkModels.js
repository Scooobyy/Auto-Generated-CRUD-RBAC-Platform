const { query } = require('../config/database');

async function checkModelDefinitions() {
  try {
    console.log('🔍 Checking model definitions...');
    
    const result = await query('SELECT id, name, definition FROM model_definitions');
    
    for (const model of result.rows) {
      console.log(`\n📋 Model: ${model.name} (ID: ${model.id})`);
      
      try {
        const definition = typeof model.definition === 'string' 
          ? JSON.parse(model.definition) 
          : model.definition;
        
        console.log('✅ Definition is valid JSON');
        console.log('   Name:', definition.name);
        console.log('   Fields count:', definition.fields?.length);
        console.log('   RBAC:', definition.rbac ? 'Present' : 'Missing');
        
      } catch (error) {
        console.log('❌ Definition is INVALID JSON');
        console.log('   Raw definition:', model.definition);
        console.log('   Error:', error.message);
      }
    }
  } catch (error) {
    console.error('Error checking models:', error);
  }
}

checkModelDefinitions();