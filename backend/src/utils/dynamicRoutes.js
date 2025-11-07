const express = require('express');
const { query } = require('../config/database');
const { authenticate, authorize } = require('../middleware/auth');
const modelGenerator = require('./modelGenerator');

class DynamicRoutes {
  constructor() {
    this.router = express.Router();
    this.setupBaseRoute();
  }

  setupBaseRoute() {
    // All dynamic routes require authentication
    this.router.use(authenticate);
  }

  // Generate CRUD routes for a model
  generateCRUDRoutes(modelDefinition) {
    try {
      const { name, table_name, definition } = modelDefinition;
      
      if (!name || !table_name || !definition) {
        console.error('❌ Invalid model definition:', { name, table_name, definition });
        throw new Error('Invalid model definition');
      }
      
      // Parse definition if it's a string
      let parsedDefinition;
      if (typeof definition === 'string') {
        try {
          parsedDefinition = JSON.parse(definition);
        } catch (parseError) {
          console.error(`❌ Failed to parse definition for ${name}:`, parseError);
          throw new Error('Definition is not valid JSON');
        }
      } else {
        parsedDefinition = definition;
      }
      
      const { fields = [], ownerField, rbac = {} } = parsedDefinition;
      const tableName = table_name;
      const basePath = `/${name}`;
      
      console.log(`🔄 Generating CRUD routes for: ${name} -> /api/data${basePath}`);
      console.log(`   Table: ${tableName}, Fields: ${fields.length}`);

      // GET /api/data/:modelName - List all records
      this.router.get(basePath, this.checkPermission(rbac, 'read'), async (req, res) => {
        try {
          console.log(`📥 GET /api/data${basePath} requested by user: ${req.user.id}`);
          
          let whereClause = '';
          let queryParams = [];
          
          // If user is not Admin and there's ownerField, show only their records
          if (ownerField && req.user.role !== 'Admin') {
            whereClause = `WHERE "${ownerField}" = $1`;
            queryParams = [req.user.id];
          }

          const result = await query(
            `SELECT * FROM ${tableName} ${whereClause} ORDER BY created_at DESC`,
            queryParams
          );

          console.log(`✅ GET /api/data${basePath} returned ${result.rows.length} records`);
          
          res.json({
            success: true,
            data: result.rows,
            total: result.rows.length
          });
        } catch (error) {
          console.error(`❌ Error fetching ${name}:`, error);
          res.status(500).json({ 
            success: false, 
            error: `Failed to fetch ${name}: ${error.message}` 
          });
        }
      });

      // GET /api/data/:modelName/:id - Get single record
      this.router.get(`${basePath}/:id`, this.checkPermission(rbac, 'read'), async (req, res) => {
        try {
          const { id } = req.params;
          console.log(`📥 GET /api/data${basePath}/${id} requested`);
          
          let whereClause = 'id = $1';
          let queryParams = [id];
          
          // Add ownership check for non-Admins
          if (ownerField && req.user.role !== 'Admin') {
            whereClause += ` AND "${ownerField}" = $2`;
            queryParams.push(req.user.id);
          }

          const result = await query(
            `SELECT * FROM ${tableName} WHERE ${whereClause}`,
            queryParams
          );

          if (result.rows.length === 0) {
            return res.status(404).json({
              success: false,
              error: `${name} not found`
            });
          }

          res.json({
            success: true,
            data: result.rows[0]
          });
        } catch (error) {
          console.error(`❌ Error fetching ${name}:`, error);
          res.status(500).json({ 
            success: false, 
            error: `Failed to fetch ${name}: ${error.message}` 
          });
        }
      });

      // POST /api/data/:modelName - Create record
      this.router.post(basePath, this.checkPermission(rbac, 'create'), async (req, res) => {
        try {
          console.log(`📥 POST /api/data${basePath} requested`);
          const data = req.body;
          
          // Validate required fields
          const requiredFields = fields.filter(f => f.required);
          for (const field of requiredFields) {
            if (data[field.name] === undefined || data[field.name] === null || data[field.name] === '') {
              return res.status(400).json({
                success: false,
                error: `Field '${field.name}' is required`
              });
            }
          }

          // Prepare insert query
          const fieldNames = ['created_at', 'updated_at'];
          const fieldValues = ['CURRENT_TIMESTAMP', 'CURRENT_TIMESTAMP'];
          const queryParams = [];
          let paramCount = 0;

          // Add owner field if specified
          if (ownerField) {
            data[ownerField] = req.user.id;
          }

          // Process each field - use quoted column names for case sensitivity
          for (const field of fields) {
            if (data[field.name] !== undefined && data[field.name] !== null) {
              paramCount++;
              fieldNames.push(`"${field.name}"`); // Quote column names
              fieldValues.push(`$${paramCount}`);
              queryParams.push(data[field.name]);
            } else if (field.default !== undefined) {
              paramCount++;
              fieldNames.push(`"${field.name}"`); // Quote column names
              fieldValues.push(`$${paramCount}`);
              queryParams.push(field.default);
            }
          }

          // Add owner field to insert
          if (ownerField && data[ownerField]) {
            paramCount++;
            fieldNames.push(`"${ownerField}"`); // Quote owner field
            fieldValues.push(`$${paramCount}`);
            queryParams.push(data[ownerField]);
          }

          const insertQuery = `
            INSERT INTO ${tableName} (${fieldNames.join(', ')})
            VALUES (${fieldValues.join(', ')})
            RETURNING *
          `;

          console.log('Insert Query:', insertQuery);
          console.log('Query Params:', queryParams);

          const result = await query(insertQuery, queryParams);
          
          res.status(201).json({
            success: true,
            message: `${name} created successfully`,
            data: result.rows[0]
          });
        } catch (error) {
          console.error(`❌ Error creating ${name}:`, error);
          res.status(500).json({ 
            success: false, 
            error: `Failed to create ${name}: ${error.message}` 
          });
        }
      });

      // PUT /api/data/:modelName/:id - Update record
      this.router.put(`${basePath}/:id`, this.checkPermission(rbac, 'update'), async (req, res) => {
        try {
          const { id } = req.params;
          const data = req.body;

          // Check if record exists and user has permission
          let whereClause = 'id = $1';
          let queryParams = [id];
          
          if (ownerField && req.user.role !== 'Admin') {
            whereClause += ` AND "${ownerField}" = $2`;
            queryParams.push(req.user.id);
          }

          const checkResult = await query(
            `SELECT id FROM ${tableName} WHERE ${whereClause}`,
            queryParams
          );

          if (checkResult.rows.length === 0) {
            return res.status(404).json({
              success: false,
              error: `${name} not found or you don't have permission to update it`
            });
          }

          // Prepare update query - use quoted column names
          const updates = ['updated_at = CURRENT_TIMESTAMP'];
          const updateParams = [];
          let paramCount = 1;

          for (const field of fields) {
            if (data[field.name] !== undefined && data[field.name] !== null) {
              paramCount++;
              updates.push(`"${field.name}" = $${paramCount}`); // Quote column names
              updateParams.push(data[field.name]);
            }
          }

          const updateQuery = `
            UPDATE ${tableName} 
            SET ${updates.join(', ')}
            WHERE id = $1
            RETURNING *
          `;

          const result = await query(updateQuery, [id, ...updateParams]);
          
          res.json({
            success: true,
            message: `${name} updated successfully`,
            data: result.rows[0]
          });
        } catch (error) {
          console.error(`❌ Error updating ${name}:`, error);
          res.status(500).json({ 
            success: false, 
            error: `Failed to update ${name}: ${error.message}` 
          });
        }
      });

      // DELETE /api/data/:modelName/:id - Delete record
      this.router.delete(`${basePath}/:id`, this.checkPermission(rbac, 'delete'), async (req, res) => {
        try {
          const { id } = req.params;
          
          let whereClause = 'id = $1';
          let queryParams = [id];
          
          if (ownerField && req.user.role !== 'Admin') {
            whereClause += ` AND "${ownerField}" = $2`;
            queryParams.push(req.user.id);
          }

          const result = await query(
            `DELETE FROM ${tableName} WHERE ${whereClause} RETURNING *`,
            queryParams
          );

          if (result.rows.length === 0) {
            return res.status(404).json({
              success: false,
              error: `${name} not found or you don't have permission to delete it`
            });
          }

          res.json({
            success: true,
            message: `${name} deleted successfully`,
            data: result.rows[0]
          });
        } catch (error) {
          console.error(`❌ Error deleting ${name}:`, error);
          res.status(500).json({ 
            success: false, 
            error: `Failed to delete ${name}: ${error.message}` 
          });
        }
      });

      console.log(`✅ CRUD routes generated for: ${name}`);
    } catch (error) {
      console.error(`❌ Failed to generate routes for model:`, error);
      console.error('Model definition that failed:', modelDefinition);
    }
  }

  // Permission checking middleware
  checkPermission(rbac, action) {
    return (req, res, next) => {
      const userRole = req.user.role;
      
      // Admin has all permissions
      if (userRole === 'Admin') return next();
      
      const rolePermissions = rbac[userRole] || [];
      
      // Check if role has permission for this action
      if (rolePermissions.includes('all') || rolePermissions.includes(action)) {
        return next();
      }
      
      return res.status(403).json({
        success: false,
        error: `Access denied. You need '${action}' permission for this resource.`
      });
    };
  }

  getRouter() {
    return this.router;
  }
}

module.exports = new DynamicRoutes();