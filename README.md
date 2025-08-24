# NotesHub API

A comprehensive notes management system for academic institutions built with Node.js, Express, and MongoDB.

## 🚀 Features

- **Academic Organization**: Organize notes by programs, semesters, and subjects
- **Rich Metadata**: Support for tags, authors, file attachments, and privacy settings
- **Advanced Search**: Full-text search with filtering and pagination
- **RESTful API**: Complete CRUD operations for all entities
- **Data Validation**: Comprehensive input validation and error handling
- **Performance Optimized**: Database indexes and efficient queries

## 📋 Prerequisites

- Node.js (v14 or higher)
- MongoDB (v4.4 or higher)
- npm or yarn

## 🛠️ Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd NotesHub
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up environment variables** (optional)
   ```bash
   # Create .env file
   PORT=8080
   MONGO_URL=mongodb://127.0.0.1:27017/notesHub
   NODE_ENV=development
   ```

4. **Start MongoDB**
   ```bash
   # Make sure MongoDB is running on your system
   mongod
   ```

5. **Run the application**
   ```bash
   # Development mode
   npm run dev
   
   # Production mode
   npm start
   ```

The application will be available at `http://localhost:8080`

## 🌐 Frontend Features

The NotesHub application includes a beautiful, responsive web interface with the following features:

### 📊 **Dashboard**
- Real-time statistics showing total programs, semesters, notes, and subjects
- Recent notes display with quick access
- Beautiful animated stat cards with gradient backgrounds

### 🎓 **Programs Management**
- Create, view, and delete academic programs
- Search functionality for programs
- Program statistics and analytics
- Active/inactive status indicators

### 📅 **Semesters Management**
- Create and manage academic semesters
- Filter by program and academic year
- Semester statistics and subject tracking
- Date range management

### 📝 **Notes Management**
- Create rich notes with titles, content, and metadata
- Advanced search and filtering capabilities
- Tag-based organization
- Public/private note settings
- Pagination for large datasets

### 🎨 **User Interface**
- **Modern Design**: Clean, professional interface with gradient backgrounds
- **Responsive Layout**: Works perfectly on desktop, tablet, and mobile devices
- **Interactive Elements**: Hover effects, animations, and smooth transitions
- **Modal Forms**: Clean, accessible forms for data entry
- **Real-time Updates**: Dynamic content loading without page refreshes
- **Loading States**: Professional loading spinners and feedback
- **Notifications**: Success and error notifications with animations

### 🔧 **Technical Features**
- **Single Page Application**: Smooth navigation without page reloads
- **API Integration**: Full integration with the REST API
- **Form Validation**: Client-side and server-side validation
- **Error Handling**: Comprehensive error handling and user feedback
- **Search & Filter**: Real-time search and advanced filtering
- **Pagination**: Efficient handling of large datasets

## 📚 API Endpoints

### Health Check
- `GET /` - API health check and endpoint information

### Programs
- `GET /api/programs` - Get all programs
- `GET /api/programs/:id` - Get program by ID
- `POST /api/programs` - Create new program
- `PUT /api/programs/:id` - Update program
- `DELETE /api/programs/:id` - Delete program
- `GET /api/programs/:id/stats` - Get program statistics

### Semesters
- `GET /api/semesters` - Get all semesters
- `GET /api/semesters/:id` - Get semester by ID
- `POST /api/semesters` - Create new semester
- `PUT /api/semesters/:id` - Update semester
- `DELETE /api/semesters/:id` - Delete semester
- `GET /api/semesters/:id/stats` - Get semester statistics
- `GET /api/semesters/program/:programId` - Get semesters by program
- `GET /api/semesters/year/:academicYear` - Get semesters by academic year

### Notes
- `GET /api/notes` - Get all notes (with pagination and filtering)
- `GET /api/notes/:id` - Get note by ID
- `POST /api/notes` - Create new note
- `PUT /api/notes/:id` - Update note
- `DELETE /api/notes/:id` - Delete note
- `GET /api/notes/program/:programId` - Get notes by program
- `GET /api/notes/semester/:semesterId` - Get notes by semester
- `GET /api/notes/subject/:subject` - Get notes by subject

