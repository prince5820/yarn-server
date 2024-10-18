export interface ContactResponse {
  id: number
  first_name: string
  last_name: string
  mobile: string
  email: string
  profile_url: string | null
  active: number
  user_id: number
  created_date: string
  modified_date: string | null
}

export interface ContactRequestPayload {
  firstName: string
  lastName: string
  mobile: string
  email: string
  profileUrl: string | null
  active: number
  userId?: number
}