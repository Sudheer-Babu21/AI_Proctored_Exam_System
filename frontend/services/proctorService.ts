import api, { API_BASE_URL } from "@/lib/api";
import {
  CreateProctorEventPayload,
  ProctorEvent,
} from "@/types";

export const createProctorEvent = async (
  payload: CreateProctorEventPayload
): Promise<ProctorEvent> => {
  const response = await api.post<ProctorEvent>("/proctor-events", payload);
  return response.data;
};

export const getSessionEvents = async (
  sessionPublicId: string
): Promise<ProctorEvent[]> => {
  const response = await api.get<ProctorEvent[]>(
    `/proctor-events/${sessionPublicId}`
  );
  return response.data;
};

export const resolveProctorEvent = async (
  eventPublicId: string
): Promise<{ message: string }> => {
  const response = await api.patch<{ message: string }>(
    `/proctor-events/${eventPublicId}/resolve`
  );
  return response.data;
};

export const getProctorWebSocketUrl = (): string => {
  if (process.env.NEXT_PUBLIC_WS_URL) {
    const custom = process.env.NEXT_PUBLIC_WS_URL.replace(/\/$/, "");
    return `${custom}/ws/proctor`;
  }
  const wsUrl = API_BASE_URL.replace(/^http(s?):\/\//, "ws$1://");
  return `${wsUrl}/ws/proctor`;
};
