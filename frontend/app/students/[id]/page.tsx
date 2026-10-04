'use client';

import React, { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { apiRequest } from '../../../lib/api';
import { Student } from '../../../lib/types';
import {
  User,
  GraduationCap,
  Calendar,
  Mail,
  ShieldAlert,
  ArrowLeft,
  BookOpen,
  CheckCircle,
} from 'lucide-react';

export default function StudentDetailsPage() {
  const params = useParams();
  const router = useRouter();
  const id = params?.id as string;

  const [student, setStudent] = useState<Student | null>(null);
  const [errorStatus, setErrorStatus] = useState<number | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadStudent() {
      if (!id) return;
      setLoading(true);
      setErrorStatus(null);
      setErrorMessage(null);

      try {
        const res = await apiRequest<Student>(`/students/${id}`);
        setStudent(res);
      } catch (err: any) {
        setErrorStatus(err.status || 500);
        setErrorMessage(
          err.message || 'Access Denied: You do not have permission to view this profile.'
        );
        setStudent(null);
      } finally {
        setLoading(false);
      }
    }

    loadStudent();
  }, [id]);

  if (loading) {
    return (
      <div className="p-12 text-center">
        <div className="w-8 h-8 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin mx-auto" />
        <p className="text-sm text-slate-500 mt-3">Loading student record #{id}...</p>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <Link
          href="/students"
          className="inline-flex items-center text-sm font-medium text-slate-600 hover:text-indigo-600 transition-colors"
        >
          <ArrowLeft className="w-4 h-4 mr-1.5" />
          Back to Student Directory
        </Link>

        {/* Quick ID switcher for IDOR testing */}
        <div className="flex items-center space-x-2 text-xs bg-white border border-slate-200 px-3 py-1.5 rounded-lg shadow-sm">
          <span className="text-slate-400 font-medium">Record ID:</span>
          {[1, 2, 3, 4].map((testId) => (
            <button
              key={testId}
              onClick={() => router.push(`/students/${testId}`)}
              className={`px-2 py-0.5 rounded font-mono font-semibold ${
                parseInt(id, 10) === testId
                  ? 'bg-indigo-600 text-white'
                  : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
              }`}
            >
              #{testId}
            </button>
          ))}
        </div>
      </div>

      {/* 403 Forbidden or Error state (Remediated in V2) */}
      {errorStatus ? (
        <div className="bg-white rounded-2xl border border-rose-200 shadow-sm p-8 text-center space-y-4">
          <div className="h-16 w-16 bg-rose-50 border border-rose-200 rounded-2xl flex items-center justify-center text-rose-600 mx-auto">
            <ShieldAlert className="h-8 w-8" />
          </div>
          <div>
            <span className="inline-block px-3 py-1 bg-rose-100 text-rose-800 text-xs font-bold rounded-full uppercase tracking-wider mb-2">
              HTTP {errorStatus} {errorStatus === 403 ? 'Forbidden' : 'Error'}
            </span>
            <h2 className="text-xl font-bold text-slate-900">Access Restricted</h2>
            <p className="mt-2 text-sm text-slate-600 max-w-md mx-auto">{errorMessage}</p>
          </div>
          <div className="pt-2">
            <p className="text-xs text-slate-400">
              In V2, object-level authorization prevents unauthorized cross-student profile inspection.
            </p>
          </div>
        </div>
      ) : student ? (
        <div className="space-y-6">
          {/* Profile Card */}
          <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm overflow-hidden">
            <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 px-6 py-8 text-white flex items-center space-x-5">
              <div className="h-20 w-20 rounded-2xl bg-indigo-600/40 border border-indigo-400/30 flex items-center justify-center text-white text-3xl font-bold">
                {student.user?.name?.charAt(0) || 'S'}
              </div>
              <div>
                <h2 className="text-2xl font-bold">{student.user?.name}</h2>
                <p className="text-indigo-200 text-sm mt-0.5">{student.user?.email}</p>
                <div className="flex gap-2 mt-2">
                  <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-white/20 text-white">
                    Student ID: #{student.id}
                  </span>
                  <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-500/20 text-emerald-200 border border-emerald-400/30">
                    Roll: {student.rollNumber}
                  </span>
                </div>
              </div>
            </div>

            <div className="p-6">
              <h3 className="text-sm font-semibold text-slate-900 uppercase tracking-wider mb-4">
                Student Details
              </h3>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="p-4 bg-slate-50 rounded-xl border border-slate-100 flex items-start space-x-3">
                  <GraduationCap className="w-5 h-5 text-indigo-600 mt-0.5" />
                  <div>
                    <p className="text-xs text-slate-400 font-medium">Department & Course</p>
                    <p className="text-sm font-semibold text-slate-800">{student.course}</p>
                  </div>
                </div>

                <div className="p-4 bg-slate-50 rounded-xl border border-slate-100 flex items-start space-x-3">
                  <Calendar className="w-5 h-5 text-indigo-600 mt-0.5" />
                  <div>
                    <p className="text-xs text-slate-400 font-medium">Academic Year</p>
                    <p className="text-sm font-semibold text-slate-800">Year {student.year}</p>
                  </div>
                </div>

                <div className="p-4 bg-slate-50 rounded-xl border border-slate-100 flex items-start space-x-3">
                  <Mail className="w-5 h-5 text-indigo-600 mt-0.5" />
                  <div>
                    <p className="text-xs text-slate-400 font-medium">Email Address</p>
                    <p className="text-sm font-semibold text-slate-800">{student.user?.email}</p>
                  </div>
                </div>

                <div className="p-4 bg-slate-50 rounded-xl border border-slate-100 flex items-start space-x-3">
                  <User className="w-5 h-5 text-indigo-600 mt-0.5" />
                  <div>
                    <p className="text-xs text-slate-400 font-medium">Enrolled Since</p>
                    <p className="text-sm font-semibold text-slate-800">
                      {new Date(student.createdAt).toLocaleDateString()}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Submissions Section */}
          <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm overflow-hidden">
            <div className="p-5 border-b border-slate-100 flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <BookOpen className="h-5 w-5 text-indigo-600" />
                <h3 className="font-bold text-slate-900">Student Coursework Submissions</h3>
              </div>
              <span className="text-xs font-medium text-slate-400">
                {student.submissions?.length || 0} Submissions
              </span>
            </div>

            <div className="divide-y divide-slate-100">
              {(!student.submissions || student.submissions.length === 0) ? (
                <div className="p-6 text-center text-sm text-slate-400">
                  No submissions on file for this student.
                </div>
              ) : (
                student.submissions.map((sub) => (
                  <div key={sub.id} className="p-4 sm:p-5 flex items-center justify-between hover:bg-slate-50/70 transition-colors">
                    <div>
                      <h4 className="text-sm font-semibold text-slate-800">
                        {sub.assignment?.title || `Assignment #${sub.assignmentId}`}
                      </h4>
                      <p className="text-xs text-slate-500 font-mono mt-0.5">
                        File: {sub.filename}
                      </p>
                    </div>
                    <div className="flex items-center text-xs text-slate-400">
                      <CheckCircle className="w-4 h-4 text-emerald-500 mr-1.5" />
                      {new Date(sub.createdAt).toLocaleDateString()}
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
