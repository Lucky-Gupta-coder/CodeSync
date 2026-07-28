import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { MemoryRouter, Routes, Route } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { WorkspacesPage } from "../src/pages/WorkspacesPage.js";
import { WorkspaceDetailPage } from "../src/pages/WorkspaceDetailPage.js";
import { workspaceApi } from "../src/modules/workspace/services/workspace.service.js";
import { roomApi } from "../src/modules/room/services/room.service.js";
import { useAuthStore } from "../src/modules/auth/store/auth.store.js";
import { UserRole, WorkspaceVisibility } from "@codesync/types";

// Mock workspace service
vi.mock("../src/modules/workspace/services/workspace.service.js", () => ({
  workspaceApi: {
    getWorkspaces: vi.fn(),
    getWorkspaceById: vi.fn(),
    createWorkspace: vi.fn(),
    updateWorkspace: vi.fn(),
    archiveWorkspace: vi.fn(),
    restoreWorkspace: vi.fn(),
    deleteWorkspace: vi.fn(),
  },
}));

// Mock room service
vi.mock("../src/modules/room/services/room.service.js", () => ({
  roomApi: {
    getWorkspaceRooms: vi.fn().mockResolvedValue([]),
    getRoomById: vi.fn(),
  },
}));

// Mock the API client interceptors
vi.mock("../src/api/client.ts", () => ({
  apiClient: {
    interceptors: {
      request: { use: vi.fn(), eject: vi.fn() },
      response: { use: vi.fn(), eject: vi.fn() },
    },
  },
}));

describe("Workspace Management UI flow tests", () => {
  let queryClient: QueryClient;

  beforeEach(() => {
    queryClient = new QueryClient({
      defaultOptions: {
        queries: { retry: false },
      },
    });

    vi.clearAllMocks();

    // Default logged in user (id: "user-123")
    useAuthStore.getState().login("mock_token", {
      id: "user-123",
      name: "Workspace Owner",
      email: "owner@example.com",
      role: UserRole.MEMBER,
    });
  });

  const renderWithProviders = (component: React.ReactElement, route = "/workspaces") => {
    return render(
      <QueryClientProvider client={queryClient}>
        <MemoryRouter initialEntries={[route]}>
          <Routes>
            <Route path="/workspaces" element={component} />
            <Route path="/workspaces/:id" element={component} />
          </Routes>
        </MemoryRouter>
      </QueryClientProvider>
    );
  };

  it("should render workspaces list page and support grid/list view toggles", async () => {
    vi.mocked(workspaceApi.getWorkspaces).mockResolvedValue({
      data: [
        {
          id: "ws-1",
          name: "Project Workspace Alpha",
          description: "Alpha workspace test description",
          visibility: WorkspaceVisibility.PRIVATE,
          isArchived: false,
          owner: "user-123",
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        },
      ],
      pagination: { page: 1, limit: 10, total: 1, pages: 1 },
    });

    renderWithProviders(<WorkspacesPage />);

    expect(await screen.findByText("Project Workspace Alpha")).toBeInTheDocument();
    expect(screen.getByText("Alpha workspace test description")).toBeInTheDocument();

    // Toggle list view
    const listBtn = screen.getByTitle("List view");
    fireEvent.click(listBtn);

    // Toggle grid view
    const gridBtn = screen.getByTitle("Grid view");
    fireEvent.click(gridBtn);
  });

  it("should open create workspace modal and execute mutation", async () => {
    vi.mocked(workspaceApi.getWorkspaces).mockResolvedValue({
      data: [],
      pagination: { page: 1, limit: 10, total: 0, pages: 1 },
    });

    vi.mocked(workspaceApi.createWorkspace).mockResolvedValue({
      id: "ws-new",
      name: "Brand New Workspace",
      description: "My new workspace desc",
      visibility: WorkspaceVisibility.PRIVATE,
      isArchived: false,
      owner: "user-123",
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });

    renderWithProviders(<WorkspacesPage />);

    const openBtn = await screen.findByText("New Workspace");
    fireEvent.click(openBtn);

    expect(screen.getByRole("heading", { name: "Create Workspace" })).toBeInTheDocument();

    // Fill details
    const nameInput = screen.getByPlaceholderText("e.g. project-x");
    fireEvent.change(nameInput, { target: { value: "Brand New Workspace" } });

    const form = nameInput.closest("form");
    expect(form).not.toBeNull();
    if (form) {
      fireEvent.submit(form);
    }

    await waitFor(() => {
      expect(workspaceApi.createWorkspace).toHaveBeenCalledWith({
        name: "Brand New Workspace",
        description: "",
        visibility: WorkspaceVisibility.PRIVATE,
      });
    });
  });

  it("should enforce owner permission checks and edit/delete inputs validation", async () => {
    const mockWorkspace = {
      id: "ws-detail",
      name: "Detail Workspace Alpha",
      description: "My detail description",
      visibility: WorkspaceVisibility.PUBLIC,
      isArchived: false,
      owner: "user-123", // Match logged in owner ID
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    vi.mocked(workspaceApi.getWorkspaceById).mockResolvedValue(mockWorkspace);
    vi.mocked(roomApi.getWorkspaceRooms).mockResolvedValue([]);

    renderWithProviders(<WorkspaceDetailPage />, "/workspaces/ws-detail");

    // Owner should see Edit/Archive/Delete actions
    expect(await screen.findByRole("button", { name: "Edit" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Archive" })).toBeInTheDocument();
    const deleteBtn = screen.getByRole("button", { name: "Delete" });
    expect(deleteBtn).toBeInTheDocument();

    // Show delete safety input confirmation
    fireEvent.click(deleteBtn);
    expect(screen.getByText("Delete Workspace?")).toBeInTheDocument();

    const deleteSubmit = screen.getByRole("button", { name: "Delete Workspace" });
    expect(deleteSubmit).toBeDisabled();

    // Fill wrong name
    const inputConfirm = screen.getByPlaceholderText("Type workspace name here");
    fireEvent.change(inputConfirm, { target: { value: "Wrong Workspace Name" } });
    expect(deleteSubmit).toBeDisabled();

    // Fill correct name to enable delete
    fireEvent.change(inputConfirm, { target: { value: "Detail Workspace Alpha" } });
    expect(deleteSubmit).not.toBeDisabled();
  });

  it("should hide owner controls if workspace owner doesn't match authenticated user", async () => {
    const mockWorkspace = {
      id: "ws-detail",
      name: "Detail Workspace Alpha",
      description: "My detail description",
      visibility: WorkspaceVisibility.PUBLIC,
      isArchived: false,
      owner: "another-owner-456", // Doesn't match user-123
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    vi.mocked(workspaceApi.getWorkspaceById).mockResolvedValue(mockWorkspace);
    vi.mocked(roomApi.getWorkspaceRooms).mockResolvedValue([]);

    renderWithProviders(<WorkspaceDetailPage />, "/workspaces/ws-detail");

    // Ensure buttons are loaded/not loaded
    await screen.findByText("Detail Workspace Alpha");
    expect(screen.queryByRole("button", { name: "Edit" })).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Archive" })).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Delete" })).not.toBeInTheDocument();
  });
});
