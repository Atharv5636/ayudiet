const express = require("express");
const ejsmate = require("ejs-mate");
const cors = require('cors');
const { GoogleGenerativeAI } = require("@google/generative-ai");
require('dotenv').config();
const path = require("path");
const mongoose = require("mongoose");
const session = require("express-session");
const MongoStore = require("connect-mongo");
const bcrypt = require("bcrypt");
const methodOverride = require("method-override");
const userDetails = require("./models/signupdb.js");
const wrapAsync = require("./utils/wrapAsync.js");
const ExpressError = require("./utils/ExpressError.js");
const Assessment = require("./models/patientSchema.js");
const patientValidation = require("./models/patientValidation.js");
const bodyParser = require('body-parser');
const Conversation = require("./models/chatuser");
const app = express();
const genAI = require('./services/aiService');
app.use(bodyParser.urlencoded({ extended: true }));
// MongoDB Connection
const MONGO_URL = "mongodb://127.0.0.1:27017/userDetails";
mongoose
  .connect(MONGO_URL)
  .then(() => console.log("✅ Connected to MongoDB"))
  .catch((err) => console.error("❌ MongoDB connection error:", err));
// Middleware
app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(methodOverride("_method"));
app.use(express.static(path.join(__dirname, "public")));

// Set up EJS
app.engine("ejs", ejsmate);
app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "views"));

// Session setup
const store = MongoStore.create({ mongoUrl: MONGO_URL, touchAfter: 24 * 3600 });
app.use(
  session({
    store,
    name: "session",
    secret: "yourSecretKeyHere",
    resave: false,
    saveUninitialized: false,
    cookie: {
      httpOnly: true,
      expires: Date.now() + 1000 * 60 * 60 * 24 * 7,
      maxAge: 1000 * 60 * 60 * 24 * 7,
    },
  })
);

// Custom middleware


app.use(async (req, res, next) => {
  if (req.session.userId) {
    res.locals.currentUser = await userDetails.findById(req.session.userId).lean();
  } else {
    res.locals.currentUser = null;
  }
  next();
});


// Authentication middleware
function requireLogin(req, res, next) {
  if (!req.session.userId) return res.redirect("/login");
  next();
}

// Validation middleware
const validate = (schema) => (req, res, next) => {
  const { error, value } = schema.validate(req.body, { abortEarly: false });
  if (error) {
    const messages = error.details.map((d) => d.message);
    throw new ExpressError(messages.join(","), 400);
  }
  req.body = value;
  next();
};

// ================= Routes =================
app.get("/", (req, res) => res.render("landings/landing"));
app.get("/login", (req, res) => res.render("landings/login"));
app.get("/login/forgot", (req, res) => res.render("landings/forgot"));
app.get("/dashboard", requireLogin, (req, res) => res.render("main/dashboard"));
app.get("/signup", (req, res) => {
res.render("landings/signup")});

  

app.get("/dashboard/patient-form", requireLogin, (req, res) =>
  res.render("main/patientform")
);

// ================= Login =================
app.post(
  "/login",
  wrapAsync(async (req, res, next) => {
    const { email, password } = req.body;
    if (!email || !password)
      throw new ExpressError("Email and password required", 400);

    const user = await userDetails.findOne({ email });
    if (!user) throw new ExpressError("Invalid email or password", 400);

    const valid = await user.isValidPassword(password);
    if (!valid) throw new ExpressError("Invalid email or password", 400);

    req.session.userId = user._id;
    res.redirect("/dashboard");
  })
);

// ================= Logout =================
app.get("/logout", (req, res, next) => {
  req.session.destroy((err) => {
    if (err) return next(err);
    res.clearCookie("session");
    res.redirect("/login");
  });
});

// ================= Signup =================
const signupValidation = require("./models/signupValidation.js");

