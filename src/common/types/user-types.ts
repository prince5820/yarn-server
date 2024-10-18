export interface UserDetail {
  firstName: string;
  lastName: string;
  email: string;
  password: string;
  gender: string;
  mobile: string;
  dob: string;
  profileUrl?: string;
  address: string;
}

export interface User {
  id: number;
  first_name: string;
  last_name: string;
  email: string;
  password: string;
  gender: string;
  mobile: string;
  dob: string;
  profile_url: string | null;
  address: string;
  created_date: string;
  modified_date: string;
}