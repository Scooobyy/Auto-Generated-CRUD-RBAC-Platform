import React, { useState, useEffect } from 'react';
import { modelsAPI } from '../../services/api';

const ModelBuilder = () => {
  const [models, setModels] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Model form state
  const [modelForm, setModelForm] = useState({
    name: '',
    ownerField: '',
    rbac: {
      Admin: ['create', 'read', 'update', 'delete'],
      Manager: ['create', 'read', 'update'],
      Viewer: ['read']
    }
  });

  const [fields, setFields] = useState([
    { name: '', type: 'string', required: false, default: '', unique: false }
  ]);

  const [fieldErrors, setFieldErrors] = useState({});

  useEffect(() => {
    loadModels();
  }, []);

  const loadModels = async () => {
    try {
      const response = await modelsAPI.getAll();
      setModels(response.data.models);
    } catch (err) {
      setError('Failed to load models');
    }
  };

  // Validate field name
  const validateFieldName = (name, index) => {
    const errors = {};
    
    if (!name.trim()) {
      errors[index] = 'Field name is required';
      return errors;
    }

    // Check for valid field name (alphanumeric + underscore)
    if (!/^[a-zA-Z_][a-zA-Z0-9_]*$/.test(name)) {
      errors[index] = 'Field name must start with a letter or underscore and contain only letters, numbers, and underscores';
      return errors;
    }

    // Check for duplicates
    const duplicateIndex = fields.findIndex((field, i) => 
      i !== index && field.name.toLowerCase() === name.toLowerCase()
    );
    
    if (duplicateIndex !== -1) {
      errors[index] = `Field name must be unique. "${name}" already exists at field ${duplicateIndex + 1}`;
    }

    // Reserved words check
    const reservedWords = ['id', 'created_at', 'updated_at', 'user', 'password', 'token'];
    if (reservedWords.includes(name.toLowerCase())) {
      errors[index] = `"${name}" is a reserved word. Please choose a different name.`;
    }

    return errors;
  };

  const addField = () => {
    setFields([...fields, { name: '', type: 'string', required: false, default: '', unique: false }]);
  };

  const removeField = (index) => {
    if (fields.length > 1) {
      setFields(fields.filter((_, i) => i !== index));
      // Remove error for deleted field
      const newErrors = { ...fieldErrors };
      delete newErrors[index];
      setFieldErrors(newErrors);
    }
  };

  const updateField = (index, field) => {
    const newFields = [...fields];
    newFields[index] = field;
    setFields(newFields);

    // Validate on change
    if (field.name) {
      const errors = validateFieldName(field.name, index);
      setFieldErrors(prev => ({ ...prev, [index]: errors[index] }));
    } else {
      // Clear error if field is empty
      const newErrors = { ...fieldErrors };
      delete newErrors[index];
      setFieldErrors(newErrors);
    }
  };

  const validateModel = () => {
    const errors = {};

    // Validate model name
    if (!modelForm.name.trim()) {
      errors.modelName = 'Model name is required';
    } else if (!/^[A-Z][a-zA-Z0-9]*$/.test(modelForm.name)) {
      errors.modelName = 'Model name must start with a capital letter and contain only letters and numbers';
    }

    // Validate all fields
    fields.forEach((field, index) => {
      const fieldErrors = validateFieldName(field.name, index);
      if (fieldErrors[index]) {
        errors[`field_${index}`] = fieldErrors[index];
      }
    });

    // Check for duplicate model names
    const existingModelNames = models.map(m => m.name.toLowerCase());
    if (existingModelNames.includes(modelForm.name.toLowerCase())) {
      errors.modelName = `A model named "${modelForm.name}" already exists`;
    }

    return errors;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    // Validate everything
    const errors = validateModel();
    if (Object.keys(errors).length > 0) {
      setFieldErrors(errors);
      setError('Please fix the validation errors below');
      return;
    }

    setLoading(true);

    try {
      const modelData = {
        name: modelForm.name,
        fields: fields.map(field => ({
          ...field,
          required: field.required || false,
          unique: field.unique || false
        })),
        ownerField: modelForm.ownerField || null,
        rbac: modelForm.rbac
      };

      await modelsAPI.create(modelData);
      setSuccess(`Model "${modelForm.name}" created successfully! APIs are now available at /api/data/${modelForm.name}`);
      
      // Reset form
      setModelForm({
        name: '',
        ownerField: '',
        rbac: {
          Admin: ['create', 'read', 'update', 'delete'],
          Manager: ['create', 'read', 'update'],
          Viewer: ['read']
        }
      });
      setFields([{ name: '', type: 'string', required: false, default: '', unique: false }]);
      setFieldErrors({});
      
      loadModels(); // Refresh the list
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to create model');
    } finally {
      setLoading(false);
    }
  };

  const fieldTypes = [
    { value: 'string', label: 'Text' },
    { value: 'text', label: 'Long Text' },
    { value: 'number', label: 'Number' },
    { value: 'integer', label: 'Integer' },
    { value: 'boolean', label: 'True/False' },
    { value: 'date', label: 'Date' },
    { value: 'json', label: 'JSON' }
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-2xl font-bold leading-7 text-gray-900 sm:text-3xl sm:truncate">
          Model Builder
        </h2>
        <p className="mt-1 text-sm text-gray-500">
          Create custom data models with fields and permissions. Each model automatically gets REST APIs.
        </p>
      </div>

      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
          {error}
        </div>
      )}

      {success && (
        <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded">
          {success}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Model Form */}
        <div className="lg:col-span-2">
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="bg-white shadow sm:rounded-lg">
              <div className="px-4 py-5 sm:p-6">
                <h3 className="text-lg leading-6 font-medium text-gray-900 mb-4">
                  Model Information
                </h3>
                
                <div className="grid grid-cols-1 gap-4">
                  <div>
                    <label htmlFor="name" className="block text-sm font-medium text-gray-700">
                      Model Name *
                    </label>
                    <input
                      type="text"
                      id="name"
                      required
                      className={`mt-1 block w-full border rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm ${
                        fieldErrors.modelName ? 'border-red-300' : 'border-gray-300'
                      }`}
                      placeholder="e.g., Product, Employee, Order"
                      value={modelForm.name}
                      onChange={(e) => setModelForm({ ...modelForm, name: e.target.value })}
                    />
                    {fieldErrors.modelName && (
                      <p className="mt-1 text-sm text-red-600">{fieldErrors.modelName}</p>
                    )}
                    <p className="mt-1 text-sm text-gray-500">
                      Use PascalCase (e.g., ProductCategory). This will create table "productcategories"
                    </p>
                  </div>

                  <div>
                    <label htmlFor="ownerField" className="block text-sm font-medium text-gray-700">
                      Owner Field (optional)
                    </label>
                    <input
                      type="text"
                      id="ownerField"
                      className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                      placeholder="e.g., ownerId, createdBy"
                      value={modelForm.ownerField}
                      onChange={(e) => setModelForm({ ...modelForm, ownerField: e.target.value })}
                    />
                    <p className="mt-1 text-sm text-gray-500">
                      Field name for ownership-based permissions. Users will only see their own records.
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Fields Section */}
            <div className="bg-white shadow sm:rounded-lg">
              <div className="px-4 py-5 sm:p-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg leading-6 font-medium text-gray-900">
                    Fields
                  </h3>
                  <button
                    type="button"
                    onClick={addField}
                    className="inline-flex items-center px-3 py-1 border border-transparent text-sm font-medium rounded text-blue-700 bg-blue-100 hover:bg-blue-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                  >
                    + Add Field
                  </button>
                </div>

                <div className="space-y-4">
                  {fields.map((field, index) => (
                    <div key={index} className="border border-gray-200 rounded-lg p-4">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-3">
                        <div>
                          <label className="block text-sm font-medium text-gray-700">
                            Field Name *
                          </label>
                          <input
                            type="text"
                            required
                            className={`mt-1 block w-full border rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm ${
                              fieldErrors[index] ? 'border-red-300' : 'border-gray-300'
                            }`}
                            placeholder="e.g., title, price, isActive"
                            value={field.name}
                            onChange={(e) => updateField(index, { ...field, name: e.target.value })}
                          />
                          {fieldErrors[index] && (
                            <p className="mt-1 text-sm text-red-600">{fieldErrors[index]}</p>
                          )}
                          <p className="mt-1 text-xs text-gray-500">
                            Use camelCase (e.g., firstName, isActive)
                          </p>
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-gray-700">
                            Type *
                          </label>
                          <select
                            className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                            value={field.type}
                            onChange={(e) => updateField(index, { ...field, type: e.target.value })}
                          >
                            {fieldTypes.map(type => (
                              <option key={type.value} value={type.value}>
                                {type.label}
                              </option>
                            ))}
                          </select>
                        </div>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-3">
                        <div className="flex items-center">
                          <input
                            type="checkbox"
                            id={`required-${index}`}
                            className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                            checked={field.required}
                            onChange={(e) => updateField(index, { ...field, required: e.target.checked })}
                          />
                          <label htmlFor={`required-${index}`} className="ml-2 block text-sm text-gray-700">
                            Required
                          </label>
                        </div>

                        <div className="flex items-center">
                          <input
                            type="checkbox"
                            id={`unique-${index}`}
                            className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                            checked={field.unique}
                            onChange={(e) => updateField(index, { ...field, unique: e.target.checked })}
                          />
                          <label htmlFor={`unique-${index}`} className="ml-2 block text-sm text-gray-700">
                            Unique
                          </label>
                        </div>

                        {fields.length > 1 && (
                          <div>
                            <button
                              type="button"
                              onClick={() => removeField(index)}
                              className="text-red-600 hover:text-red-800 text-sm font-medium"
                            >
                              Remove Field
                            </button>
                          </div>
                        )}
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700">
                          Default Value (optional)
                        </label>
                        <input
                          type="text"
                          className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                          placeholder="Default value for this field"
                          value={field.default}
                          onChange={(e) => updateField(index, { ...field, default: e.target.value })}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Submit Button */}
            <div className="flex justify-end">
              <button
                type="submit"
                disabled={loading}
                className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
              >
                {loading ? (
                  <>
                    <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Creating Model...
                  </>
                ) : (
                  'Create Model'
                )}
              </button>
            </div>
          </form>
        </div>

        {/* Models List & Info */}
        <div className="lg:col-span-1 space-y-6">
          <div className="bg-white shadow sm:rounded-lg">
            <div className="px-4 py-5 sm:p-6">
              <h3 className="text-lg leading-6 font-medium text-gray-900 mb-4">
                Existing Models
              </h3>
              
              {models.length === 0 ? (
                <p className="text-gray-500 text-sm">No models created yet</p>
              ) : (
                <ul className="space-y-3">
                  {models.map((model) => (
                    <li key={model.id} className="border border-gray-200 rounded-lg p-3">
                      <div className="flex items-center justify-between">
                        <div>
                          <h4 className="text-sm font-medium text-gray-900">{model.name}</h4>
                          <p className="text-xs text-gray-500">
                            {model.definition?.fields?.length || 0} fields
                          </p>
                        </div>
                        <div className="text-xs text-gray-400">
                          {model.table_name}
                        </div>
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>

          {/* API Information */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <h4 className="text-sm font-medium text-blue-800 mb-2">Auto-Generated APIs</h4>
            <p className="text-xs text-blue-700">
              Each model automatically gets REST APIs:
            </p>
            <ul className="text-xs text-blue-600 mt-1 space-y-1">
              <li>• GET /api/data/ModelName</li>
              <li>• POST /api/data/ModelName</li>
              <li>• GET /api/data/ModelName/:id</li>
              <li>• PUT /api/data/ModelName/:id</li>
              <li>• DELETE /api/data/ModelName/:id</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ModelBuilder;