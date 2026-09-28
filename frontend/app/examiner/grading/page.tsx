"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import Navbar from "@/components/navbar/Navbar";
import Sidebar from "@/components/sidebar/Sidebar";
import {
  getPendingAnswers,
  getReviewedAnswers,
  evaluateAnswer,
} from "@/services/gradingService";
import { AnswerResponse } from "@/types";
import {
  FiCheckCircle,
  FiClock,
  FiAward,
  FiMessageSquare,
  FiSend,
  FiImage,
  FiCpu,
  FiUser,
  FiBookOpen,
} from "react-icons/fi";
import { API_BASE_URL } from "@/lib/api";

export default function ExaminerGradingPage() {
  const router = useRouter();
  const { token, loading: authLoading, role } = useAuth();

  const [activeTab, setActiveTab] = useState<"pending" | "reviewed">("pending");
  const [pendingList, setPendingList] = useState<AnswerResponse[]>([]);
  const [reviewedList, setReviewedList] = useState<AnswerResponse[]>([]);
  const [loading, setLoading] = useState(true);

  // Active evaluation state
  const [evaluatingId, setEvaluatingId] = useState<string | null>(null);
  const [marks, setMarks] = useState<Record<string, number>>({});
  const [feedback, setFeedback] = useState<Record<string, string>>({});

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
        const [pending, reviewed] = await Promise.all([
          getPendingAnswers().catch(() => []),
          getReviewedAnswers().catch(() => []),
        ]);
        setPendingList(pending);
        setReviewedList(reviewed);

        // Pre-fill initial marks with AI score if available
        const initialMarks: Record<string, number> = {};
        const initialFeedback: Record<string, string> = {};
        pending.forEach((ans) => {
          if (ans.ai_score !== undefined && ans.ai_score !== null) {
            initialMarks[ans.public_id] = ans.ai_score;
          } else {
            initialMarks[ans.public_id] = ans.marks_awarded || 0;
          }
          if (ans.ai_justification) {
            initialFeedback[ans.public_id] = ans.ai_justification;
          }
        });
        setMarks(initialMarks);
        setFeedback(initialFeedback);
      } catch (err) {
        console.error("Grading load error:", err);
      } finally {
        setLoading(false);
      }
    };

    if (token) {
      loadData();
    }
  }, [token, authLoading, role, router]);

  const handleEvaluateSubmit = async (answerPublicId: string) => {
    const marksAwarded = marks[answerPublicId] ?? 0;
    const fb = feedback[answerPublicId] || "";

    setEvaluatingId(answerPublicId);
    try {
      const updated = await evaluateAnswer(
        answerPublicId,
        marksAwarded,
        fb
      );

      // Move from pending to reviewed list
      setPendingList((prev) =>
        prev.filter((a) => a.public_id !== answerPublicId)
      );
      setReviewedList((prev) => [updated, ...prev]);

      alert("Marks confirmed and saved. Candidate total score updated!");
    } catch (err: any) {
      console.error("Grading error:", err);
      alert(err.response?.data?.detail || "Failed to evaluate answer.");
    } finally {
      setEvaluatingId(null);
    }
  };

  const getFullImageUrl = (path: string) => {
    if (path.startsWith("http")) return path;
    const base = API_BASE_URL.replace(/\/$/, "");
    const clean = path.startsWith("/") ? path : `/${path}`;
    return `${base}${clean}`;
  };

  const currentList = activeTab === "pending" ? pendingList : reviewedList;

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col">
      <Navbar />

      <div className="flex-1 flex">
        <Sidebar />

        <main className="flex-1 p-6 sm:p-8 max-w-6xl">
          <div className="mb-8">
            <span className="px-3 py-1 rounded-full text-xs font-semibold bg-indigo-500/15 text-indigo-300 border border-indigo-500/30">
              Examiner Assessment Portal
            </span>
            <h1 className="text-2xl sm:text-3xl font-bold text-white mt-2 flex items-center gap-2.5">
              <FiCheckCircle className="text-indigo-400" />
              Grading & Evaluation Queue
            </h1>
            <p className="text-xs sm:text-sm text-slate-400 mt-1">
              AI pre-filled scores and justifications are ready for your review. You may modify marks, add personalized feedback, and commit the final score.
            </p>
          </div>

          {/* Tabs */}
          <div className="flex items-center gap-2 border-b border-slate-800 pb-3 mb-6">
            <button
              onClick={() => setActiveTab("pending")}
              className={`px-4 py-2 rounded-xl text-xs font-semibold transition flex items-center gap-2 cursor-pointer ${
                activeTab === "pending"
                  ? "bg-amber-500/20 text-amber-300 border border-amber-500/30"
                  : "bg-slate-900 text-slate-400 hover:text-slate-200"
              }`}
            >
              <FiClock /> Pending Review ({pendingList.length})
            </button>

            <button
              onClick={() => setActiveTab("reviewed")}
              className={`px-4 py-2 rounded-xl text-xs font-semibold transition flex items-center gap-2 cursor-pointer ${
                activeTab === "reviewed"
                  ? "bg-emerald-500/20 text-emerald-300 border border-emerald-500/30"
                  : "bg-slate-900 text-slate-400 hover:text-slate-200"
              }`}
            >
              <FiCheckCircle /> Reviewed Submissions ({reviewedList.length})
            </button>
          </div>

          {/* List Content */}
          {loading ? (
            <div className="p-16 flex flex-col items-center justify-center gap-3 text-slate-400">
              <span className="w-8 h-8 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" />
              <p className="text-xs">Loading subjective answers...</p>
            </div>
          ) : currentList.length === 0 ? (
            <div className="p-12 text-center rounded-3xl bg-slate-900/40 border border-slate-800 text-slate-400">
              <p className="text-sm font-medium text-slate-300">
                {activeTab === "pending"
                  ? "No submissions awaiting review"
                  : "No submissions reviewed yet"}
              </p>
              <p className="text-xs text-slate-500 mt-1">
                {activeTab === "pending"
                  ? "All subjective answers have been graded and approved."
                  : "Evaluated answers will appear here once saved."}
              </p>
            </div>
          ) : (
            <div className="space-y-6">
              {currentList.map((answer) => (
                <div
                  key={answer.public_id}
                  className="p-6 rounded-3xl bg-slate-900/80 border border-slate-800 shadow-xl"
                >
                  {/* Submission Header */}
                  <div className="flex flex-wrap items-center justify-between gap-2 pb-3 border-b border-slate-800/80 mb-4">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-semibold text-indigo-400 flex items-center gap-1">
                        <FiUser /> {answer.student_name || "Candidate"}
                      </span>
                      <span className="text-xs text-slate-400 font-mono">
                        • Answer ID: {answer.public_id.substring(0, 8)}...
                      </span>
                    </div>

                    <div className="flex items-center gap-2">
                      <span className="px-2.5 py-0.5 rounded-lg text-xs font-semibold bg-indigo-500/15 text-indigo-300">
                        {answer.question_type ? answer.question_type.replace(/_/g, " ") : "Subjective"}
                      </span>
                      <span className="text-xs text-slate-400 font-semibold">
                        Max: <strong className="text-white">{answer.max_marks || 10} Marks</strong>
                      </span>
                    </div>
                  </div>

                  {/* Question & Model Answer */}
                  <div className="mb-5 space-y-3">
                    <div className="p-4 rounded-2xl bg-slate-950/70 border border-slate-800">
                      <span className="text-xs font-bold text-slate-400 flex items-center gap-1.5 mb-1">
                        <FiBookOpen className="text-indigo-400" /> Question Prompt:
                      </span>
                      <p className="text-sm font-medium text-slate-100 leading-relaxed">
                        {answer.question_text || "Subjective examination prompt."}
                      </p>
                    </div>

                    {answer.model_answer && (
                      <div className="p-3.5 rounded-2xl bg-slate-950/40 border border-slate-800/60 text-xs text-slate-400">
                        <strong className="text-slate-300 block mb-1">
                          Official Model Answer / Rubric:
                        </strong>
                        <p className="text-slate-300 whitespace-pre-wrap">
                          {answer.model_answer}
                        </p>
                      </div>
                    )}
                  </div>

                  {/* Student Answer */}
                  <div className="mb-6 space-y-2">
                    <span className="text-xs font-bold text-slate-400 block">
                      Candidate Submission:
                    </span>
                    {answer.answer_text ? (
                      <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 text-sm text-slate-200 whitespace-pre-wrap leading-relaxed">
                        {answer.answer_text}
                      </div>
                    ) : answer.image_url ? (
                      <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800">
                        <div className="text-xs text-slate-400 flex items-center gap-1.5 mb-2">
                          <FiImage /> Uploaded Solution Document:
                        </div>
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                          src={getFullImageUrl(answer.image_url)}
                          alt="Student Answer Document"
                          className="max-h-96 rounded-xl border border-slate-800 object-contain mx-auto"
                        />
                      </div>
                    ) : (
                      <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 text-xs text-slate-500 italic">
                        No answer response recorded.
                      </div>
                    )}
                  </div>

                  {/* AI Evaluation Box (if available) */}
                  {(answer.ai_score !== undefined || answer.ai_justification) && (
                    <div className="mb-5 p-4 rounded-2xl bg-indigo-950/30 border border-indigo-500/20 text-xs flex items-start gap-3">
                      <div className="p-2 rounded-xl bg-indigo-500/20 text-indigo-400 text-base shrink-0">
                        <FiCpu />
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center justify-between">
                          <span className="font-bold text-indigo-300">
                            LLM Subjective Evaluator (GPT-4o)
                          </span>
                          <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-indigo-500/20 text-indigo-300">
                            Pre-filled Suggestion: {answer.ai_score ?? answer.marks_awarded} / {answer.max_marks || 10}
                          </span>
                        </div>
                        <p className="text-slate-300 mt-1">
                          {answer.ai_justification || "Automated semantic evaluation based on rubric and key concepts."}
                        </p>
                      </div>
                    </div>
                  )}

                  {/* Evaluation Controls */}
                  {activeTab === "pending" ? (
                    <div className="p-4 rounded-2xl bg-slate-950/80 border border-slate-800/80 grid grid-cols-1 sm:grid-cols-3 gap-3 items-end">
                      <div>
                        <label className="block text-xs font-semibold text-slate-300 mb-1">
                          Awarded Marks (Max: {answer.max_marks || 10}) *
                        </label>
                        <input
                          type="number"
                          min={0}
                          max={answer.max_marks || 100}
                          step={0.5}
                          placeholder="e.g. 8.5"
                          value={marks[answer.public_id] ?? ""}
                          onChange={(e) =>
                            setMarks({
                              ...marks,
                              [answer.public_id]: Number(e.target.value),
                            })
                          }
                          className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-indigo-500"
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-semibold text-slate-300 mb-1">
                          Examiner Feedback / Remarks
                        </label>
                        <input
                          type="text"
                          placeholder="Feedback for candidate..."
                          value={feedback[answer.public_id] ?? ""}
                          onChange={(e) =>
                            setFeedback({
                              ...feedback,
                              [answer.public_id]: e.target.value,
                            })
                          }
                          className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-indigo-500"
                        />
                      </div>

                      <div>
                        <button
                          onClick={() => handleEvaluateSubmit(answer.public_id)}
                          disabled={evaluatingId === answer.public_id}
                          className="w-full py-2.5 px-4 rounded-xl bg-indigo-600 hover:bg-indigo-500 disabled:bg-indigo-900 text-white text-xs font-bold shadow-md shadow-indigo-600/20 transition flex items-center justify-center gap-1.5 cursor-pointer"
                        >
                          {evaluatingId === answer.public_id ? (
                            "Saving & Recalculating..."
                          ) : (
                            <>
                              <FiSend /> Save Evaluation
                            </>
                          )}
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="p-4 rounded-2xl bg-emerald-950/20 border border-emerald-500/20 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs">
                      <div>
                        <span className="text-slate-400">Awarded Score: </span>
                        <strong className="text-emerald-400 font-mono text-sm ml-1">
                          +{answer.marks_awarded} Marks
                        </strong>
                      </div>
                      {answer.feedback && (
                        <div className="text-slate-300 italic">
                          "{answer.feedback}"
                        </div>
                      )}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
