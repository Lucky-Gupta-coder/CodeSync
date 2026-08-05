import { render, screen, fireEvent, waitFor, within } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { MemoryRouter, Routes, Route } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { WorkspaceDetailPage } from "../src/pages/WorkspaceDetailPage.js";
import { RoomDetailPage } from "../src/pages/RoomDetailPage.js";
import { roomApi } from "../src/modules/room/services/room.service.js";
import { workspaceApi } from "../src/modules/workspace/services/workspace.service.js";
import { useAuthStore } from "../src/modules/auth/store/auth.store.js";
import { RoomLanguage, RoomStatus, UserRole, WorkspaceVisibility } from "@codesync/types";

// Mock workspace service
vi.mock("../src/modules/workspace/services/workspace.service.js", () => ({
  workspaceApi: {
    getWorkspaceById: vi.fn(),
    updateWorkspace: vi.fn(),
    archiveWorkspace: vi.fn(),
    restoreWorkspace: vi.fn(),
    deleteWorkspace: vi.fn(),
  },
}));

// Mock room service
vi.mock("../src/modules/room/services/room.service.js", () => ({
  roomApi: {
    getWorkspaceRooms: vi.fn(),
    getRoomById: vi.fn(),
    createRoom: vi.fn(),
    updateRoom: vi.fn(),
    archiveRoom: vi.fn(),
    restoreRoom: vi.fn(),
    deleteRoom: vi.fn(),
  },
}));

// Mock API Client interceptors
vi.mock("../src/api/client.ts", () => ({
  apiClient: {
    interceptors: {
      request: { use: vi.fn(), eject: vi.fn() },
      response: { use: vi.fn(), eject: vi.fn() },
    },
  },
}));

