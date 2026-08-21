import { useState, useMemo, FormEvent } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { fileApi } from "../../modules/room/services/file.service.js";
import { FileNodeDTO, FileType } from "@codesync/types";
import { Skeleton } from "../common/Skeleton.js";
import { Dialog } from "../common/Dialog.js";
import { Modal } from "../common/Modal.js";
import { Input } from "../common/Input.js";
import { Button } from "../common/Button.js";
import { useToastStore } from "../../store/toast.store.js";

interface FileExplorerProps {
  roomId: string;
  activeFileId: string | null;
  onFileSelect: (fileId: string) => void;
}

export const FileExplorer = ({ roomId, activeFileId, onFileSelect }: FileExplorerProps) => {
  const queryClient = useQueryClient();
  const addToast = useToastStore((state) => state.addToast);
  const [expandedFolders, setExpandedFolders] = useState<Set<string>>(new Set());

  // Modal States
  const [createModal, setCreateModal] = useState<{
    isOpen: boolean;
    parentId: string | null;
    type: FileType;
  } | null>(null);
  const [renameModal, setRenameModal] = useState<{
    isOpen: boolean;
    fileId: string;
    currentName: string;
  } | null>(null);
  const [deleteDialog, setDeleteDialog] = useState<{
    isOpen: boolean;
    fileId: string;
    fileName: string;
  } | null>(null);

  const [inputName, setInputName] = useState("");

  const { data: files = [], isLoading } = useQuery({
    queryKey: ["roomFiles", roomId],
    queryFn: () => fileApi.getRoomFiles(roomId),
  });

  const createMutation = useMutation({
    mutationFn: (data: { name: string; type: FileType; parentId: string | null }) =>
      fileApi.createFile(roomId, data),
    onSuccess: (newFile) => {
      queryClient.invalidateQueries({ queryKey: ["roomFiles", roomId] });
      setCreateModal(null);
      if (newFile.type === FileType.FILE) {
        onFileSelect(newFile.id);
      }
    },
    onError: (err: any) => {
      addToast(err.response?.data?.message || "Failed to create file", "error");
    },
  });

  const renameMutation = useMutation({
    mutationFn: (data: { fileId: string; name: string }) =>
      fileApi.updateFile(roomId, data.fileId, { name: data.name }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["roomFiles", roomId] });
      setRenameModal(null);
    },
    onError: (err: any) => {
      addToast(err.response?.data?.message || "Failed to rename file", "error");
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (fileId: string) => fileApi.deleteFile(roomId, fileId),
    onSuccess: (_, fileId) => {
      queryClient.invalidateQueries({ queryKey: ["roomFiles", roomId] });
      setDeleteDialog(null);
      if (activeFileId === fileId) {
        onFileSelect("");
      }
    },
    onError: (err: any) => {
      addToast(err.response?.data?.message || "Failed to delete file", "error");
    },
  });

  const toggleFolder = (folderId: string) => {
    setExpandedFolders((prev) => {
      const next = new Set(prev);
      if (next.has(folderId)) {
        next.delete(folderId);
      } else {
        next.add(folderId);
      }
      return next;
    });
  };

  const fileTree = useMemo(() => {
    const map = new Map<string, FileNodeDTO & { children: any[] }>();
    files.forEach((f) => map.set(f.id, { ...f, children: [] }));
    const roots: any[] = [];

    map.forEach((node) => {
      if (node.parentId && map.has(node.parentId)) {
        map.get(node.parentId)?.children.push(node);
      } else {
        roots.push(node);
      }
    });

    // Sort folders first, then files
    const sortNodes = (nodes: any[]) => {
      nodes.sort((a, b) => {
        if (a.type !== b.type) {
          return a.type === FileType.FOLDER ? -1 : 1;
        }
        return a.name.localeCompare(b.name);
      });
      nodes.forEach((node) => {
        if (node.children.length > 0) sortNodes(node.children);
      });
    };
    sortNodes(roots);

    return roots;
  }, [files]);

  const renderTree = (nodes: (FileNodeDTO & { children: any[] })[], depth = 0) => {
    return nodes.map((node) => {
      const isFolder = node.type === FileType.FOLDER;
      const isExpanded = expandedFolders.has(node.id);
      const isActive = activeFileId === node.id;

      return (
        <div key={node.id} className="flex flex-col">
          <div
            className={`flex items-center justify-between w-full text-xs font-medium transition-all group relative ${
              isActive
                ? "bg-indigo-600/10 text-indigo-400 font-semibold"
                : "text-slate-400 hover:text-slate-200 hover:bg-slate-900/60"
            }`}
          >
            <button
              onClick={() => {
                if (isFolder) {
                  toggleFolder(node.id);
                } else {
                  onFileSelect(node.id);
                }
              }}
              className="flex items-center gap-2 py-1.5 flex-1 text-left"
              style={{ paddingLeft: `${0.75 + depth * 1}rem` }}
            >
              {isFolder ? (
                <svg
                  className="w-4 h-4 shrink-0 text-slate-500 group-hover:text-slate-400 transition-colors"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d={isExpanded ? "M19 9l-7 7-7-7" : "M9 5l7 7-7 7"}
                  />
                </svg>
              ) : (
                <svg
                  className="w-4 h-4 shrink-0 opacity-60"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                  />
                </svg>
              )}
              <span className="truncate pr-16">{node.name}</span>
            </button>

            <div className="absolute right-2 opacity-0 group-hover:opacity-100 flex items-center gap-1">
              {isFolder && (
                <>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setCreateModal({ isOpen: true, parentId: node.id, type: FileType.FILE });
                      setInputName("");
                    }}
                    className="p-1 hover:bg-slate-700/50 rounded text-slate-400 hover:text-indigo-400 transition-colors"
                    title="New File"
                  >
                    <svg
                      className="w-3.5 h-3.5"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth="2"
                        d="M9 13h6m-3-3v6m5 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                      />
                    </svg>
                  </button>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setCreateModal({ isOpen: true, parentId: node.id, type: FileType.FOLDER });
                      setInputName("");
                    }}
                    className="p-1 hover:bg-slate-700/50 rounded text-slate-400 hover:text-indigo-400 transition-colors"
                    title="New Folder"
                  >
                    <svg
                      className="w-3.5 h-3.5"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth="2"
                        d="M9 13h6m-3-3v6m-9 1V7a2 2 0 012-2h6l2 2h6a2 2 0 012 2v8a2 2 0 01-2 2H5a2 2 0 01-2-2z"
                      />
                    </svg>
                  </button>
                </>
              )}
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setRenameModal({ isOpen: true, fileId: node.id, currentName: node.name });
                  setInputName(node.name);
                }}
                className="p-1 hover:bg-slate-700/50 rounded text-slate-400 hover:text-amber-400 transition-colors"
                title="Rename"
              >
                <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z"
                  />
                </svg>
              </button>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setDeleteDialog({ isOpen: true, fileId: node.id, fileName: node.name });
                }}
                className="p-1 hover:bg-slate-700/50 rounded text-slate-400 hover:text-red-400 transition-colors"
                title="Delete"
              >
                <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                  />
                </svg>
              </button>
            </div>
          </div>

          {isFolder && isExpanded && node.children.length > 0 && (
            <div className="flex flex-col w-full">{renderTree(node.children, depth + 1)}</div>
          )}
        </div>
      );
    });
  };

  if (isLoading) {
    return (
      <div className="flex flex-col gap-2 p-3">
        <Skeleton className="h-6 w-full rounded" />
        <Skeleton className="h-6 w-3/4 rounded ml-4" />
        <Skeleton className="h-6 w-5/6 rounded" />
      </div>
    );
  }

  const handleCreateSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (!createModal || !inputName.trim()) return;
    createMutation.mutate({
      name: inputName.trim(),
      type: createModal.type,
      parentId: createModal.parentId,
    });
  };

  const handleRenameSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (!renameModal || !inputName.trim()) return;
    renameMutation.mutate({ fileId: renameModal.fileId, name: inputName.trim() });
  };

  return (
    <div className="flex flex-col w-full h-full overflow-y-auto relative py-2 group/explorer">
      {/* Root actions */}
      <div className="absolute top-2 right-2 opacity-0 group-hover/explorer:opacity-100 flex items-center gap-1 z-10 transition-opacity">
        <button
          onClick={(e) => {
            e.stopPropagation();
            setCreateModal({ isOpen: true, parentId: null, type: FileType.FILE });
            setInputName("");
          }}
          className="p-1.5 bg-slate-800 hover:bg-slate-700 rounded-md text-slate-300 hover:text-indigo-400 transition-colors shadow-sm"
          title="New File at Root"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="2"
              d="M9 13h6m-3-3v6m5 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
            />
          </svg>
        </button>
        <button
          onClick={(e) => {
            e.stopPropagation();
            setCreateModal({ isOpen: true, parentId: null, type: FileType.FOLDER });
            setInputName("");
          }}
          className="p-1.5 bg-slate-800 hover:bg-slate-700 rounded-md text-slate-300 hover:text-indigo-400 transition-colors shadow-sm"
          title="New Folder at Root"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="2"
              d="M9 13h6m-3-3v6m-9 1V7a2 2 0 012-2h6l2 2h6a2 2 0 012 2v8a2 2 0 01-2 2H5a2 2 0 01-2-2z"
            />
          </svg>
        </button>
      </div>

      {files.length === 0 ? (
        <div className="px-4 py-8 text-center mt-6">
          <p className="text-xs text-slate-500">No files found.</p>
        </div>
      ) : (
        <div className="mt-6">{renderTree(fileTree)}</div>
      )}

      {/* Create Modal */}
      <Modal
        isOpen={!!createModal?.isOpen}
        onClose={() => setCreateModal(null)}
        title={createModal?.type === FileType.FILE ? "Create File" : "Create Folder"}
      >
        <form onSubmit={handleCreateSubmit} className="flex flex-col gap-4">
          <Input
            autoFocus
            label="Name"
            placeholder={createModal?.type === FileType.FILE ? "e.g. index.ts" : "e.g. src"}
            value={inputName}
            onChange={(e) => setInputName(e.target.value)}
          />
          <div className="flex justify-end gap-3 mt-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setCreateModal(null)}
              disabled={createMutation.isPending}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              variant="primary"
              size="sm"
              loading={createMutation.isPending}
              disabled={!inputName.trim()}
            >
              Create
            </Button>
          </div>
        </form>
      </Modal>

      {/* Rename Modal */}
      <Modal isOpen={!!renameModal?.isOpen} onClose={() => setRenameModal(null)} title="Rename">
        <form onSubmit={handleRenameSubmit} className="flex flex-col gap-4">
          <Input
            autoFocus
            label="New Name"
            value={inputName}
            onChange={(e) => setInputName(e.target.value)}
          />
          <div className="flex justify-end gap-3 mt-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setRenameModal(null)}
              disabled={renameMutation.isPending}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              variant="primary"
              size="sm"
              loading={renameMutation.isPending}
              disabled={!inputName.trim() || inputName === renameModal?.currentName}
            >
              Rename
            </Button>
          </div>
        </form>
      </Modal>

      {/* Delete Dialog */}
      <Dialog
        isOpen={!!deleteDialog?.isOpen}
        onClose={() => setDeleteDialog(null)}
        onConfirm={() => {
          if (deleteDialog) deleteMutation.mutate(deleteDialog.fileId);
        }}
        title="Delete"
        message={`Are you sure you want to delete "${deleteDialog?.fileName}"? This action cannot be undone.`}
        confirmText="Delete"
        variant="danger"
        loading={deleteMutation.isPending}
      />
    </div>
  );
};
