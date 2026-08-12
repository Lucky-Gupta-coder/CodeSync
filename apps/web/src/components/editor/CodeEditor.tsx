import Editor, { Monaco } from "@monaco-editor/react";
import type { editor } from "monaco-editor";
import * as Y from "yjs";
import { MonacoBinding } from "y-monaco";
import { useRef, useEffect } from "react";
import { PresenceUser, CursorPosition } from "@codesync/types";

export interface CodeEditorProps {
  value?: string;
  language: string;
  readOnly?: boolean;
  onChange?: (value: string) => void;
  ytext?: Y.Text | null;
  users?: PresenceUser[];
  cursors?: Record<string, CursorPosition | null>;
  onCursorChange?: (position: CursorPosition | null) => void;
}

export const CodeEditor = ({
  value,
  language,
  readOnly = false,
  onChange,
  ytext,
  users = [],
  cursors = {},
  onCursorChange,
}: CodeEditorProps) => {
  const editorRef = useRef<editor.IStandaloneCodeEditor | null>(null);
  const bindingRef = useRef<MonacoBinding | null>(null);
  const monacoRef = useRef<Monaco | null>(null);
  const decorationsRef = useRef<{
    set: (newDecorations: editor.IModelDeltaDecoration[]) => void;
    clear: () => void;
  } | null>(null); // To store the Monaco decorations collection

  const handleEditorChange = (value: string | undefined) => {
    if (onChange) {
      onChange(value || "");
    }
  };

  const handleEditorWillMount = (monaco: Monaco) => {
    monacoRef.current = monaco;
  };

  const handleEditorDidMount = (editorInstance: editor.IStandaloneCodeEditor) => {
    editorRef.current = editorInstance;

    // Initialize empty decorations collection
    if (editorInstance.createDecorationsCollection) {
      const collection = editorInstance.createDecorationsCollection([]);
      decorationsRef.current = {
        set: (newDecorations) => collection.set(newDecorations),
        clear: () => collection.clear(),
      };
    } else {
      // Fallback for older Monaco versions
      let oldDecorations: string[] = [];
      decorationsRef.current = {
        set: (newDecorations: editor.IModelDeltaDecoration[]) => {
          oldDecorations = editorInstance.deltaDecorations(oldDecorations, newDecorations);
        },
        clear: () => {
          oldDecorations = editorInstance.deltaDecorations(oldDecorations, []);
        },
      };
    }

    // Hook cursor changes
    editorInstance.onDidChangeCursorPosition((e: editor.ICursorPositionChangedEvent) => {
      if (onCursorChange) {
        const selection = editorInstance.getSelection();
        onCursorChange({
          lineNumber: e.position.lineNumber,
          column: e.position.column,
          selectionStartLineNumber: selection ? selection.startLineNumber : e.position.lineNumber,
          selectionStartColumn: selection ? selection.startColumn : e.position.column,
          selectionEndLineNumber: selection ? selection.endLineNumber : e.position.lineNumber,
          selectionEndColumn: selection ? selection.endColumn : e.position.column,
        });
      }
    });

    editorInstance.onDidChangeCursorSelection((e: editor.ICursorSelectionChangedEvent) => {
      if (onCursorChange) {
        onCursorChange({
          lineNumber: e.selection.positionLineNumber,
          column: e.selection.positionColumn,
          selectionStartLineNumber: e.selection.startLineNumber,
          selectionStartColumn: e.selection.startColumn,
          selectionEndLineNumber: e.selection.endLineNumber,
          selectionEndColumn: e.selection.endColumn,
        });
      }
    });
  };

  // Bind Y.Text
  useEffect(() => {
    if (!editorRef.current || !ytext) {
      if (bindingRef.current) {
        bindingRef.current.destroy();
        bindingRef.current = null;
      }
      return;
    }

    bindingRef.current = new MonacoBinding(
      ytext,
      editorRef.current.getModel(),
      new Set([editorRef.current]),
      null
    );

    return () => {
      if (bindingRef.current) {
        bindingRef.current.destroy();
        bindingRef.current = null;
      }
    };
  }, [ytext]);

  // Handle remote cursors
  useEffect(() => {
    if (!editorRef.current || !decorationsRef.current || !monacoRef.current) return;

    const newDecorations: editor.IModelDeltaDecoration[] = [];

    // Create CSS classes dynamically if they don't exist
    // This allows us to use dynamic colors from the user object
    Object.entries(cursors).forEach(([userId, cursor]) => {
      if (!cursor) return;

      const user = users.find((u) => u.userId === userId);
      if (!user) return;

      const color = user.color || "#0088ff";
      const className = `remote-cursor-${userId}`;
      const selClassName = `remote-selection-${userId}`;

      // Inject CSS if needed
      if (!document.getElementById(`style-${className}`)) {
        const style = document.createElement("style");
        style.id = `style-${className}`;
        style.innerHTML = `
          .${className} {
            border-left: 2px solid ${color};
            position: relative;
            z-index: 9;
          }
          .${className}::after {
            content: "${user.name}";
            position: absolute;
            top: -16px;
            left: -2px;
            background: ${color};
            color: white;
            font-size: 10px;
            padding: 1px 4px;
            white-space: nowrap;
            border-radius: 2px 2px 2px 0;
            opacity: 0;
            transition: opacity 0.2s;
            pointer-events: none;
          }
          .${className}:hover::after {
            opacity: 1;
          }
          .${selClassName} {
            background-color: ${color}40; /* 25% opacity */
          }
        `;
        document.head.appendChild(style);
      }

      // Add cursor decoration
      newDecorations.push({
        range: new monacoRef.current.Range(
          cursor.lineNumber,
          cursor.column,
          cursor.lineNumber,
          cursor.column
        ),
        options: {
          className: className,
          stickiness: 1, // TrackedRangeStickiness.NeverGrowsWhenTypingAtEdges
        },
      });

      // Add selection decoration if there is a selection
      if (
        cursor.selectionStartLineNumber !== cursor.selectionEndLineNumber ||
        cursor.selectionStartColumn !== cursor.selectionEndColumn
      ) {
        newDecorations.push({
          range: new monacoRef.current.Range(
            cursor.selectionStartLineNumber,
            cursor.selectionStartColumn,
            cursor.selectionEndLineNumber,
            cursor.selectionEndColumn
          ),
          options: {
            className: selClassName,
            stickiness: 1,
          },
        });
      }
    });

    decorationsRef.current.set(newDecorations);

    return () => {
      // Cleanup styles is tricky because we might unmount/remount often,
      // but we can rely on React's lifecycle. We'll let them persist for now
      // as they are small, or clean them up on unmount.
    };
  }, [cursors, users]);

  return (
    <div className="w-full h-full">
      <Editor
        height="100%"
        language={language}
        value={value}
        theme="vs-dark"
        onChange={handleEditorChange}
        beforeMount={handleEditorWillMount}
        onMount={handleEditorDidMount}
        options={{
          readOnly,
          minimap: { enabled: false },
          wordWrap: "on",
          fontSize: 14,
          tabSize: 2,
          smoothScrolling: true,
          lineNumbers: "on",
          folding: true,
          matchBrackets: "always",
          automaticLayout: true,
          scrollBeyondLastLine: false,
          padding: { top: 16, bottom: 16 },
          fontFamily: "'JetBrains Mono', 'Fira Code', 'Courier New', monospace",
        }}
      />
    </div>
  );
};
