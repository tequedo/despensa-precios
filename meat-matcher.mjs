export function normalizeWords(value) {
  return String(value ?? "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

export const MIN_PLAUSIBLE_MEAT_PRICE_PER_KG = 4_000;
export const MAX_PLAUSIBLE_MEAT_PRICE_PER_KG = 250_000;

const nonFreshMeatContext = /\b(sabor|papas?|mayonesa|salsa|aderezo|gallet\w*|snack|helad\w*|repasador|juguete|mascota|perro|gato|hamburguesa|medallon|milanes\w*|empanad\w*|pizza|sandwich|fiambre|feta\w*|fet|fetead\w*|curad\w*|cocid\w*|ahumad\w*|congelad\w*|descong\w*|cong|iqf|formad\w*|rebozad\w*|grillad\w*|hornead\w*|horno|crispy|rellen\w*|preparad\w*|napolitan\w*|demiglace|comidas?|atun|merluza|pescado|sob|pch|bli)\b/;
const nonFreshMeatBrand = /\b(nuestra cocina|granja del sol|paladini|lario|familia grion)\b/;

export function createMeatMatcher(catalog) {
  const entries = catalog.map((entry) => ({
    ...entry,
    aliases: entry.aliases.map(normalizeWords),
  }));

  return function isMeatProduct(description, brand = "") {
    const source = normalizeWords(description);
    const sourceBrand = normalizeWords(brand);
    if (!source || nonFreshMeatContext.test(source) || nonFreshMeatBrand.test(sourceBrand)) return false;

    const candidates = [
      source,
      source.replace(/^(?:carne(?: vacuna| de vaca| porcina| de cerdo)?|corte vacuno)\s+/, ""),
      source.replace(/^pollo\s+/, ""),
    ];

    return entries.some((entry) => {
      if (entry.category === "Carne vacuna" && /\b(cerd\w*|porcin\w*|poll\w*|pavo|lechon\w*|corder\w*|ovin\w*|caprin\w*|cord)\b/.test(source)) return false;
      if (entry.category === "Pollo" && /\b(cerd\w*|porcin\w*|vacun\w*|pavo|lechon\w*|corder\w*|ovin\w*|caprin\w*)\b/.test(source)) return false;
      if (entry.category === "Cerdo" && /\b(vacun\w*|poll\w*|pavo|corder\w*|ovin\w*|caprin\w*)\b/.test(source)) return false;

      return entry.aliases.some((alias) =>
        candidates.some((candidate) => candidate === alias || candidate.startsWith(`${alias} `)),
      );
    });
  };
}

export function hasExactKilogramBasis(presentation, referenceUnit) {
  const exactOneKilogram = /^1(?:[.,]0+)?\s*(?:kg|kgm|kgr|kilo|kilogramo)s?\.?$/i.test(String(presentation ?? "").trim());
  const kilogramUnit = /^(?:kg|kgm|kgr|kilo|kilogramo)s?\.?$/i.test(String(referenceUnit ?? "").trim());
  return exactOneKilogram && kilogramUnit;
}

export function isPlausibleMeatPrice(value) {
  const price = Number(value);
  return Number.isFinite(price) && price >= MIN_PLAUSIBLE_MEAT_PRICE_PER_KG && price <= MAX_PLAUSIBLE_MEAT_PRICE_PER_KG;
}
