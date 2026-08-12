/**
 * Utility for mapping file extensions to Monaco Editor languages.
 */

export const getLanguageFromFileName = (fileName: string): string => {
  const extension = fileName.split(".").pop()?.toLowerCase();

  switch (extension) {
    case "ts":
    case "tsx":
      return "typescript";
    case "js":
    case "jsx":
      return "javascript";
    case "json":
      return "json";
    case "html":
    case "htm":
      return "html";
    case "css":
      return "css";
    case "scss":
    case "sass":
      return "scss";
    case "md":
    case "mdx":
      return "markdown";
    case "py":
      return "python";
    case "java":
      return "java";
    case "c":
      return "c";
    case "cpp":
    case "cc":
    case "cxx":
      return "cpp";
    case "rs":
      return "rust";
    case "go":
      return "go";
    case "sql":
      return "sql";
    case "sh":
    case "bash":
      return "shell";
    case "yaml":
    case "yml":
      return "yaml";
    case "xml":
      return "xml";
    case "php":
      return "php";
    case "rb":
      return "ruby";
    default:
      return "plaintext";
  }
};
