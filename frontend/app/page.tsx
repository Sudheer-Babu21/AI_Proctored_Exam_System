import Link from "next/link";
import Navbar from "@/components/navbar/Navbar";
import {
  FiShield,
  FiEye,
  FiCpu,
  FiCheckSquare,
  FiArrowRight,
  FiLock,
  FiFileText,
  FiUsers,
} from "react-icons/fi";

export default function Home() {
  return (
    <div className="min-h-screen flex flex-col bg-slate-950 text-slate-100">
      <Navbar />

      {/* Hero Section */}
      <main className="flex-1 flex flex-col items-center justify-center px-4 sm:px-6 lg:px-8 py-16 relative overflow-hidden">
        {/* Subtle background glow */}
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[350px] bg-indigo-600/20 blur-[120px] rounded-full pointer-events-none" />
        <div className="absolute top-1/3 left-1/3 w-[300px] h-[200px] bg-cyan-600/15 blur-[100px] rounded-full pointer-events-none" />

        <div className="relative max-w-4xl mx-auto text-center">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-indigo-500/10 border border-indigo-500/30 text-indigo-300 text-xs font-semibold mb-6">
            <FiShield className="text-sm text-indigo-400" />
            Next-Gen AI Online Examination & Automated Proctoring
          </div>

          <h1 className="text-4xl sm:text-6xl font-extrabold tracking-tight text-white leading-tight">
            Secure, Intelligent{" "}
            <span className="bg-gradient-to-r from-indigo-400 via-purple-300 to-cyan-400 bg-clip-text text-transparent">
              AI-Proctored
            </span>{" "}
            Examinations
          </h1>

          <p className="mt-6 text-lg sm:text-xl text-slate-400 max-w-2xl mx-auto leading-relaxed">
            Eliminate academic dishonesty with automated computer vision monitoring,
            anti-switch browser shields, instant multi-format grading, and complete
            examiner audit logs.
          </p>

          {/* Call to Actions */}
          <div className="mt-10 flex flex-wrap items-center justify-center gap-4">
            <Link
              href="/login"
              className="px-8 py-3.5 rounded-xl text-base font-semibold bg-indigo-600 hover:bg-indigo-500 text-white shadow-xl shadow-indigo-600/25 transition duration-150 flex items-center gap-2 group"
            >
              Take an Exam
              <FiArrowRight className="group-hover:translate-x-1 transition-transform" />
            </Link>

            <Link
              href="/register"
              className="px-8 py-3.5 rounded-xl text-base font-semibold bg-slate-900 hover:bg-slate-800 text-slate-200 border border-slate-700/80 transition duration-150"
            >
              Create Account
            </Link>
          </div>

          {/* Role Direct Jump Cards */}
          <div className="mt-16 grid grid-cols-1 sm:grid-cols-3 gap-4 text-left max-w-3xl mx-auto">
            <Link
              href="/login"
              className="p-5 rounded-2xl bg-slate-900/60 border border-slate-800 hover:border-indigo-500/50 hover:bg-slate-900 transition duration-200 group"
            >
              <div className="w-10 h-10 rounded-xl bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 flex items-center justify-center mb-3">
                <FiFileText className="text-xl" />
              </div>
              <h3 className="font-semibold text-white group-hover:text-indigo-300 transition">
                Student Portal
              </h3>
              <p className="text-xs text-slate-400 mt-1">
                Access upcoming tests, submit image/text answers, and view instant score cards.
              </p>
            </Link>

            <Link
              href="/login"
              className="p-5 rounded-2xl bg-slate-900/60 border border-slate-800 hover:border-purple-500/50 hover:bg-slate-900 transition duration-200 group"
            >
              <div className="w-10 h-10 rounded-xl bg-purple-500/10 border border-purple-500/20 text-purple-400 flex items-center justify-center mb-3">
                <FiUsers className="text-xl" />
              </div>
              <h3 className="font-semibold text-white group-hover:text-purple-300 transition">
                Examiner Studio
              </h3>
              <p className="text-xs text-slate-400 mt-1">
                Author question banks, create timed exams, review subjective answers, and audit logs.
              </p>
            </Link>

            <Link
              href="/login"
              className="p-5 rounded-2xl bg-slate-900/60 border border-slate-800 hover:border-cyan-500/50 hover:bg-slate-900 transition duration-200 group"
            >
              <div className="w-10 h-10 rounded-xl bg-cyan-500/10 border border-cyan-500/20 text-cyan-400 flex items-center justify-center mb-3">
                <FiLock className="text-xl" />
              </div>
              <h3 className="font-semibold text-white group-hover:text-cyan-300 transition">
                Proctoring Shield
              </h3>
              <p className="text-xs text-slate-400 mt-1">
                Live webcam verification, fullscreen locking, copy/paste prevention, & WebSocket telemetry.
              </p>
            </Link>
          </div>
        </div>

        {/* Feature Highlights Grid */}
        <div className="mt-24 max-w-6xl mx-auto w-full">
          <div className="text-center mb-12">
            <h2 className="text-2xl sm:text-3xl font-bold text-white">
              Enterprise Proctoring Architecture
            </h2>
            <p className="text-slate-400 text-sm mt-2">
              Engineered with FastAPI, WebSockets, computer vision hooks, and automated scoring.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="p-6 rounded-2xl bg-slate-900/40 border border-slate-800/80">
              <div className="w-12 h-12 rounded-xl bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 flex items-center justify-center mb-4">
                <FiEye className="text-2xl" />
              </div>
              <h3 className="text-base font-semibold text-white mb-2">
                Real-Time Vision Checks
              </h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                Detects face missing, multi-person presence, and prolonged gaze divergence directly on device.
              </p>
            </div>

            <div className="p-6 rounded-2xl bg-slate-900/40 border border-slate-800/80">
              <div className="w-12 h-12 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 flex items-center justify-center mb-4">
                <FiCheckSquare className="text-2xl" />
              </div>
              <h3 className="text-base font-semibold text-white mb-2">
                6 Question Formats
              </h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                Full support for MCQ, Multi-Select, True/False, Short Answer, Long Essay, and Camera/Image upload.
              </p>
            </div>

            <div className="p-6 rounded-2xl bg-slate-900/40 border border-slate-800/80">
              <div className="w-12 h-12 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-400 flex items-center justify-center mb-4">
                <FiCpu className="text-2xl" />
              </div>
              <h3 className="text-base font-semibold text-white mb-2">
                Automated Scoring
              </h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                Instant objective auto-grading with negative marking algorithms and examiner subjective evaluation queues.
              </p>
            </div>

            <div className="p-6 rounded-2xl bg-slate-900/40 border border-slate-800/80">
              <div className="w-12 h-12 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-400 flex items-center justify-center mb-4">
                <FiShield className="text-2xl" />
              </div>
              <h3 className="text-base font-semibold text-white mb-2">
                Browser Lock & Audit
              </h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                Enforces fullscreen mode, intercepts tab switches and window blurs, and logs tamper events to server.
              </p>
            </div>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-900 bg-slate-950 py-8 px-4 text-center text-xs text-slate-400">
        <p>© 2026 AI Proctored Examination System. All rights reserved.</p>
      </footer>
    </div>
  );
}