const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const morgan = require("morgan");

// Import models
const Notes = require("./models/notes");
const Program = require("./models/program");
const Semester = require("./models/semester");

// Import routes
const notesRoutes = require("./routes/notes");
const programRoutes = require("./routes/programs");
const semesterRoutes = require("./routes/semesters");

const app = express();
const PORT = process.env.PORT || 8080;
const MONGO_URL = process.env.MONGO_URL || "mongodb://127.0.0.1:27017/notesHub";

// Middleware
app.use(cors());
app.use(morgan("dev"));
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true }));

// Serve static files
app.use(express.static("public"));

// Database connection
async function main() {
    try {
        await mongoose.connect(MONGO_URL);
        console.log("✅ Connected to NotesHub database");
    } catch (err) {
        console.error("❌ Database connection error:", err);
        process.exit(1);
    }
}

main();

// Routes
app.use("/api/notes", notesRoutes);
app.use("/api/programs", programRoutes);
app.use("/api/semesters", semesterRoutes);

// Health check route
app.get("/", (req, res) => {
    res.sendFile(__dirname + "/public/index.html");
});

// API info route
app.get("/api", (req, res) => {
    res.json({
        message: "NotesHub API is running",
        version: "1.0.0",
        endpoints: {
            notes: "/api/notes",
            programs: "/api/programs",
            semesters: "/api/semesters"
        }
    });
});

// 404 handler
app.use("*", (req, res) => {
    res.status(404).json({ error: "Route not found" });
});

// Error handling middleware
app.use((err, req, res, next) => {
    console.error("Error:", err);
    res.status(err.status || 500).json({
        error: err.message || "Internal server error",
        ...(process.env.NODE_ENV === "development" && { stack: err.stack })
    });
});

app.listen(PORT, () => {
    console.log(`🚀 Server is running on port ${PORT}`);
    console.log(`📚 NotesHub API available at http://localhost:${PORT}`);
});