import { exec } from "child_process";
import fs from "fs/promises";
import path from "path";
import os from "os";
import crypto from "crypto";

export class ExecutionService {
  public static async executeCode(
    code: string,
    language: string
  ): Promise<{ stdout: string; stderr: string; exitCode: number; executionTime: number }> {
    // For MVP, map typescript to javascript execution (since we just run node)
    // Real implementation would transpile or use ts-node
    if (language !== "javascript" && language !== "typescript") {
      throw new Error(`Language ${language} is not supported for execution.`);
    }

    const fileId = crypto.randomBytes(16).toString("hex");
    const tmpDir = os.tmpdir();
    const filePath = path.join(tmpDir, `codesync-exec-${fileId}.js`);

    await fs.writeFile(filePath, code, "utf-8");

    const startTime = Date.now();

    return new Promise((resolve) => {
      // Use child_process.exec with timeout (5000ms max)
      exec(
        `node "${filePath}"`,
        { timeout: 5000, maxBuffer: 1024 * 500 }, // 500KB max output
        async (error, stdout, stderr) => {
          const executionTime = Date.now() - startTime;

          // Clean up temp file
          try {
            await fs.unlink(filePath);
          } catch (e) {
            console.error("Failed to delete temp file", e);
          }

          if (error) {
            // If killed by timeout
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
              exitCode: error.code || 1,
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
  }
}
