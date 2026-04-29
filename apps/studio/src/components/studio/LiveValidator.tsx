const processContent = async (content: string, name: string) => {
  setError("");
  setFileName(name);
  try {
    let parsed: Record<string, unknown>;

    if (name.endsWith(".json") || content.trim().startsWith("{")) {
      parsed = JSON.parse(content) as Record<string, unknown>;
    } else {
      parsed = parseYamlLight(content);
    }

    const computedHash = await sha256Hex(content.replace(/\r\n/g, "\n"));
    setHash(computedHash);
    setValidation(validateAix(parsed));
  } catch (e) {
    setError(
      `Invalid AIX payload: ${e instanceof Error ? e.message : String(e)
      }`
    );
    setValidation(null);
  }
};