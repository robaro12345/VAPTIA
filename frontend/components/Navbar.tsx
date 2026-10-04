'use client';

import React from 'react';
import { useAuth } from '../lib/auth';
import { LogOut, User as UserIcon, Shield, GraduationCap } from 'lucide-react';

export default function Navbar() {
  const { user, logout } = useAuth();

  if (!user) return null;

  return (
    <header className="bg-white border-b border-slate-200 sticky top-0 z-30">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          <div className="flex items-center space-x-3">
            <div className="h-10 w-10 rounded-xl bg-gradient-to-tr from-indigo-600 to-indigo-700 flex items-center justify-center text-white shadow-md shadow-indigo-100">
              <GraduationCap className="h-6 w-6" />
            </div>
            <div>
              <span className="text-xl font-bold tracking-tight text-slate-900">
                Campus<span className="text-indigo-600">Hub</span>
              </span>
              <span className="hidden sm:inline-block ml-2 text-xs font-medium text-slate-400 border-l border-slate-200 pl-2">
                Academic Portal
              </span>
            </div>
          </div>

          <div className="flex items-center space-x-4">
            <div className="hidden sm:flex items-center space-x-3 pr-2 border-r border-slate-200">
              <div className="text-right">
                <p className="text-sm font-semibold text-slate-800 leading-none">{user.name}</p>
                <p className="text-xs text-slate-500 mt-1">{user.email}</p>
              </div>
              <span
                className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                  user.role === 'ADMIN'
                    ? 'bg-purple-100 text-purple-800 border border-purple-200'
                    : 'bg-indigo-50 text-indigo-700 border border-indigo-200'
                }`}
              >
                {user.role === 'ADMIN' ? (
                  <>
                    <Shield className="w-3 h-3 mr-1" />
                    Admin
                  </>
                ) : (
                  <>
                    <UserIcon className="w-3 h-3 mr-1" />
                    Student
                  </>
                )}
              </span>
            </div>

            <button
              onClick={logout}
              title="Logout"
              className="inline-flex items-center justify-center p-2 rounded-lg text-slate-500 hover:text-rose-600 hover:bg-rose-50 transition-colors duration-150"
            >
              <LogOut className="h-5 w-5" />
              <span className="sr-only">Logout</span>
            </button>
          </div>
        </div>
      </div>
    </header>
  );
}