app.post(
  "/signup",
  // Validate with Joi first (this will check presence and confirm_password)
  validate(signupValidation),
  wrapAsync(async (req, res, next) => {
    try {
      // Extract only fields we accept (sanitization)
      const { fullname, email, password, phone, specialization, clinic } = req.body;

      // Check duplicate explicitly
      const existingUser = await userDetails.findOne({ email });
      if (existingUser) {
        // Custom error so it falls to error handler and shows a clear message
        throw new ExpressError("Email already registered! Please login or use a different email.", 400);
      }

      const newUser = new userDetails({
        fullname,
        email,
        phone,
        specialization,
        clinic,
        password
      });

      await newUser.save();

      // Set session and redirect
      req.session.userId = newUser._id;
      res.redirect("/dashboard");
    } catch (err) {
      // handle duplicate-key error (race condition)
      if (err.code === 11000 && err.keyPattern && err.keyPattern.email) {
        return next(new ExpressError("Email already registered!", 400));
      }
      // bubble error to global error handler for consistent UI
      next(err);
    }
  })
);

// ================= Patient Form =================
app.post(
  "/dashboard/patient-form",
  requireLogin,
  (req, res, next) => {
    if (req.body.preferences) {
      req.body.preferences = req.body.preferences
        .split(",")
        .map((p) => p.trim().toLowerCase().replace(" ", "-"));
    }
    next();
  },
  validate(patientValidation),
  wrapAsync(async (req, res) => {
    const newPatient = new Assessment({
      ...req.body,
      owner: req.session.userId, // assign current logged-in user
    });
    await newPatient.save();
    res.redirect("/patients");
  })
);



app.get("/patients/:id", requireLogin, wrapAsync(async (req, res) => {
  const patient = await Assessment.findById(req.params.id);
  if (!patient) throw new ExpressError("Patient not found", 404);
  res.render("main/patientDetails", { patient });
}));


// Patients Page - Dynamic with Search
// Patients Page - Dynamic with Search
// Patients Page - Dynamic with Search
app.get("/patients", requireLogin, wrapAsync(async (req, res) => {
  const search = req.query.search || "";
  const prakritiFilter = req.query.prakriti || "";
  const levelFilter = req.query.level || "";

  let query = { owner: req.session.userId }; // 🔑 only this user’s patients

  if (search) {
    const ageNumber = Number(search);
    query.$or = [
      { patientName: { $regex: search, $options: "i" } },
      { prakriti: { $regex: search, $options: "i" } },
      ...( !isNaN(ageNumber) ? [{ age: ageNumber }] : [] )
    ];
  }

  if (prakritiFilter && prakritiFilter !== "All") query.prakriti = prakritiFilter;

  if (levelFilter && levelFilter !== "All") {
    if (levelFilter === "Low") query.activityLevel = { $lte: 2 };
    else if (levelFilter === "Medium") query.activityLevel = { $gte: 3, $lte: 4 };
    else if (levelFilter === "High") query.activityLevel = { $gte: 5 };
  }

  const patients = await Assessment.find(query).sort({ createdAt: -1 });

  res.render("main/patients", { patients, search, prakritiFilter, levelFilter });
}));


// for chatbot posyt route
app.post("/chat", async (req, res) => {
  try {
    const { message } = req.body;
    const userId = req.session.userId; // must be ObjectId type
    if (!userId) return res.json({ success: false, error: "User not logged in" });

    // Find or create conversation
    let conversation = await Conversation.findOne({ userId });
    if (!conversation) {
      conversation = new Conversation({ userId, messages: [] });
    }

    // Save user message
    conversation.messages.push({ role: "user", content: message });

    // Generate AI response
    const aiResponse = await genAI.generateChatResponse(conversation.messages);
    const reply = aiResponse.success ? aiResponse.response : "⚠️ AI Error";

    // Save AI response
    conversation.messages.push({ role: "assistant", content: reply });
    await conversation.save();

    res.json({ success: true, reply });
  } catch (err) {
    console.error("Chat Error:", err);
    res.json({ success: false, error: err.message });
  }
});





// ================= Error Handler =================
// ================= Error Handler =================
app.use((err, req, res, next) => {
  console.error("Error caught:", err);

  // Joi or custom validation errors
  if (err.isJoi) {
    return res.status(400).render("error", {
      err: { messages: err.details.map(d => d.message) }
    });
  }

  // ExpressError (custom)
  if (err instanceof ExpressError) {
    return res.status(err.statusCode || 500).render("error", { err });
  }

  // Fallback for unknown errors
  res.status(500).render("error", {
    err: { messages: [err.message || "Unexpected error occurred."] }
  });
});

// ================= Start server =================
app.listen(3003, () =>
  console.log("🚀 Server running at http://localhost:3003")
);
