/** Some browsers start saving well after the click, so the file has to outlast it. */
const KEEP_FILE_MS = 40_000;

export function downloadFile(document: Document, fileName: string, type: string, content: string) {
  const url = URL.createObjectURL(new Blob([content], { type }));
  const link = document.createElement('a');

  link.href = url;
  link.download = fileName;
  link.click();

  setTimeout(() => URL.revokeObjectURL(url), KEEP_FILE_MS);
}
