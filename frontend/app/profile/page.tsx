'use client';

import React, { useEffect, useState } from 'react';
import { useAuth } from '../../lib/auth';
import { apiRequest } from '../../lib/api';
import { Student } from '../../lib/types';
import { User, BookOpen, Calendar, GraduationCap, Mail, Shield, CheckCircle } from 'lucide-react';

export default function ProfilePage() {
  const { user } = useAuth();
  const [profile, setProfile] = useState<Student | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadProfile() {
      if (user?.role === 'STUDENT') {
        try {
          const res = await apiRequest<Student>('/students/profile/me');
          setProfile(res);
        } catch (err) {
          console.error('Failed to load profile', err);
        } finally {
          setLoading(false);
        }
      } else {
        setLoading(false);
      }
    }

    loadProfile();
  }, [user]);

  if (loading) {
    return (
      <div className="space-y-6 animate-pulse">
        <div className="h-8 bg-slate-200 rounded w-1/4" />
        <div className="h-64 bg-slate-200 rounded-xl" />
      </div>
    );
  }

  const isAdmin = user?.role === 'ADMIN';

  return (
    <div className="space-y-8 max-w-4xl mx-auto">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">User Profile</h1>
        <p className="text-sm text-slate-500 mt-1">
          {isAdmin ? 'Administrative credentials and system roles' : 'Academic identity and coursework record'}
        </p>
      </div>

      {/* Main Profile Card */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm overflow-hidden">
        <div className="bg-gradient-to-r from-slate-900 to-indigo-950 px-6 py-8 text-white flex items-center space-x-5">
          <div className="h-20 w-20 rounded-2xl bg-indigo-600/40 border border-indigo-400/30 flex items-center justify-center text-white text-3xl font-bold">
            {user?.name.charAt(0)}
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <h2 className="text-2xl font-bold">{user?.name}</h2>
              <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-white/20 text-white">
                {user?.role}
              </span>
            </div>
            <p className="text-indigo-200 text-sm mt-1">{user?.email}</p>
          </div>
        </div>

        <div className="p-6">
          <h3 className="text-sm font-semibold text-slate-900 uppercase tracking-wider mb-4">
            Account Information
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="p-4 bg-slate-50 rounded-xl border border-slate-100 flex items-start space-x-3">
              <Mail className="w-5 h-5 text-indigo-600 mt-0.5" />
              <div>
                <p className="text-xs text-slate-400 font-medium">Email Address</p>
                <p className="text-sm font-semibold text-slate-800">{user?.email}</p>
              </div>
            </div>

            <div className="p-4 bg-slate-50 rounded-xl border border-slate-100 flex items-start space-x-3">
              {isAdmin ? (
                <Shield className="w-5 h-5 text-purple-600 mt-0.5" />
              ) : (
                <GraduationCap className="w-5 h-5 text-indigo-600 mt-0.5" />
              )}
              <div>
                <p className="text-xs text-slate-400 font-medium">Access Level</p>
                <p className="text-sm font-semibold text-slate-800">{user?.role} Account</p>
              </div>
            </div>

            {!isAdmin && profile && (
              <>
                <div className="p-4 bg-slate-50 rounded-xl border border-slate-100 flex items-start space-x-3">
                  <User className="w-5 h-5 text-indigo-600 mt-0.5" />
                  <div>
                    <p className="text-xs text-slate-400 font-medium">Roll Number</p>
                    <p className="text-sm font-semibold text-slate-800 font-mono">{profile.rollNumber}</p>
                  </div>
                </div>

                <div className="p-4 bg-slate-50 rounded-xl border border-slate-100 flex items-start space-x-3">
                  <Calendar className="w-5 h-5 text-indigo-600 mt-0.5" />
                  <div>
                    <p className="text-xs text-slate-400 font-medium">Department & Year</p>
                    <p className="text-sm font-semibold text-slate-800">
                      {profile.course} (Year {profile.year})
                    </p>
                  </div>
                </div>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Coursework Submissions History */}
      {!isAdmin && profile && (
        <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm overflow-hidden">
          <div className="p-6 border-b border-slate-100 flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <BookOpen className="h-5 w-5 text-indigo-600" />
              <h3 className="font-bold text-slate-900">Your Submitted Coursework</h3>
            </div>
            <span className="text-xs font-medium text-slate-500">
              {profile.submissions?.length || 0} Submissions
            </span>
          </div>

          <div className="divide-y divide-slate-100">
            {(!profile.submissions || profile.submissions.length === 0) ? (
              <div className="p-8 text-center text-sm text-slate-400">
                You have not submitted any coursework assignments yet.
              </div>
            ) : (
              profile.submissions.map((sub) => (
                <div key={sub.id} className="p-5 flex items-center justify-between hover:bg-slate-50/70 transition-colors">
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
      )}
    </div>
  );
}
