export type UserRole = "STUDENT" | "EXAMINER" | "ADMIN";

export interface User {
  id: number;
  public_id: string;
  name: string;
  email: string;
  role: UserRole;
  is_active: boolean;
}

export interface TokenResponse {
  access_token: string;
  token_type: string;
  user?: User;
}

export type QuestionType =
  | "MCQ"
  | "MULTI_SELECT"
  | "TRUE_FALSE"
  | "SHORT_ANSWER"
  | "LONG_ANSWER"
  | "IMAGE_UPLOAD";

export type DifficultyLevel = "EASY" | "MEDIUM" | "HARD";

export type ExamStatus = "DRAFT" | "PUBLISHED" | "COMPLETED";

export type SessionStatus =
  | "NOT_STARTED"
  | "IN_PROGRESS"
  | "SUBMITTED"
  | "TIME_UP"
  | "CANCELLED";

export type ResultStatus = "PASS" | "FAIL";

export type ProctorEventType =
  | "FACE_MISSING"
  | "MULTIPLE_FACES"
  | "GAZE_AWAY"
  | "TAB_SWITCH"
  | "WINDOW_BLUR"
  | "COPY_PASTE"
  | "RIGHT_CLICK"
  | "FULLSCREEN_EXIT";

export interface Option {
  id?: number;
  option_text: string;
  is_correct: boolean;
}

export interface StudentOption {
  id: number;
  option_text: string;
}

export interface Question {
  id: number;
  public_id: string;
  question_text: string;
  question_type: QuestionType;
  difficulty: DifficultyLevel;
  subject: string;
  topic?: string | null;
  marks: number;
  negative_marks: number;
  model_answer?: string | null;
  explanation?: string | null;
  image_path?: string | null;
  language?: string;
  is_active: boolean;
  created_by?: number;
  options: Option[];
}

export interface QuestionCreatePayload {
  question_text: string;
  question_type: QuestionType;
  difficulty: DifficultyLevel;
  subject: string;
  topic?: string;
  marks: number;
  negative_marks?: number;
  model_answer?: string;
  explanation?: string;
  language?: string;
  options: { option_text: string; is_correct: boolean }[];
}

export interface StudentQuestion {
  public_id: string;
  question_text: string;
  question_type: QuestionType;
  marks: number;
  options: StudentOption[];
}

export interface Exam {
  id: number;
  public_id: string;
  title: string;
  description?: string | null;
  subject: string;
  duration_minutes: number;
  total_marks: number;
  pass_marks: number;
  negative_marking: boolean;
  shuffle_questions: boolean;
  shuffle_options: boolean;
  start_time: string;
  end_time: string;
  is_active: boolean;
}

export interface ExamCreatePayload {
  title: string;
  description?: string;
  subject: string;
  duration_minutes: number;
  total_marks: number;
  pass_marks: number;
  negative_marking: boolean;
  shuffle_questions: boolean;
  shuffle_options: boolean;
  start_time: string;
  end_time: string;
}

export interface StartExamResponse {
  session_id: string;
  exam_id: string;
  duration_minutes: number;
  total_questions: number;
  message: string;
}

export interface StudentExamResponse {
  session_id: string;
  exam_id: string;
  exam_title?: string;
  duration_minutes?: number;
  remaining_seconds?: number;
  questions: StudentQuestion[];
}

export interface SubmitAnswerPayload {
  question_public_id: string;
  selected_option_ids?: number[];
  answer_text?: string;
}

export interface ProctorEvent {
  id?: number;
  public_id: string;
  exam_session_id?: number;
  event_type: ProctorEventType;
  event_time?: string;
  suspicion_score: number;
  confidence: number;
  evidence_path?: string | null;
  remarks?: string | null;
  is_resolved: boolean;
}

export interface CreateProctorEventPayload {
  session_public_id: string;
  event_type: ProctorEventType;
  suspicion_score?: number;
  confidence?: number;
  evidence_path?: string;
  remarks?: string;
  snapshot_base64?: string;
}

export interface ResultResponse {
  exam_session_public_id: string;
  max_score: number;
  total_score: number;
  final_score: number;
  percentage: number;
  status: ResultStatus;
}

export interface AnswerResponse {
  public_id: string;
  exam_session_id?: number;
  session_public_id?: string;
  question_id?: number;
  question_text?: string;
  question_type?: QuestionType;
  max_marks?: number;
  model_answer?: string | null;
  answer_text?: string | null;
  image_url?: string | null;
  marks_awarded: number;
  feedback?: string | null;
  ai_score?: number;
  ai_justification?: string | null;
  student_name?: string | null;
  submitted_at: string;
}

export interface SessionListItem {
  public_id: string;
  exam_id: number;
  exam_public_id?: string;
  exam_title?: string;
  subject?: string;
  student_id: number;
  student_name?: string;
  student_email?: string;
  status: SessionStatus;
  start_time: string;
  end_time?: string;
  total_marks?: number;
  obtained_marks?: number;
  percentage?: number;
  result_status?: ResultStatus;
  proctor_events_count: number;
  max_suspicion_score: number;
}
