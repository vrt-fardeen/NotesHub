const express = require("express");
const router = express.Router();
const Semester = require("../models/semester");
const Program = require("../models/program");
const Notes = require("../models/notes");

// GET all semesters with optional filtering
router.get("/", async (req, res) => {
    try {
        const { program, academicYear, isActive } = req.query;
        const query = {};

        if (program) query.program = program;
        if (academicYear) query.academicYear = academicYear;
        if (isActive !== undefined) query.isActive = isActive === "true";

        const semesters = await Semester.find(query)
            .populate("program", "name code")
            .sort({ academicYear: -1, number: 1 });

        res.json({ success: true, data: semesters });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

// GET semesters by program (must come before /:id route)
router.get("/program/:programId", async (req, res) => {
    try {
        const semesters = await Semester.find({ program: req.params.programId })
            .populate("program", "name code")
            .sort({ academicYear: -1, number: 1 });

        res.json({ success: true, data: semesters });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

// GET semesters by academic year (must come before /:id route)
router.get("/year/:academicYear", async (req, res) => {
    try {
        const semesters = await Semester.find({ academicYear: req.params.academicYear })
            .populate("program", "name code")
            .sort({ number: 1 });

        res.json({ success: true, data: semesters });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

// GET single semester by ID (must come after specific routes)
router.get("/:id", async (req, res) => {
    try {
        const semester = await Semester.findById(req.params.id)
            .populate("program", "name code");

        if (!semester) {
            return res.status(404).json({ success: false, error: "Semester not found" });
        }

        res.json({ success: true, data: semester });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

// POST create new semester
router.post("/", async (req, res) => {
    try {
        const {
            name,
            number,
            academicYear,
            program,
            startDate,
            endDate,
            isActive,
            subjects
        } = req.body;

        // Validate required fields
        if (!name || !number || !academicYear || !program || !startDate || !endDate) {
            return res.status(400).json({
                success: false,
                error: "Name, number, academic year, program, start date, and end date are required"
            });
        }

        // Validate program exists
        const programExists = await Program.findById(program);
        if (!programExists) {
            return res.status(400).json({ success: false, error: "Invalid program" });
        }

        // Check if semester with same number and academic year already exists for this program
        const existingSemester = await Semester.findOne({
            program,
            number,
            academicYear
        });

        if (existingSemester) {
            return res.status(400).json({
                success: false,
                error: "Semester with this number and academic year already exists for this program"
            });
        }

        const semester = new Semester({
            name,
            number,
            academicYear,
            program,
            startDate: new Date(startDate),
            endDate: new Date(endDate),
            isActive: isActive !== undefined ? isActive : true,
            subjects: subjects || []
        });

        const savedSemester = await semester.save();
        const populatedSemester = await Semester.findById(savedSemester._id)
            .populate("program", "name code");

        res.status(201).json({ success: true, data: populatedSemester });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

// PUT update semester
router.put("/:id", async (req, res) => {
    try {
        const {
            name,
            number,
            academicYear,
            program,
            startDate,
            endDate,
            isActive,
            subjects
        } = req.body;

        const updateData = {};
        if (name !== undefined) updateData.name = name;
        if (number !== undefined) updateData.number = number;
        if (academicYear !== undefined) updateData.academicYear = academicYear;
        if (program !== undefined) updateData.program = program;
        if (startDate !== undefined) updateData.startDate = new Date(startDate);
        if (endDate !== undefined) updateData.endDate = new Date(endDate);
        if (isActive !== undefined) updateData.isActive = isActive;
        if (subjects !== undefined) updateData.subjects = subjects;

        // Validate program exists if updating
        if (program) {
            const programExists = await Program.findById(program);
            if (!programExists) {
                return res.status(400).json({ success: false, error: "Invalid program" });
            }
        }

        // Check for duplicate semester if updating number/academic year
        if (number || academicYear || program) {
            const currentSemester = await Semester.findById(req.params.id);
            const checkNumber = number || currentSemester.number;
            const checkAcademicYear = academicYear || currentSemester.academicYear;
            const checkProgram = program || currentSemester.program;

            const existingSemester = await Semester.findOne({
                program: checkProgram,
                number: checkNumber,
                academicYear: checkAcademicYear,
                _id: { $ne: req.params.id }
            });

            if (existingSemester) {
                return res.status(400).json({
                    success: false,
                    error: "Semester with this number and academic year already exists for this program"
                });
            }
        }

        const semester = await Semester.findByIdAndUpdate(
            req.params.id,
            updateData,
            { new: true, runValidators: true }
        ).populate("program", "name code");

        if (!semester) {
            return res.status(404).json({ success: false, error: "Semester not found" });
        }

        res.json({ success: true, data: semester });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

// DELETE semester
router.delete("/:id", async (req, res) => {
    try {
        // Check if semester has associated notes
        const notesCount = await Notes.countDocuments({ semester: req.params.id });
        
        if (notesCount > 0) {
            return res.status(400).json({
                success: false,
                error: `Cannot delete semester. It has ${notesCount} associated notes.`
            });
        }

        const semester = await Semester.findByIdAndDelete(req.params.id);
        
        if (!semester) {
            return res.status(404).json({ success: false, error: "Semester not found" });
        }

        res.json({ success: true, message: "Semester deleted successfully" });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

// GET semester statistics
router.get("/:id/stats", async (req, res) => {
    try {
        const semester = await Semester.findById(req.params.id)
            .populate("program", "name code");

        if (!semester) {
            return res.status(404).json({ success: false, error: "Semester not found" });
        }

        const [totalNotes, publicNotes, privateNotes] = await Promise.all([
            Notes.countDocuments({ semester: req.params.id }),
            Notes.countDocuments({ semester: req.params.id, isPublic: true }),
            Notes.countDocuments({ semester: req.params.id, isPublic: false })
        ]);

        const subjects = await Notes.distinct("subject", { semester: req.params.id });

        res.json({
            success: true,
            data: {
                semester,
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
