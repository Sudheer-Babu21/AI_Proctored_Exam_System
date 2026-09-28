"use client";

import React, { useEffect, useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import Navbar from "@/components/navbar/Navbar";
import Sidebar from "@/components/sidebar/Sidebar";
import {
  getAllQuestions,
  createQuestion,
  deleteQuestion,
  searchQuestions,
} from "@/services/questionService";
import { Question, QuestionCreatePayload, QuestionType, DifficultyLevel } from "@/types";
import {
  FiLayers,
  FiPlusCircle,
  FiTrash2,
  FiSearch,
  FiCheckCircle,
  FiX,
  FiPlus,
} from "react-icons/fi";

function ExaminerQuestionsContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { token, loading: authLoading, role } = useAuth();

  const [questions, setQuestions] = useState<Question[]>([]);
  const [loading, setLoading] = useState(true);

  // Filter state
  const [searchSubject, setSearchSubject] = useState("");
  const [filterType, setFilterType] = useState<string>("ALL");
  const [filterDifficulty, setFilterDifficulty] = useState<string>("ALL");

  // Create Modal state
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newQ, setNewQ] = useState<QuestionCreatePayload>({
    question_text: "",
    question_type: "MCQ",
    difficulty: "EASY",
    subject: "Python",
    topic: "Basics",
    marks: 5,
    negative_marks: 0,
    model_answer: "",
    explanation: "",
    language: "English",
    options: [
      { option_text: "Option A", is_correct: true },
      { option_text: "Option B", is_correct: false },
      { option_text: "Option C", is_correct: false },
      { option_text: "Option D", is_correct: false },
    ],
  });

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

    const loadQuestions = async () => {
      try {
        const data = await getAllQuestions(0, 100);
        setQuestions(data);
      } catch (err) {
        console.error("Failed to load questions:", err);
      } finally {
        setLoading(false);
      }
    };

    if (token) {
      loadQuestions();
    }
  }, [token, authLoading, role, router]);

  const handleTypeChange = (type: QuestionType) => {
    let defaultOptions: { option_text: string; is_correct: boolean }[] = [];

    if (type === "MCQ") {
      defaultOptions = [
        { option_text: "", is_correct: true },
        { option_text: "", is_correct: false },
        { option_text: "", is_correct: false },
        { option_text: "", is_correct: false },
      ];
    } else if (type === "MULTI_SELECT") {
      defaultOptions = [
        { option_text: "", is_correct: true },
        { option_text: "", is_correct: true },
        { option_text: "", is_correct: false },
      ];
    } else if (type === "TRUE_FALSE") {
      defaultOptions = [
        { option_text: "True", is_correct: true },
        { option_text: "False", is_correct: false },
      ];
    } else {
      defaultOptions = [];
    }

    setNewQ({
      ...newQ,
      question_type: type,
      options: defaultOptions,
    });
  };

  const handleOptionTextChange = (idx: number, text: string) => {
    const updated = [...newQ.options];
    updated[idx].option_text = text;
    setNewQ({ ...newQ, options: updated });
  };

  const handleOptionCorrectChange = (idx: number) => {
    const updated = [...newQ.options];
    if (newQ.question_type === "MCQ" || newQ.question_type === "TRUE_FALSE") {
      updated.forEach((o, i) => (o.is_correct = i === idx));
    } else {
      updated[idx].is_correct = !updated[idx].is_correct;
    }
    setNewQ({ ...newQ, options: updated });
  };

  const addOption = () => {
    setNewQ({
      ...newQ,
      options: [...newQ.options, { option_text: "", is_correct: false }],
    });
  };

  const removeOption = (idx: number) => {
    setNewQ({
      ...newQ,
      options: newQ.options.filter((_, i) => i !== idx),
    });
  };

  const handleCreateQuestionSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Basic client validation
    if (
      newQ.question_type === "MCQ" ||
      newQ.question_type === "MULTI_SELECT" ||
      newQ.question_type === "TRUE_FALSE"
    ) {
      if (newQ.options.length < 2) {
        alert("At least 2 options are required.");
        return;
      }
      const correctCount = newQ.options.filter((o) => o.is_correct).length;
      if (correctCount === 0) {
        alert("Please designate at least one option as correct.");
        return;
      }
      if (newQ.question_type === "MCQ" && correctCount !== 1) {
        alert("MCQ must have exactly one correct option.");
        return;
      }
    }

    try {
      const payload: QuestionCreatePayload = {
        ...newQ,
        options:
          newQ.question_type === "SHORT_ANSWER" ||
          newQ.question_type === "LONG_ANSWER" ||
          newQ.question_type === "IMAGE_UPLOAD"
            ? []
            : newQ.options,
      };

      const created = await createQuestion(payload);
      setQuestions((prev) => [created, ...prev]);
      setShowCreateModal(false);
      alert("Question added to bank successfully!");
    } catch (err: any) {
      console.error("Create question error:", err);
      alert(
        err.response?.data?.detail ||
          "Failed to create question. Check required fields."
      );
    }
  };

  const handleDelete = async (publicId: string) => {
    if (!confirm("Remove this question from the Question Bank?")) return;
    try {
      await deleteQuestion(publicId);
      setQuestions((prev) => prev.filter((q) => q.public_id !== publicId));
    } catch (err) {
      alert("Failed to delete question.");
    }
  };

  const filteredQuestions = questions.filter((q) => {
    const matchesSubject =
      !searchSubject ||
      q.subject.toLowerCase().includes(searchSubject.toLowerCase()) ||
      q.question_text.toLowerCase().includes(searchSubject.toLowerCase());
    const matchesType = filterType === "ALL" || q.question_type === filterType;
    const matchesDiff =
      filterDifficulty === "ALL" || q.difficulty === filterDifficulty;
    return matchesSubject && matchesType && matchesDiff;
  });

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col">
      <Navbar />

      <div className="flex-1 flex">
        <Sidebar />

        <main className="flex-1 p-6 sm:p-8 max-w-6xl">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold text-white flex items-center gap-2.5">
                <FiLayers className="text-indigo-400" />
                Question Bank
              </h1>
              <p className="text-xs sm:text-sm text-slate-400 mt-1">
                Author and organize multi-format questions with dynamic options and scoring keys.
              </p>
            </div>

            <button
              onClick={() => setShowCreateModal(true)}
              className="px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold shadow-lg shadow-indigo-600/20 transition flex items-center gap-2 cursor-pointer self-start"
            >
              <FiPlusCircle className="text-sm" /> Add New Question
            </button>
          </div>

          {/* Filters Bar */}
          <div className="p-4 rounded-2xl bg-slate-900/60 border border-slate-800 mb-6 grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="relative">
              <FiSearch className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                placeholder="Search subject or text..."
                value={searchSubject}
                onChange={(e) => setSearchSubject(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-9 pr-4 py-2 text-xs text-white placeholder-slate-400 focus:outline-none focus:border-indigo-500"
              />
            </div>

            <div>
              <select
                value={filterType}
                onChange={(e) => setFilterType(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none"
              >
                <option value="ALL">All Question Types</option>
                <option value="MCQ">Multiple Choice (MCQ)</option>
                <option value="MULTI_SELECT">Multi-Select</option>
                <option value="TRUE_FALSE">True / False</option>
                <option value="SHORT_ANSWER">Short Answer</option>
                <option value="LONG_ANSWER">Long Answer</option>
                <option value="IMAGE_UPLOAD">Image Upload</option>
              </select>
            </div>

            <div>
              <select
                value={filterDifficulty}
                onChange={(e) => setFilterDifficulty(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none"
              >
                <option value="ALL">All Difficulties</option>
                <option value="EASY">EASY</option>
                <option value="MEDIUM">MEDIUM</option>
                <option value="HARD">HARD</option>
              </select>
            </div>
          </div>

          {/* Questions List */}
          {loading ? (
            <div className="p-16 flex flex-col items-center justify-center gap-3 text-slate-400">
              <span className="w-8 h-8 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" />
              <p className="text-xs">Loading Question Bank items...</p>
            </div>
          ) : filteredQuestions.length === 0 ? (
            <div className="p-12 text-center rounded-3xl bg-slate-900/40 border border-slate-800 text-slate-400">
              <p className="text-sm font-medium text-slate-300">No questions found</p>
              <p className="text-xs text-slate-500 mt-1">
                Click "Add New Question" above to build your question repository.
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {filteredQuestions.map((q, idx) => (
                <div
                  key={q.public_id}
                  className="p-5 sm:p-6 rounded-3xl bg-slate-900/70 border border-slate-800 hover:border-slate-700 transition"
                >
                  <div className="flex flex-wrap items-center justify-between gap-2 mb-3">
                    <div className="flex items-center gap-2">
                      <span className="px-2.5 py-0.5 rounded-lg text-xs font-semibold bg-indigo-500/15 text-indigo-300 border border-indigo-500/20">
                        {q.subject}
                      </span>
                      <span className="px-2 py-0.5 rounded-lg text-xs font-semibold bg-slate-800 text-slate-300">
                        {q.question_type.replace(/_/g, " ")}
                      </span>
                      <span
                        className={`px-2 py-0.5 rounded-lg text-[10px] font-bold ${
                          q.difficulty === "EASY"
                            ? "text-emerald-400"
                            : q.difficulty === "MEDIUM"
                            ? "text-amber-400"
                            : "text-rose-400"
                        }`}
                      >
                        {q.difficulty}
                      </span>
                    </div>

                    <div className="flex items-center gap-3">
                      <span className="text-xs text-slate-400 font-mono">
                        Marks: <strong className="text-emerald-400">+{q.marks}</strong>
                        {q.negative_marks > 0 && (
                          <span className="text-rose-400 ml-1">
                            (-{q.negative_marks})
                          </span>
                        )}
                      </span>
                      <button
                        onClick={() => handleDelete(q.public_id)}
                        className="p-1.5 rounded-lg bg-slate-800 hover:bg-rose-500/20 text-slate-400 hover:text-rose-300 transition text-xs"
                      >
                        <FiTrash2 />
                      </button>
                    </div>
                  </div>

                  <p className="text-sm sm:text-base font-medium text-slate-100 mb-3">
                    {q.question_text}
                  </p>

                  {/* Render Options if present */}
                  {q.options && q.options.length > 0 && (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mt-3 pt-3 border-t border-slate-800/60">
                      {q.options.map((opt, i) => (
                        <div
                          key={i}
                          className={`p-2.5 rounded-xl text-xs flex items-center justify-between border ${
                            opt.is_correct
                              ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-300 font-semibold"
                              : "bg-slate-950 border-slate-800 text-slate-400"
                          }`}
                        >
                          <span>{opt.option_text}</span>
                          {opt.is_correct && (
                            <span className="text-[10px] uppercase font-bold text-emerald-400">
                              ✓ Correct
                            </span>
                          )}
                        </div>
                      ))}
                    </div>
                  )}

                  {q.explanation && (
                    <div className="mt-3 text-xs text-slate-500 italic">
                      Explanation: {q.explanation}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}

          {/* Add Question Modal */}
          {showCreateModal && (
            <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
              <div className="max-w-2xl w-full rounded-3xl bg-slate-900 border border-slate-800 p-6 sm:p-8 shadow-2xl my-8">
                <div className="flex items-center justify-between mb-5">
                  <h3 className="text-xl font-bold text-white">
                    Add Question to Bank
                  </h3>
                  <button
                    onClick={() => setShowCreateModal(false)}
                    className="text-slate-400 hover:text-white"
                  >
                    <FiX size={20} />
                  </button>
                </div>

                <form onSubmit={handleCreateQuestionSubmit} className="space-y-4">
                  {/* Subject, Topic, Difficulty, Type */}
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                    <div>
                      <label className="block text-xs font-semibold text-slate-300 mb-1">
                        Subject *
                      </label>
                      <input
                        type="text"
                        required
                        value={newQ.subject}
                        onChange={(e) =>
                          setNewQ({ ...newQ, subject: e.target.value })
                        }
                        className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-slate-300 mb-1">
                        Topic
                      </label>
                      <input
                        type="text"
                        value={newQ.topic || ""}
                        onChange={(e) =>
                          setNewQ({ ...newQ, topic: e.target.value })
                        }
                        className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-slate-300 mb-1">
                        Question Type *
                      </label>
                      <select
                        value={newQ.question_type}
                        onChange={(e) =>
                          handleTypeChange(e.target.value as QuestionType)
                        }
                        className="w-full bg-slate-950 border border-slate-800 rounded-xl px-2 py-2 text-xs text-white focus:outline-none"
                      >
                        <option value="MCQ">MCQ</option>
                        <option value="MULTI_SELECT">Multi Select</option>
                        <option value="TRUE_FALSE">True/False</option>
                        <option value="SHORT_ANSWER">Short Answer</option>
                        <option value="LONG_ANSWER">Long Answer</option>
                        <option value="IMAGE_UPLOAD">Image Upload</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-slate-300 mb-1">
                        Difficulty *
                      </label>
                      <select
                        value={newQ.difficulty}
                        onChange={(e) =>
                          setNewQ({
                            ...newQ,
                            difficulty: e.target.value as DifficultyLevel,
                          })
                        }
                        className="w-full bg-slate-950 border border-slate-800 rounded-xl px-2 py-2 text-xs text-white focus:outline-none"
                      >
                        <option value="EASY">EASY</option>
                        <option value="MEDIUM">MEDIUM</option>
                        <option value="HARD">HARD</option>
                      </select>
                    </div>
                  </div>

                  {/* Question Text */}
                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1">
                      Question Prompt *
                    </label>
                    <textarea
                      rows={3}
                      required
                      placeholder="Type the question content here..."
                      value={newQ.question_text}
                      onChange={(e) =>
                        setNewQ({ ...newQ, question_text: e.target.value })
                      }
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-xs text-white placeholder-slate-400 focus:outline-none focus:border-indigo-500"
                    />
                  </div>

                  {/* Marks & Negative Marks */}
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-semibold text-slate-300 mb-1">
                        Marks Awarded *
                      </label>
                      <input
                        type="number"
                        min={1}
                        required
                        value={newQ.marks}
                        onChange={(e) =>
                          setNewQ({ ...newQ, marks: Number(e.target.value) })
                        }
                        className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-slate-300 mb-1">
                        Negative Marks (Deduction)
                      </label>
                      <input
                        type="number"
                        min={0}
                        step={0.5}
                        value={newQ.negative_marks}
                        onChange={(e) =>
                          setNewQ({
                            ...newQ,
                            negative_marks: Number(e.target.value),
                          })
                        }
                        className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white"
                      />
                    </div>
                  </div>

                  {/* Dynamic Options Builder (Objective Questions) */}
                  {(newQ.question_type === "MCQ" ||
                    newQ.question_type === "MULTI_SELECT" ||
                    newQ.question_type === "TRUE_FALSE") && (
                    <div className="p-4 rounded-2xl bg-slate-950/60 border border-slate-800 space-y-3">
                      <div className="flex items-center justify-between text-xs">
                        <span className="font-semibold text-slate-300">
                          Options List (Toggle radio/checkbox for correct choice)
                        </span>
                        {newQ.question_type !== "TRUE_FALSE" && (
                          <button
                            type="button"
                            onClick={addOption}
                            className="text-xs font-semibold text-indigo-400 hover:text-indigo-300 flex items-center gap-1 cursor-pointer"
                          >
                            <FiPlus /> Add Option
                          </button>
                        )}
                      </div>

                      <div className="space-y-2">
                        {newQ.options.map((opt, i) => (
                          <div key={i} className="flex items-center gap-2">
                            <input
                              type={
                                newQ.question_type === "MULTI_SELECT"
                                  ? "checkbox"
                                  : "radio"
                              }
                              name="correct_option"
                              checked={opt.is_correct}
                              onChange={() => handleOptionCorrectChange(i)}
                              title="Mark as correct"
                              className="accent-indigo-500 cursor-pointer"
                            />
                            <input
                              type="text"
                              required
                              placeholder={`Option ${i + 1} text`}
                              value={opt.option_text}
                              onChange={(e) =>
                                handleOptionTextChange(i, e.target.value)
                              }
                              className="flex-1 bg-slate-900 border border-slate-800 rounded-xl px-3 py-1.5 text-xs text-white focus:outline-none"
                            />
                            {newQ.question_type !== "TRUE_FALSE" &&
                              newQ.options.length > 2 && (
                                <button
                                  type="button"
                                  onClick={() => removeOption(i)}
                                  className="text-slate-500 hover:text-rose-400 p-1"
                                >
                                  <FiX size={16} />
                                </button>
                              )}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Model Answer & Explanation */}
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-semibold text-slate-300 mb-1">
                        Model Answer (Reference)
                      </label>
                      <input
                        type="text"
                        placeholder="Expected answer keywords or criteria..."
                        value={newQ.model_answer || ""}
                        onChange={(e) =>
                          setNewQ({ ...newQ, model_answer: e.target.value })
                        }
                        className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-slate-300 mb-1">
                        Explanation
                      </label>
                      <input
                        type="text"
                        placeholder="Reasoning shown during review..."
                        value={newQ.explanation || ""}
                        onChange={(e) =>
                          setNewQ({ ...newQ, explanation: e.target.value })
                        }
                        className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white"
                      />
                    </div>
                  </div>

                  <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-800">
                    <button
                      type="button"
                      onClick={() => setShowCreateModal(false)}
                      className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-semibold text-slate-300"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      className="px-5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-xs font-bold text-white shadow-md transition cursor-pointer"
                    >
                      Save Question
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

export default function ExaminerQuestionsPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-slate-950 flex items-center justify-center text-slate-400">
          Loading Question Bank...
        </div>
      }
    >
      <ExaminerQuestionsContent />
    </Suspense>
  );
}
