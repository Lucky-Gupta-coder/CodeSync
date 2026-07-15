import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { useAuthStore } from "../src/modules/auth/store/auth.store.js";
import { LoginForm } from "../src/modules/auth/components/LoginForm.js";
import { ProtectedRoute } from "../src/modules/auth/components/ProtectedRoute.js";
import { MemoryRouter, Routes, Route } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { apiClient } from "../src/api/client.js";
import { UserRole } from "@codesync/types";

// Mock the API client
vi.mock("../src/api/client.ts", () => ({
  apiClient: {
    post: vi.fn(),
    get: vi.fn(),
    interceptors: {
      request: { use: vi.fn(), eject: vi.fn() },
      response: { use: vi.fn(), eject: vi.fn() },
    },
  },
}));

const queryClient = new QueryClient({
  defaultOptions: {
    queries: { retry: false },
  },
});

describe("Auth Store & Authentication Flow Tests", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    useAuthStore.getState().clear();
  });

  describe("Zustand Auth Store", () => {
    it("should initialize with default states", () => {
      const state = useAuthStore.getState();
      expect(state.user).toBeNull();
      expect(state.accessToken).toBeNull();
      expect(state.isAuthenticated).toBe(false);
      expect(state.loading).toBe(false);
    });

    it("should update state on login and clear on logout", () => {
      const mockUser = {
        id: "123",
        name: "Test User",
        email: "test@example.com",
        role: UserRole.MEMBER,
      };
      const token = "mock_token";

      useAuthStore.getState().login(token, mockUser);

      let state = useAuthStore.getState();
      expect(state.accessToken).toBe(token);
      expect(state.user).toEqual(mockUser);
      expect(state.isAuthenticated).toBe(true);

      useAuthStore.getState().logout();

      state = useAuthStore.getState();
      expect(state.accessToken).toBeNull();
      expect(state.user).toBeNull();
      expect(state.isAuthenticated).toBe(false);
    });
  });

  describe("LoginForm Rendering & Validation", () => {
    it("should render inputs, labels, and the sign-in button", () => {
      render(
        <QueryClientProvider client={queryClient}>
          <MemoryRouter>
            <LoginForm />
          </MemoryRouter>
        </QueryClientProvider>
      );

      expect(screen.getByLabelText(/email address/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/password/i)).toBeInTheDocument();
      expect(screen.getByRole("button", { name: /sign in/i })).toBeInTheDocument();
    });

    it("should display validation errors when fields are empty", async () => {
      render(
        <QueryClientProvider client={queryClient}>
          <MemoryRouter>
            <LoginForm />
          </MemoryRouter>
        </QueryClientProvider>
      );

      fireEvent.click(screen.getByRole("button", { name: /sign in/i }));

      expect(await screen.findByText(/email is required/i)).toBeInTheDocument();
      expect(await screen.findByText(/password is required/i)).toBeInTheDocument();
    });

    it("should display email format validation errors", async () => {
      render(
        <QueryClientProvider client={queryClient}>
          <MemoryRouter>
            <LoginForm />
          </MemoryRouter>
        </QueryClientProvider>
      );

      fireEvent.change(screen.getByLabelText(/email address/i), {
        target: { value: "invalid-email" },
      });
      fireEvent.change(screen.getByLabelText(/password/i), {
        target: { value: "password123" },
      });

      fireEvent.click(screen.getByRole("button", { name: /sign in/i }));

      expect(await screen.findByText(/invalid email address/i)).toBeInTheDocument();
    });
  });

  describe("API Login Integrations", () => {
    it("should call login API and update store on successful login", async () => {
      const mockUser = {
        id: "123",
        name: "Test User",
        email: "test@example.com",
        role: UserRole.MEMBER,
      };
      const mockToken = "success_jwt";

      vi.mocked(apiClient.post).mockResolvedValueOnce({
        data: {
          success: true,
          data: {
            accessToken: mockToken,
            user: mockUser,
          },
        },
      });

      render(
        <QueryClientProvider client={queryClient}>
          <MemoryRouter>
            <LoginForm />
          </MemoryRouter>
        </QueryClientProvider>
      );

      fireEvent.change(screen.getByLabelText(/email address/i), {
        target: { value: "test@example.com" },
      });
      fireEvent.change(screen.getByLabelText(/password/i), {
        target: { value: "Password123!" },
      });

      fireEvent.click(screen.getByRole("button", { name: /sign in/i }));

      await waitFor(() => {
        expect(apiClient.post).toHaveBeenCalledWith("/api/auth/login", {
          email: "test@example.com",
          password: "Password123!",
        });
      });

      expect(useAuthStore.getState().accessToken).toBe(mockToken);
      expect(useAuthStore.getState().user).toEqual(mockUser);
      expect(useAuthStore.getState().isAuthenticated).toBe(true);
    });

    it("should display server error message on login failure", async () => {
      const errorMessage = "Invalid email or password";
      vi.mocked(apiClient.post).mockRejectedValueOnce({
        response: {
          status: 401,
          data: {
            success: false,
            message: errorMessage,
          },
        },
      });

      render(
        <QueryClientProvider client={queryClient}>
          <MemoryRouter>
            <LoginForm />
          </MemoryRouter>
        </QueryClientProvider>
      );

      fireEvent.change(screen.getByLabelText(/email address/i), {
        target: { value: "test@example.com" },
      });
      fireEvent.change(screen.getByLabelText(/password/i), {
        target: { value: "wrongpassword" },
      });

      fireEvent.click(screen.getByRole("button", { name: /sign in/i }));

      expect(await screen.findByText(errorMessage)).toBeInTheDocument();
      expect(useAuthStore.getState().isAuthenticated).toBe(false);
    });
  });

  describe("ProtectedRoute Guard & Navigations", () => {
    it("should redirect unauthenticated users to /login", () => {
      render(
        <MemoryRouter initialEntries={["/"]}>
          <Routes>
            <Route
              path="/"
              element={
                <ProtectedRoute>
                  <div>Secret Dashboard</div>
                </ProtectedRoute>
              }
            />
            <Route path="/login" element={<div>Login Page Screen</div>} />
          </Routes>
        </MemoryRouter>
      );

      expect(screen.queryByText("Secret Dashboard")).not.toBeInTheDocument();
      expect(screen.getByText("Login Page Screen")).toBeInTheDocument();
    });

    it("should render children for authenticated users", () => {
      const mockUser = {
        id: "123",
        name: "Test User",
        email: "test@example.com",
        role: UserRole.MEMBER,
      };
      useAuthStore.getState().login("mock_token", mockUser);

      render(
        <MemoryRouter initialEntries={["/"]}>
          <Routes>
            <Route
              path="/"
              element={
                <ProtectedRoute>
                  <div>Secret Dashboard</div>
                </ProtectedRoute>
              }
            />
            <Route path="/login" element={<div>Login Page Screen</div>} />
          </Routes>
        </MemoryRouter>
      );

      expect(screen.getByText("Secret Dashboard")).toBeInTheDocument();
      expect(screen.queryByText("Login Page Screen")).not.toBeInTheDocument();
    });
  });
});
