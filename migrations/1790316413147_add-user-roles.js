exports.up = (pgm) => {
  pgm.addColumn("users", {
    role: {
      type: "varchar(20)",
      notNull: true,
      default: "user",
    },
  });

  pgm.addConstraint("users", "users_role_check", {
    check: "role IN ('user', 'admin')",
  });
};

exports.down = (pgm) => {
  pgm.dropConstraint("users", "users_role_check");
  pgm.dropColumn("users", "role");
};