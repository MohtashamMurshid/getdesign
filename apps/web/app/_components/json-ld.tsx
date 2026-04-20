type JsonLdProps = {
  data: Record<string, unknown> | Record<string, unknown>[];
};

// Escape `<` so a stray `</script>` sequence inside any serialized string
// (e.g. future crawler output) can't break out of the JSON-LD block.
function serialize(data: JsonLdProps["data"]): string {
  return JSON.stringify(data).replace(/</g, "\\u003c");
}

export function JsonLd({ data }: JsonLdProps) {
  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: serialize(data) }}
    />
  );
}
