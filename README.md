# Product Catalogue

A full-stack product catalogue and ordering application built with React, Express, PostgreSQL, Neon, Cloudinary, and Render.

## Live Demo

- Frontend: https://frontend-build-nmjc.onrender.com
- Backend API: https://product-catalogue-api-aiqj.onrender.com
- API health check: https://product-catalogue-api-aiqj.onrender.com/health

> The free Render backend can take up to a minute to respond after inactivity.

## Features

### Users

- User registration and login
- Password hashing with `bcrypt`
- JWT authentication
- Protected routes
- Automatic sign-out when a session expires
- Product search, price filters, pagination, loading states, and error states
- Product detail page
- Add products to cart
- Increase or decrease cart quantity
- Remove products from cart
- Place an order
- View order number, items, total, and exact order time

### Admins

- Only admins can create, edit, and delete products
- Only admins can upload product images
- Admin panel to grant or remove admin access
- Protected initial admin account
- Admin audit log for product and role changes
- Admin customer-order view
- View customer name, email, products, quantities, total price, and order time

### Product Images

- Cloudinary image upload and storage
- JPEG, PNG, and WebP uploads
- File-size validation
- Broken-image fallback

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
- `pg`
- `node-pg-migrate`
- Faker
- Supertest
- Render Web Service

## Prerequisites

Install the following before running the project locally:

- Node.js
- npm
- PostgreSQL, or a Neon PostgreSQL database
- Cloudinary account for product image uploads

## Installation

Clone the repository:

```bash
git clone https://github.com/inchara-codes/-Backend-Frontend-Build.git
cd -Backend-Frontend-Build
```

Install dependencies:

```bash
npm install
```

## Environment Variables

Create a `.env` file in the project root.

```env
# Backend
PORT=3000
CLIENT_ORIGIN=http://localhost:5173
JWT_SECRET=replace_with_a_long_random_secret

# Use DATABASE_URL for Neon or another cloud PostgreSQL database
DATABASE_URL=postgresql://YOUR_DATABASE_CONNECTION_STRING

# Local PostgreSQL connection
DB_HOST=localhost
DB_PORT=5432
DB_USER=YOUR_POSTGRES_USERNAME
DB_PASSWORD=YOUR_POSTGRES_PASSWORD
DB_NAME=my_application_db

# Frontend API URL
VITE_API_URL=http://localhost:3000

# Cloudinary
CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret
```

Never commit `.env` because it contains passwords and API secrets.

## Database Setup

For local PostgreSQL, create a database:

```sql
CREATE DATABASE my_application_db;
```

Run all migrations:

```bash
npm run migrate
```

Seed sample users and products:

```bash
npm run seed
```

The seed script creates 25 users and 30 products.

## Run Locally

Start the backend:

```bash
npm run dev
```

The backend runs at:

```text
http://localhost:3000
```

Open a second terminal in the same project folder and start the frontend:

```bash
npx vite
```

Open the URL shown by Vite, normally:

```text
http://localhost:5173
```

## Demo Login

```text
Email: test@example.com
Password: password123
```

You can also create a regular user account from the registration screen.

## Roles and Permissions

| Action | Regular user | Admin |
| --- | --- | --- |
| Browse products | Yes | Yes |
| Search and filter products | Yes | Yes |
| Add products to cart | Yes | No |
| Place orders | Yes | No |
| View personal orders | Yes | No |
| Create products | No | Yes |
| Edit products | No | Yes |
| Delete products | No | Yes |
| Upload product images | No | Yes |
| Manage user roles | No | Yes |
| View all customer orders | No | Yes |
| View admin audit history | No | Yes |

The protected initial admin email is configured in:

```text
routes/admin.js
```

## API Endpoints

All endpoints except login, registration, health check, and database check require a JWT token.

```http
Authorization: Bearer YOUR_JWT_TOKEN
```

### Authentication

| Method | Endpoint | Description |
| --- | --- | --- |
| POST | `/auth/register` | Create a regular user account and receive a JWT |
| POST | `/auth/login` | Sign in and receive a JWT |

### Products

