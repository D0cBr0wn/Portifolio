export type MfaResponse = {
  mfaRequired: boolean;
  userId: string;
  message: string;
  token: string;
};

export type MfasetupNeededResponse = {
  mfaSetupRequired: boolean;
  userId: string;
  message: string;
  token: string;
};

export type MfaSetupResponse = {
  qrCodeDataURL: string;
  secret: string;
};

export type MfaVerifiedResponse = {
  verified: boolean;
  token: string;
};

export type LoginResponse = {
  token: string;
};
