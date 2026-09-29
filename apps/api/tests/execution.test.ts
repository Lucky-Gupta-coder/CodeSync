import { ExecutionService } from "../src/modules/execution/execution.service.js";
import fs from "fs/promises";
import path from "path";

describe("ExecutionService", () => {
  it("should execute valid JavaScript code", async () => {
    const code = 'console.log("Hello World!");';
    const result = await ExecutionService.executeCode(code, "javascript");

    expect(result.exitCode).toBe(0);
    expect(result.stdout.trim()).toBe("Hello World!");
    expect(result.stderr).toBe("");
  });

  it("should handle syntax errors", async () => {
    const code = 'console.log("Missing paren";';
    const result = await ExecutionService.executeCode(code, "javascript");

    expect(result.exitCode).not.toBe(0);
    expect(result.stderr).toContain("SyntaxError");
  });

  it("should timeout for infinite loops", async () => {
    const code = "while(true) {}";
    const result = await ExecutionService.executeCode(code, "javascript");

    expect(result.exitCode).toBe(143);
    expect(result.stderr).toContain("Execution Timeout");
  }, 10000); // Allow test to run up to 10s

  it("should reject unsupported languages", async () => {
    await expect(ExecutionService.executeCode('print("Hello")', "python")).rejects.toThrow(
      "Language python is not supported for execution."
    );
  });
});
