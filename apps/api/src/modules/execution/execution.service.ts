import { exec } from "child_process";
import fs from "fs/promises";
import path from "path";
import os from "os";
import crypto from "crypto";

interface LanguageConfig {
  filename: string;
  command: (filePath: string, workDir: string) => string;
  isCompiled?: boolean;
}

const LANGUAGE_CONFIGS: Record<string, LanguageConfig> = {
  javascript: {
    filename: "main.js",
    command: (filePath) => `node "${filePath}"`,
  },
  typescript: {
    filename: "main.js", // Map TS to JS execution for MVP
    command: (filePath) => `node "${filePath}"`,
  },
  python: {
    filename: "main.py",
    command: (filePath) => `python "${filePath}"`,
  },
  java: {
    filename: "Main.java",
    command: (_filePath, workDir) =>
      `javac "${path.join(workDir, "Main.java")}" && java -cp "${workDir}" Main`,
    isCompiled: true,
  },
};

export class ExecutionService {
  public static async executeCode(
    code: string,
    language: string
  ): Promise<{ stdout: string; stderr: string; exitCode: number; executionTime: number }> {
    const normalizedLang = language.toLowerCase();
    const config = LANGUAGE_CONFIGS[normalizedLang];

    if (!config) {
      throw new Error(`Language ${language} is not supported for execution.`);
    }

    const execId = crypto.randomBytes(16).toString("hex");
    const workDir = path.join(os.tmpdir(), `codesync-exec-${execId}`);
    const filePath = path.join(workDir, config.filename);

    await fs.mkdir(workDir, { recursive: true });
    await fs.writeFile(filePath, code, "utf-8");

    const startTime = Date.now();

    try {
      const result = await new Promise<{
        stdout: string;
        stderr: string;
        exitCode: number;
        executionTime: number;
      }>((resolve) => {
        const cmd = config.command(filePath, workDir);
        exec(
          cmd,
          { timeout: 5000, maxBuffer: 1024 * 500, cwd: workDir },
          (error, stdout, stderr) => {
            const executionTime = Date.now() - startTime;

            if (error) {
              if (error.killed) {
                resolve({
                  stdout: stdout.toString(),
                  stderr: stderr.toString() + "\n[Execution Timeout: Process killed after 5s]",
                  exitCode: 143,
                  executionTime,
                });
                return;
              }

              resolve({
                stdout: stdout.toString(),
                stderr: stderr.toString() || error.message,
                exitCode: typeof error.code === "number" ? error.code : 1,
                executionTime,
              });
              return;
            }

            resolve({
              stdout: stdout.toString(),
              stderr: stderr.toString(),
              exitCode: 0,
              executionTime,
            });
          }
        );
      });

      return result;
    } finally {
      // Guaranteed cleanup of isolated temp directory
      try {
        await new Promise((r) => setTimeout(r, 50));
        await fs.rm(workDir, { recursive: true, force: true, maxRetries: 5, retryDelay: 200 });
      } catch (e: any) {
        if (e?.code !== "EBUSY" && e?.code !== "ENOENT") {
          console.error("Failed to cleanup execution directory", e);
        }
      }
    }
  }
}
