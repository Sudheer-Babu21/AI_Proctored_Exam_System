import api from "@/lib/api";
import {
  Exam,
  ExamCreatePayload,
  StartExamResponse,
} from "@/types";

export const getAllExams = async (
  skip: number = 0,
  limit: number = 20
): Promise<Exam[]> => {
  const response = await api.get<Exam[]>("/exams", {
    params: { skip, limit },
  });
  return response.data;
};

export const getExam = async (publicId: string): Promise<Exam> => {
  const response = await api.get<Exam>(`/exams/${publicId}`);
  return response.data;
};

export const createExam = async (
  data: ExamCreatePayload
): Promise<Exam> => {
  const response = await api.post<Exam>("/exams", data);
  return response.data;
};

export const updateExam = async (
  publicId: string,
  data: Partial<ExamCreatePayload>
): Promise<Exam> => {
  const response = await api.patch<Exam>(`/exams/${publicId}`, data);
  return response.data;
};

export const deleteExam = async (publicId: string): Promise<Exam> => {
  const response = await api.delete<Exam>(`/exams/${publicId}`);
  return response.data;
};

export const assignRandomQuestions = async (
  publicId: string,
  data: { subject: string; difficulty: string; question_count: number }
): Promise<{ exam_id: number; assigned_questions: number; message: string }> => {
  const response = await api.post(
    `/exams/${publicId}/assign-random-questions`,
    data
  );
  return response.data;
};

export const startExam = async (
  publicId: string
): Promise<StartExamResponse> => {
  const response = await api.post<StartExamResponse>(
    `/exams/${publicId}/start`,
    {}
  );
  return response.data;
};
