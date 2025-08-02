function ensureAuthenticated(req, res, next) {
  if (req.isAuthenticated()) {
    return next();
  }
  res.redirect("/auth/login");
}

function forwardAuthenticated(req, res, next) {
  const excludedPaths = ["/auth/logout"];

  if (excludedPaths.includes(req.path) || !req.isAuthenticated()) {
    return next();
  }
  res.redirect("/dashboard");
}

module.exports = {
  ensureAuthenticated,
  forwardAuthenticated,
};
