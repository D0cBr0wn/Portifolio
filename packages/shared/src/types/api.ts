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
  userId?: number
  message?: string
}

export interface MfaVerifyResponse {
  verified: boolean
  token: string
}
