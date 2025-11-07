import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { modelsAPI, dataAPI } from '../../services/api';

const Dashboard = () => {
  const [models, setModels] = useState([]);
  const [stats, setStats] = useState({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    try {
      const [modelsResponse] = await Promise.all([
        modelsAPI.getAll(),
      ]);
      
      setModels(modelsResponse.data.models);

      // Load record counts for each model
      const modelStats = {};
      for (const model of modelsResponse.data.models) {
        try {
          const dataResponse = await dataAPI.getAll(model.name);
          modelStats[model.name] = dataResponse.data.data.length;
        } catch (error) {
          modelStats[model.name] = 0;
        }
      }
      setStats(modelStats);
    } catch (err) {
      console.error('Error loading dashboard:', err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-600 to-purple-700 rounded-2xl p-8 text-white">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-4xl font-bold mb-2">Welcome to CRUD Platform</h1>
            <p className="text-blue-100 text-lg">
              Build, manage, and scale your data models with our low-code platform
            </p>
          </div>
          <div className="hidden md:block">
            <div className="text-6xl">🚀</div>
          </div>
        </div>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                <span className="text-2xl">📊</span>
              </div>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Total Models</p>
              <p className="text-2xl font-bold text-gray-900">{models.length}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                <span className="text-2xl">🔧</span>
              </div>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Total Fields</p>
              <p className="text-2xl font-bold text-gray-900">
                {models.reduce((total, model) => total + (model.definition?.fields?.length || 0), 0)}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
                <span className="text-2xl">🌐</span>
              </div>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">API Endpoints</p>
              <p className="text-2xl font-bold text-gray-900">{models.length * 5}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Action Cards */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Create Model Card */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-start justify-between">
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Create New Model</h3>
              <p className="text-gray-600 mb-4">
                Design your data structure with custom fields and permissions
              </p>
              <Link
                to="/models"
                className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
              >
                <span className="mr-2">🛠️</span>
                Start Building
              </Link>
            </div>
            <div className="text-4xl text-blue-100">✨</div>
          </div>
        </div>

        {/* API Documentation Card */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-start justify-between">
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">API Access</h3>
              <p className="text-gray-600 mb-4">
                Use auto-generated REST APIs to integrate with your applications
              </p>
              <div className="text-sm text-gray-500">
                <code className="bg-gray-100 px-2 py-1 rounded">GET /api/data/ModelName</code>
              </div>
            </div>
            <div className="text-4xl text-green-100">🔌</div>
          </div>
        </div>
      </div>

      {/* Models Grid */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <div className="px-6 py-5 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xl font-semibold text-gray-900">Your Data Models</h2>
              <p className="text-gray-600 mt-1">Manage and explore your created models</p>
            </div>
            <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-blue-100 text-blue-800">
              {models.length} models
            </span>
          </div>
        </div>

        {models.length === 0 ? (
          <div className="text-center py-12">
            <div className="text-gray-400 mb-4">
              <div className="text-6xl mb-4">📝</div>
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">No models yet</h3>
            <p className="text-gray-500 mb-6">Get started by creating your first data model</p>
            <Link
              to="/models"
              className="inline-flex items-center px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
            >
              <span className="mr-2">🛠️</span>
              Create Your First Model
            </Link>
          </div>
        ) : (
          <div className="divide-y divide-gray-200">
            {models.map((model) => (
              <div key={model.id} className="p-6 hover:bg-gray-50 transition-colors">
                <Link to={`/data/${model.name}`} className="block">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-4">
                      <div className="flex-shrink-0">
                        <div className="w-12 h-12 bg-gradient-to-r from-blue-500 to-purple-600 rounded-lg flex items-center justify-center">
                          <span className="text-white font-bold text-sm">
                            {model.name.charAt(0)}
                          </span>
                        </div>
                      </div>
                      <div>
                        <h3 className="text-lg font-semibold text-gray-900">{model.name}</h3>
                        <p className="text-gray-600 text-sm">
                          {model.definition?.fields?.length || 0} fields • {stats[model.name] || 0} records
                        </p>
                        <div className="flex items-center space-x-2 mt-1">
                          <span className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded">
                            {model.table_name}
                          </span>
                          <span className="text-xs text-blue-600 bg-blue-50 px-2 py-1 rounded">
                            Auto APIs
                          </span>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center space-x-4">
                      <div className="text-right">
                        <div className="text-sm text-gray-500">Created by</div>
                        <div className="text-sm font-medium text-gray-900">
                          {model.created_by_username}
                        </div>
                      </div>
                      <div className="text-gray-400">
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                        </svg>
                      </div>
                    </div>
                  </div>
                </Link>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default Dashboard;