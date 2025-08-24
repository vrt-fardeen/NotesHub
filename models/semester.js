const mongoose = require("mongoose");
const Program = require("./program");

const Schema = mongoose.Schema;

const semesterSchema = new Schema({
    name: {
        type: String,
        required: [true, "Semester name is required"],
        trim: true,
        maxlength: [50, "Semester name cannot exceed 50 characters"]
    },
    number: {
        type: Number,
        required: [true, "Semester number is required"],
        min: 1,
        max: 12
    },
    academicYear: {
        type: String,
        required: [true, "Academic year is required"],
        trim: true,
        match: [/^\d{4}-\d{4}$/, "Academic year must be in format YYYY-YYYY"]
    },
    program: {
        type: Schema.Types.ObjectId,
        ref: "Program",
        required: [true, "Program is required"]
    },
    startDate: {
        type: Date,
        required: [true, "Start date is required"]
    },
    endDate: {
        type: Date,
        required: [true, "End date is required"]
    },
    isActive: {
        type: Boolean,
        default: true
    },
    subjects: [{
        name: {
            type: String,
            required: true,
            trim: true
        },
        code: {
            type: String,
            required: true,
            trim: true,
            uppercase: true
        },
        credits: {
            type: Number,
            min: 1,
            max: 6,
            default: 3
        }
    }]
}, {
    timestamps: true
});

// Indexes
semesterSchema.index({ program: 1, academicYear: 1, number: 1 });
semesterSchema.index({ startDate: 1, endDate: 1 });

// Virtual for semester display name
semesterSchema.virtual("displayName").get(function() {
    return `${this.name} - ${this.academicYear}`;
});

// Validate that end date is after start date
semesterSchema.pre("save", function(next) {
    if (this.startDate && this.endDate && this.startDate >= this.endDate) {
        next(new Error("End date must be after start date"));
    }
    next();
});

const Semester = mongoose.model("Semester", semesterSchema);
module.exports = Semester;