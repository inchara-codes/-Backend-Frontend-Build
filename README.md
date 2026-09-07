# Product Catalogue

A full-stack product catalogue application built with React, Express, and PostgreSQL.

## Features

- Login using email and password
- User session stored in browser local storage
- Product grid with image, name, and price
- Product detail page
- Loading, empty, and error states
- Broken-image fallback
- Responsive layout for desktop and mobile
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

Create a PostgreSQL database named:

```sql
CREATE DATABASE my_application_db;