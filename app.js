require("dotenv").config();
const express = require("express");
const session = require("express-session");
const flash = require("connect-flash");
const passport = require("passport");
const path = require("path");
const prisma = require("./config/database");
const morgan = require("morgan");
const errorHandler = require('./middleware/error');

const app = express();
const PORT = process.env.PORT || 3000;
const NODE_ENV = process.env.NODE_ENV || "development";

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, "public")));

app.use(morgan("dev"));
app.use(flash());
app.use(
  session({
    secret: process.env.SESSION_SECRET,
    resave: false,
    saveUninitialized: false,
    cookie: { secure: process.env.NODE_ENV === "production" },
  })
);

app.use(passport.initialize());
app.use(passport.session());
require("./config/passport")(passport);

app.set("views", path.join(__dirname, "views"));
app.set("view engine", "ejs");

app.use((req, res, next) => {
  res.locals.isAuth = req.isAuthenticated();
  res.locals.success_msg = req.flash("success_msg");
  res.locals.error_msg = req.flash("error_msg");
  res.locals.error = req.flash("error");
  next();
});

app.use("/", require("./routes/index"));
app.use("/auth", require("./routes/auth"));
app.use("/api", require("./routes/api"));

app.use((req, res, next) => {
  res.status(404).render("notfound");
});

app.use(errorHandler);

async function startServer() {
  try {
    await prisma.$connect();
    console.log("✅ Database connected successfully");

    app.listen(PORT, () => {
      console.log(`🚀 SiRajin system ready at http://localhost:${PORT}`);
      console.log(`🌱 Environment: ${NODE_ENV}`);
    });

    process.on("SIGINT", async () => {
      console.log("🛑 Gracefully shutting down...");
      await prisma.$disconnect();
      process.exit(0);
    });
  } catch (err) {
    console.error("❌ Database connection error:", err);
    process.exit(1);
  }
}

startServer();
