const { after, before, test } = require("node:test");
const assert = require("node:assert/strict");
const request = require("supertest");

const app = require("../src/server");
const pool = require("../src/db");

let token;

before(async () => {
  const response = await request(app)
    .post("/auth/login")
    .send({
      email: "test@example.com",
      password: "password123",
    });

  assert.equal(response.status, 200);
  assert.equal(typeof response.body.token, "string");

  token = response.body.token;
});

after(async () => {
  await pool.end();
});

test("rejects product requests without a token", async () => {
  const response = await request(app).get("/products");

  assert.equal(response.status, 401);
  assert.equal(response.body.message, "Authentication token is required.");
});

test("logs in with valid credentials and returns a JWT", async () => {
  const response = await request(app)
    .post("/auth/login")
    .send({
      email: "test@example.com",
      password: "password123",
    });

  assert.equal(response.status, 200);
  assert.equal(response.body.message, "Login successful.");
  assert.equal(typeof response.body.token, "string");
  assert.equal(response.body.user.email, "test@example.com");
});

test("rejects an invalid login email", async () => {
  const response = await request(app)
    .post("/auth/login")
    .send({
      email: "not-an-email",
      password: "password123",
    });

  assert.equal(response.status, 400);
  assert.equal(response.body.message, "Enter a valid email address.");
});

test("returns a paginated protected product list", async () => {
  const response = await request(app)
    .get("/products?page=1&limit=8")
    .set("Authorization", `Bearer ${token}`);

  assert.equal(response.status, 200);
  assert.ok(Array.isArray(response.body.products));
  assert.ok(response.body.products.length <= 8);
  assert.equal(response.body.pagination.page, 1);
  assert.equal(response.body.pagination.limit, 8);
});

test("rejects an invalid product ID", async () => {
  const response = await request(app)
    .get("/products/not-a-number")
    .set("Authorization", `Bearer ${token}`);

  assert.equal(response.status, 400);
  assert.equal(
    response.body.message,
    "Product ID must be a positive whole number."
  );
});

test("rejects an invalid price range", async () => {
  const response = await request(app)
    .get("/products?minPrice=1000&maxPrice=100")
    .set("Authorization", `Bearer ${token}`);

  assert.equal(response.status, 400);
  assert.equal(
    response.body.message,
    "Minimum price cannot be greater than maximum price."
  );
});