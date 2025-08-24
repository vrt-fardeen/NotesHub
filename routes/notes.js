const express = require("express");
const router = express.Router();
const Notes = require("../models/notes");
const Program = require("../models/program");
const Semester = require("../models/semester");

// GET all notes with pagination and filtering
router.get("/", async (req, res) => {
    try {
        const { 
            page = 1, 
            limit = 10, 
            program, 
            semester, 
            subject, 
            tags, 
            search,
            isPublic 
        } = req.query;

        const query = {};

        // Apply filters
        if (program) query.program = program;
        if (semester) query.semester = semester;
        if (subject) query.subject = { $regex: subject, $options: "i" };
        if (tags) query.tags = { $in: tags.split(",") };
        if (isPublic !== undefined) query.isPublic = isPublic === "true";

        // Text search
        if (search) {
            query.$text = { $search: search };
        }

        const options = {
            page: parseInt(page),
            limit: parseInt(limit),
            populate: [
                { path: "program", select: "name code" },
                { path: "semester", select: "name academicYear" }
            ],
            sort: { createdAt: -1 }
        };

        const notes = await Notes.paginate(query, options);
        
        res.json({
            success: true,
            data: notes.docs,
            pagination: {
                page: notes.page,
                limit: notes.limit,
                totalDocs: notes.totalDocs,
                totalPages: notes.totalPages,
                hasNextPage: notes.hasNextPage,
                hasPrevPage: notes.hasPrevPage
            }
        });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

// GET notes by program (must come before /:id route)
router.get("/program/:programId", async (req, res) => {
    try {
        const notes = await Notes.find({ program: req.params.programId })
            .populate("program", "name code")
            .populate("semester", "name academicYear")
            .sort({ createdAt: -1 });

        res.json({ success: true, data: notes });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

// GET notes by semester (must come before /:id route)
router.get("/semester/:semesterId", async (req, res) => {
    try {
        const notes = await Notes.find({ semester: req.params.semesterId })
            .populate("program", "name code")
            .populate("semester", "name academicYear")
            .sort({ createdAt: -1 });

        res.json({ success: true, data: notes });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

// GET notes by subject (must come before /:id route)
router.get("/subject/:subject", async (req, res) => {
    try {
        const notes = await Notes.find({
            subject: { $regex: req.params.subject, $options: "i" }
        })
            .populate("program", "name code")
            .populate("semester", "name academicYear")
            .sort({ createdAt: -1 });

        res.json({ success: true, data: notes });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

// GET single note by ID (must come after specific routes)
router.get("/:id", async (req, res) => {
    try {
        const note = await Notes.findById(req.params.id)
            .populate("program", "name code")
            .populate("semester", "name academicYear");

        if (!note) {
            return res.status(404).json({ success: false, error: "Note not found" });
        }

        res.json({ success: true, data: note });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

// POST create new note
router.post("/", async (req, res) => {
    try {
        const {
            title,
            content,
            fileUrl,
            program,
            semester,
            subject,
            tags,
            author,
            isPublic,
            fileType,
            fileSize
        } = req.body;

        // Validate required fields
        if (!title || !content || !program || !semester || !subject) {
            return res.status(400).json({
                success: false,
                error: "Title, content, program, semester, and subject are required"
            });
        }

        // Validate program and semester exist
        const [programExists, semesterExists] = await Promise.all([
            Program.findById(program),
            Semester.findById(semester)
        ]);

        if (!programExists) {
            return res.status(400).json({ success: false, error: "Invalid program" });
        }

        if (!semesterExists) {
            return res.status(400).json({ success: false, error: "Invalid semester" });
        }

        const note = new Notes({
            title,
            content,
            fileUrl,
            program,
            semester,
            subject,
            tags: tags || [],
            author: author || "Anonymous",
            isPublic: isPublic || false,
            fileType: fileType || "other",
            fileSize: fileSize || 0
        });

        const savedNote = await note.save();
        const populatedNote = await Notes.findById(savedNote._id)
            .populate("program", "name code")
            .populate("semester", "name academicYear");

        res.status(201).json({ success: true, data: populatedNote });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

// PUT update note
router.put("/:id", async (req, res) => {
    try {
        const {
            title,
            content,
            fileUrl,
            program,
            semester,
            subject,
            tags,
            author,
            isPublic,
            fileType,
            fileSize
        } = req.body;

        const updateData = {};
        if (title !== undefined) updateData.title = title;
        if (content !== undefined) updateData.content = content;
        if (fileUrl !== undefined) updateData.fileUrl = fileUrl;
        if (program !== undefined) updateData.program = program;
        if (semester !== undefined) updateData.semester = semester;
        if (subject !== undefined) updateData.subject = subject;
        if (tags !== undefined) updateData.tags = tags;
        if (author !== undefined) updateData.author = author;
        if (isPublic !== undefined) updateData.isPublic = isPublic;
        if (fileType !== undefined) updateData.fileType = fileType;
        if (fileSize !== undefined) updateData.fileSize = fileSize;

        const note = await Notes.findByIdAndUpdate(
            req.params.id,
            updateData,
            { new: true, runValidators: true }
        ).populate("program", "name code")
         .populate("semester", "name academicYear");

        if (!note) {
            return res.status(404).json({ success: false, error: "Note not found" });
        }

        res.json({ success: true, data: note });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

// DELETE note
router.delete("/:id", async (req, res) => {
    try {
        const note = await Notes.findByIdAndDelete(req.params.id);
        
        if (!note) {
            return res.status(404).json({ success: false, error: "Note not found" });
        }

        res.json({ success: true, message: "Note deleted successfully" });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

module.exports = router;
