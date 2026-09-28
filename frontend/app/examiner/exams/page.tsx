"use client";

import React, { useEffect, useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import Navbar from "@/components/navbar/Navbar";
import Sidebar from "@/components/sidebar/Sidebar";
import {
  getAllExams,
  createExam,
  deleteExam,
  assignRandomQuestions,
} from "@/services/examService";
import { Exam, ExamCreatePayload } from "@/types";
import {
  FiFileText,
  FiPlusCircle,
  FiClock,
  FiTrash2,
  FiShuffle,
  FiCheck,
  FiX,
  FiCalendar,
} from "react-icons/fi";

function ExaminerExamsContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { token, loading: authLoading, role } = useAuth();

  const [exams, setExams] = useState<Exam[]>([]);
  const [loading, setLoading] = useState(true);

  // Modals state
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showAssignModal, setShowAssignModal] = useState<string | null>(null);

  // New Exam Form state
  const [newExam, setNewExam] = useState<ExamCreatePayload>({
    title: "",
    description: "",
    subject: "Python",
    duration_minutes: 60,
    total_marks: 100,
    pass_marks: 40,
    negative_marking: false,
    shuffle_questions: true,
    shuffle_options: true,
    start_time: new Date().toISOString().slice(0, 16),
    end_time: new Date(Date.now() + 7 * 24 * 3600 * 1000)
      .toISOString()
      .slice(0, 16),
  });

  // Assign Questions Form state
  const [assignForm, setAssignForm] = useState({
    subject: "Python",
    difficulty: "EASY",
    question_count: 5,
  });
  const [assigning, setAssigning] = useState(false);
  const [assignResult, setAssignResult] = useState<string | null>(null);

  useEffect(() => {
    if (searchParams.get("create") === "true") {
      setShowCreateModal(true);
    }
  }, [searchParams]);

  useEffect(() => {
    if (!authLoading && !token) {
      router.push("/login");
      return;
    }

    if (!authLoading && role && role !== "EXAMINER" && role !== "ADMIN") {
      router.push("/student/dashboard");
      return;
    }

    const loadExams = async () => {
      try {
        const data = await getAllExams(0, 50);
        setExams(data);
      } catch (err) {
        console.error("Failed to load exams:", err);
      } finally {
        setLoading(false);
      }
    };

    if (token) {
      loadExams();
    }
  }, [token, authLoading, role, router]);

  const handleCreateSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const created = await createExam({
        ...newExam,
        start_time: new Date(newExam.start_time).toISOString(),
        end_time: new Date(newExam.end_time).toISOString(),
      });
      setExams((prev) => [created, ...prev]);
      setShowCreateModal(false);
      alert("Exam created successfully!");
    } catch (err: any) {
      console.error("Failed to create exam:", err);
      alert(err.response?.data?.detail || "Could not create exam.");
    }
  };

  const handleDelete = async (publicId: string) => {
    if (!confirm("Are you sure you want to remove this exam?")) return;
    try {
      await deleteExam(publicId);
      setExams((prev) => prev.filter((e) => e.public_id !== publicId));
    } catch (err: any) {
      alert("Failed to delete exam.");
    }
  };

  const handleAssignQuestions = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!showAssignModal) return;
    setAssigning(true);
    setAssignResult(null);

    try {
      const res = await assignRandomQuestions(showAssignModal, {
        subject: assignForm.subject,
        difficulty: assignForm.difficulty,
        question_count: Number(assignForm.question_count),
      });

      setAssignResult(
        `Successfully assigned ${res.assigned_questions} question(s) from the bank.`
      );
      setTimeout(() => {
        setShowAssignModal(null);
        setAssignResult(null);
      }, 1500);
    } catch (err: any) {
      console.error("Assign error:", err);
      alert(
        err.response?.data?.detail ||
          "Failed to assign questions. Ensure sufficient active questions exist in the Question Bank matching the criteria."
      );
    } finally {
      setAssigning(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col">
      <Navbar />

      <div className="flex-1 flex">
        <Sidebar />

        <main className="flex-1 p-6 sm:p-8 max-w-6xl">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold text-white flex items-center gap-2.5">
                <FiFileText className="text-indigo-400" />
                Exams Management
              </h1>
              <p className="text-xs sm:text-sm text-slate-400 mt-1">
                Configure exam schedules, duration, marks, and assign questions from Question Bank.
              </p>
            </div>

            <button
              onClick={() => setShowCreateModal(true)}
              className="px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold shadow-lg shadow-indigo-600/20 transition flex items-center gap-2 cursor-pointer self-start"
            >
              <FiPlusCircle className="text-sm" /> Create New Exam
            </button>
          </div>

          {/* Exams Grid */}
          {loading ? (
            <div className="p-16 flex flex-col items-center justify-center gap-3 text-slate-400">
              <span className="w-8 h-8 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" />
              <p className="text-xs">Loading exams...</p>
            </div>
          ) : exams.length === 0 ? (
            <div className="p-12 text-center rounded-3xl bg-slate-900/40 border border-slate-800 text-slate-400">
              <p className="text-sm font-medium text-slate-300">No exams configured yet</p>
              <p className="text-xs text-slate-500 mt-1">
                Click "Create New Exam" above to author your first assessment.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {exams.map((exam) => (
                <div
                  key={exam.public_id}
                  className="p-6 rounded-3xl bg-slate-900/70 border border-slate-800 hover:border-slate-700 transition flex flex-col justify-between"
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

                    <h3 className="font-bold text-lg text-white">
                      {exam.title}
                    </h3>
                    <p className="text-xs text-slate-400 mt-1 line-clamp-2">
                      {exam.description || "No description provided."}
                    </p>

                    <div className="mt-4 pt-3 border-t border-slate-800/80 grid grid-cols-2 gap-2 text-xs text-slate-400">
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
                      <div>
                        Negative Marking:{" "}
                        <span className={exam.negative_marking ? "text-amber-400" : "text-slate-400"}>
                          {exam.negative_marking ? "Enabled" : "Disabled"}
                        </span>
                      </div>
                      <div>
                        Status:{" "}
                        <span className={exam.is_active ? "text-emerald-400" : "text-rose-400"}>
                          {exam.is_active ? "Active" : "Archived"}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="mt-6 pt-4 border-t border-slate-800/80 flex items-center justify-between gap-2">
                    <button
                      onClick={() => {
                        setAssignForm({
                          subject: exam.subject,
                          difficulty: "EASY",
                          question_count: 5,
                        });
                        setShowAssignModal(exam.public_id);
                      }}
                      className="flex-1 py-2 px-3 rounded-xl bg-indigo-600/20 hover:bg-indigo-600/30 text-indigo-300 border border-indigo-500/30 text-xs font-semibold transition flex items-center justify-center gap-1.5"
                    >
                      <FiShuffle /> Assign Questions
                    </button>

                    <button
                      onClick={() => handleDelete(exam.public_id)}
                      title="Delete Exam"
                      className="p-2 rounded-xl bg-slate-900 hover:bg-rose-500/20 text-slate-400 hover:text-rose-300 border border-slate-800 hover:border-rose-500/30 transition text-xs"
                    >
                      <FiTrash2 />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Create Exam Modal */}
          {showCreateModal && (
            <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
              <div className="max-w-xl w-full rounded-3xl bg-slate-900 border border-slate-800 p-6 sm:p-8 shadow-2xl my-8">
                <div className="flex items-center justify-between mb-5">
                  <h3 className="text-xl font-bold text-white">Create New Exam</h3>
                  <button
                    onClick={() => setShowCreateModal(false)}
                    className="text-slate-400 hover:text-white"
                  >
                    <FiX size={20} />
                  </button>
                </div>

                <form onSubmit={handleCreateSubmit} className="space-y-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1">
                      Exam Title *
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Midterm Python Programming Assessment"
                      value={newExam.title}
                      onChange={(e) =>
                        setNewExam({ ...newExam, title: e.target.value })
                      }
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2 text-xs text-white placeholder-slate-400 focus:outline-none focus:border-indigo-500"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-semibold text-slate-300 mb-1">
                        Subject *
                      </label>
                      <input
                        type="text"
                        required
                        placeholder="e.g. Python"
                        value={newExam.subject}
                        onChange={(e) =>
                          setNewExam({ ...newExam, subject: e.target.value })
                        }
                        className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2 text-xs text-white placeholder-slate-400 focus:outline-none focus:border-indigo-500"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-slate-300 mb-1">
                        Duration (Minutes) *
                      </label>
                      <input
                        type="number"
                        required
                        min={5}
                        max={300}
                        value={newExam.duration_minutes}
                        onChange={(e) =>
                          setNewExam({
                            ...newExam,
                            duration_minutes: Number(e.target.value),
                          })
                        }
                        className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2 text-xs text-white placeholder-slate-400 focus:outline-none focus:border-indigo-500"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-semibold text-slate-300 mb-1">
                        Total Marks *
                      </label>
                      <input
                        type="number"
                        required
                        min={1}
                        value={newExam.total_marks}
                        onChange={(e) =>
                          setNewExam({
                            ...newExam,
                            total_marks: Number(e.target.value),
                          })
                        }
                        className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2 text-xs text-white placeholder-slate-400 focus:outline-none focus:border-indigo-500"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-slate-300 mb-1">
                        Passing Marks *
                      </label>
                      <input
                        type="number"
                        required
                        min={0}
                        value={newExam.pass_marks}
                        onChange={(e) =>
                          setNewExam({
                            ...newExam,
                            pass_marks: Number(e.target.value),
                          })
                        }
                        className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2 text-xs text-white placeholder-slate-400 focus:outline-none focus:border-indigo-500"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1">
                      Description
                    </label>
                    <textarea
                      rows={2}
                      placeholder="Special instructions or topics covered..."
                      value={newExam.description || ""}
                      onChange={(e) =>
                        setNewExam({ ...newExam, description: e.target.value })
                      }
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2 text-xs text-white placeholder-slate-400 focus:outline-none focus:border-indigo-500"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-semibold text-slate-300 mb-1">
                        Start Time
                      </label>
                      <input
                        type="datetime-local"
                        required
                        value={newExam.start_time}
                        onChange={(e) =>
                          setNewExam({ ...newExam, start_time: e.target.value })
                        }
                        className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-indigo-500"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-slate-300 mb-1">
                        End Time
                      </label>
                      <input
                        type="datetime-local"
                        required
                        value={newExam.end_time}
                        onChange={(e) =>
                          setNewExam({ ...newExam, end_time: e.target.value })
                        }
                        className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-indigo-500"
                      />
                    </div>
                  </div>

                  <div className="flex items-center gap-6 pt-2 text-xs text-slate-300">
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={newExam.negative_marking}
                        onChange={(e) =>
                          setNewExam({
                            ...newExam,
                            negative_marking: e.target.checked,
                          })
                        }
                        className="rounded"
                      />
                      Negative Marking
                    </label>

                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={newExam.shuffle_questions}
                        onChange={(e) =>
                          setNewExam({
                            ...newExam,
                            shuffle_questions: e.target.checked,
                          })
                        }
                        className="rounded"
                      />
                      Shuffle Questions
                    </label>
                  </div>

                  <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-800">
                    <button
                      type="button"
                      onClick={() => setShowCreateModal(false)}
                      className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-semibold text-slate-300 transition"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      className="px-5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-xs font-bold text-white shadow-md shadow-indigo-600/20 transition cursor-pointer"
                    >
                      Create Exam
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}

          {/* Assign Random Questions Modal */}
          {showAssignModal && (
            <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
              <div className="max-w-md w-full rounded-3xl bg-slate-900 border border-slate-800 p-6 sm:p-8 shadow-2xl">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-bold text-white flex items-center gap-2">
                    <FiShuffle className="text-indigo-400" />
                    Assign Random Questions
                  </h3>
                  <button
                    onClick={() => setShowAssignModal(null)}
                    className="text-slate-400 hover:text-white"
                  >
                    <FiX size={18} />
                  </button>
                </div>

                <p className="text-xs text-slate-400 mb-5">
                  Select criteria to pull randomized questions from the Question Bank into this exam.
                </p>

                {assignResult && (
                  <div className="p-3 mb-4 rounded-xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-300 text-xs flex items-center gap-2">
                    <FiCheck /> {assignResult}
                  </div>
                )}

                <form onSubmit={handleAssignQuestions} className="space-y-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1">
                      Subject
                    </label>
                    <input
                      type="text"
                      required
                      value={assignForm.subject}
                      onChange={(e) =>
                        setAssignForm({ ...assignForm, subject: e.target.value })
                      }
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1">
                      Difficulty Level
                    </label>
                    <select
                      value={assignForm.difficulty}
                      onChange={(e) =>
                        setAssignForm({
                          ...assignForm,
                          difficulty: e.target.value,
                        })
                      }
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none"
                    >
                      <option value="EASY">EASY</option>
                      <option value="MEDIUM">MEDIUM</option>
                      <option value="HARD">HARD</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1">
                      Question Count (Max 200)
                    </label>
                    <input
                      type="number"
                      min={1}
                      max={200}
                      required
                      value={assignForm.question_count}
                      onChange={(e) =>
                        setAssignForm({
                          ...assignForm,
                          question_count: Number(e.target.value),
                        })
                      }
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white"
                    />
                  </div>

                  <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-800">
                    <button
                      type="button"
                      onClick={() => setShowAssignModal(null)}
                      className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-semibold text-slate-300"
                    >
                      Close
                    </button>
                    <button
                      type="submit"
                      disabled={assigning}
                      className="px-5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 disabled:bg-indigo-900 text-xs font-bold text-white shadow-md transition cursor-pointer"
                    >
                      {assigning ? "Assigning..." : "Assign Questions"}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}

export default function ExaminerExamsPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-slate-950 flex items-center justify-center text-slate-400">
          Loading exams...
        </div>
      }
    >
      <ExaminerExamsContent />
    </Suspense>
  );
}
