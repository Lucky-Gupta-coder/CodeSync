import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { createBrowserRouter, RouterProvider, Navigate } from "react-router-dom";
import { LoginPage } from "./modules/auth/pages/LoginPage.js";
import { SignupPage } from "./modules/auth/pages/SignupPage.js";
import { DashboardPage } from "./pages/DashboardPage.js";
import { WorkspacesPage } from "./pages/WorkspacesPage.js";
import { WorkspaceDetailPage } from "./pages/WorkspaceDetailPage.js";
import { RoomDetailPage } from "./pages/RoomDetailPage.js";
import { ProfilePage } from "./pages/ProfilePage.js";
import { SettingsPage } from "./pages/SettingsPage.js";
import { NotFoundPage } from "./pages/NotFoundPage.js";
import { UnauthorizedPage } from "./pages/UnauthorizedPage.js";
import { ProtectedRoute } from "./modules/auth/components/ProtectedRoute.js";
import { AuthProvider } from "./modules/auth/components/AuthProvider.js";
import { SocketProvider } from "./socket/SocketProvider.js";
import { DashboardLayout } from "./layouts/DashboardLayout.js";
import { ErrorBoundary } from "./components/common/ErrorBoundary.js";
import { ToastContainer } from "./components/common/ToastContainer.js";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      retry: 1, // Limit retries to 1 to fail-fast on queries
      staleTime: 5 * 60 * 1000, // Cache for 5 minutes
    },
  },
});

const router = createBrowserRouter([
  {
    path: "/login",
    element: <LoginPage />,
  },
  {
    path: "/signup",
    element: <SignupPage />,
  },
  {
    path: "/",
    element: (
      <ProtectedRoute>
        <DashboardLayout />
      </ProtectedRoute>
    ),
    children: [
      {
        path: "dashboard",
        element: <DashboardPage />,
      },
      {
        path: "workspaces",
        element: <WorkspacesPage />,
      },
      {
        path: "workspaces/:id",
        element: <WorkspaceDetailPage />,
      },
      {
        path: "rooms/:id",
        element: <RoomDetailPage />,
      },
      {
        path: "profile",
        element: <ProfilePage />,
      },
      {
        path: "settings",
        element: <SettingsPage />,
      },
      {
        path: "unauthorized",
        element: <UnauthorizedPage />,
      },
      {
        path: "",
        element: <Navigate to="dashboard" replace />,
      },
    ],
  },
  {
    path: "*",
    element: <NotFoundPage />,
  },
]);

export default function App() {
  return (
    <ErrorBoundary>
      <QueryClientProvider client={queryClient}>
        <AuthProvider>
          <SocketProvider>
            <RouterProvider router={router} />
            <ToastContainer />
          </SocketProvider>
        </AuthProvider>
      </QueryClientProvider>
    </ErrorBoundary>
  );
}
