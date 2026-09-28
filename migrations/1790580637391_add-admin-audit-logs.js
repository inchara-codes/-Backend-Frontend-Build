exports.up = (pgm) => {
  pgm.createTable("admin_audit_logs", {
    id: {
      type: "bigserial",
      primaryKey: true,
    },

    actor_id: {
      type: "bigint",
      notNull: true,
      references: "users",
      onDelete: "RESTRICT",
    },

    action: {
      type: "varchar(50)",
      notNull: true,
    },

    entity_type: {
      type: "varchar(50)",
      notNull: true,
    },

    entity_id: {
      type: "bigint",
    },

    details: {
      type: "jsonb",
      notNull: true,
    },

    created_at: {
      type: "timestamptz",
      notNull: true,
      default: pgm.func("now()"),
    },
  });

  pgm.createIndex("admin_audit_logs", ["actor_id"]);
  pgm.createIndex("admin_audit_logs", ["created_at"]);
};

exports.down = (pgm) => {
  pgm.dropTable("admin_audit_logs");
};