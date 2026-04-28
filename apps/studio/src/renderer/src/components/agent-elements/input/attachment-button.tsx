import { memo, type ReactNode } from "react";
import { IconPaperclip, IconPlus } from "@tabler/icons-react";

export type AttachmentButtonIcon = "plus" | "paperclip";

export type AttachmentButtonProps = {
  onClick?: () => void;
  /**
   * Icon to render inside the button.
   * - "plus" (default): a `+` glyph, matches the generic "add something" affordance.
   * - "paperclip": a paperclip glyph, matches the more literal "attach file" affordance.
   * - Pass any ReactNode to fully override (e.g. a custom svg). The node is
   *   rendered as-is inside the button; size/color from this component's
   *   styling is only applied to the built-in presets.
   */
  icon?: AttachmentButtonIcon | ReactNode;
};

function isIconName(value: unknown): value is AttachmentButtonIcon {
  return value === "plus" || value === "paperclip";
}

export const AttachmentButton = memo(function AttachmentButton({
  onClick,
  icon = "plus",
}: AttachmentButtonProps) {
  const iconClassName = "w-4 h-4 text-neutral-400 dark:text-neutral-600";
  let iconNode: ReactNode;
  if (isIconName(icon)) {
    iconNode =
      icon === "paperclip" ? (
        <IconPaperclip className={iconClassName} strokeWidth={2} />
      ) : (
        <IconPlus className={iconClassName} strokeWidth={2} />
      );
  } else {
    iconNode = icon;
  }

  return (
    <button
      type="button"
      onClick={onClick}
      className="size-7 rounded-full flex items-center justify-center hover:bg-muted transition-colors cursor-pointer"
      aria-label="Attach"
    >
      {iconNode}
    </button>
  );
});
