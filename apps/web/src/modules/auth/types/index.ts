import { UserResponseDTO } from "@codesync/types";

export interface AuthState {
  user: UserResponseDTO | null;
  token: string | null;
  accessToken: string | null; // For backward compatibility/tests
  isAuthenticated: boolean;
  loading: boolean;
  login: (emailOrToken: string, passwordOrUser?: string | UserResponseDTO) => Promise<void> | void;
  signup: (name: string, email: string, password: string) => Promise<void>;
  logout: () => void;
  fetchCurrentUser: () => Promise<void>;
  setUser: (user: UserResponseDTO | null) => void;
  setToken: (token: string | null) => void;
  clear: () => void;
}
