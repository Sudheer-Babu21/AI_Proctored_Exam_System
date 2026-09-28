"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import {
  FiBookOpen,
  FiFileText,
  FiLayers,
  FiCheckCircle,
  FiPlusCircle,
  FiSettings,
} from "react-icons/fi";

export default function Sidebar() {
  const pathname = usePathname();
  const { role } = useAuth();

  const isExaminer = role === "EXAMINER" || role === "ADMIN";

  const links = isExaminer
    ? [
        {
          name: "Dashboard Overview",
          href: "/examiner/dashboard",
          icon: FiBookOpen,
        },
        {
          name: "Manage Exams",
          href: "/examiner/exams",
          icon: FiFileText,
        },
        {
          name: "Question Bank",
          href: "/examiner/questions",
          icon: FiLayers,
        },
        {
          name: "Grading & Review",
          href: "/examiner/grading",
          icon: FiCheckCircle,
        },
      ]
    : [
        {
          name: "My Dashboard",
          href: "/student/dashboard",
          icon: FiBookOpen,
        },
        {
          name: "Available Exams",
          href: "/student/exams",
          icon: FiFileText,
        },
      ];

  return (
    <aside className="w-64 shrink-0 hidden lg:block border-r border-slate-800/80 bg-slate-950 min-h-[calc(100vh-4rem)] p-4">
      <div className="space-y-1">
        <div className="px-3 py-2 text-xs font-semibold uppercase tracking-wider text-slate-400">
          Navigation
        </div>
        {links.map((link) => {
          const Icon = link.icon;
          const isActive = pathname === link.href;
          return (
            <Link
              key={link.href}
              href={link.href}
              className={`flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm font-medium transition duration-150 ${
                isActive
                  ? "bg-indigo-600/15 text-indigo-400 border border-indigo-500/30 shadow-sm"
                  : "text-slate-400 hover:text-slate-200 hover:bg-slate-900"
              }`}
            >
              <Icon className={`text-lg ${isActive ? "text-indigo-400" : "text-slate-400"}`} />
              {link.name}
            </Link>
          );
        })}
      </div>

      {isExaminer && (
        <div className="mt-8 pt-6 border-t border-slate-800/80">
          <div className="px-3 py-2 text-xs font-semibold uppercase tracking-wider text-slate-400">
            Quick Actions
          </div>
          <div className="mt-2 space-y-2">
            <Link
              href="/examiner/exams?create=true"
              className="flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-semibold text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 hover:bg-emerald-500/20 transition"
            >
              <FiPlusCircle className="text-sm" />
              Create New Exam
            </Link>
            <Link
              href="/examiner/questions?create=true"
              className="flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-semibold text-indigo-400 bg-indigo-500/10 border border-indigo-500/20 hover:bg-indigo-500/20 transition"
            >
              <FiPlusCircle className="text-sm" />
              Add Question
            </Link>
          </div>
        </div>
      )}
    </aside>
  );
}