| Method | Endpoint | Access | Description |
| --- | --- | --- | --- |
| GET | `/products?page=1&limit=8` | Signed-in user | Get paginated products |
| GET | `/products?search=chair` | Signed-in user | Search products by name |
| GET | `/products?minPrice=100&maxPrice=500` | Signed-in user | Filter products by price |
| GET | `/products/:id` | Signed-in user | Get one product |
| POST | `/products` | Admin | Create a product with an image |
| PUT | `/products/:id` | Admin | Update a product and optionally replace its image |
| DELETE | `/products/:id` | Admin | Delete a product |

### Cart

| Method | Endpoint | Description |
| --- | --- | --- |
| GET | `/cart` | Get the signed-in user's cart |
| POST | `/cart/items` | Add a product to the cart |
| PATCH | `/cart/items/:productId` | Update a cart item quantity |
| DELETE | `/cart/items/:productId` | Remove an item from the cart |
| POST | `/cart/checkout` | Place an order from the current cart |

### Orders

| Method | Endpoint | Access | Description |
| --- | --- | --- | --- |
| GET | `/orders` | Signed-in user | Get the user's order history |
| GET | `/orders/:id` | Signed-in user | Get one of the user's orders |
| GET | `/admin/orders` | Admin | Get all customer orders |

### Admin

| Method | Endpoint | Description |
| --- | --- | --- |
| GET | `/admin/users` | Get all users and roles |
| PATCH | `/admin/users/:id/role` | Grant or remove admin access |
| GET | `/admin/audit-logs` | Get admin activity history |

### System

| Method | Endpoint | Description |
| --- | --- | --- |
| GET | `/health` | Check whether the API is running |
| GET | `/test-db` | Verify database connectivity |

## Database Design

| Table | Purpose |
| --- | --- |
| `users` | Stores accounts, password hashes, and roles |
| `products` | Stores product information and Cloudinary image URLs |
| `cart_items` | Stores each user's current cart items and quantities |
| `orders` | Stores placed orders, totals, and order time |
| `order_items` | Stores a permanent product and price snapshot for each order |
| `admin_audit_logs` | Stores admin actions and timestamps |
| `pgmigrations` | Tracks completed database migrations |

`order_items` stores the product name and price at checkout time. This means an order remains accurate even if an admin later edits or deletes the product.

## Available Scripts

| Command | Description |
| --- | --- |
| `npm run dev` | Start the backend with Nodemon |
| `npm start` | Start the backend with Node |
| `npm run build` | Create a production React build |
| `npm test` | Run API integration tests |
| `npm run migrate` | Run pending database migrations |
| `npm run migrate:down` | Undo the latest migration |
| `npm run seed` | Seed sample users and products |

## Tests

Run the test suite:

```bash
npm test
```

The current API tests cover:

- Login and JWT creation
- Invalid login validation
- Protected product routes
- Product pagination
- Invalid product IDs
- Invalid price ranges
- Required image validation

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

The React frontend is deployed as a Render Static Site.

Required environment variable:

```text
VITE_API_URL=https://product-catalogue-api-aiqj.onrender.com
```

Render must rebuild the frontend whenever `VITE_API_URL` changes.

## Project Structure

```text
Backend/
├── config/
│   └── cloudinary.js          Cloudinary configuration
├── middleware/
│   ├── adminMiddleware.js     Admin permission check
│   ├── authMiddleware.js      JWT authentication check
│   └── upload.js              Multer upload validation
├── migrations/                Database migration files
├── routes/
│   ├── admin.js               Admin users, audit logs, and customer orders
│   ├── auth.js                Registration and login routes
│   ├── cart.js                Cart and checkout routes
│   ├── order.js               Personal order-history routes
│   └── products.js            Product management routes
├── scripts/
│   └── seed.js                Sample data seed script
├── src/
│   ├── App.jsx                React application
│   ├── App.css                Component styling
│   ├── db.js                  PostgreSQL connection
│   ├── main.jsx               React entry point
│   └── server.js              Express server setup
├── test/
│   └── api.test.js            API integration tests
├── utils/
│   └── audit.js               Admin audit-log helper
├── .env.example               Environment-variable template
├── package.json
└── README.md
```

## Future Improvements

- Payment integration
- Product stock and inventory management
- Product categories and sorting
- Email confirmation after registration
- Password reset flow
- Order status tracking
- More frontend and API tests
- GitHub Actions CI/CD pipeline