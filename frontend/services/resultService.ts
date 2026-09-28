import api from "@/lib/api";
import { ResultResponse } from "@/types";

export const getResult = async (
  sessionPublicId: string
): Promise<ResultResponse> => {
  const response = await api.get<ResultResponse>(
    `/results/${sessionPublicId}`
  );
  return response.data;
};

export const downloadResultPdf = async (sessionPublicId: string): Promise<void> => {
  const response = await api.get(`/results/${sessionPublicId}/pdf`, {
    responseType: "blob",
  });

  const blob = new Blob([response.data], { type: "application/pdf" });
  const url = window.URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.setAttribute("download", `Exam_Report_${sessionPublicId.substring(0, 8)}.pdf`);
  document.body.appendChild(link);
  link.click();
  link.parentNode?.removeChild(link);
  window.URL.revokeObjectURL(url);
};
