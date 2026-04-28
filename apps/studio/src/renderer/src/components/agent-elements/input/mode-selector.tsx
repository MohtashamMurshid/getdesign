type ModeSelectorMode = {
  id: string;
  label: string;
  description?: string;
};

type ModeSelectorProps = {
  modes: ModeSelectorMode[];
  value?: string;
  defaultValue?: string;
  onChange?: (modeId: string) => void;
};

export function ModeSelector({ modes, value, defaultValue, onChange }: ModeSelectorProps) {
  return (
    <select
      className="ae-select"
      value={value ?? defaultValue ?? modes[0]?.id ?? ""}
      onChange={(event) => onChange?.(event.target.value)}
      aria-label="Mode"
    >
      {modes.map((mode) => (
        <option key={mode.id} value={mode.id}>
          {mode.label}
        </option>
      ))}
    </select>
  );
}
