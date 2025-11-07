const { query, pool } = require('../config/database');
const fs = require('fs').promises;
const path = require('path');

class ModelGenerator {
  constructor() {
    this.modelsDir = path.join(__dirname, '../../models');
    this.ensureModelsDir();
  }

  async ensureModelsDir() {
    try {
      await fs.access(this.modelsDir);
    } catch (error) {
      await fs.mkdir(this.modelsDir, { recursive: true });
    }
  }

  // Generate table name from model name
  generateTableName(modelName) {
    return modelName.toLowerCase() + 's'; // e.g., Product -> products
  }

  // Convert field type to PostgreSQL type
  getPostgresType(field) {
    const typeMap = {
      'string': 'VARCHAR(255)',
      'text': 'TEXT',
      'number': 'DECIMAL(10,2)',
      'integer': 'INTEGER',
      'boolean': 'BOOLEAN',
      'date': 'TIMESTAMP',
      'json': 'JSONB'
    };
    return typeMap[field.type] || 'VARCHAR(255)';
  }

  // Create dynamic table for a model
  async createModelTable(modelDefinition) {
    const { name, fields, ownerField } = modelDefinition;
    const tableName = this.generateTableName(name);
    
    let sql = `CREATE TABLE IF NOT EXISTS ${tableName} (
      id SERIAL PRIMARY KEY,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    `;

    // Add fields
    for (const field of fields) {
      const pgType = this.getPostgresType(field);
      // Quote field names to handle reserved keywords and special characters
      const quotedFieldName = `"${field.name}"`;
      let fieldSql = `, ${quotedFieldName} ${pgType}`;
      
      if (field.required) {
        fieldSql += ' NOT NULL';
      }
      if (field.default !== undefined && field.default !== '') {
        fieldSql += ` DEFAULT ${this.formatDefaultValue(field.default, field.type)}`;
      }
      if (field.unique) {
        fieldSql += ' UNIQUE';
      }
      
      sql += fieldSql;
    }

    // Add owner field if specified
    if (ownerField) {
      sql += `, "${ownerField}" INTEGER REFERENCES users(id)`;
    }

    sql += ')';

    await query(sql);
    return tableName;
  }

  formatDefaultValue(value, type) {
    if (type === 'string' || type === 'text') {
      return `'${value}'`;
    }
    if (type === 'boolean') {
      return value ? 'TRUE' : 'FALSE';
    }
    return value;
  }

  // Save model definition to file
  async saveModelToFile(modelDefinition) {
    const fileName = `${modelDefinition.name}.json`;
    const filePath = path.join(this.modelsDir, fileName);
    
    const modelData = {
      ...modelDefinition,
      tableName: this.generateTableName(modelDefinition.name),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    await fs.writeFile(filePath, JSON.stringify(modelData, null, 2));
    return filePath;
  }

  // Save model definition to database
  async saveModelDefinition(modelDefinition, userId) {
    const { name } = modelDefinition;
    const tableName = this.generateTableName(name);
    
    const result = await query(
      `INSERT INTO model_definitions (name, table_name, definition, created_by) 
       VALUES ($1, $2, $3, $4) 
       RETURNING id, name, table_name, definition, created_at`,
      [name, tableName, JSON.stringify(modelDefinition), userId]
    );

    return result.rows[0];
  }

  // Get all model definitions
  async getAllModels() {
    const result = await query(`
      SELECT md.*, u.username as created_by_username 
      FROM model_definitions md 
      LEFT JOIN users u ON md.created_by = u.id 
      ORDER BY md.created_at DESC
    `);
    return result.rows;
  }

  // Get model by name
  async getModelByName(name) {
    const result = await query(
      'SELECT * FROM model_definitions WHERE name = $1',
      [name]
    );
    return result.rows[0];
  }

  // Delete model
  async deleteModel(name) {
    const tableName = this.generateTableName(name);
    
    // Drop the table
    await query(`DROP TABLE IF EXISTS ${tableName}`);
    
    // Remove from database
    await query('DELETE FROM model_definitions WHERE name = $1', [name]);
    
    // Remove file
    const filePath = path.join(this.modelsDir, `${name}.json`);
    try {
      await fs.unlink(filePath);
    } catch (error) {
      // File might not exist, that's ok
    }
  }
}

module.exports = new ModelGenerator();