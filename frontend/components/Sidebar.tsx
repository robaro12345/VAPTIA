'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuth } from '../lib/auth';
import {
  LayoutDashboard,
  User,
  Users,
  BookOpen,
  FileText,
  Search,
  MessageSquare,
  UploadCloud,
} from 'lucide-react';

export default function Sidebar() {
  const pathname = usePathname();
  const { user } = useAuth();

  if (!user) return null;

  const isAdmin = user.role === 'ADMIN';

  const studentNavItems = [
    { label: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
    { label: 'Profile', href: '/profile', icon: User },
    { label: 'Assignments', href: '/assignments', icon: BookOpen },
    { label: 'Documents', href: '/documents', icon: FileText },
    { label: 'Student Search', href: '/students', icon: Search },
    { label: 'Feedback', href: '/feedback', icon: MessageSquare },
  ];

  const adminNavItems = [
    { label: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
    { label: 'Students', href: '/students', icon: Users },
    { label: 'Assignments', href: '/assignments', icon: BookOpen },
    { label: 'Documents', href: '/documents', icon: FileText },
    { label: 'Submissions', href: '/submissions', icon: UploadCloud },
    { label: 'Feedback', href: '/feedback', icon: MessageSquare },
  ];

  const items = isAdmin ? adminNavItems : studentNavItems;

  return (
    <aside className="w-64 bg-slate-900 min-h-[calc(100vh-4rem)] p-4 flex flex-col justify-between">
      <div className="space-y-1">
        <div className="px-3 py-2 text-xs font-semibold text-slate-400 uppercase tracking-wider">
          {isAdmin ? 'Administration' : 'Student Portal'}
        </div>
        <nav className="space-y-1">
          {items.map((item) => {
            const Icon = item.icon;
            const isActive = pathname === item.href || pathname?.startsWith(`${item.href}/`);
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-150 ${
                  isActive
                    ? 'bg-indigo-600 text-white shadow-sm shadow-indigo-500/30'
                    : 'text-slate-300 hover:text-white hover:bg-slate-800'
                }`}
              >
                <Icon className={`mr-3 h-5 w-5 ${isActive ? 'text-white' : 'text-slate-400'}`} />
                {item.label}
              </Link>
            );
          })}
        </nav>
      </div>

      <div className="pt-4 border-t border-slate-800">
        <div className="px-3 py-2 bg-slate-800/60 rounded-lg text-xs text-slate-400">
          <p className="font-semibold text-slate-200">CampusHub Laboratory</p>
          <p className="mt-0.5 text-slate-400">Isolated Academic Environment</p>
        </div>
      </div>
    </aside>
  );
}
