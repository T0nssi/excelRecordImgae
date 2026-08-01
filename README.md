# 📊 Excel Template Validator

A web application for creating Excel templates with validation rules and uploading/validating Excel files against those templates.

## Features

✅ **Template Builder**
- Upload a sample Excel file
- Preview the data
- Define validation rules per column (type, required, range, length, format, uniqueness)
- Create reusable templates

✅ **File Validation**
- Upload Excel files
- Validate against any template
- Get detailed error reports by row and column
- Download invalid files for fixing

✅ **Supported Data Types**
- Text (with max length)
- Number (with min/max range)
- Date
- Boolean

## Project Structure

```
.
├── backend/               # Node.js Express API
│   ├── src/
│   │   ├── db/           # Database setup
│   │   ├── services/     # Business logic (Excel validator)
│   │   ├── routes/       # API endpoints
│   │   └── index.ts      # Express server
│   └── package.json
├── frontend/             # React UI
│   ├── src/
│   │   ├── pages/        # Components (TemplateBuilder, UploadForm)
│   │   └── App.tsx
│   └── package.json
├── docker-compose.yml    # PostgreSQL container
└── README.md
```

## Setup & Installation

### Prerequisites
- Node.js 16+ 
- npm or yarn
- Docker & Docker Compose (for database)

### 1. Start PostgreSQL

```bash
docker-compose up -d
```

This starts a PostgreSQL instance on `localhost:5432`.

### 2. Backend Setup

```bash
cd backend

# Install dependencies
npm install

# Copy environment file
cp .env.example .env

# Initialize database (create tables)
npm run db:init

# Start server in development mode
npm run dev
```

The backend will be running on `http://localhost:3001`.

### 3. Frontend Setup

```bash
cd frontend

# Install dependencies
npm install

# Start React development server
npm start
```

The frontend will be running on `http://localhost:3000`.

## API Endpoints

### Templates

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/templates` | Create a new template |
| GET | `/api/templates` | List all templates |
| GET | `/api/templates/:id` | Get template with rules |
| DELETE | `/api/templates/:id` | Delete a template |

### Uploads

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/uploads/preview` | Preview Excel file (no template) |
| POST | `/api/uploads/validate` | Upload and validate against template |
| GET | `/api/uploads/:uploadId` | Get upload details and validation errors |
| GET | `/api/uploads/:uploadId/download` | Download the uploaded file |

## Usage Workflow

### 1. Create a Template

1. Go to "✏️ Create Template" tab
2. Upload a sample Excel file with your desired structure
3. Select the start row (if headers aren't in row 1)
4. Click "👁️ Preview" to see the data
5. Define validation rules for each column:
   - Data type (Text, Number, Date, Boolean)
   - Mark as required/optional
   - Set constraints (min/max for numbers, max length for text)
   - Enable uniqueness check if needed
6. Give the template a name and description
7. Click "✅ Create Template"

### 2. Upload & Validate

1. Go to "📤 Upload & Validate" tab
2. Select the template from the dropdown
3. Upload your Excel file
4. The system will:
   - Parse the file
   - Apply all template rules
   - Show validation results

If validation **passes**: ✅ File is saved with metadata
If validation **fails**: Show all errors by row/column with details

## Validation Rules

### Data Type Validation
- **Text**: Validates value is string
- **Number**: Validates value is numeric (with optional min/max)
- **Date**: Validates value is a valid date
- **Boolean**: Accepts true/false or "true"/"false"

### Field Constraints
- **Required**: Field cannot be empty
- **Min/Max Value**: For numbers, ensure value is in range
- **Max Length**: For text, limit character count
- **Format**: Regex pattern matching for custom validation
- **Unique**: No duplicate values in column

## Example Workflow

### Sample Template

Create a "Sales Report" template with rules:
- **Date** (Column A): Required, format YYYY-MM-DD
- **Amount** (Column B): Number, required, min: 0, max: 1000000
- **Product** (Column C): Text, required, max length: 100
- **Region** (Column D): Text, required, unique values

### Upload & Validate

Upload a sales.xlsx file → System validates:
- ✓ All dates are valid
- ✓ All amounts are numbers between 0-1000000
- ✓ Product names max 100 chars
- ✓ No duplicate regions

If errors found → Shows exactly which rows/columns failed and why.

## Development

### Backend Routes

```typescript
// Template creation
POST /api/templates
{
  name: string,
  description?: string,
  startRow: number,
  rules: Array<{
    columnName: string,
    columnLetter: string,
    dataType: 'text' | 'number' | 'date' | 'boolean',
    required?: boolean,
    minValue?: number,
    maxValue?: number,
    maxLength?: number,
    format?: string,
    uniqueValues?: boolean
  }>
}
```

### Environment Variables

**Backend (.env)**
```
DB_HOST=localhost
DB_PORT=5432
DB_USER=postgres
DB_PASSWORD=postgres
DB_NAME=excel_validator
PORT=3001
UPLOAD_DIR=./uploads
```

## Troubleshooting

### "Database connection failed"
- Ensure PostgreSQL is running: `docker-compose ps`
- Check credentials in `.env` file

### "No templates found"
- Create a template first from the "Create Template" tab

### "File upload failed"
- Ensure file is valid Excel (.xlsx or .xls)
- Check file size is reasonable

### Frontend can't reach backend
- Verify backend is running on port 3001
- Check CORS is enabled in `backend/src/index.ts`

## Future Enhancements

- 📋 Document versioning and history
- 🖼️ Image management alongside files
- 👥 Multi-user collaboration
- 📊 Validation reports and analytics
- 🔄 Automatic file processing queue
- 🔐 User authentication and permissions

## License

MIT