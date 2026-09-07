# Product Catalogue

A full-stack product catalogue application built with React, Express, and PostgreSQL.

## Features

- Login using email and password
- User session stored in browser local storage
- Product grid with images, names, and prices
- Product detail page
- Loading, empty, and error states
- Broken-image fallback
- Responsive desktop and mobile layout
- Sign-out functionality

## Tech Stack

### Frontend

- React
- Vite
- CSS

### Backend

- Node.js
- Express
- PostgreSQL
- `pg`
- `bcrypt`
- Faker
- `node-pg-migrate`

## Prerequisites

Install the following before running the project:

- Node.js
- npm
- PostgreSQL

## Database Setup

Create a PostgreSQL database:

```sql
CREATE DATABASE my_application_db;
```

Create a `.env` file in the project root:

```env
DB_HOST=localhost
DB_PORT=5432
DB_USER=YOUR_POSTGRES_USERNAME
DB_PASSWORD=YOUR_POSTGRES_PASSWORD
DB_NAME=my_application_db
PORT=3000
DATABASE_URL=postgresql://YOUR_POSTGRES_USERNAME:YOUR_POSTGRES_PASSWORD@localhost:5432/my_application_db
```

Update the values to match your local PostgreSQL setup.

## Installation

Install dependencies:

```bash
npm install
```

Run database migrations:

```bash
npm run migrate
```

Seed sample users and products:

```bash
npm run seed
```

The seed script creates 25 users and 30 products.

## Run the Application

Start the backend:

```bash
npm run dev
```

The backend runs at:

```text
http://localhost:3000
```

Open another terminal in the same project folder and start the frontend:

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

## API Endpoints

| Method | Endpoint | Description |
| --- | --- | --- |
| POST | `/auth/login` | Log in using email and password |
| GET | `/products` | Get all products |
| GET | `/products/:id` | Get one product by ID |
| GET | `/test-db` | Verify database connection |

## Project Structure

```text
Backend/
├── migrations/               Database migration files
├── routes/
│   ├── auth.js               Login route
│   └── products.js           Product routes
├── scripts/
│   └── seed.js               Sample-data seed script
├── src/
│   ├── App.jsx               React application
│   ├── App.css               Component styling
│   ├── index.css             Global styling
│   ├── main.jsx              React entry point
│   ├── db.js                 PostgreSQL connection
│   └── server.js             Express server
├── .env                      Local environment variables
├── package.json
└── README.md
```

## Frontend Flow

1. User opens the login screen.
2. User enters an email address and password.
3. The frontend sends a request to `POST /auth/login`.
4. On success, user data is saved in `localStorage`.
5. The frontend fetches products from `GET /products`.
6. The user clicks a product card.
7. The frontend fetches details from `GET /products/:id`.
8. The user returns to the product list or signs out.

## Available Scripts

| Command | Description |
| --- | --- |
| `npm run dev` | Start backend with Nodemon |
| `npm run start` | Start backend normally |
| `npm run migrate` | Run database migrations |
| `npm run migrate:down` | Undo the latest migration |
| `npm run seed` | Seed sample users and products |

## Future Improvements

- Add JWT authentication
- Protect product routes with authentication middleware
- Add product search and filtering
- Add pagination
- Add create, edit, and delete product functionality
- Add user registration
- Deploy the application
