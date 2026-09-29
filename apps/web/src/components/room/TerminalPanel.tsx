import { useState } from "react";
import { executionApi, ExecutionResult } from "../../modules/room/services/execution.service.js";
import { useMutation } from "@tanstack/react-query";
import * as Y from "yjs";

interface TerminalPanelProps {
  roomId: string;
  ytext: Y.Text | null;
  language: string;
}

export const TerminalPanel = ({ roomId, ytext, language }: TerminalPanelProps) => {
  const [output, setOutput] = useState<ExecutionResult | null>(null);
  const [isExecuting, setIsExecuting] = useState(false);

  const executeMutation = useMutation({
    mutationFn: () => executionApi.runCode(roomId, ytext ? ytext.toString() : "", language),
    onSuccess: (data) => {
      setOutput(data);
      setIsExecuting(false);
    },
    onError: (error: any) => {
      setOutput({
        stdout: "",
        stderr: error.response?.data?.message || error.message || "Failed to execute code",
        exitCode: 1,
        executionTime: 0,
      });
      setIsExecuting(false);
    },
  });

  const handleRun = () => {
    setIsExecuting(true);
    setOutput(null);
    executeMutation.mutate();
  };

  const handleClear = () => {
    setOutput(null);
  };

  return (
    <div className="h-48 shrink-0 bg-surface-container-low border-t border-surface-container-highest flex flex-col">
      <div className="h-8 border-b border-surface-container-highest flex items-center justify-between px-4">
        <div className="flex items-center gap-6 h-full">
          <button className="text-on-surface border-b border-primary-container h-full font-label-sm text-label-sm uppercase tracking-wider flex items-center gap-2">
            Terminal
          </button>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={handleRun}
            disabled={
              isExecuting || !ytext || (language !== "javascript" && language !== "typescript")
            }
            className="flex items-center gap-1 text-[11px] px-2 py-1 bg-primary text-on-primary rounded hover:bg-primary/90 disabled:opacity-50 transition-colors"
          >
            <span className="material-symbols-outlined text-[14px]">play_arrow</span>
            {isExecuting ? "Running..." : "Run"}
          </button>
          <button
            onClick={handleClear}
            className="flex items-center gap-1 text-[11px] px-2 py-1 bg-surface-container text-on-surface rounded hover:bg-surface-container-high transition-colors"
          >
            <span className="material-symbols-outlined text-[14px]">clear_all</span>
            Clear
          </button>
        </div>
      </div>
      <div className="flex-1 p-3 font-code-md text-code-md overflow-y-auto text-outline">
        {isExecuting && <div className="text-tertiary">Running...</div>}

        {!isExecuting && output === null && (
          <div className="text-outline-variant italic">
            Click Run to execute your {language} code.
          </div>
        )}

        {output && (
          <div className="flex flex-col gap-1">
            <div className="flex items-center gap-2 text-[10px] uppercase font-label-sm">
              <span
                className={`px-1.5 rounded ${output.exitCode === 0 ? "bg-tertiary/20 text-tertiary" : "bg-error/20 text-error"}`}
              >
                Exit Code: {output.exitCode}
              </span>
              <span className="text-outline-variant">{output.executionTime}ms</span>
            </div>
            {output.stdout && (
              <pre className="text-on-surface whitespace-pre-wrap">{output.stdout}</pre>
            )}
            {output.stderr && <pre className="text-error whitespace-pre-wrap">{output.stderr}</pre>}
          </div>
        )}
      </div>
    </div>
  );
};
