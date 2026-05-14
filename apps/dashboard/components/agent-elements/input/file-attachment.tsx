import { useState } from "react";
import {
  IconX as X,
  IconFileText as FileText,
  IconFileCode as FileCode,
  IconFileTypeJs as FileJson,
  IconPhoto as ImageIcon,
} from "@tabler/icons-react";
import { cn } from "../utils/cn";
import { ImageLightbox } from "../image-lightbox";

export type FileAttachmentProps = {
  id: string;
  filename: string;
  size?: number;
  isImage?: boolean;
  url?: string;
  onRemove?: () => void;
  className?: string;
  display?: "chip" | "image-only";
  /**
   * When true (default) clicking the image thumbnail opens a fullscreen
   * preview. Set to false to render a non-interactive thumbnail.
   */
  enableImagePreview?: boolean;
};

function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

type FileIconName = "image" | "code" | "data" | "text";

function getFileIconName(filename: string, isImage?: boolean): FileIconName {
  if (isImage) return "image";

  const ext = filename.split(".").pop()?.toLowerCase();

  if (
    [
      "js",
      "ts",
      "jsx",
      "tsx",
      "py",
      "rb",
      "go",
      "rs",
      "java",
      "kt",
      "swift",
      "c",
      "cpp",
      "h",
      "hpp",
      "cs",
      "php",
    ].includes(ext || "")
  ) {
    return "code";
  }

  if (["json", "yaml", "yml", "xml"].includes(ext || "")) {
    return "data";
  }

  return "text";
}

function renderFileIcon(iconName: FileIconName) {
  switch (iconName) {
    case "image":
      return <ImageIcon className="size-4 text-muted-foreground" />;
    case "code":
      return <FileCode className="size-4 text-muted-foreground" />;
    case "data":
      return <FileJson className="size-4 text-muted-foreground" />;
    default:
      return <FileText className="size-4 text-muted-foreground" />;
  }
}

export function FileAttachment({
  id,
  filename,
  size,
  isImage,
  url,
  onRemove,
  className,
  display = "chip",
  enableImagePreview = true,
}: FileAttachmentProps) {
  const [isHovered, setIsHovered] = useState(false);
  const [isLightboxOpen, setIsLightboxOpen] = useState(false);
  const iconName = getFileIconName(filename, isImage);
  const isImageOnly = display === "image-only" && isImage && !!url;
  const canPreview = Boolean(enableImagePreview && isImage && url);

  const openLightbox = (event: React.MouseEvent) => {
    event.stopPropagation();
    setIsLightboxOpen(true);
  };

  return (
    <div
      className={cn(
        "relative bg-muted/50 rounded-[calc(var(--an-input-border-radius)-var(--an-context-padding))]",
        isImageOnly
          ? "size-10 flex items-center justify-center"
          : "flex items-center gap-2 pl-1 pr-2 py-1 min-w-[120px] max-w-[200px]",
        className,
      )}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {isImageOnly ? (
        <div
          className={cn(
            "size-8 overflow-hidden shrink-0 rounded-[calc(var(--an-input-border-radius)-var(--an-context-padding)-2px)]",
            canPreview && "cursor-pointer",
          )}
          onClick={canPreview ? openLightbox : undefined}
        >
          <img
            src={url}
            alt={filename}
            className="w-full h-full object-cover"
          />
        </div>
      ) : (
        <>
          {isImage && url ? (
            <div
              className={cn(
                "w-8 self-stretch overflow-hidden shrink-0 rounded-[calc(var(--an-input-border-radius)-var(--an-context-padding)-2px)]",
                canPreview && "cursor-pointer",
              )}
              onClick={canPreview ? openLightbox : undefined}
            >
              <img
                src={url}
                alt={filename}
                className="w-full h-full object-cover aspect-square"
              />
            </div>
          ) : (
            <div className="flex items-center justify-center w-8 self-stretch bg-muted shrink-0 rounded-[calc(var(--an-input-border-radius)-var(--an-context-padding)-2px)]">
              {renderFileIcon(iconName)}
            </div>
          )}

          <div className="flex flex-col min-w-0">
            <span
              className="text-sm font-medium text-foreground truncate"
              title={filename}
            >
              {filename}
            </span>
            {size !== undefined && (
              <span className="text-[10px] text-muted-foreground">
                {formatFileSize(size)}
              </span>
            )}
          </div>
        </>
      )}

      {onRemove && (
        <button
          onClick={(e) => {
            e.stopPropagation();
            onRemove();
          }}
          className={`absolute -top-1.5 -right-1.5 size-4 rounded-full bg-background border border-border
                     flex items-center justify-center transition-[opacity,transform] duration-150 ease-out active:scale-[0.97] z-10
                     text-muted-foreground hover:text-foreground
                     ${isHovered ? "opacity-100" : "opacity-0"}`}
          type="button"
        >
          <X className="size-3" />
        </button>
      )}

      {canPreview && url && (
        <ImageLightbox
          open={isLightboxOpen}
          onClose={() => setIsLightboxOpen(false)}
          images={[{ id, url, filename }]}
        />
      )}
    </div>
  );
}
