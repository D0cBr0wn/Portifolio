export interface VenueData {
  id: number
  name: string
  city: string
  address1?: string
  address2?: string
  zipCode?: string
}

export interface ShowData {
  id: number
  label?: string
  details?: string
  date: string
  venueId: number
  venue?: VenueData
}

export interface AuthResponse {
  token?: string
  mfaRequired?: boolean
  mfaSetupRequired?: boolean
  mfaPendingToken?: string
  setupToken?: string
  message?: string
}

export interface MfaVerifyResponse {
  verified: boolean
  token: string
}

export interface ShowWithCreator extends ShowData {
  createdBy: { email: string } | null
  createdAt: string
}

export interface VenueWithCreator extends VenueData {
  createdBy: { email: string } | null
  createdAt: string
}

export interface UserData {
  id: number
  email: string
  role: 'USER' | 'ADMIN'
  mfaEnabled: boolean
  createdAt: string
}
