import { UserResponseDTO } from "@codesync/types";

export interface AuthState {
  user: UserResponseDTO | null;
  accessToken: string | null;
  isAuthenticated: boolean;
  loading: boolean;
  login: (token: string, user: UserResponseDTO) => void;
  logout: () => void;
  setUser: (user: UserResponseDTO | null) => void;
  setToken: (token: string | null) => void;
  clear: () => void;
}
