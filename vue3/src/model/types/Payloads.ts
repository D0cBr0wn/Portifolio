export type LoginPayload = {
  email: string;
  password: string;
};

export type MfaVerifyPayload = {
  token?: string | undefined;
  email?: string | null;
};
