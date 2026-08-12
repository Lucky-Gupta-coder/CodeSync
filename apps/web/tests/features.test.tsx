import { render, screen } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { MemoryRouter, Routes, Route } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { WorkspacesPage } from "../src/pages/WorkspacesPage.js";
import { WorkspaceDetailPage } from "../src/pages/WorkspaceDetailPage.js";
import { RoomDetailPage } from "../src/pages/RoomDetailPage.js";
import { ProfilePage } from "../src/pages/ProfilePage.js";
import { SettingsPage } from "../src/pages/SettingsPage.js";
import { workspaceApi } from "../src/modules/workspace/services/workspace.service.js";
import { roomApi } from "../src/modules/room/services/room.service.js";
import { useAuthStore } from "../src/modules/auth/store/auth.store.js";
import { UserRole, WorkspaceVisibility, RoomLanguage, RoomStatus } from "@codesync/types";

// Mock the services
vi.mock("../src/modules/workspace/services/workspace.service.js", () => ({
  workspaceApi: {
    getWorkspaces: vi.fn(),
    getWorkspaceById: vi.fn(),
  },
}));

vi.mock("../src/modules/room/services/room.service.js", () => ({
  roomApi: {
    getWorkspaceRooms: vi.fn(),
    getRoomById: vi.fn(),
  },
}));

vi.mock("../src/socket/hooks/useSocket.js", () => ({
  useSocket: vi.fn(() => ({
    on: vi.fn(),
    off: vi.fn(),
    emit: vi.fn(),
  })),
}));

vi.mock("../src/socket/hooks/usePresence.js", () => ({
  usePresence: vi.fn(() => ({ users: [], cursors: {}, updateCursor: vi.fn() })),
}));

vi.mock("../src/socket/hooks/useConnectionStatus.js", () => ({
  useConnectionStatus: vi.fn(() => "DISCONNECTED"),
}));

vi.mock("../src/socket/hooks/useRoomConnection.js", () => ({
  useRoomConnection: vi.fn(() => ({ isJoined: false, isJoining: false })),
}));

// Mock the API client to prevent network issues during vitest
vi.mock("../src/api/client.ts", () => ({
  apiClient: {
    interceptors: {
      request: { use: vi.fn(), eject: vi.fn() },
      response: { use: vi.fn(), eject: vi.fn() },
    },
  },
}));

describe("Frontend Foundation Pages Mount", () => {
  let queryClient: QueryClient;

  beforeEach(() => {
    queryClient = new QueryClient({
      defaultOptions: {
        queries: {
          retry: false,
        },
      },
    });
    vi.clearAllMocks();
    useAuthStore.getState().login("mock_token", {
      id: "123",
      name: "Mock Dashboard User",
      email: "mock@example.com",
      role: UserRole.MEMBER,
    });
  });

  it("should mount and render WorkspacesPage with workspaces grid", async () => {
    (workspaceApi.getWorkspaces as any).mockResolvedValue({
      success: true,
      data: [
        {
          id: "ws-1",
          name: "Test Workspace",
          description: "Hello test",
          visibility: WorkspaceVisibility.PRIVATE,
          isArchived: false,
          owner: "123",
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        },
      ],
      pagination: { total: 1, page: 1, limit: 6, pages: 1 },
    });

    render(
      <QueryClientProvider client={queryClient}>
        <MemoryRouter>
          <WorkspacesPage />
        </MemoryRouter>
      </QueryClientProvider>
    );

    expect(await screen.findByText("Workspaces")).toBeInTheDocument();
    expect(await screen.findByText("Test Workspace")).toBeInTheDocument();
  });

  it("should mount and render WorkspaceDetailPage with rooms", async () => {
    (workspaceApi.getWorkspaceById as any).mockResolvedValue({
      id: "ws-1",
      name: "Test Workspace",
      description: "Hello test",
      visibility: WorkspaceVisibility.PRIVATE,
      isArchived: false,
      owner: "123",
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });

    (roomApi.getWorkspaceRooms as any).mockResolvedValue([
      {
        id: "room-1",
        workspace: "ws-1",
        name: "Test Room",
        description: "Coding here",
        owner: "123",
        language: RoomLanguage.JAVASCRIPT,
        status: RoomStatus.ACTIVE,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
    ]);

    render(
      <QueryClientProvider client={queryClient}>
        <MemoryRouter initialEntries={["/workspaces/ws-1"]}>
          <Routes>
            <Route path="/workspaces/:id" element={<WorkspaceDetailPage />} />
          </Routes>
        </MemoryRouter>
      </QueryClientProvider>
    );

    expect((await screen.findAllByText("Test Workspace")).length).toBeGreaterThan(0);
    expect(await screen.findByText("Coding Rooms")).toBeInTheDocument();
    expect((await screen.findAllByText("Test Room")).length).toBeGreaterThan(0);
  });

  it("should mount and render RoomDetailPage with Explorer sidebar and code container", async () => {
    (roomApi.getRoomById as any).mockResolvedValue({
      id: "room-1",
      workspace: "ws-1",
      name: "Test Room",
      description: "Coding here",
      owner: "123",
      language: RoomLanguage.JAVASCRIPT,
      status: RoomStatus.ACTIVE,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });

    render(
      <QueryClientProvider client={queryClient}>
        <MemoryRouter initialEntries={["/rooms/room-1"]}>
          <Routes>
            <Route path="/rooms/:id" element={<RoomDetailPage />} />
          </Routes>
        </MemoryRouter>
      </QueryClientProvider>
    );

    expect(await screen.findByText("Explorer")).toBeInTheDocument();
    expect((await screen.findAllByText("index.js")).length).toBeGreaterThan(0);
    expect(await screen.findByText("Active Members (0)")).toBeInTheDocument();
  });

  it("should mount and render ProfilePage", () => {
    render(
      <MemoryRouter>
        <ProfilePage />
      </MemoryRouter>
    );

    expect(screen.getByText("Profile")).toBeInTheDocument();
    expect(screen.getByText("Mock Dashboard User")).toBeInTheDocument();
  });

  it("should mount and render SettingsPage", () => {
    render(
      <MemoryRouter>
        <SettingsPage />
      </MemoryRouter>
    );

    expect(screen.getByText("Settings")).toBeInTheDocument();
    expect(screen.getByText("Appearance")).toBeInTheDocument();
  });
});