describe("Room Management UI & Detail Page Integration Tests", () => {
  let queryClient: QueryClient;

  const mockWorkspace = {
    id: "ws-100",
    name: "Engineering Workspace",
    description: "Main workspace for code collaboration",
    owner: "user-123",
    visibility: WorkspaceVisibility.PRIVATE,
    isArchived: false,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  const mockRooms = [
    {
      id: "room-1",
      workspace: "ws-100",
      name: "frontend-core",
      description: "React and TypeScript frontend room",
      owner: "user-123",
      language: RoomLanguage.TYPESCRIPT,
      status: RoomStatus.ACTIVE,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
    {
      id: "room-2",
      workspace: "ws-100",
      name: "backend-service",
      description: "Express and Node backend room",
      owner: "user-123",
      language: RoomLanguage.JAVASCRIPT,
      status: RoomStatus.ARCHIVED,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
  ];

  beforeEach(() => {
    queryClient = new QueryClient({
      defaultOptions: {
        queries: { retry: false },
      },
    });

    vi.clearAllMocks();

    // Set logged-in owner user
    useAuthStore.getState().login("mock_token", {
      id: "user-123",
      name: "Lead Developer",
      email: "lead@example.com",
      role: UserRole.MEMBER,
    });
  });

  const renderWithProviders = (
    component: React.ReactElement,
    initialRoute = "/workspaces/ws-100"
  ) => {
    return render(
      <QueryClientProvider client={queryClient}>
        <MemoryRouter initialEntries={[initialRoute]}>
          <Routes>
            <Route path="/workspaces/:id" element={component} />
            <Route path="/rooms/:id" element={component} />
          </Routes>
        </MemoryRouter>
      </QueryClientProvider>
    );
  };

  it("should render room list with room cards, language badges, and view mode switcher", async () => {
    vi.mocked(workspaceApi.getWorkspaceById).mockResolvedValue(mockWorkspace);
    vi.mocked(roomApi.getWorkspaceRooms).mockResolvedValue({
      data: mockRooms,
      pagination: { total: 2, page: 1, limit: 6, pages: 1 },
    });

    renderWithProviders(<WorkspaceDetailPage />);

    const roomTitles = await screen.findAllByText("frontend-core");
    expect(roomTitles.length).toBeGreaterThan(0);
    expect(screen.getByText("backend-service")).toBeInTheDocument();
    expect(screen.getByText("TypeScript")).toBeInTheDocument();
    expect(screen.getByText("JavaScript")).toBeInTheDocument();

    // Toggle list view
    const listBtn = screen.getByTitle("List view");
    fireEvent.click(listBtn);

    // Toggle grid view
    const gridBtn = screen.getByTitle("Grid view");
    fireEvent.click(gridBtn);
  });

  it("should support debounced search and filtering dropdowns", async () => {
    vi.mocked(workspaceApi.getWorkspaceById).mockResolvedValue(mockWorkspace);
    vi.mocked(roomApi.getWorkspaceRooms).mockResolvedValue({
      data: [mockRooms[0]],
      pagination: { total: 1, page: 1, limit: 6, pages: 1 },
    });

    renderWithProviders(<WorkspaceDetailPage />);

    const searchInput = await screen.findByPlaceholderText(
      "Search rooms by name, description, language..."
    );
    fireEvent.change(searchInput, { target: { value: "frontend" } });

    await waitFor(
      () => {
        expect(roomApi.getWorkspaceRooms).toHaveBeenCalledWith(
          "ws-100",
          expect.objectContaining({ search: "frontend" })
        );
      },
      { timeout: 2000 }
    );
  });

  it("should open create room modal and perform room creation", async () => {
    vi.mocked(workspaceApi.getWorkspaceById).mockResolvedValue(mockWorkspace);
    vi.mocked(roomApi.getWorkspaceRooms).mockResolvedValue({
      data: [],
      pagination: { total: 0, page: 1, limit: 6, pages: 1 },
    });

    vi.mocked(roomApi.createRoom).mockResolvedValue({
      id: "room-new",
      workspace: "ws-100",
      name: "python-analytics",
      description: "Python data room",
      owner: "user-123",
      language: RoomLanguage.PYTHON,
      status: RoomStatus.ACTIVE,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });

    renderWithProviders(<WorkspaceDetailPage />);

    await screen.findAllByText("Engineering Workspace");

    const newRoomBtn = screen.getByRole("button", { name: "New Room" });
    expect(newRoomBtn).not.toBeDisabled();
    fireEvent.click(newRoomBtn);

    expect(screen.getByRole("heading", { name: "Create Coding Room" })).toBeInTheDocument();

    const nameInput = screen.getByPlaceholderText("room-name");
    fireEvent.change(nameInput, { target: { value: "python-analytics" } });

    const form = nameInput.closest("form");
    if (form) {
      fireEvent.submit(form);
    }

    await waitFor(() => {
      expect(roomApi.createRoom).toHaveBeenCalledWith("ws-100", {
        name: "python-analytics",
        description: "",
        language: RoomLanguage.JAVASCRIPT,
      });
    });
  });

  it("should open delete room modal and require exact room name typing to delete", async () => {
    vi.mocked(workspaceApi.getWorkspaceById).mockResolvedValue(mockWorkspace);
    vi.mocked(roomApi.getWorkspaceRooms).mockResolvedValue({
      data: [mockRooms[0]],
      pagination: { total: 1, page: 1, limit: 6, pages: 1 },
    });

    vi.mocked(roomApi.deleteRoom).mockResolvedValue({ success: true, message: "Deleted" });

    renderWithProviders(<WorkspaceDetailPage />);

    await screen.findAllByText("Engineering Workspace");

    const cardDeleteBtn = await screen.findByTitle("Delete Room");
    fireEvent.click(cardDeleteBtn);

    const modalDialog = screen.getByRole("dialog");
    expect(within(modalDialog).getByRole("heading", { name: "Delete Room?" })).toBeInTheDocument();

    const confirmSubmitBtn = within(modalDialog).getByRole("button", { name: "Delete Room" });
    expect(confirmSubmitBtn).toBeDisabled();

    // Type incorrect name
    const input = within(modalDialog).getByPlaceholderText("Type room name here");
    fireEvent.change(input, { target: { value: "wrong-name" } });
    expect(confirmSubmitBtn).toBeDisabled();

    // Type exact room name
    fireEvent.change(input, { target: { value: "frontend-core" } });
    expect(confirmSubmitBtn).not.toBeDisabled();

    fireEvent.click(confirmSubmitBtn);

    await waitFor(() => {
      expect(roomApi.deleteRoom).toHaveBeenCalledWith("room-1");
    });
  });

  it("should render room detail page with breadcrumbs, sidebar, explorer, and editor placeholders", async () => {
    vi.mocked(roomApi.getRoomById).mockResolvedValue(mockRooms[0]);
    vi.mocked(workspaceApi.getWorkspaceById).mockResolvedValue(mockWorkspace);

    renderWithProviders(<RoomDetailPage />, "/rooms/room-1");

    const roomTitles = await screen.findAllByText("frontend-core");
    expect(roomTitles.length).toBeGreaterThan(0);
    expect(screen.getByText("Dashboard")).toBeInTheDocument();
    expect(screen.getByText("Explorer")).toBeInTheDocument();

    const fileElements = screen.getAllByText("index.js");
    expect(fileElements.length).toBeGreaterThan(0);
    expect(screen.getByText("Terminal Output")).toBeInTheDocument();

    // Click sidebar tab
    const membersTab = screen.getByRole("button", { name: /members/i });
    fireEvent.click(membersTab);

    expect(screen.getByText("members Placeholder")).toBeInTheDocument();
  });

  it("should hide modification controls for non-owner users", async () => {
    // Set non-owner user
    useAuthStore.getState().login("guest_token", {
      id: "other-user-999",
      name: "Guest User",
      email: "guest@example.com",
      role: UserRole.MEMBER,
    });

    vi.mocked(workspaceApi.getWorkspaceById).mockResolvedValue(mockWorkspace);
    vi.mocked(roomApi.getWorkspaceRooms).mockResolvedValue({
      data: [mockRooms[0]],
      pagination: { total: 1, page: 1, limit: 6, pages: 1 },
    });

    renderWithProviders(<WorkspaceDetailPage />);

    await screen.findAllByText("frontend-core");
    expect(screen.queryByTitle("Edit Room")).not.toBeInTheDocument();
    expect(screen.queryByTitle("Delete Room")).not.toBeInTheDocument();
  });
});
