import { api } from "@/lib/api/client";
import { registerResultSchema, sessionSchema } from "@/lib/api/schemas/auth";
import type {
  LoginInput,
  RegisterInput,
  RegisterResult,
  Session,
  VerifyEmailInput,
} from "@/lib/api/schemas/auth";

// All auth calls go through the same-origin client; the backend sets/clears the
// httpOnly cookies. We only read the user/role off the body to drive redirects.
export const authApi = {
  // The non-forgeable current session (backend reads the httpOnly cookies).
  async me(): Promise<Session> {
    const data = await api.get<unknown>("/auth/me");
    return sessionSchema.parse(data);
  },

  async login(input: LoginInput): Promise<Session> {
    const data = await api.post<unknown>("/auth/login", input);
    return sessionSchema.parse(data);
  },

  async logout(): Promise<void> {
    await api.post("/auth/logout");
  },

  // Returns no session — the account cannot be used until the emailed code is
  // confirmed. See registerResultSchema.
  async register(input: RegisterInput): Promise<RegisterResult> {
    const data = await api.post<unknown>("/auth/register", input);
    return registerResultSchema.parse(data);
  },

  // This is the first real sign-in: the backend sets the auth cookies here.
  async verifyEmail(input: VerifyEmailInput): Promise<Session> {
    const data = await api.post<unknown>("/auth/verify-email", input);
    return sessionSchema.parse(data);
  },

  async resendVerification(email: string): Promise<void> {
    await api.post("/auth/resend-verification", { email });
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
