export type Role = 'STUDENT' | 'ADMIN';

export interface User {
  id: number;
  name: string;
  email: string;
  role: Role;
  student?: Student;
  createdAt: string;
}

export interface Student {
  id: number;
  userId: number;
  rollNumber: string;
  course: string;
  year: number;
  user?: User;
  submissions?: Submission[];
  createdAt: string;
}

export interface Assignment {
  id: number;
  title: string;
  description: string;
  createdAt: string;
  _count?: {
    submissions: number;
  };
  submissions?: Submission[];
}

export interface Submission {
  id: number;
  assignmentId: number;
  studentId: number;
  filename: string;
  filepath: string;
  createdAt: string;
  assignment?: Assignment;
  student?: Student;
}

export interface DocumentItem {
  id: number;
  name: string;
  filepath: string;
  uploadedBy: number;
  uploader?: {
    id: number;
    name: string;
    email: string;
  };
  createdAt: string;
}

export interface FeedbackItem {
  id: number;
  userId: number;
  content: string;
  createdAt: string;
  user?: {
    id: number;
    name: string;
    email: string;
    role: Role;
  };
}
