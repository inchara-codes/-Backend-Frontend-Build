exports.up = (pgm) => {
  pgm.createTable("products", {
    id: {
      type: "bigserial",
      primaryKey: true,
    },

    user_id: {
      type: "bigint",
      notNull: true,
      references: "users",
      onDelete: "CASCADE",
    },

    name: {
      type: "varchar(200)",
      notNull: true,
    },

    description: {
      type: "text",
    },

    price: {
      type: "numeric(10, 2)",
      notNull: true,
    },

    image_url: {
      type: "text",
    },

    created_at: {
      type: "timestamptz",
      notNull: true,
      default: pgm.func("now()"),
    },
  });
};

exports.down = (pgm) => {
  pgm.dropTable("products");
};