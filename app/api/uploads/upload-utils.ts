export const MAX_FILE_SIZE = 100 * 1024 * 1024;
export const PART_SIZE = 10 * 1024 * 1024;

export function safeFileName(value: string) { return value.replace(/[\\/\0]/g, "-").trim().slice(0, 240); }
export function alphabeticRevision(value: number) {
  let number = value; let result = "";
  while (number > 0) { number -= 1; result = String.fromCharCode(65 + (number % 26)) + result; number = Math.floor(number / 26); }
  return result || "A";
}
export function fileKind(name: string, type: string) {
  const extension = name.split(".").pop()?.toLowerCase() ?? "";
  if (["doc", "docx", "rtf"].includes(extension)) return "word";
  if (["xls", "xlsx", "csv"].includes(extension)) return "excel";
  if (extension === "pdf") return "pdf";
  if (["py", "sh", "bash", "js", "ts", "tsx", "jsx", "json", "yaml", "yml", "md", "txt"].includes(extension) || type.startsWith("text/")) return "code";
  if (type.startsWith("image/") || ["heic", "heif"].includes(extension)) return "image";
  return "other";
}
