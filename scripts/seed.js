require("dotenv").config();

const { faker } = require("@faker-js/faker");
const bcrypt = require("bcrypt");
const pool = require("../src/db");

async function seed() {
  try {
    console.log("Starting seed...");

    await pool.query(
      "TRUNCATE products, users RESTART IDENTITY CASCADE"
    );

    // Create 25 users
    for (let i = 0; i < 25; i++) {
      const name = faker.person.fullName();
      const email =
        i === 0
        ? "test@example.com"
        : faker.internet.email().toLowerCase();
      
      const passwordHash = await bcrypt.hash("password123", 10);

      await pool.query(
        `
        INSERT INTO users (name, email, password_hash)
        VALUES ($1, $2, $3)
        `,
        [name, email, passwordHash]
      );
    }

    // Get all users
    const users = await pool.query(
      "SELECT id FROM users"
    );

    // Create 30 products
    for (let i = 0; i < 30; i++) {
      const user = faker.helpers.arrayElement(users.rows);

      await pool.query(
        `
        INSERT INTO products
          (user_id, name, description, price, image_url)
        VALUES
          ($1, $2, $3, $4, $5)
        `,
        [
          user.id,
          faker.commerce.productName(),
          faker.commerce.productDescription(),
          faker.commerce.price({
            min: 10,
            max: 2000,
            dec: 2
          }),
          faker.image.url()
        ]
      );
    }

    console.log("Seed completed successfully!");
    console.log("Created 25 users and 30 products.");
    console.log("Test login: test@example.com / password123");
  } catch (error) {
    console.error("Seed failed:", error);
  } finally {
    await pool.end();
  }
}

seed();