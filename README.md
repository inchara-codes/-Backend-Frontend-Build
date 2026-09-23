# Product Catalogue

A full-stack product catalogue application built with React, Express, PostgreSQL, Neon, and Cloudinary.

## Live Demo

- Frontend: https://frontend-build-nmjc.onrender.com
- Backend API: https://product-catalogue-api-aiqj.onrender.com
- API health check: https://product-catalogue-api-aiqj.onrender.com/health

> The free Render backend may take up to a minute to respond after inactivity.

## Features

- Email and password login
- JWT authentication for protected product routes
- Automatic sign-out when a session expires
- Product list with pagination
- Product search by name
- Minimum and maximum price filters
- Product detail page
- Create a product with image upload
- Cloudinary image storage
- Loading skeletons, empty states, and error states
- Broken-image fallback
- Responsive desktop and mobile layout
- API integration tests

## Tech Stack

### Frontend

- React
- Vite
- CSS
- Render Static Site

### Backend

- Node.js
- Express
- PostgreSQL
- Neon Serverless Postgres
- Cloudinary
- Multer
- JSON Web Tokens (`jsonwebtoken`)
- `bcrypt`
- Faker
- `node-pg-migrate`
- Supertest
- Render Web Service

## Prerequisites

Install these before running the project locally:

- Node.js
- npm
- PostgreSQL, or a Neon PostgreSQL database
- A Cloudinary account for image uploads

## Installation

Clone the repository and enter the project folder:

```bash
git clone https://github.com/inchara-codes/-Backend-Frontend-Build.git
cd -Backend-Frontend-Build
```

Install dependencies:

```bash
npm install
```

## Environment Variables

Create a `.env` file in the project root. Never commit this file.

```env
# Backend
PORT=3000
CLIENT_ORIGIN=http://localhost:5173
JWT_SECRET=replace_with_a_long_random_secret

# Use either DATABASE_URL for Neon/cloud PostgreSQL,
# or the individual DB values below for local PostgreSQL.
DATABASE_URL=postgresql://YOUR_DATABASE_CONNECTION_STRING

# Local PostgreSQL connection
DB_HOST=localhost
DB_PORT=5432
DB_USER=YOUR_POSTGRES_USERNAME
DB_PASSWORD=YOUR_POSTGRES_PASSWORD
DB_NAME=my_application_db

# Frontend API URL
VITE_API_URL=http://localhost:3000

# Cloudinary image storage
CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret
```

## Database Setup

For local PostgreSQL, create the database:

```sql
CREATE DATABASE my_application_db;
```

Run the migrations:

```bash
npm run migrate
```

Seed sample users and products:

```bash
npm run seed
```

The seed script creates 25 users and 30 products.

## Run Locally

Start the Express backend:

```bash
npm run dev
```

The backend runs on:

```text
http://localhost:3000
```

Open a second terminal in the same project folder and start the React frontend:

```bash
npx vite
```

Open the Vite URL shown in the terminal, usually:

```text
http://localhost:5173
```

## Demo Login

```text
Email: test@example.com
Password: password123
```

## API Endpoints

All `/products` endpoints require a JWT bearer token unless stated otherwise.

| Method | Endpoint | Description |
| --- | --- | --- |
| POST | `/auth/login` | Log in and receive a JWT |
| GET | `/products?page=1&limit=8` | Get paginated products |
| GET | `/products?search=chair` | Search products by name |
| GET | `/products?minPrice=100&maxPrice=500` | Filter products by price |
| GET | `/products/:id` | Get one product by ID |
| POST | `/products` | Create a product with an uploaded image |
| GET | `/health` | Check API health |
| GET | `/test-db` | Verify database connectivity |

## Example Protected Request

```http
Authorization: Bearer YOUR_JWT_TOKEN
```

## Available Scripts

| Command | Description |
| --- | --- |
| `npm run dev` | Start the backend with Nodemon |
| `npm run start` | Start the backend normally |
| `npm run build` | Create a production frontend build |
| `npm test` | Run API integration tests |
| `npm run migrate` | Run database migrations |
| `npm run migrate:down` | Undo the latest migration |
| `npm run seed` | Seed sample users and products |

## Tests

Run the API test suite:

```bash
npm test
```

The tests cover authentication, protected routes, pagination, invalid product IDs, invalid price ranges, and required image validation.

## Deployment

### Backend

The Express API is deployed as a Render Web Service.

Required Render environment variables:

```text
DATABASE_URL
JWT_SECRET
CLIENT_ORIGIN
NODE_ENV=production
CLOUDINARY_CLOUD_NAME
CLOUDINARY_API_KEY
CLOUDINARY_API_SECRET
```

### Frontend

The React application is deployed as a Render Static Site.

Required frontend environment variable:

```text
VITE_API_URL=https://product-catalogue-api-aiqj.onrender.com
```

The frontend must be rebuilt and redeployed after changing `VITE_API_URL`.

## Project Structure

```text
Backend/
├── config/
│   └── cloudinary.js          Cloudinary configuration
├── middleware/
│   ├── authMiddleware.js      JWT authentication middleware
│   └── upload.js              Multer upload configuration
├── migrations/                PostgreSQL migration files
├── routes/
│   ├── auth.js                Login route
│   └── products.js            Product API routes
├── scripts/
│   └── seed.js                Sample data seed script
├── src/
│   ├── App.jsx                React application
│   ├── App.css                Component styling
│   ├── index.css              Global styling
│   ├── main.jsx               React entry point
│   ├── db.js                  PostgreSQL connection
│   └── server.js              Express server
├── test/
│   └── api.test.js            API integration tests
├── .env.example               Environment-variable template
├── package.json
└── README.md
```

## Future Improvements

- User registration
- Edit and delete product functionality
- Product categories and sorting
- Admin roles and permissions
- Password reset flow
- More API and frontend tests
- CI/CD workflow with GitHub Actions