# HR Portal Backend

HR Portal is a comprehensive recruitment management system built with Node.js and Express.

## Features

- **Candidate Management**: Add, update, and track candidates throughout the recruitment process
- **Resume Processing**: Upload and parse PDF/DOCX resumes using AI
- **Interview Scheduling**: Schedule and manage interviews with automated email notifications
- **Offer Management**: Create and send offer letters with customized terms
- **AI Assistant**: 
  - Resume vs JD Analysis using Gemini AI
  - JD suggestions based on candidate resume
  - Interview tips and preparation
- **Email Integration**: Support for Gmail and Outlook email services
- **Database**: MySQL with comprehensive schema for candidate tracking

## Setup Instructions

### Prerequisites
- Node.js 14+
- MySQL 5.7+
- Gemini API key

### Installation

1. **Install dependencies**:
```bash
cd server
npm install
```

2. **Configure environment variables**:
```bash
cp .env.example .env
```

Edit `.env` with your configuration:
```
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=your_password
DB_NAME=hr_portal
GEMINI_API_KEY=your_gemini_api_key
GMAIL_EMAIL=your_email@gmail.com
GMAIL_PASSWORD=your_app_password
PORT=5000
```

3. **Set up the database**:
```bash
mysql -u root -p < src/database/schema.sql
```

4. **Start the server**:
```bash
npm run dev
```

The server will run on `http://localhost:5000`

## API Endpoints

### Candidates
- `GET /api/candidates` - Get all candidates
- `POST /api/candidates` - Create new candidate
- `GET /api/candidates/:id` - Get candidate details
- `PUT /api/candidates/:id` - Update candidate
- `DELETE /api/candidates/:id` - Delete candidate

### Resumes
- `POST /api/resumes/upload` - Upload resume
- `GET /api/resumes/candidate/:candidateId` - Get candidate resumes
- `GET /api/resumes/:id` - Get resume details

### Interviews
- `GET /api/interviews` - Get all interviews
- `POST /api/interviews` - Create interview
- `GET /api/interviews/candidate/:candidateId` - Get candidate interviews
- `PUT /api/interviews/:id` - Update interview

### Offers
- `GET /api/offers/:id` - Get offer
- `POST /api/offers` - Create offer
- `PUT /api/offers/:id` - Update offer
- `POST /api/offers/:id/respond` - Accept/reject offer

### Emails
- `POST /api/emails/interview` - Send interview email
- `POST /api/emails/offer` - Send offer letter
- `GET /api/emails/logs` - Get email logs

### AI
- `POST /api/ai/analyze-resume` - Analyze resume vs JD
- `POST /api/ai/jd-suggestions` - Get JD suggestions
- `POST /api/ai/interview-tips` - Get interview tips

## Database Schema

### Tables
- **candidates**: Store candidate information
- **resumes**: Store uploaded resumes and parsed text
- **interviews**: Store interview schedules and feedback
- **offers**: Store job offers
- **email_logs**: Track sent emails

## Technologies Used

- **Backend**: Node.js, Express, MySQL2
- **AI**: Google Generative AI (Gemini)
- **Email**: Nodemailer
- **Resume Parsing**: pdf-parse, mammoth
- **Validation**: express-validator
- **Authentication**: JWT

## Frontend

The React frontend is available in the `client` directory. See [client/README.md](client/README.md) for frontend setup.
