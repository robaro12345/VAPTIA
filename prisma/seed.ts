import { PrismaClient, Role } from '@prisma/client';

const prisma = new PrismaClient();

// Pre-computed verified bcrypt hashes (10 rounds) for instant seeding without external dependencies
// Admin@123
const ADMIN_PASSWORD_HASH = '$2a$10$WBrPW3izgGq0JOsJW0Ldr.t.5lX3sfBMr.evF0KV1RG7t9CfQt1yi';
// Student@123
const STUDENT_PASSWORD_HASH = '$2a$10$8MzVT8c83Op/ZBoSny0ED.nXNCqfc5ps8IFtOiH0Fg1rIa3MsB03i';

async function main() {
  console.log('--- Seeding CampusHub Database ---');

  // Clean existing records in reverse dependency order
  await prisma.submission.deleteMany();
  await prisma.feedback.deleteMany();
  await prisma.document.deleteMany();
  await prisma.assignment.deleteMany();
  await prisma.student.deleteMany();
  await prisma.user.deleteMany();

  const adminPasswordHash = ADMIN_PASSWORD_HASH;
  const studentPasswordHash = STUDENT_PASSWORD_HASH;

  // 1. Create Admin User
  const adminUser = await prisma.user.create({
    data: {
      name: 'Campus Administrator',
      email: 'admin@campushub.local',
      passwordHash: adminPasswordHash,
      role: Role.ADMIN,
    },
  });
  console.log(`Created Admin: ${adminUser.email} (ID: ${adminUser.id})`);

  // 2. Create Students
  const studentData = [
    {
      name: 'Rahul Sharma',
      email: 'student1@campushub.local',
      rollNumber: 'CS2026-001',
      course: 'Computer Science & Engineering',
      year: 3,
    },
    {
      name: 'Priya Patel',
      email: 'student2@campushub.local',
      rollNumber: 'IT2026-042',
      course: 'Information Technology',
      year: 2,
    },
    {
      name: 'Amit Kumar',
      email: 'student3@campushub.local',
      rollNumber: 'ECE2026-015',
      course: 'Electronics & Communication',
      year: 4,
    },
    {
      name: 'Sneha Reddy',
      email: 'student4@campushub.local',
      rollNumber: 'CS2026-088',
      course: 'Computer Science & Engineering',
      year: 3,
    },
  ];

  const createdStudents = [];
  for (const s of studentData) {
    const user = await prisma.user.create({
      data: {
        name: s.name,
        email: s.email,
        passwordHash: studentPasswordHash,
        role: Role.STUDENT,
        student: {
          create: {
            rollNumber: s.rollNumber,
            course: s.course,
            year: s.year,
          },
        },
      },
      include: {
        student: true,
      },
    });
    createdStudents.push(user.student!);
    console.log(`Created Student: ${s.name} (${s.email}, Roll: ${s.rollNumber}, Student ID: ${user.student!.id})`);
  }

  // 3. Create Sample Assignments
  const assignments = [
    {
      title: 'CS101: Network Security & Cryptography Analysis',
      description: 'Analyze common cryptographic protocols and implement RSA key pair validation. Submit a detailed technical report in PDF or DOCX format.',
    },
    {
      title: 'IT204: Web Architecture & Database Optimization',
      description: 'Perform relational database schema normalization and benchmark SQL query plans against non-indexed tables.',
    },
    {
      title: 'CS305: Software Engineering & Secure SDLC',
      description: 'Conduct static application security testing (SAST) on a sample codebase and provide remediation strategies.',
    },
  ];

  const createdAssignments = [];
  for (const a of assignments) {
    const assignment = await prisma.assignment.create({
      data: a,
    });
    createdAssignments.push(assignment);
    console.log(`Created Assignment: ${assignment.title} (ID: ${assignment.id})`);
  }

  // 4. Create Sample Documents (uploaded by Admin)
  const documents = [
    {
      name: 'CS101 Course Syllabus',
      filepath: 'syllabus-cs101.pdf',
      uploadedBy: adminUser.id,
    },
    {
      name: 'Laboratory Safety Guidelines',
      filepath: 'lab-safety-guidelines.txt',
      uploadedBy: adminUser.id,
    },
    {
      name: 'Academic Calendar 2026',
      filepath: 'academic-calendar-2026.pdf',
      uploadedBy: adminUser.id,
    },
  ];

  for (const doc of documents) {
    await prisma.document.create({
      data: doc,
    });
    console.log(`Created Document: ${doc.name} (${doc.filepath})`);
  }

  // 5. Create Sample Feedback
  const sampleFeedbacks = [
    {
      userId: createdStudents[0].userId,
      content: 'The campus laboratory workstations are working smoothly this semester.',
    },
    {
      userId: createdStudents[1].userId,
      content: 'Can we have additional consultation hours for the cryptography project?',
    },
    {
      userId: createdStudents[2].userId,
      content: 'The digital library portal has been very helpful for research papers.',
    },
  ];

  for (const fb of sampleFeedbacks) {
    await prisma.feedback.create({
      data: fb,
    });
    console.log(`Created Feedback from User ID ${fb.userId}`);
  }

  console.log('--- Database Seeding Complete ---');
}

main()
  .catch((e) => {
    console.error('Seeding error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
