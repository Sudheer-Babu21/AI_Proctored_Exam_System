import api from "@/lib/api";
import { TokenResponse, User, UserRole } from "@/types";

export const loginUser = async (
  username: string,
  password: string
): Promise<TokenResponse> => {
  const formData = new URLSearchParams();
  formData.append("username", username);
  formData.append("password", password);

  const response = await api.post<TokenResponse>("/auth/login", formData, {
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
    },
  });

  return response.data;
};

export const registerUser = async (data: {
  name: string;
  email: string;
  password: string;
  role: UserRole;
}): Promise<User> => {
  const response = await api.post<User>("/auth/register", data);
  return response.data;
};