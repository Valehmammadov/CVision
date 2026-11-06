# CVisionAI — AI-Powered CV Screening

**Smart HR Screening for ALAS Academy**

CVisionAI is an AI-powered recruitment assistant designed to simplify and improve the initial candidate screening process. It analyzes resumes against job descriptions, evaluates relevant skills and experience, and provides structured insights to help HR teams identify promising candidates more efficiently.

Built with ALAS Academy in mind, CVisionAI demonstrates how AI can make recruitment workflows faster, more consistent, and more transparent.

---

## The Problem

Recruitment teams often receive hundreds of applications for a single position. Reviewing every CV manually takes considerable time and effort.

This creates several challenges:

- Time-consuming manual resume screening.
- Difficulty comparing candidates against consistent job requirements.
- Risk of overlooking qualified applicants.
- Lack of structured and transparent candidate evaluation.
- Increased workload for HR professionals.

## Our Solution

CVisionAI helps address these challenges by automating the initial CV screening process.

Recruiters can provide a job description, upload candidate resumes, and receive AI-assisted evaluations based on relevant qualifications, professional experience, technical expertise, and teaching or communication abilities.

Instead of manually reviewing every application from scratch, HR professionals can use structured candidate insights to prioritize their attention and make more informed decisions.

---

## Key Features

- **CV Upload:** Upload candidate resumes in supported PDF and DOCX formats.
- **Job Description Analysis:** Define the position's requirements and evaluation criteria.
- **AI-Assisted Screening:** Compare candidate qualifications and experience against job requirements.
- **Candidate Match Scores:** Generate a match score to summarize candidate suitability.
- **Detailed Evaluation:** Review individual assessment categories, including:
  - Technical Expertise
  - Relevant Experience
  - Teaching & Mentorship Ability
  - Culture & Soft Skills
- **Strengths & Skill Gaps:** Identify relevant qualifications and areas where candidates may lack experience.
- **Candidate Filtering:** Filter applicants by match score.
- **Candidate Details:** Explore individual candidate profiles and evaluation explanations.
- **Interview Workflow:** Use the interview action to demonstrate the next step in the recruitment process.

---

## How It Works

1. **Define the Position:** Enter the job description and required qualifications.
2. **Upload Resumes:** Add candidate CVs in supported formats.
3. **Analyze Candidates:** CVisionAI extracts relevant information and evaluates candidates against the position requirements.
4. **Review Results:** Explore match scores, strengths, skill gaps, and detailed evaluation metrics.
5. **Prioritize Candidates:** Use the results to support the HR team's interview shortlisting process.

---

## Technology Stack

| Technology | Purpose |
|---|---|
| Next.js | React-based application framework |
| React | User interface |
| TypeScript | Type-safe development |
| Tailwind CSS | Styling and responsive design |
| shadcn/ui | UI components |
| Lucide React | Icons |
| Framer Motion | Animations |
| PDF.js | PDF text extraction |
| Mammoth | DOCX text extraction |
| AI API | AI-assisted candidate evaluation |

*The exact AI provider and implementation depend on the configured environment.*

---

## Getting Started

Follow these instructions to run CVisionAI locally.

### Prerequisites

- Node.js (LTS recommended)
- npm
- Git

### 1. Clone the repository

```bash
git clone https://github.com/YOUR_USERNAME/cvisionai.git
```

### 2. Navigate to the project directory

```bash
cd cvisionai
```

### 3. Install dependencies

```bash
npm install
```

### 4. Configure environment variables

Create a `.env.local` file in the project root.

Example:

```env
GEMINI_API_KEY=your_api_key_here
```

If your project uses another AI provider, configure the corresponding environment variable instead.

**Important:** Never commit `.env.local` or expose API keys in client-side code.

### 5. Start the development server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

---

## Project Structure

A simplified overview of the application:

```text
cvisionai/
├── app/                  # Next.js application routes
├── components/           # Reusable UI components
├── lib/                  # Screening logic and utilities
├── public/               # Static assets
├── .env.example          # Environment variable template
├── .gitignore
├── package.json
└── README.md
```

*The actual structure may vary depending on the implementation.*

---

## Example Use Case: ALAS Academy

**Position:** Software Development Instructor

CVisionAI can evaluate applicants against requirements such as:

- Strong knowledge of JavaScript, React, and Node.js.
- At least three years of professional software development experience.
- Previous teaching, mentoring, or student-guidance experience.
- Ability to explain complex technical concepts.
- Strong communication skills.
- Azerbaijani and English language proficiency.

The system provides structured candidate evaluations to help recruiters identify applicants whose qualifications best align with the position.

---

## Responsible AI & Human Oversight

CVisionAI is designed as a decision-support tool, not an autonomous hiring system.

- Match scores are indicators, not guarantees of candidate performance.
- Evaluations should focus on job-related qualifications and experience.
- AI-generated assessments should be reviewed by a human recruiter.
- Sensitive personal information should not influence candidate rankings.
- Candidate data should be handled securely and responsibly.

The final recruitment decision always belongs to the hiring team.

---

## Project Status

**Hackathon MVP — In Development**

CVisionAI is a prototype demonstrating an AI-assisted approach to recruitment screening. Some features, such as interview scheduling, may be simulated for demonstration purposes.

---

## Future Improvements

- Integration with additional AI models.
- Advanced semantic matching between job descriptions and resumes.
- OCR support for scanned documents.
- Candidate comparison and ranking tools.
- HR analytics and reporting.
- Secure candidate management and authentication.
- Integration with real email and recruitment platforms.

---

## Built For

**ALAS Academy Hackathon**

Developed to explore how artificial intelligence can solve practical challenges in recruitment and human resource management.

---

*CVisionAI — Making candidate screening smarter, faster, and more transparent.*
