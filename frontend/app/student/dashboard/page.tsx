"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import Navbar from "@/components/navbar/Navbar";
import { getAllExams, startExam } from "@/services/examService";
import { getMySessions } from "@/services/sessionService";
import { downloadResultPdf } from "@/services/resultService";
import { Exam, SessionListItem } from "@/types";
import {
  FiBookOpen,
  FiClock,
  FiAward,
  FiCheckCircle,
  FiPlay,
  FiCamera,
  FiShield,
  FiMonitor,
  FiDownload,
  FiArrowRight,
  FiFileText,
} from "react-icons/fi";

export default function StudentDashboard() {
  const router = useRouter();
  const { user, token, loading: authLoading, role } = useAuth();
  const [exams, setExams] = useState<Exam[]>([]);
  const [mySessions, setMySessions] = useState<SessionListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [startingExamId, setStartingExamId] = useState<string | null>(null);
  const [downloadingPdfId, setDownloadingPdfId] = useState<string | null>(null);

  useEffect(() => {
    if (!authLoading && !token) {
      router.push("/login");
      return;
    }

    if (!authLoading && role && role !== "STUDENT") {
      if (role === "EXAMINER") router.push("/examiner/dashboard");
      else if (role === "ADMIN") router.push("/admin/dashboard");
      return;
    }

    const fetchData = async () => {
      try {
        const [examsData, sessionsData] = await Promise.all([
          getAllExams(0, 10).catch(() => []),
          getMySessions(0, 10).catch(() => []),
        ]);
        setExams(examsData);
        setMySessions(sessionsData);
      } catch (err) {
        console.error("Failed to load student dashboard:", err);
      } finally {
        setLoading(false);
      }
    };

    if (token) {
      fetchData();
    }
  }, [token, authLoading, role, router]);

  const handleStartExam = async (examPublicId: string) => {
    setStartingExamId(examPublicId);
    try {
      const session = await startExam(examPublicId);
      router.push(`/student/exam/${session.session_id}`);
    } catch (err: any) {
      console.error("Failed to start exam:", err);
      alert(
        err.response?.data?.detail ||
          "Could not start the exam. Please ensure you have permission."
      );
      setStartingExamId(null);
    }
  };

  const handleDownloadPdf = async (sessionPublicId: string) => {
    setDownloadingPdfId(sessionPublicId);
    try {
      await downloadResultPdf(sessionPublicId);
    } catch (e: any) {
      alert(e.response?.data?.detail || "Report not available yet.");
    } finally {
      setDownloadingPdfId(null);
    }
  };

  if (authLoading || loading) {
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col">
        <Navbar />
        <div className="flex-1 flex items-center justify-center">
          <div className="flex flex-col items-center gap-3 text-slate-400">
            <span className="w-8 h-8 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" />
            <p className="text-sm">Loading Student Dashboard...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col">
      <Navbar />

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Welcome Header */}
        <div className="p-6 sm:p-8 rounded-3xl bg-gradient-to-r from-indigo-950/60 via-slate-900 to-slate-900 border border-indigo-500/20 shadow-xl relative overflow-hidden mb-8">
          <div className="relative z-10 max-w-2xl">
            <span className="px-3 py-1 rounded-full text-xs font-semibold bg-emerald-500/15 text-emerald-300 border border-emerald-500/30">
              Student Assessment Center
            </span>
            <h1 className="text-2xl sm:text-3xl font-bold text-white mt-3">
              Welcome, {user?.name || "Student"}!
            </h1>
            <p className="text-slate-400 text-sm mt-1">
              All assessments in this portal are monitored via real-time computer vision AI proctoring.
              Ensure your webcam is enabled and your workstation is clear before starting an exam.
            </p>
          </div>
          <div className="absolute right-0 top-1/2 -translate-y-1/2 translate-x-8 opacity-15 hidden md:block pointer-events-none">
            <FiShield className="text-[180px] text-indigo-400" />
          </div>
        </div>

        {/* Readiness Checklist Banner */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
          <div className="p-4 rounded-2xl bg-slate-900/60 border border-slate-800 flex items-start gap-3">
            <div className="p-2 rounded-xl bg-indigo-500/10 text-indigo-400 text-lg shrink-0">
              <FiCamera />
            </div>
            <div>
              <div className="text-xs font-semibold text-white">Webcam Verification</div>
              <div className="text-xs text-slate-400 mt-0.5">
                Front-facing camera continuously verifies face presence & gaze direction.
              </div>
            </div>
          </div>

          <div className="p-4 rounded-2xl bg-slate-900/60 border border-slate-800 flex items-start gap-3">
            <div className="p-2 rounded-xl bg-purple-500/10 text-purple-400 text-lg shrink-0">
              <FiMonitor />
            </div>
            <div>
              <div className="text-xs font-semibold text-white">Security Safeguards</div>
              <div className="text-xs text-slate-400 mt-0.5">
                Fullscreen lock, tab switch detection, and copy/paste blocking are enforced.
              </div>
            </div>
          </div>

          <div className="p-4 rounded-2xl bg-slate-900/60 border border-slate-800 flex items-start gap-3">
            <div className="p-2 rounded-xl bg-emerald-500/10 text-emerald-400 text-lg shrink-0">
              <FiAward />
            </div>
            <div>
              <div className="text-xs font-semibold text-white">Instant Scoring & PDF</div>
              <div className="text-xs text-slate-400 mt-0.5">
                MCQs auto-grade instantly; official verified transcripts can be downloaded as PDF.
              </div>
            </div>
          </div>
        </div>

        {/* My Assessment History Section */}
        {mySessions.length > 0 && (
          <div className="p-6 rounded-3xl bg-slate-900/60 border border-slate-800 mb-8">
            <h2 className="text-base font-bold text-white flex items-center gap-2 mb-4">
              <FiAward className="text-indigo-400" />
              My Assessment History & Official Results ({mySessions.length})
            </h2>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-950 text-slate-400 font-semibold border-b border-slate-800">
                  <tr>
                    <th className="p-3">Assessment</th>
                    <th className="p-3">Date</th>
                    <th className="p-3">Status</th>
                    <th className="p-3">Score & Percentage</th>
                    <th className="p-3">Result</th>
                    <th className="p-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/80">
                  {mySessions.map((s) => (
                    <tr key={s.public_id} className="hover:bg-slate-900/40 transition">
                      <td className="p-3">
                        <div className="font-bold text-white">{s.exam_title}</div>
                        <div className="text-[10px] text-indigo-400">{s.subject}</div>
                      </td>
                      <td className="p-3 font-mono text-slate-400">
                        {new Date(s.start_time).toLocaleDateString()}
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
                      <td className="p-3 font-mono">
                        {s.obtained_marks !== null && s.obtained_marks !== undefined ? (
                          <span className="text-white font-semibold">
                            {s.obtained_marks} / {s.total_marks} ({s.percentage?.toFixed(1)}%)
                          </span>
                        ) : (
                          <span className="text-slate-500">In Progress</span>
                        )}
                      </td>
                      <td className="p-3">
                        {s.result_status ? (
                          <span
                            className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                              s.result_status === "PASS"
                                ? "bg-emerald-500/20 text-emerald-300"
                                : "bg-rose-500/20 text-rose-300"
                            }`}
                          >
                            {s.result_status}
                          </span>
                        ) : (
                          <span className="text-slate-500 text-[10px]">Processing</span>
                        )}
                      </td>
                      <td className="p-3 text-right space-x-2">
                        <Link
                          href={`/student/result/${s.public_id}`}
                          className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl bg-indigo-600/20 hover:bg-indigo-600 text-indigo-300 hover:text-white transition cursor-pointer"
                        >
                          <FiFileText /> View Results
                        </Link>
                        {s.status === "SUBMITTED" && (
                          <button
                            type="button"
                            onClick={() => handleDownloadPdf(s.public_id)}
                            disabled={downloadingPdfId === s.public_id}
                            className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl bg-emerald-600/20 hover:bg-emerald-600 text-emerald-300 hover:text-white transition cursor-pointer"
                          >
                            <FiDownload />
                            {downloadingPdfId === s.public_id ? "..." : "PDF"}
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Available Exams Section */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-lg font-bold text-white flex items-center gap-2">
                <FiBookOpen className="text-indigo-400" />
                Available Exams ({exams.length})
              </h2>
              <p className="text-xs text-slate-400 mt-0.5">
                Exams ready to be taken right now
              </p>
            </div>

            <Link
              href="/student/exams"
              className="text-xs font-semibold text-indigo-400 hover:text-indigo-300 transition"
            >
              View All Exams →
            </Link>
          </div>

          {exams.length === 0 ? (
            <div className="p-12 text-center rounded-2xl bg-slate-900/40 border border-slate-800 text-slate-400">
              <FiBookOpen className="text-4xl mx-auto mb-3 text-slate-600" />
              <p className="text-sm font-medium text-slate-300">No exams currently available</p>
              <p className="text-xs text-slate-500 mt-1">
                Please check back later or contact your examiner.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
              {exams.map((exam) => (
                <div
                  key={exam.public_id}
                  className="p-6 rounded-2xl bg-slate-900/70 border border-slate-800 hover:border-slate-700 transition flex flex-col justify-between group"
                >
                  <div>
                    <div className="flex items-center justify-between mb-3">
                      <span className="px-2.5 py-0.5 rounded-lg text-xs font-semibold bg-indigo-500/15 text-indigo-300 border border-indigo-500/20">
                        {exam.subject}
                      </span>
                      <span className="flex items-center gap-1 text-xs text-slate-400 font-mono">
                        <FiClock /> {exam.duration_minutes} mins
                      </span>
                    </div>

                    <h3 className="font-bold text-base text-white group-hover:text-indigo-300 transition">
                      {exam.title}
                    </h3>
                    <p className="text-xs text-slate-400 mt-2 line-clamp-2">
                      {exam.description || "Comprehensive assessment on " + exam.subject}
                    </p>

                    <div className="mt-4 pt-3 border-t border-slate-800/80 flex items-center justify-between text-xs text-slate-400">
                      <div>
                        Total Marks:{" "}
                        <span className="text-slate-200 font-semibold">
                          {exam.total_marks}
                        </span>
                      </div>
                      <div>
                        Pass Marks:{" "}
                        <span className="text-slate-200 font-semibold">
                          {exam.pass_marks}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="mt-5">
                    <button
                      onClick={() => handleStartExam(exam.public_id)}
                      disabled={startingExamId === exam.public_id}
                      className="w-full py-2.5 px-4 rounded-xl bg-indigo-600 hover:bg-indigo-500 disabled:bg-indigo-900 text-white text-xs font-semibold shadow-lg shadow-indigo-600/20 transition flex items-center justify-center gap-2 cursor-pointer"
                    >
                      {startingExamId === exam.public_id ? (
                        <>
                          <span className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                          Launching Room...
                        </>
                      ) : (
                        <>
                          <FiPlay /> Start Exam Now
                        </>
                      )}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}