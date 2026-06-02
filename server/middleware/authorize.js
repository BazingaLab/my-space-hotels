module.exports = function authorize(allowedRoles = []) {
  return async (req, res, next) => {
    try {
      const user = req.user;

      if (!user) {
        return res.status(401).json({
          error: "Unauthorized",
        });
      }

      const role = user.role;

      if (!allowedRoles.includes(role)) {
        return res.status(403).json({
          error: "Forbidden",
        });
      }

      next();
    } catch (err) {
      console.error(err);
      return res.status(500).json({
        error: "Authorization failed",
      });
    }
  };
};