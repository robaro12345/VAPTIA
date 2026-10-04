# CampusHub — Cybersecurity Laboratory Portal (V1 & V2)

CampusHub is a full-stack student portal designed as a controlled security laboratory application. It provides two side-by-side implementations:
- **V1 (Vulnerable):** Intentionally contains exactly five high-impact web security vulnerabilities.
- **V2 (Hardened):** Implements industry-standard defensive controls and remediations while preserving the exact same functionality and shared database schema.

---

## Architecture Overview

```text
                                CampusHub
                                    │
                  ┌─────────────────┴─────────────────┐
                  ▼                                   ▼
          V1 (Vulnerable)                     V2 (Hardened)
   ├── SQL Injection                   ├── Parameterized Queries (Prisma)
   ├── IDOR / BOLA                     ├── Server-side Object Authorization
   ├── Stored XSS                      ├── Contextual Output Encoding & Sanitization
   ├── Path Traversal                  ├── Canonicalization & Boundary Containment
   └── Unrestricted File Upload        └── Strict Extension, Magic Bytes & UUID Storage
```

### Technology Stack
- **Frontend:** Next.js (App Router), React, TypeScript, Tailwind CSS, Lucide Icons
- **Backend:** Node.js, Express, TypeScript, Multer, JWT, Bcrypt
- **Database:** PostgreSQL with Prisma ORM
- **Infrastructure:** Docker & Docker Compose

---

## Quickstart with Docker Compose

Ensure Docker Desktop or Docker Engine is running on your system.

### 1. Launch V1 (Vulnerable Environment)
```bash
# Copy V1 environment configuration
cp .env.v1 .env

# Build and start all services
docker compose up --build
```

### 2. Launch V2 (Hardened Environment)
```bash
# Switch to V2 environment configuration
cp .env.v2 .env

# Rebuild and start all services
docker compose up --build
```

