"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import Navbar from "@/components/navbar/Navbar";
import { getAllExams, startExam } from "@/services/examService";
import { Exam } from "@/types";
import {
  FiBookOpen,
  FiClock,
  FiAward,
  FiSearch,
  FiPlay,
  FiAlertCircle,
  FiCheckCircle,
} from "react-icons/fi";

export default function StudentExamsPage() {
  const router = useRouter();
  const { token, loading: authLoading } = useAuth();
  const [exams, setExams] = useState<Exam[]>([]);
  const [search, setSearch] = useState("");
  const [selectedSubject, setSelectedSubject] = useState("ALL");
  const [loading, setLoading] = useState(true);
  const [startingId, setStartingId] = useState<string | null>(null);

  useEffect(() => {
    if (!authLoading && !token) {
      router.push("/login");
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
  }, [token, authLoading, router]);

  const subjects = [
    "ALL",
    ...Array.from(new Set(exams.map((e) => e.subject.toUpperCase()))),
  ];

  const filteredExams = exams.filter((exam) => {
    const matchesSearch =
      exam.title.toLowerCase().includes(search.toLowerCase()) ||
      exam.subject.toLowerCase().includes(search.toLowerCase());
    const matchesSubject =
      selectedSubject === "ALL" ||
      exam.subject.toUpperCase() === selectedSubject;
    return matchesSearch && matchesSubject;
  });

  const handleStartExam = async (examPublicId: string) => {
    setStartingId(examPublicId);
    try {
      const session = await startExam(examPublicId);
      router.push(`/student/exam/${session.session_id}`);
    } catch (err: any) {
      console.error("Failed to start exam:", err);
      alert(
        err.response?.data?.detail ||
          "Could not launch the exam session. Please check with your examiner."
      );
      setStartingId(null);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col">
      <Navbar />

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-8">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-white flex items-center gap-2.5">
              <FiBookOpen className="text-indigo-400" />
              Exams Catalog
            </h1>
            <p className="text-xs sm:text-sm text-slate-400 mt-1">
              Browse all scheduled and active assessments available for your enrollment
            </p>
          </div>

          {/* Search Bar */}
          <div className="relative w-full md:w-72">
            <FiSearch className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Search by title or subject..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full bg-slate-900 border border-slate-800 rounded-xl pl-10 pr-4 py-2 text-sm text-slate-100 placeholder-slate-400 focus:outline-none focus:border-indigo-500 transition"
            />
          </div>
        </div>

        {/* Subject Filter Pills */}
        <div className="flex items-center gap-2 overflow-x-auto pb-4 mb-6">
          {subjects.map((sub) => (
            <button
              key={sub}
              onClick={() => setSelectedSubject(sub)}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition ${
                selectedSubject === sub
                  ? "bg-indigo-600 text-white shadow-md shadow-indigo-600/30"
                  : "bg-slate-900 text-slate-400 hover:text-slate-200 border border-slate-800"
              }`}
            >
              {sub}
            </button>
          ))}
        </div>

        {/* Loading State */}
        {loading ? (
          <div className="p-16 flex flex-col items-center justify-center gap-3 text-slate-400">
            <span className="w-8 h-8 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" />
            <p className="text-xs">Fetching exams catalog...</p>
          </div>
        ) : filteredExams.length === 0 ? (
          <div className="p-12 text-center rounded-2xl bg-slate-900/40 border border-slate-800 text-slate-400">
            <p className="text-sm font-medium text-slate-300">No exams match your search criteria</p>
            <p className="text-xs text-slate-400 mt-1">Try resetting filters or searching for another subject.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredExams.map((exam) => (
              <div
                key={exam.public_id}
                className="p-6 rounded-2xl bg-slate-900/70 border border-slate-800 hover:border-slate-700 transition flex flex-col justify-between"
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
                  <p className="text-xs text-slate-400 mt-2 line-clamp-3">
                    {exam.description || "Official assessment for " + exam.subject}
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
                        {exam.negative_marking ? "Yes" : "No"}
                      </span>
                    </div>
                    <div>
                      Shuffle Questions:{" "}
                      <span className="text-slate-400">
                        {exam.shuffle_questions ? "Yes" : "No"}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="mt-6">
                  <button
                    onClick={() => handleStartExam(exam.public_id)}
                    disabled={startingId === exam.public_id}
                    className="w-full py-2.5 px-4 rounded-xl bg-indigo-600 hover:bg-indigo-500 disabled:bg-indigo-900 text-white text-xs font-semibold shadow-lg shadow-indigo-600/20 transition flex items-center justify-center gap-2 cursor-pointer"
                  >
                    {startingId === exam.public_id ? (
                      <>
                        <span className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                        Entering Exam Room...
                      </>
                    ) : (
                      <>
                        <FiPlay /> Launch Assessment
                      </>
                    )}
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
