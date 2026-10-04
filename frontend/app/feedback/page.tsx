'use client';

import React, { useEffect, useState } from 'react';
import { useAuth } from '../../lib/auth';
import { apiRequest } from '../../lib/api';
import { FeedbackItem } from '../../lib/types';
import { useToast } from '../../components/Toast';
import FeedbackDisplay from '../../components/FeedbackDisplay';
import { MessageSquare, Send, Calendar, User, ShieldAlert, Sparkles } from 'lucide-react';

export default function FeedbackPage() {
  const { user } = useAuth();
  const { showToast } = useToast();
  const [feedbacks, setFeedbacks] = useState<FeedbackItem[]>([]);
  const [content, setContent] = useState('');
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  const fetchFeedback = async () => {
    try {
      const data = await apiRequest<FeedbackItem[]>('/feedback');
      setFeedbacks(data);
    } catch (err: any) {
      showToast(err.message || 'Failed to load feedback', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchFeedback();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!content.trim()) {
      showToast('Feedback content cannot be empty', 'error');
      return;
    }

    try {
      setSubmitting(true);
      await apiRequest('/feedback', {
        method: 'POST',
        body: JSON.stringify({ content }),
      });
      showToast('Feedback submitted successfully!', 'success');
      setContent('');
      fetchFeedback();
    } catch (err: any) {
      showToast(err.message || 'Failed to submit feedback', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  const handleInsertPayload = (sample: string) => {
    setContent(sample);
  };

  return (
    <div className="space-y-8 max-w-4xl mx-auto">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Campus Feedback & Suggestions</h1>
        <p className="text-sm text-slate-500 mt-1">
          Share your feedback, report facilities issues, or suggest academic improvements
        </p>
      </div>

      {/* Feedback Submission Card */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-sm space-y-4">
        <div className="flex items-center space-x-2">
          <MessageSquare className="h-5 w-5 text-indigo-600" />
          <h2 className="font-bold text-slate-900">Submit New Feedback</h2>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <textarea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              rows={4}
              placeholder="Write your constructive feedback or suggestion here..."
              required
              className="block w-full px-3 py-2.5 border border-slate-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 placeholder-slate-400"
            />
          </div>

          {/* Quick Payloads for Harmless Lab Verification */}
          <div className="flex flex-wrap items-center gap-2 pt-1 text-xs">
            <span className="text-slate-400 font-medium flex items-center">
              <Sparkles className="w-3.5 h-3.5 mr-1 text-indigo-500" />
              Quick Samples:
            </span>
            <button
              type="button"
              onClick={() => handleInsertPayload('The laboratory hardware and air conditioning are working great.')}
              className="px-2.5 py-1 bg-slate-100 hover:bg-slate-200 rounded-md text-slate-700 transition-colors"
            >
              Standard Feedback
            </button>
            <button
              type="button"
              onClick={() =>
                handleInsertPayload(
                  '<span style="color: purple; font-weight: bold;">[Priority Issue]</span> Projector lamp is flickering.'
                )
              }
              className="px-2.5 py-1 bg-purple-50 hover:bg-purple-100 text-purple-700 rounded-md transition-colors"
            >
              HTML Formatting
            </button>
            <button
              type="button"
              onClick={() =>
                handleInsertPayload(
                  '<img src=x onerror="alert(\'Stored XSS Verified: CampusHub V1 Security Lab\')">'
                )
              }
              className="px-2.5 py-1 bg-amber-50 hover:bg-amber-100 text-amber-700 font-mono rounded-md transition-colors"
            >
              Stored XSS Test Payload
            </button>
          </div>

          <div className="flex justify-end pt-2">
            <button
              type="submit"
              disabled={submitting || !content.trim()}
              className="inline-flex items-center px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-medium text-sm rounded-lg shadow-sm disabled:opacity-50 transition-colors"
            >
              {submitting ? (
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
              ) : (
                <Send className="w-4 h-4 mr-1.5" />
              )}
              Submit Feedback
            </button>
          </div>
        </form>
      </div>

      {/* Feedback Feed */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="font-bold text-slate-900">Community Feedback Stream</h2>
          <span className="text-xs text-slate-500 font-medium">
            {feedbacks.length} Entry/Entries
          </span>
        </div>

        {loading ? (
          <div className="p-12 text-center bg-white rounded-xl border border-slate-200">
            <div className="w-8 h-8 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin mx-auto" />
            <p className="text-sm text-slate-500 mt-3">Loading feedback...</p>
          </div>
        ) : feedbacks.length === 0 ? (
          <div className="p-12 text-center bg-white rounded-xl border border-slate-200 text-slate-400 text-sm">
            No feedback entries submitted yet. Be the first to post!
          </div>
        ) : (
          <div className="space-y-3">
            {feedbacks.map((fb) => (
              <div
                key={fb.id}
                className="bg-white p-5 rounded-xl border border-slate-200/80 shadow-sm space-y-2 hover:border-slate-300 transition-colors"
              >
                <div className="flex justify-between items-start">
                  <div className="flex items-center space-x-2">
                    <div className="h-7 w-7 rounded-full bg-indigo-100 text-indigo-700 flex items-center justify-center text-xs font-bold">
                      {fb.user?.name?.charAt(0) || 'U'}
                    </div>
                    <div>
                      <span className="text-sm font-semibold text-slate-900">
                        {fb.user?.name || 'Anonymous User'}
                      </span>
                      <span className="text-xs text-slate-400 ml-2">
                        ({fb.user?.email || 'user'})
                      </span>
                    </div>
                  </div>

                  <span className="text-xs text-slate-400 flex items-center">
                    <Calendar className="w-3 h-3 mr-1" />
                    {new Date(fb.createdAt).toLocaleDateString()}
                  </span>
                </div>

                {/* Uses dynamic FeedbackDisplay (V1 renders raw HTML/XSS, V2 renders safe plain text) */}
                <div className="pt-2 pl-9">
                  <FeedbackDisplay content={fb.content} />
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
