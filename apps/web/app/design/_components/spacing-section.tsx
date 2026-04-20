import { RADII, SPACES } from "./design-data";
import { Caption } from "./design-primitives";

export function SpacingSection() {
  return (
    <div className="grid gap-6 lg:grid-cols-[1.4fr_1fr]">
      <div className="rounded-xl border border-[var(--border)] bg-[var(--surface-100)] p-6">
        <Caption>Spacing scale · 4px base</Caption>
        <div className="mt-6 space-y-2">
          {SPACES.map((space) => (
            <div key={space} className="flex items-center gap-4">
              <span className="w-10 font-mono text-[11px] text-[var(--subtle)]">
                {space}
              </span>
              <span
                className="block h-2 rounded-sm bg-[var(--accent)]"
                style={{ width: `${space * 2}px` }}
              />
              <span className="font-mono text-[10.5px] text-[var(--subtle)]">
                {space}px
              </span>
            </div>
          ))}
        </div>
      </div>

      <div className="rounded-xl border border-[var(--border)] bg-[var(--surface-100)] p-6">
        <Caption>Radius</Caption>
        <div className="mt-6 grid grid-cols-5 gap-3">
          {RADII.map((radius) => (
            <div key={radius.name} className="flex flex-col items-center gap-2">
              <span
                className="h-14 w-14 border border-[var(--border-strong)] bg-[var(--surface-200)]"
                style={{ borderRadius: radius.value }}
              />
              <span className="font-mono text-[10.5px] text-[var(--subtle)]">
                {radius.name}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
