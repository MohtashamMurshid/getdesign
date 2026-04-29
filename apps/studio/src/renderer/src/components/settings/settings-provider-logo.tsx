import { IconCpu } from "@tabler/icons-react";
import { getProviderLogo } from "@/lib/provider-logo";

export function SettingsProviderLogo({
  providerId,
  providerLabel,
  size = 18,
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
        title="Custom model"
        className={`inline-flex shrink-0 items-center justify-center rounded-[4px] bg-foreground/8 text-foreground/55 ${className ?? ""}`}
        style={{ width: size, height: size }}
      >
        <IconCpu size={Math.round(size * 0.7)} strokeWidth={1.6} />
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
      className={`shrink-0 select-none object-contain ${logo.monochrome ? "dark:invert" : ""} ${className ?? ""}`}
      draggable={false}
    />
  );
}
