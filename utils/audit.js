async function logAdminAction(
  db,
  { actorId, action, entityType, entityId = null, details }
) {
  await db.query(
    `
    INSERT INTO admin_audit_logs
      (actor_id, action, entity_type, entity_id, details)
    VALUES
      ($1, $2, $3, $4, $5)
    `,
    [
      actorId,
      action,
      entityType,
      entityId,
      JSON.stringify(details),
    ]
  );
}

module.exports = logAdminAction;