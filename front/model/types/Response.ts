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

export type MfasetupResponse = {
  qrCodeDataURL: string;
  secret: string;
};

export type LoginResponse = {
  token: string;
};
