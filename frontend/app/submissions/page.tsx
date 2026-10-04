'use client';

import React, { useEffect, useState } from 'react';
import { useAuth } from '../../lib/auth';
import { apiRequest, getSubmissionDownloadUrl } from '../../lib/api';
import { Submission, Assignment } from '../../lib/types';
import { useToast } from '../../components/Toast';
import { UploadCloud, Download, Play, Calendar, User, BookOpen } from 'lucide-react';

export default function SubmissionsPage() {
  const { user } = useAuth();
  const { showToast } = useToast();
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [loading, setLoading] = useState(true);
  const [executingId, setExecutingId] = useState<number | null>(null);
  const [executionOutput, setExecutionOutput] = useState<{ id: number; stdout: string; stderr: string } | null>(null);

  const fetchSubmissions = async () => {
    try {
      // First get assignments list
      const assignments = await apiRequest<Assignment[]>('/assignments');
      // For each assignment, get submissions
      const allSubmissions: Submission[] = [];
      for (const a of assignments) {
        const subs = await apiRequest<Submission[]>(`/assignments/${a.id}/submissions`).catch(() => []);
        allSubmissions.push(...subs);
      }
      setSubmissions(allSubmissions);
    } catch (err: any) {
      showToast(err.message || 'Failed to load submissions', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSubmissions();
  }, []);

  const handleExecuteScript = async (sub: Submission) => {
    try {
      setExecutingId(sub.id);
      setExecutionOutput(null);

      const res = await apiRequest<{ status: string; stdout: string; stderr: string }>(
        `/assignments/submissions/${sub.id}/execute`,
        { method: 'POST' }
      );

      setExecutionOutput({ id: sub.id, stdout: res.stdout, stderr: res.stderr });
      showToast('Executed script successfully inside container environment', 'success');
    } catch (err: any) {
      showToast(err.message || 'Execution error (Only supported in V1 for script files)', 'error');
    } finally {
      setExecutingId(null);
    }
  };

  const isAdmin = user?.role === 'ADMIN';

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">
          {isAdmin ? 'Student Coursework Submissions' : 'Your Submissions'}
        </h1>
        <p className="text-sm text-slate-500 mt-1">
          {isAdmin
            ? 'Review and inspect files uploaded by students for coursework grading'
            : 'Track the status and files of your submitted coursework'}
        </p>
      </div>

      {executionOutput && (
        <div className="p-4 bg-slate-900 text-slate-100 rounded-xl border border-slate-800 space-y-2">
          <div className="flex justify-between items-center text-xs font-semibold text-slate-400">
            <span>Container Script Execution Output (Submission #{executionOutput.id})</span>
            <button
              onClick={() => setExecutionOutput(null)}
              className="text-slate-400 hover:text-white"
            >
              Close
            </button>
          </div>
          {executionOutput.stdout && (
            <div>
              <p className="text-xs text-emerald-400 font-mono">Standard Output (stdout):</p>
              <pre className="p-2 bg-slate-950 rounded text-xs font-mono overflow-x-auto text-emerald-300">
                {executionOutput.stdout}
              </pre>
            </div>
          )}
          {executionOutput.stderr && (
            <div>
              <p className="text-xs text-rose-400 font-mono">Standard Error (stderr):</p>
              <pre className="p-2 bg-slate-950 rounded text-xs font-mono overflow-x-auto text-rose-300">
                {executionOutput.stderr}
              </pre>
            </div>
          )}
        </div>
      )}

      <div className="bg-white rounded-xl border border-slate-200/80 shadow-sm overflow-hidden">
        <div className="p-4 border-b border-slate-100 flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <UploadCloud className="h-5 w-5 text-indigo-600" />
            <h2 className="font-semibold text-slate-900">Submitted Files</h2>
          </div>
          <span className="text-xs font-medium text-slate-400">
            {submissions.length} submission(s)
          </span>
        </div>

        {loading ? (
          <div className="p-12 text-center">
            <div className="w-8 h-8 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin mx-auto" />
            <p className="text-sm text-slate-500 mt-3">Loading submissions...</p>
          </div>
        ) : submissions.length === 0 ? (
          <div className="p-12 text-center text-slate-400 text-sm">
            No submissions recorded.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-sm">
              <thead>
                <tr className="bg-slate-50/70 border-b border-slate-200 text-slate-500 text-xs uppercase font-semibold">
                  <th className="py-3.5 px-4">Student</th>
                  <th className="py-3.5 px-4">Assignment</th>
                  <th className="py-3.5 px-4">Filename</th>
                  <th className="py-3.5 px-4">Submitted Date</th>
                  <th className="py-3.5 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {submissions.map((sub) => {
                  const isScript = sub.filename.endsWith('.js') || sub.filename.endsWith('.sh');
                  return (
                    <tr key={sub.id} className="hover:bg-slate-50/70 transition-colors">
                      <td className="py-3.5 px-4">
                        <div className="font-medium text-slate-900">
                          {sub.student?.user?.name || `Student #${sub.studentId}`}
                        </div>
                        <div className="text-xs text-slate-400">
                          {sub.student?.user?.email || ''}
                        </div>
                      </td>
                      <td className="py-3.5 px-4 font-medium text-slate-700">
                        {sub.assignment?.title || `Assignment #${sub.assignmentId}`}
                      </td>
                      <td className="py-3.5 px-4 font-mono text-xs text-indigo-600">
                        {sub.filename}
                      </td>
                      <td className="py-3.5 px-4 text-slate-500 text-xs">
                        {new Date(sub.createdAt).toLocaleDateString()}
                      </td>
                      <td className="py-3.5 px-4 text-right space-x-2">
                        {isScript && (
                          <button
                            onClick={() => handleExecuteScript(sub)}
                            disabled={executingId === sub.id}
                            className="inline-flex items-center text-xs font-medium text-purple-700 bg-purple-50 hover:bg-purple-100 px-2.5 py-1.5 rounded-lg transition-colors"
                            title="Run submitted script in isolated container"
                          >
                            <Play className="w-3 h-3 mr-1" />
                            {executingId === sub.id ? 'Running...' : 'Run Script'}
                          </button>
                        )}
                        <a
                          href={getSubmissionDownloadUrl(sub.filename)}
                          download
                          className="inline-flex items-center text-xs font-medium text-indigo-600 hover:text-indigo-800 bg-indigo-50 hover:bg-indigo-100 px-2.5 py-1.5 rounded-lg transition-colors"
                        >
                          <Download className="w-3.5 h-3.5 mr-1" />
                          Download
                        </a>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
