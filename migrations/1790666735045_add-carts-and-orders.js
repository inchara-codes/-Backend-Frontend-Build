exports.up = (pgm) => {
  pgm.createTable("cart_items", {
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

    product_id: {
      type: "bigint",
      notNull: true,
      references: "products",
      onDelete: "CASCADE",
    },

    quantity: {
      type: "integer",
      notNull: true,
      default: 1,
      check: "quantity > 0",
    },

    created_at: {
      type: "timestamptz",
      notNull: true,
      default: pgm.func("now()"),
    },

    updated_at: {
      type: "timestamptz",
      notNull: true,
      default: pgm.func("now()"),
    },
  });

  pgm.addConstraint("cart_items", "cart_items_user_product_unique", {
    unique: ["user_id", "product_id"],
  });

  pgm.createIndex("cart_items", ["user_id"]);

  pgm.createTable("orders", {
    id: {
      type: "bigserial",
      primaryKey: true,
    },

    user_id: {
      type: "bigint",
      notNull: true,
      references: "users",
      onDelete: "RESTRICT",
    },

    total_amount: {
      type: "numeric(10, 2)",
      notNull: true,
    },

    created_at: {
      type: "timestamptz",
      notNull: true,
      default: pgm.func("now()"),
    },
  });

  pgm.createIndex("orders", ["user_id"]);

  pgm.createTable("order_items", {
    id: {
      type: "bigserial",
      primaryKey: true,
    },

    order_id: {
      type: "bigint",
      notNull: true,
      references: "orders",
      onDelete: "CASCADE",
    },

    product_id: {
      type: "bigint",
      references: "products",
      onDelete: "SET NULL",
    },

    product_name: {
      type: "varchar(200)",
      notNull: true,
    },

    product_price: {
      type: "numeric(10, 2)",
      notNull: true,
    },

    quantity: {
      type: "integer",
      notNull: true,
      check: "quantity > 0",
    },
  });

  pgm.createIndex("order_items", ["order_id"]);
};

exports.down = (pgm) => {
  pgm.dropTable("order_items");
  pgm.dropTable("orders");
  pgm.dropTable("cart_items");
};