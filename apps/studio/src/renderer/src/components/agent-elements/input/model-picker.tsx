type ModelPickerModel = {
  id: string;
  name: string;
  version?: string;
};

type ModelPickerProps = {
  models: ModelPickerModel[];
  value?: string;
  defaultValue?: string;
  onChange?: (modelId: string) => void;
  disabled?: boolean;
};

export function ModelPicker({
  models,
  value,
  defaultValue,
  onChange,
  disabled,
}: ModelPickerProps) {
  return (
    <select
      className="ae-select"
      value={value ?? defaultValue ?? ""}
      onChange={(event) => onChange?.(event.target.value)}
      disabled={disabled || models.length === 0}
      aria-label="Model"
    >
      {models.length === 0 ? (
        <option value="">No authenticated models</option>
      ) : (
        models.map((model) => (
          <option key={model.id} value={model.id}>
            {model.name}
            {model.version ? ` ${model.version}` : ""}
          </option>
        ))
      )}
    </select>
  );
}
