"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useAuth } from "@/contexts/AuthContext";
import Navbar from "@/components/navbar/Navbar";
import Sidebar from "@/components/sidebar/Sidebar";
import { getAllExams } from "@/services/examService";
import { getAllQuestions } from "@/services/questionService";
import { getAllSessions } from "@/services/sessionService";
import { Exam, Question, SessionListItem } from "@/types";
import {
  FiShield,
  FiUsers,
  FiFileText,
  FiLayers,
  FiServer,
  FiActivity,
  FiLock,
  FiArrowRight,
  FiAlertTriangle,
} from "react-icons/fi";

export default function AdminDashboard() {
  const router = useRouter();
  const { token, loading: authLoading, role, user } = useAuth();

  const [exams, setExams] = useState<Exam[]>([]);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [sessions, setSessions] = useState<SessionListItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!authLoading && !token) {
      router.push("/login");
      return;
    }

    if (!authLoading && role && role !== "ADMIN") {
      if (role === "EXAMINER") router.push("/examiner/dashboard");
      else router.push("/student/dashboard");
      return;
    }

    const loadData = async () => {
      try {
        const [examsData, questionsData, sessionsData] = await Promise.all([
          getAllExams(0, 50).catch(() => []),
          getAllQuestions(0, 50).catch(() => []),
          getAllSessions(0, 50).catch(() => []),
        ]);
        setExams(examsData);
        setQuestions(questionsData);
        setSessions(sessionsData);
      } catch (err) {
        console.error("Admin dashboard load error:", err);
      } finally {
        setLoading(false);
      }
    };

    if (token) {
      loadData();
    }
  }, [token, authLoading, role, router]);

  const flaggedSessions = sessions.filter(
    (s) => s.max_suspicion_score > 0.4 || s.status === "CANCELLED"
  );

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col">
      <Navbar />

      <div className="flex-1 flex">
        <Sidebar />

        <main className="flex-1 p-6 sm:p-8 max-w-6xl">
          <div className="mb-8 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <span className="px-3 py-1 rounded-full text-xs font-semibold bg-rose-500/15 text-rose-300 border border-rose-500/30">
                System Administration
              </span>
              <h1 className="text-2xl sm:text-3xl font-bold text-white mt-2">
                Administrator Control Center
              </h1>
              <p className="text-xs sm:text-sm text-slate-400 mt-1">
                Global oversight of examination sessions, integrity telemetry, and platform services.
              </p>
            </div>

            <div className="flex items-center gap-3">
              <Link
                href="/examiner/exams"
                className="px-4 py-2 rounded-xl text-xs font-semibold bg-indigo-600 hover:bg-indigo-500 text-white transition cursor-pointer"
              >
                Manage Exams
              </Link>
              <Link
                href="/examiner/grading"
                className="px-4 py-2 rounded-xl text-xs font-semibold bg-slate-900 hover:bg-slate-800 text-slate-200 border border-slate-800 transition cursor-pointer"
              >
                Review Grading
              </Link>
            </div>
          </div>

          {/* Metrics */}
          <div className="grid grid-cols-1 sm:grid-cols-4 gap-4 mb-8">
            <div className="p-5 rounded-2xl bg-slate-900/60 border border-slate-800">
              <div className="text-xs text-slate-400 uppercase font-semibold">
                Total Exams
              </div>
              <div className="text-3xl font-black text-white mt-1">
                {exams.length}
              </div>
            </div>

            <div className="p-5 rounded-2xl bg-slate-900/60 border border-slate-800">
              <div className="text-xs text-slate-400 uppercase font-semibold">
                Question Bank
              </div>
              <div className="text-3xl font-black text-indigo-400 mt-1">
                {questions.length}
              </div>
            </div>

            <div className="p-5 rounded-2xl bg-slate-900/60 border border-slate-800">
              <div className="text-xs text-slate-400 uppercase font-semibold">
                Total Sessions
              </div>
              <div className="text-3xl font-black text-purple-400 mt-1">
                {sessions.length}
              </div>
            </div>

            <div className="p-5 rounded-2xl bg-slate-900/60 border border-slate-800">
              <div className="text-xs text-slate-400 uppercase font-semibold">
                Flagged Anomaly Sessions
              </div>
              <div
                className={`text-3xl font-black mt-1 ${
                  flaggedSessions.length > 0 ? "text-rose-400" : "text-emerald-400"
                }`}
              >
                {flaggedSessions.length}
              </div>
            </div>
          </div>

          {/* All Candidate Sessions Oversight */}
          <div className="p-6 rounded-3xl bg-slate-900/60 border border-slate-800 mb-8">
            <h2 className="text-base font-bold text-white flex items-center gap-2 mb-4">
              <FiShield className="text-indigo-400" />
              Global Examination Sessions & Integrity Telemetry ({sessions.length})
            </h2>

            {loading ? (
              <div className="p-8 text-center text-xs text-slate-400">
                Loading sessions...
              </div>
            ) : sessions.length === 0 ? (
              <div className="p-8 text-center text-xs text-slate-400">
                No active exam sessions yet.
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-950 text-slate-400 font-semibold border-b border-slate-800">
                    <tr>
                      <th className="p-3">Candidate</th>
                      <th className="p-3">Exam</th>
                      <th className="p-3">Session Status</th>
                      <th className="p-3">Suspicion Score</th>
                      <th className="p-3">Marks</th>
                      <th className="p-3 text-right">Audit</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/80">
                    {sessions.map((s) => (
                      <tr key={s.public_id} className="hover:bg-slate-900/40 transition">
                        <td className="p-3 font-semibold text-white">
                          <div>{s.student_name || "Candidate"}</div>
                          <div className="text-[10px] text-slate-400 font-mono">
                            {s.student_email || "N/A"}
                          </div>
                        </td>
                        <td className="p-3">
                          <div className="font-medium text-slate-200">{s.exam_title}</div>
                          <div className="text-[10px] text-indigo-400 font-semibold">{s.subject}</div>
                        </td>
                        <td className="p-3">
                          <span
                            className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                              s.status === "SUBMITTED"
                                ? "bg-emerald-500/20 text-emerald-300"
                                : s.status === "CANCELLED"
                                ? "bg-rose-500/20 text-rose-300"
                                : "bg-amber-500/20 text-amber-300"
                            }`}
                          >
                            {s.status}
                          </span>
                        </td>
                        <td className="p-3">
                          <span
                            className={`font-mono font-bold ${
                              s.max_suspicion_score > 0.5
                                ? "text-rose-400"
                                : s.max_suspicion_score > 0.2
                                ? "text-amber-400"
                                : "text-emerald-400"
                            }`}
                          >
                            {(s.max_suspicion_score * 100).toFixed(0)}%
                          </span>
                          <span className="text-[10px] text-slate-400 ml-1.5">
                            ({s.proctor_events_count} flags)
                          </span>
                        </td>
                        <td className="p-3 font-mono font-semibold">
                          {s.obtained_marks !== null && s.obtained_marks !== undefined ? (
                            <span className="text-white">
                              {s.obtained_marks} / {s.total_marks || 100}
                            </span>
                          ) : (
                            <span className="text-slate-500">In Progress</span>
                          )}
                        </td>
                        <td className="p-3 text-right">
                          <Link
                            href={`/examiner/proctoring/${s.public_id}`}
                            className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl bg-indigo-600/20 hover:bg-indigo-600 text-indigo-300 hover:text-white transition cursor-pointer"
                          >
                            Audit
                          </Link>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </main>
      </div>
    </div>
  );
}
