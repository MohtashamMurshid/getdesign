"use client";

import { memo, useCallback, useState } from "react";
import { IconCheck, IconChevronDown } from "@tabler/icons-react";
import type { ModelOption } from "../types";
import { cn } from "../utils/cn";
import { Popover } from "./popover";

export type ModelPickerProps = {
  models: ModelOption[];
  value?: string;
  defaultValue?: string;
  onChange?: (modelId: string) => void;
  placeholder?: string;
  className?: string;
};

export const ModelPicker = memo(function ModelPicker({
  models,
  value,
  defaultValue,
  onChange,
  placeholder = "Auto",
  className,
}: ModelPickerProps) {
  const isControlled = value !== undefined;
  const [internalValue, setInternalValue] = useState(defaultValue);
  const activeId = isControlled ? value : internalValue;
  const activeModel = models.find((m) => m.id === activeId) ?? models[0];
  const [open, setOpen] = useState(false);

  const handleSelect = useCallback(
    (id: string) => {
      if (!isControlled) setInternalValue(id);
      onChange?.(id);
      setOpen(false);
    },
    [isControlled, onChange],
  );

  return (
    <Popover
      open={open}
      onOpenChange={setOpen}
      side="top"
      align="start"
      trigger={
        <button
          type="button"
          className={cn(
            "inline-flex h-7 items-center gap-1 rounded-[6px] px-2 text-[12px] leading-4 text-foreground/40 transition-colors hover:bg-foreground/6 cursor-pointer",
            className,
          )}
          aria-label="Select model"
        >
          <span className="font-medium">
            {activeModel?.name ?? placeholder}
          </span>
          {activeModel?.version && (
            <span className="font-normal text-foreground/25">
              {activeModel.version}
            </span>
          )}
          <IconChevronDown className="size-3 text-foreground/40" />
        </button>
      }
    >
      {models.map((model) => {
        const isActive = model.id === activeModel?.id;
        return (
          <button
            key={model.id}
            type="button"
            onClick={() => handleSelect(model.id)}
            className={cn(
              "flex w-full items-center gap-2 rounded-[6px] px-2 py-1.5 text-left text-[12px] leading-4 text-an-foreground transition-colors hover:bg-foreground/6 cursor-pointer",
              isActive && "bg-foreground/6",
            )}
          >
            <span className="flex-1 truncate">
              {model.name}
              {model.version && (
                <span className="ml-1 text-foreground/40">{model.version}</span>
              )}
            </span>
            {isActive && (
              <IconCheck className="size-3.5 shrink-0 text-foreground/60" />
            )}
          </button>
        );
      })}
    </Popover>
  );
});

export type ModelBadgeProps = {
  models: ModelOption[];
  value?: string;
  placeholder?: string;
  className?: string;
};

export const ModelBadge = memo(function ModelBadge({
  models,
  value,
  placeholder = "Auto",
  className,
}: ModelBadgeProps) {
  const activeModel = models.find((m) => m.id === value) ?? models[0];
  return (
    <div
      className={cn(
        "inline-flex h-7 items-center px-2 text-[12px] leading-4 text-foreground/30",
        className,
      )}
    >
      <span className="font-medium">{activeModel?.name ?? placeholder}</span>
      {activeModel?.version && (
        <span className="ml-0.5 font-normal text-foreground/20">
          {activeModel.version}
        </span>
      )}
    </div>
  );
});
