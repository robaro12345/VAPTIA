'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useAuth } from '../../lib/auth';
import { apiRequest, getDocumentDownloadUrl } from '../../lib/api';
import { Assignment, DocumentItem, Student, FeedbackItem } from '../../lib/types';
import {
  BookOpen,
  FileText,
  Users,
  MessageSquare,
  ArrowRight,
  Download,
  Calendar,
  CheckCircle,
} from 'lucide-react';

export default function DashboardPage() {
  const { user } = useAuth();
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [documents, setDocuments] = useState<DocumentItem[]>([]);
  const [studentsCount, setStudentsCount] = useState<number>(0);
  const [feedbackCount, setFeedbackCount] = useState<number>(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadData() {
      try {
        const [assignRes, docRes, stuRes, fbRes] = await Promise.all([
          apiRequest<Assignment[]>('/assignments').catch(() => []),
          apiRequest<DocumentItem[]>('/documents').catch(() => []),
          apiRequest<Student[]>('/students').catch(() => []),
          apiRequest<FeedbackItem[]>('/feedback').catch(() => []),
        ]);

        setAssignments(assignRes.slice(0, 3));
        setDocuments(docRes.slice(0, 3));
        setStudentsCount(stuRes.length);
        setFeedbackCount(fbRes.length);
      } catch (err) {
        console.error('Failed to load dashboard data', err);
      } finally {
        setLoading(false);
      }
    }

    loadData();
  }, []);

  if (loading) {
    return (
      <div className="space-y-6 animate-pulse">
        <div className="h-8 bg-slate-200 rounded-md w-1/4" />
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-28 bg-slate-200 rounded-xl" />
          ))}
        </div>
      </div>
    );
  }

  const isAdmin = user?.role === 'ADMIN';

  return (
    <div className="space-y-8">
      {/* Top Banner */}
      <div className="bg-gradient-to-r from-indigo-700 via-indigo-800 to-slate-900 rounded-2xl p-6 sm:p-8 text-white shadow-sm flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-indigo-500/20 text-indigo-200 border border-indigo-400/30 mb-2">
            {isAdmin ? 'Administrative Console' : 'Student Academic Portal'}
          </span>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
            Welcome back, {user?.name}!
          </h1>
          <p className="mt-1 text-sm text-indigo-200 max-w-xl">
            {isAdmin
              ? 'Manage academic coursework, review student submissions, and maintain institutional documents.'
              : 'Access your coursework, review departmental guidelines, and submit coursework assignments.'}
          </p>
        </div>

        <div className="flex gap-3">
          {isAdmin ? (
            <Link
              href="/assignments"
              className="inline-flex items-center px-4 py-2 rounded-lg bg-white text-indigo-700 font-semibold text-sm hover:bg-indigo-50 transition-colors shadow-sm"
            >
              Manage Coursework
              <ArrowRight className="ml-1.5 h-4 w-4" />
            </Link>
          ) : (
            <Link
              href="/assignments"
              className="inline-flex items-center px-4 py-2 rounded-lg bg-white text-indigo-700 font-semibold text-sm hover:bg-indigo-50 transition-colors shadow-sm"
            >
              View Assignments
              <ArrowRight className="ml-1.5 h-4 w-4" />
            </Link>
          )}
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        <div className="bg-white p-5 rounded-xl border border-slate-200/80 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs font-medium text-slate-500 uppercase tracking-wider">
              {isAdmin ? 'Total Students' : 'Registered Peers'}
            </p>
            <p className="text-2xl font-bold text-slate-900 mt-1">{studentsCount}</p>
          </div>
          <div className="h-12 w-12 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center">
            <Users className="h-6 w-6" />
          </div>
        </div>

        <div className="bg-white p-5 rounded-xl border border-slate-200/80 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs font-medium text-slate-500 uppercase tracking-wider">Assignments</p>
            <p className="text-2xl font-bold text-slate-900 mt-1">{assignments.length}</p>
          </div>
          <div className="h-12 w-12 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center">
            <BookOpen className="h-6 w-6" />
          </div>
        </div>

        <div className="bg-white p-5 rounded-xl border border-slate-200/80 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs font-medium text-slate-500 uppercase tracking-wider">Documents</p>
            <p className="text-2xl font-bold text-slate-900 mt-1">{documents.length}</p>
          </div>
          <div className="h-12 w-12 rounded-lg bg-purple-50 text-purple-600 flex items-center justify-center">
            <FileText className="h-6 w-6" />
          </div>
        </div>

        <div className="bg-white p-5 rounded-xl border border-slate-200/80 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs font-medium text-slate-500 uppercase tracking-wider">Feedback Logs</p>
            <p className="text-2xl font-bold text-slate-900 mt-1">{feedbackCount}</p>
          </div>
          <div className="h-12 w-12 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center">
            <MessageSquare className="h-6 w-6" />
          </div>
        </div>
      </div>

      {/* Two Column Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Recent Assignments Card */}
        <div className="bg-white rounded-xl border border-slate-200/80 shadow-sm overflow-hidden">
          <div className="p-5 border-b border-slate-100 flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <BookOpen className="h-5 w-5 text-indigo-600" />
              <h2 className="font-bold text-slate-900">Current Assignments</h2>
            </div>
            <Link
              href="/assignments"
              className="text-xs font-semibold text-indigo-600 hover:text-indigo-700 flex items-center"
            >
              View All <ArrowRight className="ml-1 h-3.5 w-3.5" />
            </Link>
          </div>

          <div className="divide-y divide-slate-100">
            {assignments.length === 0 ? (
              <div className="p-6 text-center text-sm text-slate-400">
                No assignments posted yet.
              </div>
            ) : (
              assignments.map((item) => (
                <div key={item.id} className="p-4 sm:p-5 hover:bg-slate-50/70 transition-colors">
                  <div className="flex justify-between items-start">
                    <div>
                      <h3 className="text-sm font-semibold text-slate-800">{item.title}</h3>
                      <p className="text-xs text-slate-500 mt-1 line-clamp-2">{item.description}</p>
                      <span className="inline-flex items-center text-[11px] text-slate-400 mt-2">
                        <Calendar className="w-3 h-3 mr-1" />
                        Posted: {new Date(item.createdAt).toLocaleDateString()}
                      </span>
                    </div>
                    <Link
                      href="/assignments"
                      className="ml-4 px-3 py-1.5 rounded-lg text-xs font-medium bg-indigo-50 text-indigo-700 hover:bg-indigo-100 transition-colors flex-shrink-0"
                    >
                      {isAdmin ? 'View' : 'Submit'}
                    </Link>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Academic Documents Card */}
        <div className="bg-white rounded-xl border border-slate-200/80 shadow-sm overflow-hidden">
          <div className="p-5 border-b border-slate-100 flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <FileText className="h-5 w-5 text-purple-600" />
              <h2 className="font-bold text-slate-900">Available Documents</h2>
            </div>
            <Link
              href="/documents"
              className="text-xs font-semibold text-indigo-600 hover:text-indigo-700 flex items-center"
            >
              View All <ArrowRight className="ml-1 h-3.5 w-3.5" />
            </Link>
          </div>

          <div className="divide-y divide-slate-100">
            {documents.length === 0 ? (
              <div className="p-6 text-center text-sm text-slate-400">
                No documents uploaded yet.
              </div>
            ) : (
              documents.map((doc) => (
                <div key={doc.id} className="p-4 sm:p-5 flex items-center justify-between hover:bg-slate-50/70 transition-colors">
                  <div className="flex items-center space-x-3">
                    <div className="p-2 rounded-lg bg-purple-50 text-purple-600">
                      <FileText className="h-5 w-5" />
                    </div>
                    <div>
                      <h3 className="text-sm font-semibold text-slate-800">{doc.name}</h3>
                      <p className="text-xs text-slate-400 font-mono mt-0.5">{doc.filepath}</p>
                    </div>
                  </div>
                  <a
                    href={getDocumentDownloadUrl(doc.filepath)}
                    download
                    className="p-2 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors"
                    title="Download Document"
                  >
                    <Download className="h-4 w-4" />
                  </a>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
