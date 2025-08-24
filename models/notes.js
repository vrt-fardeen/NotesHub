const mongoose = require("mongoose");
const mongoosePaginate = require("mongoose-paginate-v2");

const Schema = mongoose.Schema;

const notesSchema = new Schema({
    title: {
        type: String,
        required: [true, "Title is required"],
        trim: true,
        maxlength: [200, "Title cannot exceed 200 characters"]
    },
    content: {
        type: String,
        required: [true, "Content is required"],
        trim: true
    },
    fileUrl: {
        type: String,
        trim: true,
        validate: {
            validator: function(v) {
                return !v || /^https?:\/\/.+/.test(v);
            },
            message: "File URL must be a valid HTTP/HTTPS URL"
        }
    },
    // Relationships
    program: {
        type: Schema.Types.ObjectId,
        ref: "Program",
        required: [true, "Program is required"]
    },
    semester: {
        type: Schema.Types.ObjectId,
        ref: "Semester",
        required: [true, "Semester is required"]
    },
    // Additional metadata
    subject: {
        type: String,
        required: [true, "Subject is required"],
        trim: true
    },
    tags: [{
        type: String,
        trim: true
    }],
    author: {
        type: String,
        trim: true,
        default: "Anonymous"
    },
    isPublic: {
        type: Boolean,
        default: false
    },
    // File metadata
    fileType: {
        type: String,
        enum: ["pdf", "doc", "docx", "txt", "image", "other"],
        default: "other"
    },
    fileSize: {
        type: Number, // in bytes
        min: 0
    }
}, {
    timestamps: true, // Adds createdAt and updatedAt fields
    toJSON: { virtuals: true },
    toObject: { virtuals: true }
});

// Indexes for better query performance
notesSchema.index({ title: "text", content: "text" });
notesSchema.index({ program: 1, semester: 1 });
notesSchema.index({ subject: 1 });
notesSchema.index({ tags: 1 });
notesSchema.index({ createdAt: -1 });

// Virtual for formatted date
notesSchema.virtual("formattedDate").get(function() {
    return this.createdAt.toLocaleDateString();
});

// Pre-save middleware to ensure tags are unique
notesSchema.pre("save", function(next) {
    if (this.tags) {
        this.tags = [...new Set(this.tags)]; // Remove duplicates
    }
    next();
});

// Add pagination plugin
notesSchema.plugin(mongoosePaginate);

const Notes = mongoose.model("Notes", notesSchema);
module.exports = Notes;