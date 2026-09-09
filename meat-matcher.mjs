export function normalizeWords(value) {
  return String(value ?? "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

const nonFreshMeatContext = /\b(sabor|papas?|mayonesa|salsa|aderezo|gallet\w*|snack|helad\w*|repasador|juguete|mascota|perro|gato|hamburguesa|medallon|empanada|pizza|sandwich|fiambre|fetead\w*|curad\w*|cocid\w*|ahumad\w*|congelad\w*|atun|merluza|pescado)\b/;

export function createMeatMatcher(catalog) {
  const entries = catalog.map((entry) => ({
    ...entry,
    aliases: entry.aliases.map(normalizeWords),
  }));

  return function isMeatProduct(description) {
    const source = normalizeWords(description);
    if (!source || nonFreshMeatContext.test(source)) return false;

    const candidates = [
      source,
      source.replace(/^(?:carne(?: vacuna| de vaca| porcina| de cerdo)?|corte vacuno)\s+/, ""),
      source.replace(/^pollo\s+/, ""),
    ];

    return entries.some((entry) => {
      if (entry.category === "Carne vacuna" && /\b(cerd\w*|porcin\w*|poll\w*|pavo)\b/.test(source)) return false;
      if (entry.category === "Pollo" && /\b(cerd\w*|porcin\w*|vacun\w*|pavo)\b/.test(source)) return false;
      if (entry.category === "Cerdo" && /\b(vacun\w*|poll\w*|pavo)\b/.test(source)) return false;

      return entry.aliases.some((alias) =>
        candidates.some((candidate) => candidate === alias || candidate.startsWith(`${alias} `)),
      );
    });
  };
}
