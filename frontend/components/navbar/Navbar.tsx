"use client";

import React from "react";
import Link from "next/link";
import { useAuth } from "@/contexts/AuthContext";
import {
  FiShield,
  FiLogOut,
  FiUser,
  FiBookOpen,
  FiCheckCircle,
  FiFileText,
  FiLayers,
} from "react-icons/fi";

export default function Navbar() {
  const { user, role, logout, isAuthenticated } = useAuth();

  const getRoleBadge = () => {
    switch (role) {
      case "STUDENT":
        return (
          <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
            Student
          </span>
        );
      case "EXAMINER":
        return (
          <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
            Examiner
          </span>
        );
      case "ADMIN":
        return (
          <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-rose-500/20 text-rose-300 border border-rose-500/30">
            Admin
          </span>
        );
      default:
        return null;
    }
  };

  const getHomeLink = () => {
    if (role === "EXAMINER") return "/examiner/dashboard";
    if (role === "ADMIN") return "/admin/dashboard";
    return "/student/dashboard";
  };

  return (
    <header className="sticky top-0 z-40 w-full border-b border-slate-800/80 bg-slate-950/80 backdrop-blur-md">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        {/* Left: Brand */}
        <Link
          href={isAuthenticated ? getHomeLink() : "/"}
          className="flex items-center gap-2.5 group"
        >
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-indigo-600 to-cyan-500 flex items-center justify-center shadow-lg shadow-indigo-500/20 group-hover:scale-105 transition-transform duration-200">
            <FiShield className="text-white text-xl" />
          </div>
          <div>
            <div className="font-bold text-lg tracking-tight bg-gradient-to-r from-white via-slate-200 to-slate-400 bg-clip-text text-transparent">
              AI ProctorExam
            </div>
            <div className="text-[10px] text-slate-400 font-mono tracking-wider uppercase">
              Secure Assessment
            </div>
          </div>
        </Link>

        {/* Center: Role Links */}
        {isAuthenticated && (
          <nav className="hidden md:flex items-center gap-1 bg-slate-900/60 p-1 rounded-xl border border-slate-800">
            {role === "STUDENT" && (
              <>
                <Link
                  href="/student/dashboard"
                  className="px-3.5 py-1.5 rounded-lg text-sm font-medium text-slate-300 hover:text-white hover:bg-slate-800 transition flex items-center gap-1.5"
                >
                  <FiBookOpen className="text-slate-400 text-base" />
                  Dashboard
                </Link>
                <Link
                  href="/student/exams"
                  className="px-3.5 py-1.5 rounded-lg text-sm font-medium text-slate-300 hover:text-white hover:bg-slate-800 transition flex items-center gap-1.5"
                >
                  <FiFileText className="text-slate-400 text-base" />
                  Take Exams
                </Link>
              </>
            )}

            {role === "EXAMINER" && (
              <>
                <Link
                  href="/examiner/dashboard"
                  className="px-3 py-1.5 rounded-lg text-sm font-medium text-slate-300 hover:text-white hover:bg-slate-800 transition flex items-center gap-1.5"
                >
                  <FiBookOpen className="text-slate-400" />
                  Overview
                </Link>
                <Link
                  href="/examiner/exams"
                  className="px-3 py-1.5 rounded-lg text-sm font-medium text-slate-300 hover:text-white hover:bg-slate-800 transition flex items-center gap-1.5"
                >
                  <FiFileText className="text-slate-400" />
                  Exams
                </Link>
                <Link
                  href="/examiner/questions"
                  className="px-3 py-1.5 rounded-lg text-sm font-medium text-slate-300 hover:text-white hover:bg-slate-800 transition flex items-center gap-1.5"
                >
                  <FiLayers className="text-slate-400" />
                  Question Bank
                </Link>
                <Link
                  href="/examiner/grading"
                  className="px-3 py-1.5 rounded-lg text-sm font-medium text-slate-300 hover:text-white hover:bg-slate-800 transition flex items-center gap-1.5"
                >
                  <FiCheckCircle className="text-slate-400" />
                  Grading Queue
                </Link>
              </>
            )}

            {role === "ADMIN" && (
              <>
                <Link
                  href="/admin/dashboard"
                  className="px-3 py-1.5 rounded-lg text-sm font-medium text-slate-300 hover:text-white hover:bg-slate-800 transition"
                >
                  Admin Control
                </Link>
                <Link
                  href="/examiner/exams"
                  className="px-3 py-1.5 rounded-lg text-sm font-medium text-slate-300 hover:text-white hover:bg-slate-800 transition"
                >
                  All Exams
                </Link>
              </>
            )}
          </nav>
        )}

        {/* Right: Auth Profile / Actions */}
        <div className="flex items-center gap-3">
          {isAuthenticated && user ? (
            <div className="flex items-center gap-3">
              <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-xl bg-slate-900 border border-slate-800">
                <div className="w-7 h-7 rounded-full bg-indigo-500/20 border border-indigo-500/40 text-indigo-300 flex items-center justify-center text-xs font-bold">
                  {user.name ? user.name.charAt(0).toUpperCase() : <FiUser />}
                </div>
                <div className="text-left">
                  <div className="text-xs font-semibold text-slate-200 truncate max-w-[120px]">
                    {user.name || user.email || "User"}
                  </div>
                  {getRoleBadge()}
                </div>
              </div>

              <button
                onClick={logout}
                title="Sign out"
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-900 hover:bg-rose-500/20 text-slate-400 hover:text-rose-300 border border-slate-800 hover:border-rose-500/30 text-sm font-medium transition duration-150"
              >
                <FiLogOut className="text-base" />
                <span className="hidden sm:inline">Logout</span>
              </button>
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <Link
                href="/login"
                className="px-4 py-2 rounded-xl text-sm font-semibold text-slate-300 hover:text-white hover:bg-slate-900 transition"
              >
                Log In
              </Link>
              <Link
                href="/register"
                className="px-4 py-2 rounded-xl text-sm font-semibold bg-indigo-600 hover:bg-indigo-500 text-white shadow-lg shadow-indigo-600/30 transition duration-150"
              >
                Get Started
              </Link>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
