type CredentialMetadata = {
  provider: "daytona" | "openai";
};

export function hasRequiredRunCredentials(
  keys: ReadonlyArray<CredentialMetadata>,
): boolean {
  return ["daytona", "openai"].every((provider) =>
    keys.some((key) => key.provider === provider),
  );
}
