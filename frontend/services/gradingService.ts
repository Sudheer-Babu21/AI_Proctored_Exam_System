import api from "@/lib/api";
import { AnswerResponse } from "@/types";

export const getPendingAnswers = async (): Promise<AnswerResponse[]> => {
  const response = await api.get<AnswerResponse[]>("/grading/pending");
  return response.data;
};

export const getReviewedAnswers = async (): Promise<AnswerResponse[]> => {
  const response = await api.get<AnswerResponse[]>("/grading/reviewed");
  return response.data;
};

export const evaluateAnswer = async (
  answerPublicId: string,
  marksAwarded: number,
  feedback?: string
): Promise<AnswerResponse> => {
  const response = await api.patch<AnswerResponse>(
    `/grading/${answerPublicId}`,
    {
      marks_awarded: marksAwarded,
      feedback: feedback || null,
    }
  );
  return response.data;
};
