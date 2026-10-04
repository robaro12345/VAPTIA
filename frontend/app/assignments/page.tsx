'use client';

import React, { useEffect, useState } from 'react';
import { useAuth } from '../../lib/auth';
import { apiRequest, apiUpload } from '../../lib/api';
import { Assignment } from '../../lib/types';
import { useToast } from '../../components/Toast';
import FileUploadField from '../../components/FileUploadField';
import {
  BookOpen,
  Plus,
  Upload,
  Calendar,
  X,
  FileText,
  CheckCircle,
} from 'lucide-react';

export default function AssignmentsPage() {
  const { user } = useAuth();
  const { showToast } = useToast();
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [loading, setLoading] = useState(true);

  // Create Assignment Modal State (Admin)
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newDescription, setNewDescription] = useState('');
  const [creating, setCreating] = useState(false);

  // Submit Assignment Modal State (Student)
  const [submittingAssignment, setSubmittingAssignment] = useState<Assignment | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);

  const fetchAssignments = async () => {
    try {
      const data = await apiRequest<Assignment[]>('/assignments');
      setAssignments(data);
    } catch (err: any) {
      showToast(err.message || 'Failed to load assignments', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAssignments();
  }, []);

  const handleCreateAssignment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim() || !newDescription.trim()) {
      showToast('Title and description are required', 'error');
      return;
    }

    try {
      setCreating(true);
      await apiRequest('/assignments', {
        method: 'POST',
        body: JSON.stringify({ title: newTitle, description: newDescription }),
      });
      showToast('Assignment created successfully', 'success');
      setShowCreateModal(false);
      setNewTitle('');
      setNewDescription('');
      fetchAssignments();
    } catch (err: any) {
      showToast(err.message || 'Failed to create assignment', 'error');
    } finally {
      setCreating(false);
    }
  };

  const handleSubmitAssignment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!submittingAssignment || !selectedFile) {
      showToast('Please select a file to submit', 'error');
      return;
    }

    try {
      setUploading(true);
      const formData = new FormData();
      formData.append('file', selectedFile);

      await apiUpload(`/assignments/${submittingAssignment.id}/submission`, formData);
      showToast('Assignment submitted successfully!', 'success');
      setSubmittingAssignment(null);
      setSelectedFile(null);
      fetchAssignments();
    } catch (err: any) {
      showToast(err.message || 'Assignment upload failed', 'error');
    } finally {
      setUploading(false);
    }
  };

  const isAdmin = user?.role === 'ADMIN';

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Course Assignments</h1>
          <p className="text-sm text-slate-500 mt-1">
            {isAdmin
              ? 'Create course assignments and review submissions'
              : 'Submit your laboratory assignments and coursework'}
          </p>
        </div>

        {isAdmin && (
          <button
            onClick={() => setShowCreateModal(true)}
            className="inline-flex items-center px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-medium text-sm rounded-lg shadow-sm transition-colors"
          >
            <Plus className="w-4 h-4 mr-1.5" />
            Create Assignment
          </button>
        )}
      </div>

      {/* Assignments List */}
      <div className="grid grid-cols-1 gap-4">
        {loading ? (
          <div className="p-12 text-center bg-white rounded-xl border border-slate-200">
            <div className="w-8 h-8 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin mx-auto" />
            <p className="text-sm text-slate-500 mt-3">Loading assignments...</p>
          </div>
        ) : assignments.length === 0 ? (
          <div className="p-12 text-center bg-white rounded-xl border border-slate-200 text-slate-400 text-sm">
            No assignments currently posted.
          </div>
        ) : (
          assignments.map((item) => (
            <div
              key={item.id}
              className="bg-white p-6 rounded-xl border border-slate-200/80 shadow-sm flex flex-col md:flex-row justify-between items-start md:items-center gap-4 hover:border-slate-300 transition-colors"
            >
              <div className="space-y-2 max-w-2xl">
                <div className="flex items-center space-x-2">
                  <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-indigo-50 text-indigo-700 border border-indigo-200">
                    ID #{item.id}
                  </span>
                  <h3 className="text-lg font-bold text-slate-900">{item.title}</h3>
                </div>
                <p className="text-sm text-slate-600 leading-relaxed">{item.description}</p>
                <div className="flex items-center gap-4 text-xs text-slate-400 pt-1">
                  <span className="flex items-center">
                    <Calendar className="w-3.5 h-3.5 mr-1" />
                    Posted on {new Date(item.createdAt).toLocaleDateString()}
                  </span>
                  <span className="flex items-center font-medium text-slate-500">
                    <FileText className="w-3.5 h-3.5 mr-1 text-slate-400" />
                    {item._count?.submissions || 0} Submissions
                  </span>
                </div>
              </div>

              <div className="flex items-center gap-3">
                {!isAdmin && (
                  <button
                    onClick={() => {
                      setSubmittingAssignment(item);
                      setSelectedFile(null);
                    }}
                    className="inline-flex items-center px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-medium text-sm rounded-lg shadow-sm transition-colors"
                  >
                    <Upload className="w-4 h-4 mr-1.5" />
                    Submit Work
                  </button>
                )}
              </div>
            </div>
          ))
        )}
      </div>

      {/* Modal: Create Assignment (Admin Only) */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-xl max-w-lg w-full p-6 space-y-4">
            <div className="flex justify-between items-center pb-2 border-b border-slate-100">
              <h2 className="text-lg font-bold text-slate-900">Create New Course Assignment</h2>
              <button
                onClick={() => setShowCreateModal(false)}
                className="text-slate-400 hover:text-slate-600 p-1"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateAssignment} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700">Course / Title</label>
                <input
                  type="text"
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  placeholder="CS202: Systems Programming Project"
                  required
                  className="mt-1 block w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700">Description</label>
                <textarea
                  value={newDescription}
                  onChange={(e) => setNewDescription(e.target.value)}
                  rows={4}
                  placeholder="Outline the assignment requirements and deliverables..."
                  required
                  className="mt-1 block w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div className="flex justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="px-4 py-2 border border-slate-200 text-slate-600 rounded-lg text-sm font-medium hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={creating}
                  className="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-sm font-medium transition-colors"
                >
                  {creating ? 'Creating...' : 'Publish Assignment'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Submit Assignment (Student) */}
      {submittingAssignment && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-xl max-w-lg w-full p-6 space-y-4">
            <div className="flex justify-between items-center pb-2 border-b border-slate-100">
              <div>
                <h2 className="text-lg font-bold text-slate-900">Submit Coursework</h2>
                <p className="text-xs text-slate-500 font-medium">{submittingAssignment.title}</p>
              </div>
              <button
                onClick={() => setSubmittingAssignment(null)}
                className="text-slate-400 hover:text-slate-600 p-1"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmitAssignment} className="space-y-4">
              {/* Uses dynamic FileUploadField (V1 accepts arbitrary files, V2 validates types) */}
              <FileUploadField onFileSelect={setSelectedFile} selectedFile={selectedFile} />

              <div className="flex justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setSubmittingAssignment(null)}
                  className="px-4 py-2 border border-slate-200 text-slate-600 rounded-lg text-sm font-medium hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={uploading || !selectedFile}
                  className="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-sm font-medium disabled:opacity-50 transition-colors"
                >
                  {uploading ? 'Uploading Submission...' : 'Upload & Submit'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
