import { getAnalytics } from "@getdesign/analytics";

export function downloadDesignMd(content: string, filename: string) {
  const blob = new Blob([content], { type: "text/markdown;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  try {
    link.click();
    getAnalytics().capture({ event: "design_md_downloaded", properties: {} });
  } finally {
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  }
}
