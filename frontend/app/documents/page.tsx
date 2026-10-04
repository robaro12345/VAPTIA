'use client';

import React, { useEffect, useState } from 'react';
import { useAuth } from '../../lib/auth';
import { apiRequest, apiUpload, getDocumentDownloadUrl } from '../../lib/api';
import { DocumentItem } from '../../lib/types';
import { useToast } from '../../components/Toast';
import {
  FileText,
  Download,
  Upload,
  Calendar,
  User,
  ShieldCheck,
  Search,
  AlertCircle,
  FileCheck,
} from 'lucide-react';

export default function DocumentsPage() {
  const { user } = useAuth();
  const { showToast } = useToast();
  const [documents, setDocuments] = useState<DocumentItem[]>([]);
  const [loading, setLoading] = useState(true);

  // Admin upload state
  const [docName, setDocName] = useState('');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);

  // Path Traversal Tester State
  const [testPath, setTestPath] = useState('..%2flab_flag.txt');
  const [traversalResult, setTraversalResult] = useState<string | null>(null);
  const [traversalStatus, setTraversalStatus] = useState<number | null>(null);
  const [testingTraversal, setTestingTraversal] = useState(false);

  const fetchDocuments = async () => {
    try {
      const data = await apiRequest<DocumentItem[]>('/documents');
      setDocuments(data);
    } catch (err: any) {
      showToast(err.message || 'Failed to load documents', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDocuments();
  }, []);

  const handleUploadDocument = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedFile) {
      showToast('Please select a document to upload', 'error');
      return;
    }

    try {
      setUploading(true);
      const formData = new FormData();
      formData.append('file', selectedFile);
      if (docName) formData.append('name', docName);

      await apiUpload('/documents/upload', formData);
      showToast('Document uploaded successfully!', 'success');
      setDocName('');
      setSelectedFile(null);
      fetchDocuments();
    } catch (err: any) {
      showToast(err.message || 'Document upload failed', 'error');
    } finally {
      setUploading(false);
    }
  };

  const handleTestTraversal = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!testPath) return;

    try {
      setTestingTraversal(true);
      setTraversalResult(null);
      setTraversalStatus(null);

      const url = getDocumentDownloadUrl(testPath);
      const response = await fetch(url, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem('campushub_token') || ''}`,
        },
      });

      setTraversalStatus(response.status);
      const text = await response.text();
      setTraversalResult(text);

      if (response.ok) {
        showToast('Document fetched successfully', 'success');
      } else {
        showToast(`Request returned status ${response.status}`, 'error');
      }
    } catch (err: any) {
      setTraversalResult(`Fetch Error: ${err.message}`);
    } finally {
      setTestingTraversal(false);
    }
  };

  const isAdmin = user?.role === 'ADMIN';

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Institutional Documents</h1>
        <p className="text-sm text-slate-500 mt-1">
          Access official university syllabi, academic calendars, and departmental guidelines
        </p>
      </div>

      {/* Admin Upload Section */}
      {isAdmin && (
        <div className="bg-white p-6 rounded-xl border border-slate-200/80 shadow-sm space-y-4">
          <div className="flex items-center space-x-2">
            <Upload className="h-5 w-5 text-indigo-600" />
            <h2 className="font-bold text-slate-900">Upload New Institutional Document</h2>
          </div>

          <form onSubmit={handleUploadDocument} className="grid grid-cols-1 sm:grid-cols-3 gap-4 items-end">
            <div>
              <label className="block text-sm font-medium text-slate-700">Document Title</label>
              <input
                type="text"
                value={docName}
                onChange={(e) => setDocName(e.target.value)}
                placeholder="Course Syllabus 2026"
                className="mt-1 block w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700">Select File</label>
              <input
                type="file"
                onChange={(e) => setSelectedFile(e.target.files ? e.target.files[0] : null)}
                className="mt-1 block w-full text-sm text-slate-500 file:mr-4 file:py-2 file:px-3 file:rounded-md file:border-0 file:text-xs file:font-semibold file:bg-indigo-50 file:text-indigo-700 hover:file:bg-indigo-100 border border-slate-200 rounded-lg p-1"
              />
            </div>

            <div>
              <button
                type="submit"
                disabled={uploading || !selectedFile}
                className="w-full py-2.5 px-4 bg-indigo-600 hover:bg-indigo-700 text-white font-medium text-sm rounded-lg shadow-sm disabled:opacity-50 transition-colors"
              >
                {uploading ? 'Uploading...' : 'Publish Document'}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Documents Grid / Table */}
      <div className="bg-white rounded-xl border border-slate-200/80 shadow-sm overflow-hidden">
        <div className="p-4 border-b border-slate-100 flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <FileText className="h-5 w-5 text-purple-600" />
            <h2 className="font-semibold text-slate-900">Available Files</h2>
          </div>
          <span className="text-xs font-medium text-slate-400">
            {documents.length} document(s)
          </span>
        </div>

        {loading ? (
          <div className="p-12 text-center">
            <div className="w-8 h-8 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin mx-auto" />
            <p className="text-sm text-slate-500 mt-3">Loading documents...</p>
          </div>
        ) : documents.length === 0 ? (
          <div className="p-12 text-center text-slate-400 text-sm">
            No documents available at this time.
          </div>
        ) : (
          <div className="divide-y divide-slate-100">
            {documents.map((doc) => (
              <div
                key={doc.id}
                className="p-4 sm:p-5 flex items-center justify-between hover:bg-slate-50/70 transition-colors"
              >
                <div className="flex items-center space-x-4">
                  <div className="p-2.5 rounded-xl bg-purple-50 text-purple-600">
                    <FileText className="h-6 w-6" />
                  </div>
                  <div>
                    <h3 className="text-sm font-semibold text-slate-900">{doc.name}</h3>
                    <div className="flex items-center space-x-3 text-xs text-slate-400 mt-1">
                      <span className="font-mono bg-slate-100 px-1.5 py-0.5 rounded text-slate-600">
                        {doc.filepath}
                      </span>
                      <span>Uploaded by {doc.uploader?.name || 'Administrator'}</span>
                      <span>• {new Date(doc.createdAt).toLocaleDateString()}</span>
                    </div>
                  </div>
                </div>

                <a
                  href={getDocumentDownloadUrl(doc.filepath)}
                  download
                  className="inline-flex items-center text-xs font-semibold text-indigo-600 hover:text-indigo-800 bg-indigo-50 hover:bg-indigo-100 px-3 py-2 rounded-lg transition-colors"
                >
                  <Download className="w-4 h-4 mr-1.5" />
                  Download
                </a>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Path Traversal Testing Tool Panel */}
      <div className="bg-slate-900 text-slate-100 rounded-xl p-6 border border-slate-800 space-y-4">
        <div>
          <div className="flex items-center space-x-2">
            <ShieldCheck className="h-5 w-5 text-indigo-400" />
            <h3 className="font-bold text-white text-base">
              Laboratory Path Verification Utility
            </h3>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Test document retrieval endpoint: <code className="text-indigo-300 font-mono">GET /api/documents/:filename</code>.
            In V1, relative path traversal (e.g. <code className="text-emerald-300 font-mono">..%2flab_flag.txt</code>) reaches container files outside the documents repository.
            In V2, canonicalization and directory containment prevent traversal.
          </p>
        </div>

        <form onSubmit={handleTestTraversal} className="flex gap-2">
          <input
            type="text"
            value={testPath}
            onChange={(e) => setTestPath(e.target.value)}
            placeholder="..%2flab_flag.txt"
            className="flex-1 px-3 py-2 bg-slate-950 border border-slate-700 rounded-lg text-xs font-mono text-slate-200 focus:outline-none focus:ring-1 focus:ring-indigo-500"
          />
          <button
            type="submit"
            disabled={testingTraversal}
            className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-medium text-xs rounded-lg transition-colors"
          >
            {testingTraversal ? 'Querying...' : 'Test Fetch'}
          </button>
        </form>

        {traversalResult && (
          <div className="space-y-1.5 pt-2 border-t border-slate-800">
            <div className="flex justify-between items-center text-xs">
              <span className="font-mono text-slate-400">
                HTTP Response Code: <span className={traversalStatus === 200 ? 'text-emerald-400 font-bold' : 'text-rose-400 font-bold'}>{traversalStatus}</span>
              </span>
              <button
                onClick={() => setTraversalResult(null)}
                className="text-xs text-slate-500 hover:text-slate-300"
              >
                Clear
              </button>
            </div>
            <pre className="p-3 bg-slate-950 rounded-lg text-xs font-mono text-slate-200 overflow-x-auto whitespace-pre-wrap max-h-48">
              {traversalResult}
            </pre>
          </div>
        )}
      </div>
    </div>
  );
}