## 🔧 Usage Examples

### Create a Program
```bash
curl -X POST http://localhost:8080/api/programs \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Computer Science",
    "code": "CS",
    "description": "Bachelor of Computer Science",
    "duration": 8
  }'
```

### Create a Semester
```bash
curl -X POST http://localhost:8080/api/semesters \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Fall 2024",
    "number": 1,
    "academicYear": "2024-2025",
    "program": "PROGRAM_ID_HERE",
    "startDate": "2024-09-01",
    "endDate": "2024-12-15"
  }'
```

### Create a Note
```bash
curl -X POST http://localhost:8080/api/notes \
  -H "Content-Type: application/json" \
  -d '{
    "title": "Introduction to Algorithms",
    "content": "This note covers the basics of algorithm analysis...",
    "program": "PROGRAM_ID_HERE",
    "semester": "SEMESTER_ID_HERE",
    "subject": "Data Structures",
    "tags": ["algorithms", "complexity", "big-o"],
    "author": "John Doe",
    "isPublic": true
  }'
```

### Search Notes with Filters
```bash
curl "http://localhost:8080/api/notes?search=algorithm&program=PROGRAM_ID&page=1&limit=10"
```

## 📊 Data Models

### Program Schema
```javascript
{
  name: String (required, unique),
  code: String (required, unique),
  description: String,
  duration: Number (semesters),
  isActive: Boolean,
  createdAt: Date,
  updatedAt: Date
}
```

### Semester Schema
```javascript
{
  name: String (required),
  number: Number (required, 1-12),
  academicYear: String (required, format: YYYY-YYYY),
  program: ObjectId (required, ref: Program),
  startDate: Date (required),
  endDate: Date (required),
  isActive: Boolean,
  subjects: [{
    name: String,
    code: String,
    credits: Number
  }],
  createdAt: Date,
  updatedAt: Date
}
```

### Notes Schema
```javascript
{
  title: String (required),
  content: String (required),
  fileUrl: String,
  program: ObjectId (required, ref: Program),
  semester: ObjectId (required, ref: Semester),
  subject: String (required),
  tags: [String],
  author: String,
  isPublic: Boolean,
  fileType: String (enum: pdf, doc, docx, txt, image, other),
  fileSize: Number,
  createdAt: Date,
  updatedAt: Date
}
```

## 🔍 Query Parameters

### Notes Endpoints
- `page` - Page number (default: 1)
- `limit` - Items per page (default: 10)
- `program` - Filter by program ID
- `semester` - Filter by semester ID
- `subject` - Filter by subject (case-insensitive)
- `tags` - Filter by tags (comma-separated)
- `search` - Full-text search
- `isPublic` - Filter by public/private status

### Programs Endpoints
- `isActive` - Filter by active status

### Semesters Endpoints
- `program` - Filter by program ID
- `academicYear` - Filter by academic year
- `isActive` - Filter by active status

## 🛡️ Error Handling

The API returns consistent error responses:

```json
{
  "success": false,
  "error": "Error message description"
}
```

Common HTTP status codes:
- `200` - Success
- `201` - Created
- `400` - Bad Request (validation errors)
- `404` - Not Found
- `500` - Internal Server Error

## 🚀 Performance Features

- **Database Indexes**: Optimized queries for common operations
- **Pagination**: Efficient handling of large datasets
- **Population**: Automatic loading of related data
- **Text Search**: Full-text search capabilities
- **Validation**: Input validation at the schema level

## 🔧 Development

### Running in Development Mode
```bash
npm run dev
```

### Project Structure
```
NotesHub/
├── app.js              # Main application file
├── models/             # Database models
│   ├── notes.js
│   ├── program.js
│   └── semester.js
├── routes/             # API routes
│   ├── notes.js
│   ├── programs.js
│   └── semesters.js
├── package.json
└── README.md
```

## 📝 License

This project is licensed under the ISC License.

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## 📞 Support

For support and questions, please open an issue in the repository.
