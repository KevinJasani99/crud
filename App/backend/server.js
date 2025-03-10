const express = require("express");
const bodyParser = require("body-parser");
const http = require("http");
const cors = require("cors");
const mongoose = require("mongoose");
const jwt = require("jsonwebtoken");
const bcrypt = require("bcryptjs");
const dotenv = require("dotenv");
const rateLimit = require("express-rate-limit");
const JWT_SECRET="KevinJasani"
dotenv.config();

const app = express();

app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());
app.use(cors());

// Connect to MongoDB
mongoose
  .connect(
    "mongodb+srv://kevinjasani1999:Kevin99096@cluster0.7p73r.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0",
    {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    }
  )
  .then(() => console.log("DB Connected"))
  .catch((error) => console.log(error));

// User Schema
const userSchema = new mongoose.Schema({
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
});

const User = mongoose.model("User", userSchema);

// Item Schema
const itemSchema = new mongoose.Schema({
  name: String,
  description: String,
});

const Item = mongoose.model("Item", itemSchema);

app.get("/", (req, res) => {
   res.send("Hello, World!");
 });

// Register Route
app.post("/register", async (req, res) => {
  const { email, password } = req.body;
  try {
    const hashedPassword = await bcrypt.hash(password, 10);
    const newUser = new User({ email, password: hashedPassword });
    await newUser.save();
    res.json({ message: "User registered successfully!" });
  } catch (error) {
    res.status(500).json({ error: "Error registering user" });
  }
});

// Login Route with Rate Limiting
const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // within 15 minutes of timeframe
  max: 5, // Limit to 5 requests
  message: "Too many login attempts from this IP, please try again later.",
});

app.post("/login", async (req, res) => {
  const { email, password } = req.body;
  console.log("error : "+email, password);
  try {
    const user = await User.findOne({ email });
    if (!user) return res.status(400).json({ error: "User not found" });

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) return res.status(400).json({ error: "Invalid password" });

    const token = jwt.sign({ userId: user._id }, JWT_SECRET, {
      expiresIn: "1h",
    });
    res.json({ token });
  } catch (error) {
    res.status(500).json({ error: "Error logging in" });
    console.log(error);
  }
});

// Authentication Middleware
const authenticate = (req, res, next) => {
  const token = req.header("Authorization")?.replace("Bearer ", "");
  if (!token) return res.status(401).json({ error: "Access denied, no token provided" });

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    req.user = decoded;
    next();
  } catch (error) {
    res.status(400).json({ error: "Invalid token" });
  }
};

// Rate limiting for POST/PUT/DELETE operations on items
const itemRateLimiter = rateLimit({
  windowMs: 60 * 1000, 
  max: 5, // Limit to 5 requests per windowMs for item-related routes
  message: "Too many requests, please try again later.",
});

// Get All Items (No authentication required for GET method)
app.get("/items", async (req, res) => {
  const items = await Item.find();
  res.json({ items });
});

// Create New Item
app.post("/items", authenticate, itemRateLimiter, async (req, res) => {
  const { name, description } = req.body;
  const newItem = new Item({ name, description });
  await newItem.save();
  res.json({ item: newItem });
});

// Update Item by ID
app.put("/items/:id", authenticate, itemRateLimiter, async (req, res) => {
  const { id } = req.params;
  const { name, description } = req.body;
  try {
    const updatedItem = await Item.findByIdAndUpdate(id, { name, description }, { new: true });
    res.json({ item: updatedItem });
  } catch (error) {
    res.status(500).json({ error: "Error updating item" });
  }
});

// Delete Item by ID 
app.delete("/items/:id", authenticate, itemRateLimiter, async (req, res) => {
  const { id } = req.params;
  try {
    await Item.findByIdAndDelete(id);
    res.json({ message: "Item deleted successfully" });
  } catch (error) {
    res.status(500).json({ error: "Error deleting item" });
  }
});

const PORT = process.env.PORT || 4000;
const server = http.createServer(app);
server.listen(PORT, () => console.log(`Server running on PORT ${PORT}`));
