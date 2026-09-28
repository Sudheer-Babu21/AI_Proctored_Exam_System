"use client";

import React, { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { useAuth } from "@/contexts/AuthContext";
import Navbar from "@/components/navbar/Navbar";
import Sidebar from "@/components/sidebar/Sidebar";
import {
  getSessionEvents,
  resolveProctorEvent,
} from "@/services/proctorService";
import {
  getSessionDetails,
  disqualifySession,
  publishSession,
} from "@/services/sessionService";
import { ProctorEvent, SessionListItem } from "@/types";
import {
  FiShield,
  FiAlertTriangle,
  FiCheckCircle,
  FiClock,
  FiArrowLeft,
  FiCamera,
  FiUserX,
  FiSend,
  FiActivity,
  FiImage,
  FiX,
} from "react-icons/fi";
import { API_BASE_URL } from "@/lib/api";

export default function ProctoringSessionAuditPage() {
  const params = useParams();
  const sessionId = params?.sessionId as string;
  const router = useRouter();
  const { token, loading: authLoading, role } = useAuth();

  const [session, setSession] = useState<SessionListItem | null>(null);
  const [events, setEvents] = useState<ProctorEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [resolvingId, setResolvingId] = useState<string | null>(null);
  const [activeSnapshotModal, setActiveSnapshotModal] = useState<string | null>(null);
  const [actionLoading, setActionLoading] = useState(false);
  const [actionMessage, setActionMessage] = useState<string | null>(null);

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
      if (!sessionId) return;
      try {
        const [sessionData, eventsData] = await Promise.all([
          getSessionDetails(sessionId).catch(() => null),
          getSessionEvents(sessionId).catch(() => []),
        ]);
        setSession(sessionData);
        setEvents(eventsData);
      } catch (err) {
        console.error("Failed to load proctor session audit data:", err);
      } finally {
        setLoading(false);
      }
    };

    if (token) {
      loadData();
    }
  }, [sessionId, token, authLoading, role, router]);

  const handleResolve = async (eventPublicId: string) => {
    setResolvingId(eventPublicId);
    try {
      await resolveProctorEvent(eventPublicId);
      setEvents((prev) =>
        prev.map((ev) =>
          ev.public_id === eventPublicId ? { ...ev, is_resolved: true } : ev
        )
      );
    } catch (err) {
      alert("Failed to resolve proctor event.");
    } finally {
      setResolvingId(null);
    }
  };

  const handleDisqualify = async () => {
    const reason = prompt(
      "Enter reason for candidate disqualification:",
      "Candidate disqualified for proctoring integrity violations."
    );
    if (!reason) return;

    setActionLoading(true);
    try {
      await disqualifySession(sessionId, reason);
      setActionMessage("Session has been officially disqualified.");
      if (session) {
        setSession({ ...session, status: "CANCELLED" });
      }
    } catch (err: any) {
      alert(err.response?.data?.detail || "Failed to disqualify session.");
    } finally {
      setActionLoading(false);
    }
  };

  const handlePublish = async () => {
    setActionLoading(true);
    try {
      await publishSession(sessionId);
      setActionMessage("Session results approved and published for candidate.");
    } catch (err: any) {
      alert(err.response?.data?.detail || "Failed to publish session.");
    } finally {
      setActionLoading(false);
    }
  };

  const unresolvedCount = events.filter((e) => !e.is_resolved).length;
  const maxSuspicion = events.reduce(
    (max, e) => Math.max(max, e.suspicion_score || 0),
    0
  );

  const snapshots = events.filter((e) => e.evidence_path);

  const getFullEvidenceUrl = (path: string) => {
    if (path.startsWith("http")) return path;
    const base = API_BASE_URL.replace(/\/$/, "");
    const cleanPath = path.startsWith("/") ? path : `/${path}`;
    return `${base}${cleanPath}`;
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col">
      <Navbar />

      <div className="flex-1 flex">
        <Sidebar />

        <main className="flex-1 p-6 sm:p-8 max-w-6xl">
          {/* Back link */}
          <Link
            href="/examiner/dashboard"
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-400 hover:text-indigo-400 mb-6 transition"
          >
            <FiArrowLeft /> Back to Dashboard
          </Link>

          {/* Action notification */}
          {actionMessage && (
            <div className="mb-6 p-4 rounded-2xl bg-indigo-500/20 border border-indigo-500/30 text-indigo-300 text-xs flex items-center justify-between">
              <span>{actionMessage}</span>
              <button
                onClick={() => setActionMessage(null)}
                className="text-slate-400 hover:text-white"
              >
                <FiX />
              </button>
            </div>
          )}

          {/* Header */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
            <div>
              <div className="flex items-center gap-2">
                <span className="px-3 py-1 rounded-full text-xs font-semibold bg-rose-500/15 text-rose-300 border border-rose-500/30 flex items-center gap-1.5">
                  <FiShield /> Security & Integrity Audit
                </span>
                {session?.status === "CANCELLED" && (
                  <span className="px-3 py-1 rounded-full text-xs font-bold bg-rose-500 text-white">
                    DISQUALIFIED
                  </span>
                )}
              </div>
              <h1 className="text-2xl sm:text-3xl font-bold text-white mt-2">
                Proctoring Review Panel
              </h1>
              <p className="text-xs sm:text-sm text-slate-400 mt-1 font-mono">
                Candidate: {session?.student_name || "Student"} ({session?.student_email || "N/A"}) • Session: {sessionId}
              </p>
            </div>

            {/* Examiner Integrity Decision Actions */}
            <div className="flex items-center gap-3">
              <button
                onClick={handleDisqualify}
                disabled={actionLoading || session?.status === "CANCELLED"}
                className="py-2.5 px-4 rounded-xl bg-rose-600/20 hover:bg-rose-600 disabled:opacity-40 text-rose-300 hover:text-white border border-rose-500/40 text-xs font-bold transition flex items-center gap-2 cursor-pointer shadow-lg shadow-rose-600/10"
              >
                <FiUserX /> Disqualify Candidate
              </button>

              <button
                onClick={handlePublish}
                disabled={actionLoading}
                className="py-2.5 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-500 disabled:opacity-40 text-white text-xs font-bold transition flex items-center gap-2 cursor-pointer shadow-lg shadow-emerald-600/20"
              >
                <FiSend /> Approve & Publish Results
              </button>
            </div>
          </div>

          {/* Audit Metrics Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-4 gap-4 mb-8">
            <div className="p-4 rounded-2xl bg-slate-900/60 border border-slate-800">
              <div className="text-xs text-slate-400 uppercase font-semibold">
                Total Events Logged
              </div>
              <div className="text-2xl font-black text-white mt-1">
                {events.length}
              </div>
            </div>

            <div className="p-4 rounded-2xl bg-slate-900/60 border border-slate-800">
              <div className="text-xs text-slate-400 uppercase font-semibold">
                Unresolved Flagged
              </div>
              <div
                className={`text-2xl font-black mt-1 ${
                  unresolvedCount > 0 ? "text-rose-400" : "text-emerald-400"
                }`}
              >
                {unresolvedCount}
              </div>
            </div>

            <div className="p-4 rounded-2xl bg-slate-900/60 border border-slate-800">
              <div className="text-xs text-slate-400 uppercase font-semibold flex items-center gap-1">
                <FiActivity /> Peak Suspicion Score
              </div>
              <div className="text-2xl font-black text-amber-400 mt-1">
                {(maxSuspicion * 100).toFixed(0)}%
              </div>
            </div>

            <div className="p-4 rounded-2xl bg-slate-900/60 border border-slate-800">
              <div className="text-xs text-slate-400 uppercase font-semibold flex items-center gap-1">
                <FiCamera /> Timestamped Snapshots
              </div>
              <div className="text-2xl font-black text-indigo-400 mt-1">
                {snapshots.length}
              </div>
            </div>
          </div>

          {/* Timestamped Snapshots Gallery */}
          {snapshots.length > 0 && (
            <div className="p-6 rounded-3xl bg-slate-900/60 border border-slate-800 mb-8">
              <h3 className="text-sm font-bold text-white mb-4 flex items-center gap-2">
                <FiImage className="text-indigo-400" />
                Violation Snapshot Gallery ({snapshots.length})
              </h3>
              <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-6 gap-3">
                {snapshots.map((ev) => (
                  <div
                    key={ev.public_id}
                    onClick={() => setActiveSnapshotModal(ev.evidence_path || null)}
                    className="group relative aspect-video bg-slate-950 rounded-xl overflow-hidden border border-slate-800 hover:border-indigo-500 transition cursor-pointer"
                  >
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={getFullEvidenceUrl(ev.evidence_path || "")}
                      alt="Violation Evidence"
                      className="w-full h-full object-cover group-hover:scale-105 transition"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-90 p-1.5 flex flex-col justify-end">
                      <span className="text-[9px] font-bold text-rose-300 uppercase truncate">
                        {ev.event_type.replace(/_/g, " ")}
                      </span>
                      <span className="text-[8px] text-slate-400 font-mono">
                        {ev.event_time ? new Date(ev.event_time).toLocaleTimeString() : ""}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Events Timeline Log */}
          <div className="p-6 rounded-3xl bg-slate-900/60 border border-slate-800">
            <h3 className="text-sm font-bold text-white mb-4 flex items-center gap-2">
              <FiClock className="text-indigo-400" />
              Proctoring Event Timeline Log
            </h3>

            {loading ? (
              <div className="p-16 flex flex-col items-center justify-center gap-3 text-slate-400">
                <span className="w-8 h-8 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" />
                <p className="text-xs">Fetching proctoring events...</p>
              </div>
            ) : events.length === 0 ? (
              <div className="p-12 text-center rounded-3xl bg-slate-900/40 border border-slate-800 text-slate-400">
                <FiCheckCircle className="text-4xl mx-auto mb-3 text-emerald-400" />
                <p className="text-base font-bold text-white">Clean Session Record</p>
                <p className="text-xs text-slate-400 mt-1">
                  No proctoring violations or suspicious activities recorded for this candidate.
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {events.map((ev) => (
                  <div
                    key={ev.public_id}
                    className={`p-4 rounded-2xl border transition flex flex-col sm:flex-row sm:items-center justify-between gap-3 ${
                      ev.is_resolved
                        ? "bg-slate-900/40 border-slate-800/80 opacity-70"
                        : "bg-slate-900/80 border-rose-500/30"
                    }`}
                  >
                    <div className="flex items-start gap-3">
                      <div
                        className={`p-2 rounded-xl text-lg shrink-0 ${
                          ev.is_resolved
                            ? "bg-slate-800 text-slate-400"
                            : "bg-rose-500/15 text-rose-400"
                        }`}
                      >
                        <FiAlertTriangle />
                      </div>

                      <div>
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-bold text-white uppercase tracking-wider">
                            {ev.event_type.replace(/_/g, " ")}
                          </span>
                          <span
                            className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                              ev.suspicion_score > 0.6
                                ? "bg-rose-500/20 text-rose-300"
                                : "bg-amber-500/20 text-amber-300"
                            }`}
                          >
                            {(ev.suspicion_score * 100).toFixed(0)}% Suspicion
                          </span>
                          {ev.is_resolved && (
                            <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-emerald-500/20 text-emerald-300">
                              Resolved
                            </span>
                          )}
                        </div>

                        <p className="text-xs text-slate-300 mt-1">
                          {ev.remarks || "Automated proctoring event trigger."}
                        </p>

                        <div className="flex items-center gap-4 mt-1.5 text-[10px] text-slate-400 font-mono">
                          {ev.event_time && (
                            <span>Time: {new Date(ev.event_time).toLocaleString()}</span>
                          )}
                          {ev.evidence_path && (
                            <button
                              onClick={() => setActiveSnapshotModal(ev.evidence_path || null)}
                              className="text-indigo-400 hover:text-indigo-300 underline underline-offset-2 flex items-center gap-1 cursor-pointer"
                            >
                              <FiCamera /> View Snapshot
                            </button>
                          )}
                        </div>
                      </div>
                    </div>

                    {!ev.is_resolved && (
                      <button
                        onClick={() => handleResolve(ev.public_id)}
                        disabled={resolvingId === ev.public_id}
                        className="py-1.5 px-3 rounded-xl bg-slate-800 hover:bg-emerald-600/30 text-slate-300 hover:text-emerald-300 text-xs font-semibold border border-slate-700 hover:border-emerald-500/40 transition whitespace-nowrap self-start sm:self-auto cursor-pointer"
                      >
                        {resolvingId === ev.public_id ? (
                          "Resolving..."
                        ) : (
                          "Mark Resolved"
                        )}
                      </button>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </main>
      </div>

      {/* Snapshot Lightbox Modal */}
      {activeSnapshotModal && (
        <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-4">
          <div className="max-w-2xl w-full bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-2xl relative">
            <div className="flex items-center justify-between mb-4">
              <h4 className="text-sm font-bold text-white flex items-center gap-2">
                <FiCamera className="text-indigo-400" />
                Proctoring Violation Snapshot Evidence
              </h4>
              <button
                onClick={() => setActiveSnapshotModal(null)}
                className="p-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white transition"
              >
                <FiX />
              </button>
            </div>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={getFullEvidenceUrl(activeSnapshotModal)}
              alt="Snapshot Modal Evidence"
              className="w-full max-h-[70vh] object-contain rounded-2xl border border-slate-800 bg-black"
            />
          </div>
        </div>
      )}
    </div>
  );
}
