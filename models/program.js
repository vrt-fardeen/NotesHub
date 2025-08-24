const mongoose = require("mongoose");

const Schema = mongoose.Schema;

const programSchema = new Schema({
    name: {
        type: String,
        required: [true, "Program name is required"],
        trim: true,
        unique: true,
        maxlength: [100, "Program name cannot exceed 100 characters"]
    },
    code: {
        type: String,
        required: [true, "Program code is required"],
        trim: true,
        unique: true,
        uppercase: true,
        maxlength: [10, "Program code cannot exceed 10 characters"]
    },
    description: {
        type: String,
        trim: true,
        maxlength: [500, "Description cannot exceed 500 characters"]
    },
    duration: {
        type: Number, // in semesters
        min: 1,
        default: 8
    },
    isActive: {
        type: Boolean,
        default: true
    }
}, {
    timestamps: true
});

// Indexes
programSchema.index({ name: 1 });
programSchema.index({ code: 1 });

const Program = mongoose.model("Program", programSchema);
module.exports = Program;