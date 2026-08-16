const INVALID_FILE_NAME_CHARACTER_PATTERN = /[<>:"/\\|?*\u0000-\u001F]/g;

export function safeExportFileTitle(title: string, fallbackTitle: string) {
  const normalizedTitle = title
    .replace(INVALID_FILE_NAME_CHARACTER_PATTERN, "_")
    .trim()
    .replace(/[. ]+$/g, "");

  return normalizedTitle || fallbackTitle;
}
