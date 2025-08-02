const express = require("express");
const router = express.Router();
const passport = require("passport");
const bcrypt = require("bcryptjs");
const prisma = require("../config/database");
const { forwardAuthenticated } = require("../middleware/auth.js");

router.use(forwardAuthenticated);

router.get("/login", (req, res) => {
  res.render("auth/login");
});

router.get("/register", (req, res) => {
  res.render("auth/register");
});

router.post("/login", (req, res, next) => {
  passport.authenticate("local", {
    successRedirect: "/dashboard",
    failureRedirect: "/auth/login",
    failureFlash: true,
  })(req, res, next);
});

router.post("/register", async (req, res) => {
  try {
    const { username, password, confirmpassword } = req.body;
    const hashedPassword = await bcrypt.hash(password, 10);

    if (
      username == "" ||
      password == "" ||
      confirmpassword == ""
    ) {
      req.flash("error_msg", "Gagal mendaftar, coba check kembali inputnya!");
      res.redirect("/auth/register");
    }

    await prisma.admin.create({
      data: {
        username: username,
        password: hashedPassword,
      },
    });

    req.flash("success_msg", `Anda Berhasil mendaftar, silahkan login!`);
    res.redirect("/auth/login");
  } catch (error) {
    req.flash("error_msg", `Error ${error.message}`);
    res.redirect("/auth/register");
  }
});

router.get("/logout", (req, res, next) => {
  if (req.isAuthenticated()) {
    req.logout((err) => {
      if (err) {
        console.error("Error during logout:", err);
        req.flash("error_msg", "Gagal logout, silakan coba lagi.");
        return res.redirect("/dashboard"); // Redirect ke dashboard jika logout gagal
      }
      req.flash("success_msg", "Anda berhasil logout.");
      res.redirect("/auth/login"); // Redirect ke halaman login setelah logout
    });
  } else {
    req.flash("error_msg", "Anda belum login.");
    res.redirect("/auth/login"); // Redirect ke halaman login jika belum login
  }
});

module.exports = router;
