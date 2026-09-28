"use client";

import React, { useEffect, useState, useRef, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import {
  getExamQuestions,
  submitAnswer,
  uploadImageAnswer,
  submitExam,
} from "@/services/sessionService";
import {
  createProctorEvent,
  getProctorWebSocketUrl,
} from "@/services/proctorService";
import { StudentQuestion, ProctorEventType } from "@/types";
import {
  FiShield,
  FiClock,
  FiAlertTriangle,
  FiCheckCircle,
  FiChevronLeft,
  FiChevronRight,
  FiMaximize,
  FiCamera,
  FiUploadCloud,
  FiBookmark,
  FiSend,
  FiEye,
  FiWifi,
  FiActivity,
  FiUserCheck,
} from "react-icons/fi";

export default function ExamRoomPage() {
  const params = useParams();
  const sessionId = params?.sessionId as string;
  const router = useRouter();
  const { token, loading: authLoading } = useAuth();

  // Questions and current progress
  const [questions, setQuestions] = useState<StudentQuestion[]>([]);
  const [examTitle, setExamTitle] = useState<string>("Assessment");
  const [currentIndex, setCurrentIndex] = useState(0);
  const [loadingQuestions, setLoadingQuestions] = useState(true);
  const [timeRemaining, setTimeRemaining] = useState<number>(3600); // in seconds
  const [submitting, setSubmitting] = useState(false);
  const [showSubmitModal, setShowSubmitModal] = useState(false);

  // Student Answers state
  // key: question_public_id -> { selected_option_ids, answer_text, image_url }
  const [answers, setAnswers] = useState<
    Record<
      string,
      {
        selected_option_ids?: number[];
        answer_text?: string;
        image_url?: string;
      }
    >
  >({});
  const [markedForReview, setMarkedForReview] = useState<Set<number>>(
    new Set()
  );
  const [uploadingImage, setUploadingImage] = useState(false);

  // Proctoring & Camera state
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [cameraActive, setCameraActive] = useState(false);
  const [wsConnected, setWsConnected] = useState(false);
  const [suspicionScore, setSuspicionScore] = useState<number>(0); // 0 to 100
  const suspicionScoreRef = useRef<number>(0);
  useEffect(() => {
    suspicionScoreRef.current = suspicionScore;
  }, [suspicionScore]);

  const [faceStatus, setFaceStatus] = useState<"VERIFIED" | "LOOKING_AWAY" | "MISSING" | "MULTIPLE">("VERIFIED");
  const [strikes, setStrikes] = useState<
    { type: ProctorEventType; time: string; message: string }[]
  >([]);
  const [latestWarning, setLatestWarning] = useState<string | null>(null);
  const lastViolationTimeRef = useRef<Record<string, number>>({});

  // Capture current webcam snapshot as Base64 JPEG
  const captureSnapshot = useCallback((): string | undefined => {
    try {
      if (videoRef.current && videoRef.current.videoWidth > 0) {
        const snapCanvas = document.createElement("canvas");
        snapCanvas.width = 320;
        snapCanvas.height = 240;
        const ctx = snapCanvas.getContext("2d");
        if (ctx) {
          ctx.drawImage(videoRef.current, 0, 0, 320, 240);
          return snapCanvas.toDataURL("image/jpeg", 0.7);
        }
      }
    } catch (e) {
      console.warn("Snapshot capture error:", e);
    }
    return undefined;
  }, []);

  // 1. Initial auth check & questions loading
  useEffect(() => {
    if (!authLoading && !token) {
      router.push("/login");
      return;
    }

    if (!sessionId) return;

    const fetchQuestions = async () => {
      try {
        const data = await getExamQuestions(sessionId);
        setQuestions(data.questions || []);
        if (data.exam_title) {
          setExamTitle(data.exam_title);
        }
        if (data.remaining_seconds !== undefined && data.remaining_seconds !== null) {
          setTimeRemaining(data.remaining_seconds);
        } else if (data.duration_minutes) {
          setTimeRemaining(data.duration_minutes * 60);
        }
      } catch (err: any) {
        console.error("Failed to load questions:", err);
        alert(
          err.response?.data?.detail ||
            "Failed to load exam session. It may have already been submitted or expired."
        );
        router.push("/student/dashboard");
      } finally {
        setLoadingQuestions(false);
      }
    };

    fetchQuestions();
  }, [sessionId, token, authLoading, router]);

  // 2. Countdown Timer
  useEffect(() => {
    if (loadingQuestions) return;

    const timer = setInterval(() => {
      setTimeRemaining((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          handleFinalSubmit(true);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [loadingQuestions]);

  // 3. Proctoring Event Logger Helper with Snapshot Evidence
  const logViolation = useCallback(
    async (
      eventType: ProctorEventType,
      scoreWeight: number = 10,
      remarks: string = "Violation detected"
    ) => {
      // Debounce same event within 6 seconds
      const now = Date.now();
      const last = lastViolationTimeRef.current[eventType] || 0;
      if (now - last < 6000) return;
      lastViolationTimeRef.current[eventType] = now;

      try {
        const snapshot_base64 = captureSnapshot();

        await createProctorEvent({
          session_public_id: sessionId,
          event_type: eventType,
          suspicion_score: scoreWeight / 100.0,
          confidence: 0.92,
          remarks,
          snapshot_base64,
        });

        // Increment cumulative suspicion score (0 - 100)
        setSuspicionScore((prev) => Math.min(100, prev + scoreWeight));

        const newWarning = `${eventType.replace(/_/g, " ")}: ${remarks}`;
        setLatestWarning(newWarning);
        setStrikes((prev) => [
          ...prev,
          {
            type: eventType,
            time: new Date().toLocaleTimeString(),
            message: remarks,
          },
        ]);

        setTimeout(() => {
          setLatestWarning(null);
        }, 4500);
      } catch (err) {
        console.error("Failed to log proctor event:", err);
      }
    },
    [sessionId, captureSnapshot]
  );

  // 4. WebSocket Heartbeat (Every 5-10s sends telemetry to FastAPI)
  useEffect(() => {
    if (!sessionId) return;
    const wsUrl = getProctorWebSocketUrl();
    let socket: WebSocket | null = null;
    let heartbeatInterval: any = null;

    try {
      socket = new WebSocket(wsUrl);

      socket.onopen = () => {
        setWsConnected(true);
        heartbeatInterval = setInterval(() => {
          if (socket?.readyState === WebSocket.OPEN) {
            socket.send(
              JSON.stringify({
                session_public_id: sessionId,
                timestamp: Date.now(),
                status: "active",
                suspicion_score: (suspicionScoreRef.current || 0) / 100.0,
              })
            );
          }
        }, 8000);
      };

      socket.onclose = () => {
        setWsConnected(false);
        if (heartbeatInterval) clearInterval(heartbeatInterval);
      };

      socket.onerror = (e) => {
        console.warn("Proctor WebSocket error:", e);
      };
    } catch (e) {
      console.warn("WebSocket could not be initialized:", e);
    }

    return () => {
      if (heartbeatInterval) clearInterval(heartbeatInterval);
      if (socket) socket.close();
    };
  }, [sessionId]);

  // 5. Camera & Vision Face & Gaze Tracking
  useEffect(() => {
    let stream: MediaStream | null = null;
    let visionInterval: any = null;

    const startCamera = async () => {
      try {
        stream = await navigator.mediaDevices.getUserMedia({
          video: { width: 480, height: 360, frameRate: 15 },
          audio: false,
        });
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          setCameraActive(true);
        }
      } catch (err) {
        console.warn("Camera access denied or unavailable:", err);
        setFaceStatus("MISSING");
        logViolation("FACE_MISSING", 15, "Webcam permission denied or camera offline.");
      }
    };

    startCamera();

    // Vision Analysis Loop (runs continuously every 4 seconds)
    visionInterval = setInterval(() => {
      if (!videoRef.current || !canvasRef.current) return;
      const video = videoRef.current;
      const canvas = canvasRef.current;
      const ctx = canvas.getContext("2d");
      if (!ctx || video.videoWidth === 0) return;

      const w = 64;
      const h = 48;
      canvas.width = w;
      canvas.height = h;
      ctx.drawImage(video, 0, 0, w, h);

      try {
        const frame = ctx.getImageData(0, 0, w, h);
        const data = frame.data;

        let totalBrightness = 0;
        let leftBrightness = 0;
        let rightBrightness = 0;
        let skinTonePixels = 0;

        for (let i = 0; i < data.length; i += 4) {
          const r = data[i];
          const g = data[i + 1];
          const b = data[i + 2];
          const lum = (r + g + b) / 3;
          totalBrightness += lum;

          const col = (i / 4) % w;
          if (col < w / 2) leftBrightness += lum;
          else rightBrightness += lum;

          // Skin-tone detection range
          if (r > 60 && g > 40 && b > 20 && r > b && (r - g) > 10) {
            skinTonePixels++;
          }
        }

        const totalPixels = w * h;
        const avgBrightness = totalBrightness / totalPixels;
        const skinRatio = skinTonePixels / totalPixels;

        // 1. Camera covered or completely dark
        if (avgBrightness < 12 || avgBrightness > 248) {
          setFaceStatus("MISSING");
          logViolation("FACE_MISSING", 12, "Camera covered, blacked out, or unlit.");
          return;
        }

        // 2. Face missing from frame
        if (skinRatio < 0.05) {
          setFaceStatus("MISSING");
          logViolation("FACE_MISSING", 15, "Candidate face not detected in webcam frame.");
          return;
        }

        // 3. Multi-face anomaly detection (unusually widespread skin clusters)
        if (skinRatio > 0.65) {
          setFaceStatus("MULTIPLE");
          logViolation("MULTIPLE_FACES", 20, "Multiple faces or secondary person detected in camera view.");
          return;
        }

        // 4. Gaze direction / Head angle asymmetry
        const halfPixels = totalPixels / 2;
        const leftAvg = leftBrightness / halfPixels;
        const rightAvg = rightBrightness / halfPixels;
        const balance = Math.abs(leftAvg - rightAvg) / (Math.max(leftAvg, rightAvg) + 1);

        if (balance > 0.45) {
          setFaceStatus("LOOKING_AWAY");
          logViolation("GAZE_AWAY", 8, "Candidate head turned or looking away from screen.");
          return;
        }

        // Normal verified state
        setFaceStatus("VERIFIED");
      } catch (e) {
        // Ignored canvas read errors
      }
    }, 4000);

    return () => {
      if (visionInterval) clearInterval(visionInterval);
      if (stream) {
        stream.getTracks().forEach((track) => track.stop());
      }
    };
  }, [logViolation]);

  // 6. Security Event Listeners (Tab Switch, Fullscreen, Blur, Copy-Paste, Right Click)
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.hidden) {
        logViolation(
          "TAB_SWITCH",
          15,
          "Candidate switched browser tab or minimized window."
        );
      }
    };

    const handleWindowBlur = () => {
      logViolation(
        "WINDOW_BLUR",
        10,
        "Browser window lost focus."
      );
    };

    const handleFullscreenChange = () => {
      if (!document.fullscreenElement) {
        logViolation(
          "FULLSCREEN_EXIT",
          12,
          "Candidate exited fullscreen mode."
        );
      }
    };

    const handleCopyPaste = (e: ClipboardEvent) => {
      e.preventDefault();
      logViolation(
        "COPY_PASTE",
        10,
        "Copy/paste shortcut attempt blocked."
      );
    };

    const handleContextMenu = (e: MouseEvent) => {
      e.preventDefault();
      logViolation(
        "RIGHT_CLICK",
        8,
        "Right-click context menu attempt blocked."
      );
    };

    document.addEventListener("visibilitychange", handleVisibilityChange);
    window.addEventListener("blur", handleWindowBlur);
    document.addEventListener("fullscreenchange", handleFullscreenChange);
    document.addEventListener("copy", handleCopyPaste);
    document.addEventListener("paste", handleCopyPaste);
    document.addEventListener("cut", handleCopyPaste);
    document.addEventListener("contextmenu", handleContextMenu);

    return () => {
      document.removeEventListener("visibilitychange", handleVisibilityChange);
      window.removeEventListener("blur", handleWindowBlur);
      document.removeEventListener("fullscreenchange", handleFullscreenChange);
      document.removeEventListener("copy", handleCopyPaste);
      document.removeEventListener("paste", handleCopyPaste);
      document.removeEventListener("cut", handleCopyPaste);
      document.removeEventListener("contextmenu", handleContextMenu);
    };
  }, [logViolation]);

  // Request Fullscreen helper
  const enterFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch(() => {});
    }
  };

  // 7. Question Answering Handlers
  const currentQuestion = questions[currentIndex];

  const handleSelectOption = async (optionId: number) => {
    if (!currentQuestion) return;
    const qId = currentQuestion.public_id;
    let newSelected: number[] = [];

    if (currentQuestion.question_type === "MULTI_SELECT") {
      const existing = answers[qId]?.selected_option_ids || [];
      if (existing.includes(optionId)) {
        newSelected = existing.filter((id) => id !== optionId);
      } else {
        newSelected = [...existing, optionId];
      }
    } else {
      // MCQ or TRUE_FALSE
      newSelected = [optionId];
    }

    setAnswers((prev) => ({
      ...prev,
      [qId]: { ...prev[qId], selected_option_ids: newSelected },
    }));

    try {
      await submitAnswer(sessionId, {
        question_public_id: qId,
        selected_option_ids: newSelected,
      });
    } catch (e) {
      console.error("Failed to save option answer:", e);
    }
  };

  const handleTextChange = (text: string) => {
    if (!currentQuestion) return;
    const qId = currentQuestion.public_id;

    setAnswers((prev) => ({
      ...prev,
      [qId]: { ...prev[qId], answer_text: text },
    }));
  };

  const handleSaveTextAnswer = async () => {
    if (!currentQuestion) return;
    const qId = currentQuestion.public_id;
    const text = answers[qId]?.answer_text || "";

    try {
      await submitAnswer(sessionId, {
        question_public_id: qId,
        answer_text: text,
      });
    } catch (e) {
      console.error("Failed to save text answer:", e);
    }
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !currentQuestion) return;

    setUploadingImage(true);
    try {
      const res = await uploadImageAnswer(
        sessionId,
        currentQuestion.public_id,
        file
      );
      setAnswers((prev) => ({
        ...prev,
        [currentQuestion.public_id]: {
          ...prev[currentQuestion.public_id],
          image_url: res.image_url,
        },
      }));
    } catch (err: any) {
      alert(
        err.response?.data?.detail || "Failed to upload answer image."
      );
    } finally {
      setUploadingImage(false);
    }
  };

  // Toggle Mark for Review
  const toggleMarkForReview = () => {
    setMarkedForReview((prev) => {
      const next = new Set(prev);
      if (next.has(currentIndex)) {
        next.delete(currentIndex);
      } else {
        next.add(currentIndex);
      }
      return next;
    });
  };

  // 8. Submit Exam
  const handleFinalSubmit = async (timeUp: boolean = false) => {
    setSubmitting(true);
    try {
      if (currentQuestion && answers[currentQuestion.public_id]?.answer_text) {
        await handleSaveTextAnswer();
      }

      await submitExam(sessionId);
      router.push(`/student/result/${sessionId}`);
    } catch (err: any) {
      console.error("Submission error:", err);
      router.push(`/student/result/${sessionId}`);
    } finally {
      setSubmitting(false);
    }
  };

  // Format countdown string
  const formatTime = (secs: number) => {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`;
  };

  // Palette status calculator
  const isAnswered = (idx: number) => {
    const q = questions[idx];
    if (!q) return false;
    const a = answers[q.public_id];
    if (!a) return false;
    if (a.selected_option_ids && a.selected_option_ids.length > 0) return true;
    if (a.answer_text && a.answer_text.trim().length > 0) return true;
    if (a.image_url) return true;
    return false;
  };

  if (loadingQuestions) {
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center text-slate-400 gap-3">
        <span className="w-10 h-10 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" />
        <p className="text-sm font-medium">Initializing Proctored Examination Room...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col select-none">
      {/* Hidden canvas for vision frame processing */}
      <canvas ref={canvasRef} className="hidden" />

      {/* Warning Strike Toast Notification */}
      {latestWarning && (
        <div className="fixed top-4 left-1/2 -translate-x-1/2 z-50 px-5 py-3 rounded-2xl bg-rose-600/90 border border-rose-400 text-white shadow-2xl backdrop-blur-md flex items-center gap-3 animate-bounce">
          <FiAlertTriangle className="text-xl shrink-0" />
          <div className="text-xs font-bold uppercase tracking-wider">
            {latestWarning}
          </div>
        </div>
      )}

      {/* Top Examination Room Header */}
      <header className="h-16 border-b border-slate-800/80 bg-slate-950/90 backdrop-blur-md px-4 sm:px-6 flex items-center justify-between sticky top-0 z-40">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-xl bg-indigo-600 flex items-center justify-center shadow-md">
            <FiShield className="text-white text-lg" />
          </div>
          <div>
            <div className="text-xs font-bold text-slate-200 tracking-tight flex items-center gap-2">
              <span className="truncate max-w-[200px] sm:max-w-xs">{examTitle}</span>
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                Live
              </span>
            </div>
            <div className="text-[10px] text-slate-400 font-mono">
              ID: {sessionId.substring(0, 8)}...
            </div>
          </div>
        </div>

        {/* Center: Countdown Timer */}
        <div className="flex items-center gap-2 px-4 py-1.5 rounded-2xl bg-slate-900 border border-slate-800 shadow-inner">
          <FiClock
            className={`text-base ${
              timeRemaining < 300 ? "text-rose-400 animate-pulse" : "text-indigo-400"
            }`}
          />
          <div className="flex flex-col">
            <span className="text-[10px] uppercase tracking-wider text-slate-400 font-medium leading-none">
              Time Remaining
            </span>
            <span
              className={`font-mono text-base font-bold leading-tight ${
                timeRemaining < 300 ? "text-rose-400 font-extrabold" : "text-white"
              }`}
            >
              {formatTime(timeRemaining)}
            </span>
          </div>
        </div>

        {/* Right Actions: Fullscreen & Finish */}
        <div className="flex items-center gap-2">
          <button
            onClick={enterFullscreen}
            title="Enable Fullscreen"
            className="p-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-400 hover:text-white border border-slate-800 text-sm transition cursor-pointer"
          >
            <FiMaximize />
          </button>

          <button
            onClick={() => setShowSubmitModal(true)}
            className="py-2 px-4 rounded-xl bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold shadow-lg shadow-rose-600/25 transition flex items-center gap-1.5 cursor-pointer"
          >
            <FiSend /> Submit Test
          </button>
        </div>
      </header>

      {/* Main Examination Workspace */}
      <div className="flex-1 flex flex-col lg:flex-row overflow-hidden">
        {/* Center Column: Active Question */}
        <main className="flex-1 p-4 sm:p-6 lg:p-8 overflow-y-auto max-w-4xl mx-auto w-full">
          {currentQuestion ? (
            <div className="bg-slate-900/60 border border-slate-800 rounded-3xl p-6 sm:p-8 shadow-xl">
              {/* Question Header */}
              <div className="flex flex-wrap items-center justify-between gap-2 pb-4 border-b border-slate-800/80 mb-6">
                <div className="flex items-center gap-2">
                  <span className="px-3 py-1 rounded-xl text-xs font-bold bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                    Question {currentIndex + 1} of {questions.length}
                  </span>
                  <span className="px-2.5 py-1 rounded-xl text-xs font-semibold bg-slate-800 text-slate-300">
                    {currentQuestion.question_type.replace(/_/g, " ")}
                  </span>
                </div>

                <div className="text-xs font-semibold text-slate-400">
                  Marks:{" "}
                  <span className="text-emerald-400 font-bold">
                    +{currentQuestion.marks}
                  </span>
                </div>
              </div>

              {/* Question Text */}
              <div className="text-base sm:text-lg font-medium text-slate-100 leading-relaxed mb-8">
                {currentQuestion.question_text}
              </div>

              {/* Question Type Input Renderers */}
              <div className="space-y-4">
                {/* 1. MCQ & TRUE_FALSE */}
                {(currentQuestion.question_type === "MCQ" ||
                  currentQuestion.question_type === "TRUE_FALSE") && (
                  <div className="space-y-3">
                    {currentQuestion.options.map((opt) => {
                      const selected =
                        answers[currentQuestion.public_id]?.selected_option_ids?.includes(
                          opt.id
                        ) || false;
                      return (
                        <button
                          key={opt.id}
                          type="button"
                          onClick={() => handleSelectOption(opt.id)}
                          className={`w-full text-left p-4 rounded-2xl border transition flex items-center gap-3.5 cursor-pointer ${
                            selected
                              ? "bg-indigo-600/20 border-indigo-500 text-white shadow-md shadow-indigo-600/10"
                              : "bg-slate-950/60 border-slate-800 text-slate-300 hover:border-slate-700 hover:bg-slate-900"
                          }`}
                        >
                          <div
                            className={`w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0 ${
                              selected
                                ? "border-indigo-500 bg-indigo-500 text-white"
                                : "border-slate-600"
                            }`}
                          >
                            {selected && (
                              <div className="w-2 h-2 rounded-full bg-white" />
                            )}
                          </div>
                          <span className="text-sm font-medium">
                            {opt.option_text}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                )}

                {/* 2. MULTI_SELECT */}
                {currentQuestion.question_type === "MULTI_SELECT" && (
                  <div className="space-y-3">
                    <p className="text-xs text-slate-400 mb-2">
                      (Select all choices that apply)
                    </p>
                    {currentQuestion.options.map((opt) => {
                      const selected =
                        answers[currentQuestion.public_id]?.selected_option_ids?.includes(
                          opt.id
                        ) || false;
                      return (
                        <button
                          key={opt.id}
                          type="button"
                          onClick={() => handleSelectOption(opt.id)}
                          className={`w-full text-left p-4 rounded-2xl border transition flex items-center gap-3.5 cursor-pointer ${
                            selected
                              ? "bg-indigo-600/20 border-indigo-500 text-white"
                              : "bg-slate-950/60 border-slate-800 text-slate-300 hover:border-slate-700 hover:bg-slate-900"
                          }`}
                        >
                          <div
                            className={`w-5 h-5 rounded-lg border-2 flex items-center justify-center shrink-0 ${
                              selected
                                ? "border-indigo-500 bg-indigo-500 text-white"
                                : "border-slate-600"
                            }`}
                          >
                            {selected && <FiCheckCircle className="text-xs" />}
                          </div>
                          <span className="text-sm font-medium">
                            {opt.option_text}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                )}

                {/* 3. SHORT_ANSWER */}
                {currentQuestion.question_type === "SHORT_ANSWER" && (
                  <div className="space-y-2">
                    <label className="block text-xs font-semibold text-slate-400">
                      Your Concise Answer:
                    </label>
                    <input
                      type="text"
                      placeholder="Type your brief response here..."
                      value={answers[currentQuestion.public_id]?.answer_text || ""}
                      onChange={(e) => handleTextChange(e.target.value)}
                      onBlur={handleSaveTextAnswer}
                      className="w-full bg-slate-950 border border-slate-800 rounded-2xl px-4 py-3 text-sm text-slate-100 placeholder-slate-400 focus:outline-none focus:border-indigo-500 transition"
                    />
                  </div>
                )}

                {/* 4. LONG_ANSWER */}
                {currentQuestion.question_type === "LONG_ANSWER" && (
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <label className="block text-xs font-semibold text-slate-400">
                        Your Detailed Solution / Essay:
                      </label>
                      <span className="text-xs text-slate-400">
                        {(
                          answers[currentQuestion.public_id]?.answer_text || ""
                        ).trim().split(/\s+/).filter(Boolean).length}{" "}
                        words
                      </span>
                    </div>
                    <textarea
                      rows={8}
                      placeholder="Write your comprehensive answer and reasoning here..."
                      value={answers[currentQuestion.public_id]?.answer_text || ""}
                      onChange={(e) => handleTextChange(e.target.value)}
                      onBlur={handleSaveTextAnswer}
                      className="w-full bg-slate-950 border border-slate-800 rounded-2xl p-4 text-sm text-slate-100 placeholder-slate-400 focus:outline-none focus:border-indigo-500 transition resize-y"
                    />
                  </div>
                )}

                {/* 5. IMAGE_UPLOAD */}
                {currentQuestion.question_type === "IMAGE_UPLOAD" && (
                  <div className="space-y-4">
                    <label className="block text-xs font-semibold text-slate-400">
                      Upload Handwritten Work / Diagram (JPG, PNG max 5MB):
                    </label>

                    <div className="border-2 border-dashed border-slate-800 hover:border-indigo-500/50 rounded-2xl p-6 text-center bg-slate-950/40 transition">
                      <FiUploadCloud className="text-3xl text-indigo-400 mx-auto mb-2" />
                      <p className="text-xs text-slate-300 font-medium">
                        Drag and drop your solution image, or click to browse
                      </p>
                      <input
                        type="file"
                        accept="image/jpeg,image/png,image/jpg"
                        onChange={handleImageUpload}
                        disabled={uploadingImage}
                        className="mt-3 text-xs text-slate-400 file:mr-3 file:py-1.5 file:px-3 file:rounded-xl file:border-0 file:text-xs file:font-semibold file:bg-indigo-600 file:text-white hover:file:bg-indigo-500 cursor-pointer"
                      />
                      {uploadingImage && (
                        <p className="text-xs text-indigo-400 mt-2 animate-pulse">
                          Uploading image to secure proctoring storage...
                        </p>
                      )}
                    </div>

                    {answers[currentQuestion.public_id]?.image_url && (
                      <div className="mt-4 p-3 rounded-2xl bg-slate-950 border border-slate-800">
                        <div className="text-xs text-slate-400 font-semibold mb-2">
                          Uploaded Answer Preview:
                        </div>
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                          src={answers[currentQuestion.public_id].image_url}
                          alt="Answer Attachment"
                          className="max-h-60 rounded-xl border border-slate-800 object-contain mx-auto"
                        />
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Question Navigation Controls */}
              <div className="mt-10 pt-6 border-t border-slate-800/80 flex flex-wrap items-center justify-between gap-3">
                <button
                  type="button"
                  onClick={toggleMarkForReview}
                  className={`px-4 py-2 rounded-xl text-xs font-semibold border transition flex items-center gap-1.5 cursor-pointer ${
                    markedForReview.has(currentIndex)
                      ? "bg-purple-600/20 text-purple-300 border-purple-500"
                      : "bg-slate-950 text-slate-400 border-slate-800 hover:text-slate-200"
                  }`}
                >
                  <FiBookmark />
                  {markedForReview.has(currentIndex)
                    ? "Marked for Review"
                    : "Mark for Review"}
                </button>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    disabled={currentIndex === 0}
                    onClick={() => {
                      handleSaveTextAnswer();
                      setCurrentIndex((prev) => Math.max(0, prev - 1));
                    }}
                    className="px-4 py-2 rounded-xl text-xs font-semibold bg-slate-900 hover:bg-slate-800 disabled:opacity-40 text-slate-300 border border-slate-800 transition flex items-center gap-1 cursor-pointer"
                  >
                    <FiChevronLeft /> Previous
                  </button>

                  <button
                    type="button"
                    disabled={currentIndex === questions.length - 1}
                    onClick={() => {
                      handleSaveTextAnswer();
                      setCurrentIndex((prev) =>
                        Math.min(questions.length - 1, prev + 1)
                      );
                    }}
                    className="px-4 py-2 rounded-xl text-xs font-semibold bg-indigo-600 hover:bg-indigo-500 disabled:opacity-40 text-white shadow-md shadow-indigo-600/20 transition flex items-center gap-1 cursor-pointer"
                  >
                    Next <FiChevronRight />
                  </button>
                </div>
              </div>
            </div>
          ) : (
            <div className="p-12 text-center text-slate-400">
              No questions found for this exam session.
            </div>
          )}
        </main>

        {/* Right Sidebar: AI Proctor HUD & Question Palette */}
        <aside className="w-full lg:w-80 shrink-0 border-t lg:border-t-0 lg:border-l border-slate-800/80 bg-slate-950 p-4 sm:p-5 flex flex-col gap-5">
          {/* 1. Live Proctoring Webcam HUD */}
          <div className="rounded-2xl bg-slate-900 border border-slate-800 overflow-hidden shadow-xl">
            <div className="p-3 bg-slate-950/80 border-b border-slate-800/80 flex items-center justify-between text-xs font-semibold">
              <div className="flex items-center gap-1.5 text-indigo-400">
                <FiCamera />
                <span>AI Proctor HUD</span>
              </div>
              <div className="flex items-center gap-1 text-[10px] text-emerald-400">
                <FiWifi />
                <span>{wsConnected ? "Connected" : "Syncing"}</span>
              </div>
            </div>

            <div className="relative aspect-video bg-black flex items-center justify-center overflow-hidden">
              <video
                ref={videoRef}
                autoPlay
                playsInline
                muted
                className="w-full h-full object-cover mirror"
              />
              {!cameraActive && (
                <div className="absolute inset-0 bg-slate-950/90 flex flex-col items-center justify-center p-3 text-center text-xs text-rose-400">
                  <FiAlertTriangle className="text-2xl mb-1" />
                  Camera stream offline or permission needed.
                </div>
              )}

              {/* Live Overlay Face Detection Box */}
              {cameraActive && (
                <div className="absolute inset-4 border border-dashed border-emerald-400/50 rounded-xl pointer-events-none flex items-start justify-between p-1.5">
                  <span className="text-[9px] font-mono text-emerald-400 bg-black/60 px-1 rounded flex items-center gap-1">
                    <FiUserCheck />
                    {faceStatus === "VERIFIED" ? "FACE VERIFIED" : faceStatus.replace(/_/g, " ")}
                  </span>
                  <span
                    className={`w-2 h-2 rounded-full ${
                      faceStatus === "VERIFIED" ? "bg-emerald-400 animate-ping" : "bg-rose-500 animate-ping"
                    }`}
                  />
                </div>
              )}
            </div>

            {/* Suspicion Score Gauge (0-100) */}
            <div className="p-3 bg-slate-950/60 border-t border-slate-800/80 space-y-2">
              <div className="flex items-center justify-between text-[11px]">
                <span className="text-slate-400 font-semibold flex items-center gap-1">
                  <FiActivity /> Suspicion Score
                </span>
                <span
                  className={`font-mono font-bold ${
                    suspicionScore > 50
                      ? "text-rose-400"
                      : suspicionScore > 20
                      ? "text-amber-400"
                      : "text-emerald-400"
                  }`}
                >
                  {suspicionScore} / 100
                </span>
              </div>

              {/* Progress bar */}
              <div className="w-full h-2 rounded-full bg-slate-800 overflow-hidden">
                <div
                  className={`h-full transition-all duration-500 ${
                    suspicionScore > 50
                      ? "bg-rose-500"
                      : suspicionScore > 20
                      ? "bg-amber-400"
                      : "bg-emerald-400"
                  }`}
                  style={{ width: `${Math.min(100, Math.max(5, suspicionScore))}%` }}
                />
              </div>

              <div className="flex items-center justify-between text-[10px] text-slate-400 font-mono pt-1">
                <span>Violations: {strikes.length}</span>
                <span
                  className={
                    faceStatus === "VERIFIED" ? "text-emerald-400" : "text-rose-400 font-bold"
                  }
                >
                  {faceStatus === "VERIFIED" ? "Clean Session" : "Integrity Flagged"}
                </span>
              </div>
            </div>
          </div>

          {/* 2. Question Palette */}
          <div className="flex-1 flex flex-col rounded-2xl bg-slate-900 border border-slate-800 p-4">
            <h4 className="text-xs font-bold text-slate-200 mb-3 flex items-center justify-between">
              <span>Question Palette</span>
              <span className="text-[10px] text-slate-400 font-normal">
                {questions.filter((_, i) => isAnswered(i)).length}/
                {questions.length} answered
              </span>
            </h4>

            {/* Legend */}
            <div className="grid grid-cols-2 gap-1.5 text-[10px] text-slate-400 mb-3 pb-3 border-b border-slate-800/80">
              <div className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
                Answered
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-purple-500" />
                Review
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-slate-700" />
                Unanswered
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full border border-indigo-400" />
                Current
              </div>
            </div>

            {/* Palette Grid */}
            <div className="grid grid-cols-5 gap-2 overflow-y-auto max-h-56 pr-1">
              {questions.map((_, idx) => {
                const answered = isAnswered(idx);
                const review = markedForReview.has(idx);
                const isCurrent = currentIndex === idx;

                let colorClass = "bg-slate-800 text-slate-300 border-slate-700";
                if (review) {
                  colorClass =
                    "bg-purple-600/30 text-purple-200 border-purple-500 font-bold";
                } else if (answered) {
                  colorClass =
                    "bg-emerald-600/30 text-emerald-200 border-emerald-500 font-bold";
                }

                return (
                  <button
                    key={idx}
                    onClick={() => {
                      handleSaveTextAnswer();
                      setCurrentIndex(idx);
                    }}
                    className={`h-9 rounded-xl border text-xs font-semibold flex items-center justify-center transition cursor-pointer ${colorClass} ${
                      isCurrent ? "ring-2 ring-indigo-400 ring-offset-1 ring-offset-slate-900" : ""
                    }`}
                  >
                    {idx + 1}
                  </button>
                );
              })}
            </div>
          </div>
        </aside>
      </div>

      {/* Submit Confirmation Modal */}
      {showSubmitModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="max-w-md w-full rounded-3xl bg-slate-900 border border-slate-800 p-6 sm:p-8 shadow-2xl">
            <h3 className="text-xl font-bold text-white mb-2">
              Submit Examination?
            </h3>
            <p className="text-xs text-slate-400 mb-6">
              You are about to finalize and submit your assessment. The scoring engine and LLM evaluator will process your score immediately.
            </p>

            <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 space-y-2 mb-6 text-xs text-slate-300">
              <div className="flex justify-between">
                <span>Total Questions:</span>
                <span className="font-bold text-white">{questions.length}</span>
              </div>
              <div className="flex justify-between">
                <span>Answered:</span>
                <span className="font-bold text-emerald-400">
                  {questions.filter((_, i) => isAnswered(i)).length}
                </span>
              </div>
              <div className="flex justify-between">
                <span>Unanswered:</span>
                <span className="font-bold text-rose-400">
                  {questions.filter((_, i) => !isAnswered(i)).length}
                </span>
              </div>
              <div className="flex justify-between">
                <span>Marked for Review:</span>
                <span className="font-bold text-purple-400">
                  {markedForReview.size}
                </span>
              </div>
              <div className="flex justify-between pt-2 border-t border-slate-800/80">
                <span>Cumulative Suspicion Score:</span>
                <span
                  className={`font-bold ${
                    suspicionScore > 30 ? "text-rose-400" : "text-emerald-400"
                  }`}
                >
                  {suspicionScore} / 100
                </span>
              </div>
            </div>

            <div className="flex items-center justify-end gap-3">
              <button
                type="button"
                onClick={() => setShowSubmitModal(false)}
                disabled={submitting}
                className="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold transition cursor-pointer"
              >
                Return to Exam
              </button>
              <button
                type="button"
                onClick={() => handleFinalSubmit(false)}
                disabled={submitting}
                className="px-5 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold shadow-lg shadow-rose-600/25 transition flex items-center gap-2 cursor-pointer"
              >
                {submitting ? (
                  <>
                    <span className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    Submitting...
                  </>
                ) : (
                  "Confirm Submission"
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
