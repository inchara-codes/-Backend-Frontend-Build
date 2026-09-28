function adminMiddleware(req, res, next) {
  if (req.user.role !== "admin") {
    return res.status(403).json({
      message: "Admin permission is required for this action.",
    });
  }

  next();
}

module.exports = adminMiddleware;