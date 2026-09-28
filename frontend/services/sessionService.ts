import api from "@/lib/api";
import {
  StudentExamResponse,
  SubmitAnswerPayload,
  SessionListItem,
} from "@/types";

export const getExamQuestions = async (
  sessionPublicId: string
): Promise<StudentExamResponse> => {
  const response = await api.get<StudentExamResponse>(
    `/exam-sessions/${sessionPublicId}/questions`
  );
  return response.data;
};

export const submitAnswer = async (
  sessionPublicId: string,
  data: SubmitAnswerPayload
): Promise<{ message: string }> => {
  const response = await api.post(
    `/exam-sessions/${sessionPublicId}/submit-answer`,
    data
  );
  return response.data;
};

export const uploadImageAnswer = async (
  sessionPublicId: string,
  questionPublicId: string,
  file: File
): Promise<{ message: string; image_url: string }> => {
  const formData = new FormData();
  formData.append("image", file);

  const response = await api.post(
    `/exam-sessions/${sessionPublicId}/upload-image-answer`,
    formData,
    {
      params: {
        question_public_id: questionPublicId,
      },
      headers: {
        "Content-Type": "multipart/form-data",
      },
    }
  );

  return response.data;
};

export const submitExam = async (
  sessionPublicId: string
): Promise<{ message: string; result?: any }> => {
  const response = await api.post(
    `/exam-sessions/${sessionPublicId}/submit`
  );
  return response.data;
};

export const getAllSessions = async (
  skip: number = 0,
  limit: number = 50,
  examId?: number
): Promise<SessionListItem[]> => {
  const response = await api.get<SessionListItem[]>("/exam-sessions", {
    params: { skip, limit, ...(examId ? { exam_id: examId } : {}) },
  });
  return response.data;
};

export const getMySessions = async (
  skip: number = 0,
  limit: number = 50
): Promise<SessionListItem[]> => {
  const response = await api.get<SessionListItem[]>("/exam-sessions/my-sessions", {
    params: { skip, limit },
  });
  return response.data;
};

export const getSessionDetails = async (
  sessionPublicId: string
): Promise<SessionListItem> => {
  const response = await api.get<SessionListItem>(
    `/exam-sessions/${sessionPublicId}`
  );
  return response.data;
};

export const disqualifySession = async (
  sessionPublicId: string,
  reason: string = "Session disqualified for proctoring integrity violations."
): Promise<{ message: string; status: string }> => {
  const response = await api.post(
    `/exam-sessions/${sessionPublicId}/disqualify`,
    { reason }
  );
  return response.data;
};

export const publishSession = async (
  sessionPublicId: string
): Promise<{ message: string; session_id: string }> => {
  const response = await api.post(
    `/exam-sessions/${sessionPublicId}/publish`
  );
  return response.data;
};
