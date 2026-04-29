"use client";

import { memo, useCallback, useMemo, useState } from "react";
import { IconCheck, IconChevronDown, IconCpu } from "@tabler/icons-react";
import type { ModelOption } from "../types";
import { stripProviderPrefix } from "@/lib/format-model-label";
import { formatProviderDisplayName } from "@/lib/format-provider-label";
import { getProviderLogo } from "@/lib/provider-logo";
import { cn } from "@/lib/utils";
import { Popover } from "./popover";

function truncateName(name: string, max = 15): string {
  if (!name) return name;
  return name.length > max ? `${name.slice(0, max).trimEnd()}…` : name;
}

function ProviderGlyph({
  providerId,
  providerLabel,
  size = 14,
  className,
}: {
  providerId?: string;
  providerLabel?: string;
  size?: number;
  className?: string;
}) {
  const logo = getProviderLogo(providerId, providerLabel);
  if (!logo) {
    return (
      <span
        aria-hidden
        className={cn(
          "inline-flex shrink-0 items-center justify-center rounded-[3px] bg-foreground/8 text-foreground/55",
          className,
        )}
        style={{ width: size, height: size }}
        title="Custom model"
      >
        <IconCpu size={Math.round(size * 0.72)} strokeWidth={1.6} />
      </span>
    );
  }
  return (
    <img
      src={logo.src}
      alt=""
      aria-hidden
      width={size}
      height={size}
      className={cn(
        "shrink-0 select-none object-contain",
        logo.monochrome && "dark:invert",
        className,
      )}
      draggable={false}
    />
  );
}

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

  const modelsByProvider = useMemo(() => {
    const buckets = new Map<string, { label: string; models: ModelOption[] }>();
    for (const m of models) {
      const key = m.provider ?? "__ungrouped__";
      const label =
        m.providerLabel ??
        (key === "__ungrouped__"
          ? "Models"
          : formatProviderDisplayName(key, undefined));
      const cur = buckets.get(key);
      if (cur) cur.models.push(m);
      else buckets.set(key, { label, models: [m] });
    }
    const groups = [...buckets.entries()].map(
      ([providerKey, { label, models: groupModels }]) => ({
        providerKey,
        providerLabel: label,
        models: groupModels,
      }),
    );
    groups.sort((a, b) => {
      if (a.providerKey === "__ungrouped__") return 1;
      if (b.providerKey === "__ungrouped__") return -1;
      return a.providerLabel.localeCompare(b.providerLabel, undefined, {
        sensitivity: "base",
      });
    });
    const showProviderHeadings = !(
      groups.length === 1 && groups[0].providerKey === "__ungrouped__"
    );
    return { groups, showProviderHeadings };
  }, [models]);

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
      className="max-h-[min(420px,calc(100vh-96px))] min-w-[260px] max-w-[min(100vw-24px,440px)] overflow-hidden p-0"
      trigger={
        <button
          type="button"
          className={cn(
            "inline-flex h-7 max-w-[min(100%,440px)] min-w-0 items-center gap-1.5 rounded-[6px] px-2 text-[12px] leading-4 text-foreground/55 transition-colors hover:bg-foreground/6 cursor-pointer",
            className,
          )}
          aria-label="Select model"
        >
          {activeModel ? (
            <ProviderGlyph
              providerId={activeModel.provider}
              providerLabel={activeModel.providerLabel}
              size={13}
            />
          ) : null}
          <span
            className="min-w-0 truncate font-normal"
            title={activeModel?.name}
          >
            {activeModel
              ? truncateName(
                  stripProviderPrefix(activeModel.name, activeModel.provider),
                )
              : placeholder}
          </span>
          {activeModel?.version ? (
            <span className="shrink-0 font-light text-foreground/25">
              {activeModel.version}
            </span>
          ) : null}
          <IconChevronDown className="size-3 shrink-0 text-foreground/40" />
        </button>
      }
    >
      <div className="max-h-[min(380px,calc(100vh-120px))] overflow-y-auto overscroll-contain p-1">
        {modelsByProvider.groups.map((group) => (
          <div key={group.providerKey} className="space-y-0.5 pb-1 last:pb-0">
            {modelsByProvider.showProviderHeadings ? (
              <p
                className="sticky top-0 z-[1] -mx-0.5 bg-an-background px-2 py-1 text-[10px] font-semibold uppercase tracking-[0.06em] text-an-foreground/45"
              >
                {group.providerLabel}
              </p>
            ) : null}
            {group.models.map((model) => {
              const isActive = model.id === activeModel?.id;
              return (
                <button
                  key={model.id}
                  type="button"
                  onClick={() => handleSelect(model.id)}
                  title={model.id}
                  className={cn(
                    "flex w-full items-center gap-2 rounded-[6px] px-2 py-1.5 text-left text-[12px] leading-4 text-an-foreground transition-colors hover:bg-foreground/6 cursor-pointer",
                    isActive && "bg-foreground/6",
                  )}
                >
                  <ProviderGlyph
                    providerId={model.provider}
                    providerLabel={model.providerLabel}
                    size={13}
                  />
                  <span className="min-w-0 flex-1 truncate">
                    {stripProviderPrefix(model.name, model.provider)}
                    {model.version ? (
                      <span className="font-light text-foreground/40"> {model.version}</span>
                    ) : null}
                  </span>
                  {isActive ? (
                    <IconCheck className="size-3.5 shrink-0 text-foreground/60" />
                  ) : null}
                </button>
              );
            })}
          </div>
        ))}
      </div>
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
        "inline-flex h-7 items-center gap-1.5 px-2 text-[12px] leading-4 text-foreground/40",
        className,
      )}
    >
      {activeModel ? (
        <ProviderGlyph
          providerId={activeModel.provider}
          providerLabel={activeModel.providerLabel}
          size={13}
        />
      ) : null}
      <span className="font-normal" title={activeModel?.name}>
        {activeModel
          ? truncateName(
              stripProviderPrefix(activeModel.name, activeModel.provider),
            )
          : placeholder}
      </span>
      {activeModel?.version && (
        <span className="ml-0.5 font-light text-foreground/25">
          {activeModel.version}
        </span>
      )}
    </div>
  );
});
