'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { apiRequest } from '../../lib/api';
import { Search, Users, ExternalLink, AlertCircle } from 'lucide-react';

interface StudentSearchResult {
  id: number;
  name: string;
  email: string;
  rollNumber: string;
  course: string;
  year: number;
}

export default function StudentSearchPage() {
  const [query, setQuery] = useState('');
  const [students, setStudents] = useState<StudentSearchResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [errorDetails, setErrorDetails] = useState<string | null>(null);

  const fetchStudents = async (searchTerm: string) => {
    setLoading(true);
    setErrorDetails(null);
    try {
      const endpoint = searchTerm
        ? `/students/search?name=${encodeURIComponent(searchTerm)}`
        : '/students';

      const data = await apiRequest<any[]>(endpoint);

      // Normalize result shapes between standard list and search query
      const formatted = data.map((item: any) => ({
        id: item.id,
        name: item.name || item.user?.name || 'Unknown',
        email: item.email || item.user?.email || 'N/A',
        rollNumber: item.rollNumber || 'N/A',
        course: item.course || 'N/A',
        year: item.year || 1,
      }));

      setStudents(formatted);
    } catch (err: any) {
      console.error('Search error:', err);
      setErrorDetails(err.message || 'An error occurred while querying students.');
      setStudents([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStudents('');
  }, []);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    fetchStudents(query);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Student Directory</h1>
          <p className="text-sm text-slate-500 mt-1">
            Search registered students by full name or roll identifier
          </p>
        </div>
      </div>

      {/* Search Input Box */}
      <div className="bg-white p-4 rounded-xl border border-slate-200/80 shadow-sm">
        <form onSubmit={handleSearchSubmit} className="flex gap-2">
          <div className="relative flex-1">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
              <Search className="h-5 w-5" />
            </div>
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search students by name (e.g., Rahul)..."
              className="block w-full pl-10 pr-3 py-2.5 border border-slate-300 rounded-lg text-sm placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>
          <button
            type="submit"
            className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-medium text-sm rounded-lg shadow-sm transition-colors"
          >
            Search
          </button>
        </form>
      </div>

      {/* Error Banner */}
      {errorDetails && (
        <div className="p-4 bg-rose-50 border border-rose-200 rounded-xl text-rose-800 flex items-start space-x-3 text-sm">
          <AlertCircle className="w-5 h-5 flex-shrink-0 text-rose-600 mt-0.5" />
          <div>
            <p className="font-semibold">Query Execution Error</p>
            <p className="mt-0.5 font-mono text-xs text-rose-700">{errorDetails}</p>
          </div>
        </div>
      )}

      {/* Results Table */}
      <div className="bg-white rounded-xl border border-slate-200/80 shadow-sm overflow-hidden">
        <div className="p-4 border-b border-slate-100 flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Users className="h-5 w-5 text-indigo-600" />
            <h2 className="font-semibold text-slate-900">Enrolled Students</h2>
          </div>
          <span className="text-xs font-medium text-slate-400">
            {students.length} record(s) found
          </span>
        </div>

        {loading ? (
          <div className="p-12 text-center">
            <div className="w-8 h-8 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin mx-auto" />
            <p className="text-sm text-slate-500 mt-3">Searching student records...</p>
          </div>
        ) : students.length === 0 && !errorDetails ? (
          <div className="p-12 text-center text-slate-400 text-sm">
            No students found matching your criteria.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-sm">
              <thead>
                <tr className="bg-slate-50/70 border-b border-slate-200 text-slate-500 text-xs uppercase font-semibold">
                  <th className="py-3.5 px-4">Student Name</th>
                  <th className="py-3.5 px-4">Roll Number</th>
                  <th className="py-3.5 px-4">Department</th>
                  <th className="py-3.5 px-4">Year</th>
                  <th className="py-3.5 px-4 text-right">Profile</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {students.map((student) => (
                  <tr key={student.id} className="hover:bg-slate-50/70 transition-colors">
                    <td className="py-3.5 px-4">
                      <div className="font-medium text-slate-900">{student.name}</div>
                      <div className="text-xs text-slate-400">{student.email}</div>
                    </td>
                    <td className="py-3.5 px-4 font-mono text-slate-600 text-xs">
                      {student.rollNumber}
                    </td>
                    <td className="py-3.5 px-4 text-slate-600">{student.course}</td>
                    <td className="py-3.5 px-4 text-slate-600">Year {student.year}</td>
                    <td className="py-3.5 px-4 text-right">
                      <Link
                        href={`/students/${student.id}`}
                        className="inline-flex items-center text-xs font-semibold text-indigo-600 hover:text-indigo-800 bg-indigo-50 hover:bg-indigo-100 px-2.5 py-1.5 rounded-lg transition-colors"
                      >
                        View Profile
                        <ExternalLink className="ml-1 w-3 h-3" />
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
