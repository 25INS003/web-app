import { api } from "@/lib/api/client";
import { sessionSchema } from "@/lib/api/schemas/auth";
import type { LoginInput, RegisterInput, Session } from "@/lib/api/schemas/auth";

// All auth calls go through the same-origin client; the backend sets/clears the
// httpOnly cookies. We only read the user/role off the body to drive redirects.
export const authApi = {
  async login(input: LoginInput): Promise<Session> {
    const data = await api.post<unknown>("/auth/login", input);
    return sessionSchema.parse(data);
  },

  async logout(): Promise<void> {
    await api.post("/auth/logout");
  },

  async register(input: RegisterInput): Promise<Session> {
    const data = await api.post<unknown>("/auth/register", input);
    return sessionSchema.parse(data);
  },

  async forgotPassword(email: string): Promise<void> {
    await api.post("/auth/password/forgot", { email });
  },

  async verifyOtp(email: string, otp: string): Promise<{ resetToken: string }> {
    return api.post<{ resetToken: string }>("/auth/password/verify-otp", {
      email,
      otp,
    });
  },

  async resetPassword(
    resetToken: string,
    newPassword: string,
  ): Promise<{ user_type?: string }> {
    return api.post<{ user_type?: string }>("/auth/password/reset", {
      resetToken,
      newPassword,
    });
  },
};
