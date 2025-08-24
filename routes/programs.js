const express = require("express");
const router = express.Router();
const Program = require("../models/program");
const Notes = require("../models/notes");

// GET all programs
router.get("/", async (req, res) => {
    try {
        const { isActive } = req.query;
        const query = {};
        
        if (isActive !== undefined) {
            query.isActive = isActive === "true";
        }

        const programs = await Program.find(query).sort({ name: 1 });
        res.json({ success: true, data: programs });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

// GET single program by ID
router.get("/:id", async (req, res) => {
    try {
        const program = await Program.findById(req.params.id);
        
        if (!program) {
            return res.status(404).json({ success: false, error: "Program not found" });
        }

        res.json({ success: true, data: program });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

// POST create new program
router.post("/", async (req, res) => {
    try {
        const { name, code, description, duration, isActive } = req.body;

        // Validate required fields
        if (!name || !code) {
            return res.status(400).json({
                success: false,
                error: "Name and code are required"
            });
        }

        // Check if program with same name or code already exists
        const existingProgram = await Program.findOne({
            $or: [{ name }, { code }]
        });

        if (existingProgram) {
            return res.status(400).json({
                success: false,
                error: "Program with this name or code already exists"
            });
        }

        const program = new Program({
            name,
            code,
            description,
            duration: duration || 8,
            isActive: isActive !== undefined ? isActive : true
        });

        const savedProgram = await program.save();
        res.status(201).json({ success: true, data: savedProgram });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

// PUT update program
router.put("/:id", async (req, res) => {
    try {
        const { name, code, description, duration, isActive } = req.body;

        const updateData = {};
        if (name !== undefined) updateData.name = name;
        if (code !== undefined) updateData.code = code;
        if (description !== undefined) updateData.description = description;
        if (duration !== undefined) updateData.duration = duration;
        if (isActive !== undefined) updateData.isActive = isActive;

        // Check for duplicate name/code if updating
        if (name || code) {
            const existingProgram = await Program.findOne({
                $or: [
                    ...(name ? [{ name }] : []),
                    ...(code ? [{ code }] : [])
                ],
                _id: { $ne: req.params.id }
            });

            if (existingProgram) {
                return res.status(400).json({
                    success: false,
                    error: "Program with this name or code already exists"
                });
            }
        }

        const program = await Program.findByIdAndUpdate(
            req.params.id,
            updateData,
            { new: true, runValidators: true }
        );

        if (!program) {
            return res.status(404).json({ success: false, error: "Program not found" });
        }

        res.json({ success: true, data: program });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

// DELETE program
router.delete("/:id", async (req, res) => {
    try {
        // Check if program has associated notes
        const notesCount = await Notes.countDocuments({ program: req.params.id });
        
        if (notesCount > 0) {
            return res.status(400).json({
                success: false,
                error: `Cannot delete program. It has ${notesCount} associated notes.`
            });
        }

        const program = await Program.findByIdAndDelete(req.params.id);
        
        if (!program) {
            return res.status(404).json({ success: false, error: "Program not found" });
        }

        res.json({ success: true, message: "Program deleted successfully" });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

// GET program statistics
router.get("/:id/stats", async (req, res) => {
    try {
        const program = await Program.findById(req.params.id);
        
        if (!program) {
            return res.status(404).json({ success: false, error: "Program not found" });
        }

        const [totalNotes, publicNotes, privateNotes] = await Promise.all([
            Notes.countDocuments({ program: req.params.id }),
            Notes.countDocuments({ program: req.params.id, isPublic: true }),
            Notes.countDocuments({ program: req.params.id, isPublic: false })
        ]);

        const subjects = await Notes.distinct("subject", { program: req.params.id });

        res.json({
            success: true,
            data: {
                program,
                stats: {
                    totalNotes,
                    publicNotes,
                    privateNotes,
                    uniqueSubjects: subjects.length
                }
            }
        });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

module.exports = router;
