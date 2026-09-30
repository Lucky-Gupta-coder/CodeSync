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

  it("should execute valid Python code", async () => {
    const code = 'print("Hello from Python")';
    const result = await ExecutionService.executeCode(code, "python");

    expect(result.exitCode).toBe(0);
    expect(result.stdout.trim()).toBe("Hello from Python");
    expect(result.stderr).toBe("");
  });

  it("should handle Python syntax errors", async () => {
    const code = "print(";
    const result = await ExecutionService.executeCode(code, "python");

    expect(result.exitCode).not.toBe(0);
    expect(result.stderr).toContain("SyntaxError");
  });

  it("should execute valid Java code", async () => {
    const code = `
public class Main {
    public static void main(String[] args) {
        System.out.println("Hello from Java");
    }
}
    `;
    const result = await ExecutionService.executeCode(code, "java");

    expect(result.exitCode).toBe(0);
    expect(result.stdout.trim()).toBe("Hello from Java");
    expect(result.stderr).toBe("");
  });

  it("should handle Java compilation errors", async () => {
    const code = `
public class Main {
    public static void main(String[] args) {
        System.out.println("Missing semicolon")
    }
}
    `;
    const result = await ExecutionService.executeCode(code, "java");

    expect(result.exitCode).not.toBe(0);
    expect(result.stderr).toContain("error:");
  });

  it("should handle Java runtime errors", async () => {
    const code = `
public class Main {
    public static void main(String[] args) {
        int result = 10 / 0;
    }
}
    `;
    const result = await ExecutionService.executeCode(code, "java");

    expect(result.exitCode).not.toBe(0);
    expect(result.stderr).toContain("ArithmeticException");
  });

  it("should reject unsupported languages", async () => {
    await expect(ExecutionService.executeCode("#include <iostream>", "cpp")).rejects.toThrow(
      "Language cpp is not supported for execution."
    );
  });
});
