"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useAuth } from "@/contexts/AuthContext";
import Navbar from "@/components/navbar/Navbar";
import Sidebar from "@/components/sidebar/Sidebar";
import { getAllExams } from "@/services/examService";
import { getAllQuestions } from "@/services/questionService";
import { getPendingAnswers } from "@/services/gradingService";
import { getAllSessions } from "@/services/sessionService";
import { Exam, Question, AnswerResponse, SessionListItem } from "@/types";
import {
  FiFileText,
  FiLayers,
  FiCheckCircle,
  FiPlusCircle,
  FiClock,
  FiUsers,
  FiArrowRight,
  FiShield,
  FiActivity,
  FiAlertTriangle,
} from "react-icons/fi";

export default function ExaminerDashboard() {
  const router = useRouter();
  const { token, loading: authLoading, role, user } = useAuth();

  const [exams, setExams] = useState<Exam[]>([]);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [pendingAnswers, setPendingAnswers] = useState<AnswerResponse[]>([]);
  const [sessions, setSessions] = useState<SessionListItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!authLoading && !token) {
      router.push("/login");
      return;
    }

    if (!authLoading && role && role !== "EXAMINER" && role !== "ADMIN") {
      router.push("/student/dashboard");
      return;
    }

    const loadData = async () => {
      try {
        const [examsData, questionsData, pendingData, sessionsData] = await Promise.all([
          getAllExams(0, 10).catch(() => []),
          getAllQuestions(0, 10).catch(() => []),
          getPendingAnswers().catch(() => []),
          getAllSessions(0, 10).catch(() => []),
        ]);

        setExams(examsData);
        setQuestions(questionsData);
        setPendingAnswers(pendingData);
        setSessions(sessionsData);
      } catch (err) {
        console.error("Examiner Dashboard error:", err);
      } finally {
        setLoading(false);
      }
    };

    if (token) {
      loadData();
    }
  }, [token, authLoading, role, router]);

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col">
      <Navbar />

      <div className="flex-1 flex">
        <Sidebar />

        <main className="flex-1 p-6 sm:p-8 max-w-6xl">
          {/* Header */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
            <div>
              <span className="px-3 py-1 rounded-full text-xs font-semibold bg-purple-500/15 text-purple-300 border border-purple-500/30">
                Examiner Control Studio
              </span>
              <h1 className="text-2xl sm:text-3xl font-bold text-white mt-2">
                Welcome, {user?.name || "Examiner"}!
              </h1>
              <p className="text-xs sm:text-sm text-slate-400 mt-0.5">
                Real-time surveillance of student exam sessions, AI proctoring telemetry, and assessment management.
              </p>
            </div>

            <div className="flex items-center gap-3">
              <Link
                href="/examiner/exams?create=true"
                className="px-4 py-2 rounded-xl text-xs font-semibold bg-indigo-600 hover:bg-indigo-500 text-white shadow-lg shadow-indigo-600/20 transition flex items-center gap-1.5 cursor-pointer"
              >
                <FiPlusCircle /> Create Exam
              </Link>
              <Link
                href="/examiner/questions?create=true"
                className="px-4 py-2 rounded-xl text-xs font-semibold bg-slate-900 hover:bg-slate-800 text-slate-200 border border-slate-800 transition flex items-center gap-1.5 cursor-pointer"
              >
                <FiPlusCircle /> Add Question
              </Link>
            </div>
          </div>

          {/* Quick Metrics */}
          <div className="grid grid-cols-1 sm:grid-cols-4 gap-4 mb-8">
            <div className="p-5 rounded-2xl bg-slate-900/60 border border-slate-800 flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-indigo-500/15 text-indigo-400 flex items-center justify-center text-xl shrink-0">
                <FiFileText />
              </div>
              <div>
                <div className="text-2xl font-black text-white">
                  {exams.length}
                </div>
                <div className="text-xs text-slate-400 font-medium">
                  Active Exams
                </div>
              </div>
            </div>

            <div className="p-5 rounded-2xl bg-slate-900/60 border border-slate-800 flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-purple-500/15 text-purple-400 flex items-center justify-center text-xl shrink-0">
                <FiLayers />
              </div>
              <div>
                <div className="text-2xl font-black text-white">
                  {questions.length}
                </div>
                <div className="text-xs text-slate-400 font-medium">
                  Question Bank
                </div>
              </div>
            </div>

            <div className="p-5 rounded-2xl bg-slate-900/60 border border-slate-800 flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-amber-500/15 text-amber-400 flex items-center justify-center text-xl shrink-0">
                <FiCheckCircle />
              </div>
              <div>
                <div className="text-2xl font-black text-white">
                  {pendingAnswers.length}
                </div>
                <div className="text-xs text-slate-400 font-medium">
                  Pending Grading
                </div>
              </div>
            </div>

            <div className="p-5 rounded-2xl bg-slate-900/60 border border-slate-800 flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-rose-500/15 text-rose-400 flex items-center justify-center text-xl shrink-0">
                <FiShield />
              </div>
              <div>
                <div className="text-2xl font-black text-white">
                  {sessions.length}
                </div>
                <div className="text-xs text-slate-400 font-medium">
                  Exam Sessions
                </div>
              </div>
            </div>
          </div>

          {/* Candidate Exam Sessions & Proctoring Table */}
          <div className="p-6 rounded-3xl bg-slate-900/60 border border-slate-800 mb-8">
            <div className="flex items-center justify-between mb-5">
              <div>
                <h2 className="text-base font-bold text-white flex items-center gap-2">
                  <FiShield className="text-indigo-400" />
                  Candidate Exam Sessions & Proctoring Audit
                </h2>
                <p className="text-xs text-slate-400 mt-0.5">
                  Monitor live and completed examination sessions with suspicion scores and integrity controls.
                </p>
              </div>
            </div>

            {loading ? (
              <div className="p-8 text-center text-xs text-slate-400">
                Loading sessions...
              </div>
            ) : sessions.length === 0 ? (
              <div className="p-8 text-center text-slate-400 text-xs">
                No exam sessions started yet. Student test sessions will show up here in real time.
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-950 text-slate-400 font-semibold border-b border-slate-800">
                    <tr>
                      <th className="p-3">Candidate</th>
                      <th className="p-3">Exam Title</th>
                      <th className="p-3">Session Status</th>
                      <th className="p-3">Proctoring Suspicion</th>
                      <th className="p-3">Score</th>
                      <th className="p-3 text-right">Actions</th>
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
                          <div className="flex items-center gap-2">
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
                            <span className="text-[10px] text-slate-400">
                              ({s.proctor_events_count} flags)
                            </span>
                          </div>
                        </td>
                        <td className="p-3 font-mono font-semibold">
                          {s.obtained_marks !== null && s.obtained_marks !== undefined ? (
                            <span className="text-white">
                              {s.obtained_marks} / {s.total_marks || 100} ({s.percentage?.toFixed(0)}%)
                            </span>
                          ) : (
                            <span className="text-slate-500">Pending</span>
                          )}
                        </td>
                        <td className="p-3 text-right">
                          <Link
                            href={`/examiner/proctoring/${s.public_id}`}
                            className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl bg-indigo-600/20 hover:bg-indigo-600 text-indigo-300 hover:text-white text-xs font-semibold border border-indigo-500/30 transition cursor-pointer"
                          >
                            <FiShield /> Audit Proctoring
                          </Link>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* Pending Evaluations Callout */}
          {pendingAnswers.length > 0 && (
            <div className="p-6 rounded-3xl bg-gradient-to-r from-amber-950/40 via-slate-900 to-slate-900 border border-amber-500/30 flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
              <div>
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase bg-amber-500/20 text-amber-300">
                  Action Required
                </span>
                <h3 className="text-base font-bold text-white mt-1">
                  {pendingAnswers.length} Subjective / Image Submissions Pending
                </h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  AI scoring is pre-filled. Review and finalize evaluations to release official scores.
                </p>
              </div>

              <Link
                href="/examiner/grading"
                className="px-5 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-bold shadow-lg shadow-amber-500/20 transition whitespace-nowrap flex items-center gap-1.5 cursor-pointer"
              >
                Grade Submissions <FiArrowRight />
              </Link>
            </div>
          )}

          {/* Managed Exams List */}
          <div className="p-6 rounded-3xl bg-slate-900/60 border border-slate-800">
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-base font-bold text-white flex items-center gap-2">
                <FiFileText className="text-indigo-400" />
                Managed Exams ({exams.length})
              </h2>
              <Link
                href="/examiner/exams"
                className="text-xs font-semibold text-indigo-400 hover:text-indigo-300 transition"
              >
                Manage All Exams →
              </Link>
            </div>

            {loading ? (
              <div className="p-8 text-center text-xs text-slate-400">
                Loading exams...
              </div>
            ) : exams.length === 0 ? (
              <div className="p-8 text-center text-slate-400 text-xs">
                No exams created yet. Click "Create Exam" to schedule your first exam!
              </div>
            ) : (
              <div className="divide-y divide-slate-800/80">
                {exams.slice(0, 5).map((exam) => (
                  <div
                    key={exam.public_id}
                    className="py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                  >
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-sm text-slate-100">
                          {exam.title}
                        </span>
                        <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-indigo-500/20 text-indigo-300">
                          {exam.subject}
                        </span>
                      </div>
                      <div className="text-xs text-slate-400 flex items-center gap-4 mt-1 font-mono">
                        <span>{exam.duration_minutes} mins</span>
                        <span>{exam.total_marks} Marks</span>
                        <span>Pass: {exam.pass_marks}</span>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <Link
                        href={`/examiner/exams`}
                        className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium transition cursor-pointer"
                      >
                        Configure
                      </Link>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </main>
      </div>
    </div>
  );
}
