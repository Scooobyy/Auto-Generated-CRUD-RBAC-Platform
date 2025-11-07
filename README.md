Auto-Generated-CRUD-RBAC-Platform

 A powerful low-code platform that allows users to define data models through a web UI and automatically generates complete CRUD APIs, admin interfaces, and RBAC security.

 Features

 Visual Model Builder** - Create data models with custom fields through a web interface
 Auto-Generated REST APIs** - Complete CRUD endpoints created automatically for each model
 RBAC Security** - Role-based access control with configurable permissions
 Dynamic Admin UI** - Automatic data management interfaces for all models
 File Persistence** - Model definitions saved as JSON files for version control
 PostgreSQL Integration** - Automatic database table creation and management
 Modern React UI** - Beautiful, responsive interface built with Vite + Tailwind CSS
 
Tech Stack

Backend
Node.js + Express.js - Server runtime
PostgreSQL - Database
JWT - Authentication
Dynamic Route Generation** - Auto-create REST endpoints
 
Frontend  
React 18 - UI framework
Vite - Build tool & dev server
Tailwind CSS*- Styling
React Router- Navigation
Axios - API client
Quick Start

 Prerequisites
- Node.js 18+
- PostgreSQL 12+

### Installation

1. Clone the repository
   https://github.com/Scooobyy/Auto-Generated-CRUD-RBAC-Platform.git
  
Setup Backend

bash
cd backend
npm install

# Configure environment
cp .env.example .env
# Edit .env with your database credentials
Setup Database

bash
# Create database and tables
npm run setup-db
Setup Frontend

bash
cd ../frontend
npm install
Run the Application

bash
# Terminal 1 - Backend
cd backend
npm run dev

# Terminal 2 - Frontend  
cd frontend
npm run dev
Access the Platform

Frontend: http://localhost:5173

Backend API: http://localhost:5000

Default Admin Account
Email: admin@example.com
Password: admin123