The application will be accessible at:
- **Frontend Portal:** [http://localhost:3000](http://localhost:3000)
- **Backend API:** [http://localhost:5000](http://localhost:5000)
- **Database:** `localhost:5432` (`campushub_db`)

---

## Seed Accounts & Credentials

The database automatically seeds with realistic test accounts:

| Role | Email | Password | Details |
| :--- | :--- | :--- | :--- |
| **ADMIN** | `admin@campushub.local` | `Admin@123` | Institutional Administrator |
| **STUDENT** | `student1@campushub.local` | `Student@123` | Rahul Sharma (Roll: CS2026-001, Student ID: 1) |
| **STUDENT** | `student2@campushub.local` | `Student@123` | Priya Patel (Roll: IT2026-042, Student ID: 2) |
| **STUDENT** | `student3@campushub.local` | `Student@123` | Amit Kumar (Roll: ECE2026-015, Student ID: 3) |
| **STUDENT** | `student4@campushub.local` | `Student@123` | Sneha Reddy (Roll: CS2026-088, Student ID: 4) |

---

## Vulnerabilities & Remediation Matrix

### 1. SQL Injection (CWE-89)
- **Vulnerable Endpoint:** `GET /api/v1/students/search?name=<query>`
- **Vulnerable Mechanism:** Concatenates user input directly into an unparameterized SQL statement executed via `prisma.$queryRawUnsafe(...)`.
- **Testing Payload:**
  ```text
  GET /api/v1/students/search?name=' UNION SELECT 99,'HACK-999','Injected Course',4,NOW(),'Injected User','hack@lab.local'--
  GET /api/v1/students/search?name=' OR '1'='1
  ```
  Also directly testable with `sqlmap -u "http://localhost:5000/api/v1/students/search?name=Rahul" -H "Authorization: Bearer <TOKEN>"`.
- **V2 Remediation:** `GET /api/v2/students/search?name=<query>`
  Replaced with Prisma's parameterized ORM queries (`prisma.student.findMany({ where: { user: { name: { contains: name } } } })`), completely isolating user input from SQL interpretation.

---

### 2. IDOR / Broken Object-Level Authorization (CWE-639)
- **Vulnerable Endpoint:** `GET /api/v1/students/:id`
- **Vulnerable Mechanism:** When Student 1 (authenticated with Student ID 1) requests `GET /api/v1/students/2`, the backend retrieves and returns Student 2's profile and submissions without validating object ownership.
- **Testing Sequence:**
  1. Log in as `student1@campushub.local`.
  2. Navigate to `/students/1` (own profile).
  3. Change the URL to `/students/2`.
  4. In V1, Student 2's full confidential academic profile is returned.
- **V2 Remediation:** `GET /api/v2/students/:id`
  The backend enforces object ownership:
  ```typescript
  if (req.user.role !== 'ADMIN' && student.userId !== req.user.id) {
    return res.status(403).json({ error: 'Forbidden: You do not have permission to access another student\'s profile' });
  }
  ```
  Returns `403 Forbidden` if a non-admin attempts unauthorized access.

---

### 3. Stored Cross-Site Scripting (XSS) (CWE-79)
- **Vulnerable Endpoint:** `POST /api/v1/feedback` & `GET /api/v1/feedback`
- **Vulnerable Mechanism:** Feedback submissions accept raw HTML/JavaScript markup. The V1 frontend displays feedback content unsafely using `dangerouslySetInnerHTML={{ __html: content }}`.
- **Harmless Demonstration Payload:**
  ```html
  <img src=x onerror="alert('Stored XSS Verified: CampusHub V1 Security Lab')">
  ```
- **V2 Remediation:**
  - Backend validates content length and performs HTML entity encoding (`escapeHtml`) before storage.
  - Frontend renders feedback strictly as text (`<span>{content}</span>`), preventing browser script execution.

---

### 4. Path Traversal (CWE-22)
- **Vulnerable Endpoint:** `GET /api/v1/documents/:filename`
- **Vulnerable Mechanism:** Constructs target paths using `path.join('/app/storage/documents', req.params.filename)` without boundary containment checks.
- **Harmless Demonstration Payload:**
  ```text
  GET /api/v1/documents/..%2flab_flag.txt
  ```
  Serves the harmless container verification flag at `/app/storage/lab_flag.txt`.
- **V2 Remediation:** `GET /api/v2/documents/:filename`
  - Rejects traversal sequences (`..`, `/`, `\`, null bytes).
  - Uses `path.resolve` and verifies `resolvedPath.startsWith(documentsDir)`.
  - Returns `400 Bad Request` or `403 Forbidden` for traversal attempts.

---

### 5. Unrestricted File Upload (CWE-434)
- **Vulnerable Endpoint:** `POST /api/v1/assignments/:id/submission`
- **Vulnerable Mechanism:** Accepts arbitrary extensions (e.g. `.js`, `.sh`, `.php`), retains user-supplied filenames, lacks MIME/magic bytes validation, and allows execution inside the container via `POST /api/v1/assignments/submissions/:id/execute`.
- **V2 Remediation:** `POST /api/v2/assignments/:id/submission`
  - Strict extension allowlist: `.pdf`, `.docx`, `.txt`
  - MIME validation: `application/pdf`, `application/vnd.openxmlformats-officedocument.wordprocessingml.document`, `text/plain`
  - Magic bytes file signature verification (e.g., verifying `%PDF-` for PDFs, `PK\x03\x04` for DOCX)
  - 5MB maximum file size limit
  - Randomized storage filenames (`crypto.randomBytes(16)`)
  - No server-side execution interpreter or execution endpoints.

---

## Directory Structure

```text
VAPTLabCA/
├── frontend/
│   ├── app/
│   │   ├── layout.tsx
│   │   ├── page.tsx
│   │   ├── login/
│   │   ├── register/
│   │   ├── dashboard/
│   │   ├── profile/
│   │   ├── assignments/
│   │   ├── documents/
│   │   ├── students/
│   │   ├── submissions/
│   │   └── feedback/
│   ├── components/
│   │   ├── Navbar.tsx
│   │   ├── Sidebar.tsx
│   │   ├── LayoutWrapper.tsx
│   │   ├── Toast.tsx
│   │   └── FileUploadField.tsx
│   ├── lib/
│   │   ├── api.ts
│   │   ├── auth.tsx
│   │   └── types.ts
│   ├── v1/
│   │   ├── FeedbackRenderer.tsx
│   │   └── FileUploadInput.tsx
│   ├── v2/
│   │   ├── FeedbackRenderer.tsx
│   │   └── FileUploadInput.tsx
│   └── Dockerfile
│
├── backend/
│   ├── src/
│   │   ├── v1/
│   │   │   ├── auth.routes.ts
│   │   │   ├── student.routes.ts
│   │   │   ├── assignment.routes.ts
│   │   │   ├── document.routes.ts
│   │   │   ├── feedback.routes.ts
│   │   │   └── index.ts
│   │   ├── v2/
│   │   │   ├── auth.routes.ts
│   │   │   ├── student.routes.ts
│   │   │   ├── assignment.routes.ts
│   │   │   ├── document.routes.ts
│   │   │   ├── feedback.routes.ts
│   │   │   └── index.ts
│   │   ├── middleware/
│   │   │   ├── auth.middleware.ts
│   │   │   ├── errorHandler.ts
│   │   │   └── logger.ts
│   │   ├── services/
│   │   │   ├── prisma.ts
│   │   │   └── storage.ts
│   │   ├── app.ts
│   │   └── server.ts
│   └── Dockerfile
│
├── prisma/
│   ├── schema.prisma
│   └── seed.ts
│
├── storage/
│   ├── documents/
│   │   ├── syllabus-cs101.pdf
│   │   ├── lab-safety-guidelines.txt
│   │   └── academic-calendar-2026.pdf
│   ├── uploads/
│   └── lab_flag.txt
│
├── docker-compose.yml
├── .env.example
├── .env.v1
├── .env.v2
└── README.md
```

---

## Local Development (Without Docker)

If you prefer to run the components locally on your host:

### 1. Database Setup
```bash
# Ensure a local PostgreSQL server is running on port 5432
# Create database 'campushub_db' and user 'campushub_user'
```

### 2. Backend Setup
```bash
cd backend
npm install
npx prisma generate --schema=../prisma/schema.prisma
npx prisma db push --schema=../prisma/schema.prisma
npx tsx ../prisma/seed.ts
npm run dev
```

### 3. Frontend Setup
```bash
cd frontend
npm install
npm run dev
```

Visit [http://localhost:3000](http://localhost:3000).

---

## Security Boundary & Ethical Policy

CampusHub is built exclusively for authorized academic coursework, secure coding training, and controlled laboratory security demonstrations. All vulnerable paths are constrained inside container storage boundaries.
