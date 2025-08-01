const LocalStrategy = require("passport-local").Strategy;
const bcrypt = require("bcryptjs");
const prisma = require("./database");

module.exports = (passport) => {
  passport.use(
    new LocalStrategy(
      { usernameField: "username" },
      async (username, password, done) => {
        try {
          const admin = await prisma.admin.findUnique({ where: { username } });

          if (!admin) {
            return done(null, false, {
              message: "Username tidak ditemukan",
              type: "error_msg",
            });
          }

          const isMatch = await bcrypt.compare(password, admin.password);

          if (isMatch) {
            return done(null, admin);
          } else {
            return done(null, false, {
              message: "Password salah",
              type: "error_msg",
            });
          }
        } catch (err) {
          return done(err);
        }
      }
    )
  );

  passport.serializeUser((admin, done) => {
    done(null, admin.id);
  });

  passport.deserializeUser(async (id, done) => {
    try {
      const admin = await prisma.admin.findUnique({ where: { id } });
      done(null, admin);
    } catch (err) {
      done(err);
    }
  });
};
