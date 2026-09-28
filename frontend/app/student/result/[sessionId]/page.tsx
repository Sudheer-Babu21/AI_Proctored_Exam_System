"use client";

import React, { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import Navbar from "@/components/navbar/Navbar";
import { getResult, downloadResultPdf } from "@/services/resultService";
import { ResultResponse } from "@/types";
import {
  FiAward,
  FiCheckCircle,
  FiXCircle,
  FiClock,
  FiArrowRight,
  FiShield,
  FiDownload,
  FiFileText,
  FiAlertTriangle,
} from "react-icons/fi";

export default function StudentResultPage() {
  const params = useParams();
  const sessionId = params?.sessionId as string;
  const router = useRouter();

  const [result, setResult] = useState<ResultResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [downloadingPdf, setDownloadingPdf] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!sessionId) return;

    const fetchResult = async () => {
      try {
        const data = await getResult(sessionId);
        setResult(data);
      } catch (err: any) {
        console.error("Failed to load result:", err);
        setError(
          err.response?.data?.detail ||
            "Your results are currently being calculated or subjective questions are awaiting manual examiner review."
        );
      } finally {
        setLoading(false);
      }
    };

    fetchResult();
  }, [sessionId]);

  const handleDownloadPdf = async () => {
    if (!sessionId) return;
    setDownloadingPdf(true);
    try {
      await downloadResultPdf(sessionId);
    } catch (err: any) {
      console.error("PDF download error:", err);
      alert(
        err.response?.data?.detail ||
          "Failed to generate PDF report. Please verify your result has been published."
      );
    } finally {
      setDownloadingPdf(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col">
      <Navbar />

      <main className="flex-1 max-w-4xl w-full mx-auto px-4 sm:px-6 py-12 flex flex-col items-center justify-center">
        {loading ? (
          <div className="flex flex-col items-center gap-3 text-slate-400">
            <span className="w-10 h-10 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" />
            <p className="text-sm">Generating Official Result & Score Transcript...</p>
          </div>
        ) : error ? (
          <div className="max-w-md w-full p-8 rounded-3xl bg-slate-900 border border-slate-800 text-center shadow-xl">
            <div className="w-12 h-12 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-amber-400 flex items-center justify-center mx-auto mb-4 text-2xl">
              <FiClock />
            </div>
            <h2 className="text-xl font-bold text-white mb-2">
              Submission In Review
            </h2>
            <p className="text-xs text-slate-400 leading-relaxed mb-6">
              {error}
            </p>
            <Link
              href="/student/dashboard"
              className="inline-flex items-center gap-2 px-6 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold shadow-lg shadow-indigo-600/20 transition cursor-pointer"
            >
              Back to Dashboard
            </Link>
          </div>
        ) : result ? (
          <div className="w-full max-w-xl p-8 rounded-3xl bg-slate-900/90 border border-slate-800 shadow-2xl backdrop-blur-xl relative overflow-hidden">
            {/* Subtle glow header */}
            <div
              className={`absolute top-0 left-1/2 -translate-x-1/2 w-64 h-32 blur-[80px] pointer-events-none rounded-full ${
                result.status === "PASS"
                  ? "bg-emerald-500/20"
                  : "bg-rose-500/20"
              }`}
            />

            <div className="text-center mb-8 relative">
              <div
                className={`w-16 h-16 rounded-3xl flex items-center justify-center mx-auto mb-4 text-3xl shadow-xl ${
                  result.status === "PASS"
                    ? "bg-emerald-500/15 border border-emerald-500/30 text-emerald-400"
                    : "bg-rose-500/15 border border-rose-500/30 text-rose-400"
                }`}
              >
                {result.status === "PASS" ? (
                  <FiCheckCircle />
                ) : (
                  <FiXCircle />
                )}
              </div>

              <span
                className={`inline-block px-3.5 py-1 rounded-full text-xs font-extrabold uppercase tracking-wider mb-2 ${
                  result.status === "PASS"
                    ? "bg-emerald-500/20 text-emerald-300 border border-emerald-500/30"
                    : "bg-rose-500/20 text-rose-300 border border-rose-500/30"
                }`}
              >
                {result.status === "PASS" ? "Examination Passed" : "Examination Failed"}
              </span>

              <h1 className="text-3xl font-extrabold text-white mt-1">
                Official Result Summary
              </h1>
              <p className="text-xs text-slate-400 mt-1 font-mono">
                Session ID: {sessionId}
              </p>
            </div>

            {/* Score Big Display */}
            <div className="p-6 rounded-2xl bg-slate-950/80 border border-slate-800 mb-6 flex items-center justify-around text-center">
              <div>
                <div className="text-xs text-slate-400 uppercase tracking-wider font-semibold">
                  Percentage
                </div>
                <div className="text-3xl sm:text-4xl font-black text-white mt-1">
                  {result.percentage.toFixed(1)}%
                </div>
              </div>

              <div className="h-10 w-[1px] bg-slate-800" />

              <div>
                <div className="text-xs text-slate-400 uppercase tracking-wider font-semibold">
                  Final Marks
                </div>
                <div className="text-3xl sm:text-4xl font-black text-indigo-400 mt-1">
                  {result.final_score}
                  <span className="text-sm font-normal text-slate-500">
                    /{result.max_score}
                  </span>
                </div>
              </div>
            </div>

            {/* Score Metrics Grid */}
            <div className="grid grid-cols-2 gap-3 mb-6 text-xs">
              <div className="p-3.5 rounded-xl bg-slate-950/50 border border-slate-800">
                <span className="text-slate-400">Total Score:</span>
                <span className="float-right font-bold text-slate-200">
                  {result.total_score}
                </span>
              </div>

              <div className="p-3.5 rounded-xl bg-slate-950/50 border border-slate-800">
                <span className="text-slate-400">Max Possible:</span>
                <span className="float-right font-bold text-slate-200">
                  {result.max_score}
                </span>
              </div>

              <div className="p-3.5 rounded-xl bg-slate-950/50 border border-slate-800">
                <span className="text-slate-400">Proctoring Status:</span>
                <span className="float-right font-bold text-emerald-400 flex items-center gap-1">
                  <FiShield /> Audited
                </span>
              </div>

              <div className="p-3.5 rounded-xl bg-slate-950/50 border border-slate-800">
                <span className="text-slate-400">Grading System:</span>
                <span className="float-right font-bold text-indigo-400">
                  FastAPI + GPT-4o
                </span>
              </div>
            </div>

            {/* PDF Report Download Button */}
            <div className="mb-6">
              <button
                type="button"
                onClick={handleDownloadPdf}
                disabled={downloadingPdf}
                className="w-full py-3 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white text-xs font-bold shadow-lg shadow-emerald-600/20 transition flex items-center justify-center gap-2 cursor-pointer"
              >
                {downloadingPdf ? (
                  <>
                    <span className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    Generating Official PDF Report...
                  </>
                ) : (
                  <>
                    <FiDownload /> Download Official PDF Report
                  </>
                )}
              </button>
            </div>

            {/* Return CTAs */}
            <div className="flex flex-col sm:flex-row gap-3">
              <Link
                href="/student/dashboard"
                className="flex-1 py-3 px-4 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold shadow-lg shadow-indigo-600/20 text-center transition flex items-center justify-center gap-2 cursor-pointer"
              >
                Return to Dashboard <FiArrowRight />
              </Link>
              <Link
                href="/student/exams"
                className="py-3 px-5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold text-center transition cursor-pointer"
              >
                Browse Exams
              </Link>
            </div>
          </div>
        ) : null}
      </main>
    </div>
  );
}
