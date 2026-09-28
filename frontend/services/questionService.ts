import api from "@/lib/api";
import {
  Question,
  QuestionCreatePayload,
} from "@/types";

export const getAllQuestions = async (
  skip: number = 0,
  limit: number = 20,
  isActive?: boolean
): Promise<Question[]> => {
  const params: Record<string, any> = { skip, limit };
  if (isActive !== undefined) params.is_active = isActive;

  const response = await api.get<Question[]>("/questions", { params });
  return response.data;
};

export const getQuestion = async (publicId: string): Promise<Question> => {
  const response = await api.get<Question>(`/questions/${publicId}`);
  return response.data;
};

export const createQuestion = async (
  data: QuestionCreatePayload
): Promise<Question> => {
  const response = await api.post<Question>("/questions", data);
  return response.data;
};

export const updateQuestion = async (
  publicId: string,
  data: Partial<QuestionCreatePayload>
): Promise<Question> => {
  const response = await api.patch<Question>(`/questions/${publicId}`, data);
  return response.data;
};

export const deleteQuestion = async (
  publicId: string
): Promise<Question> => {
  const response = await api.delete<Question>(`/questions/${publicId}`);
  return response.data;
};

export const searchQuestions = async (params: {
  subject?: string;
  topic?: string;
  difficulty?: string;
  question_type?: string;
  is_active?: boolean;
  skip?: number;
  limit?: number;
}): Promise<Question[]> => {
  const response = await api.get<Question[]>("/questions/search/", {
    params,
  });
  return response.data;
};
