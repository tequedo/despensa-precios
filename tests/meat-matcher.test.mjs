import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";
import { createMeatMatcher } from "../meat-matcher.mjs";

const catalog = JSON.parse(await readFile(new URL("../data/meat-catalog.json", import.meta.url), "utf8"));
const isMeatProduct = createMeatMatcher(catalog);

test("acepta cortes frescos aunque SEPA agregue presentación", () => {
  assert.equal(isMeatProduct("ASADO C/HUESO X KG"), true);
  assert.equal(isMeatProduct("VACIO VACUNO ENVASADO"), true);
  assert.equal(isMeatProduct("PECHUGA DE POLLO POR KG"), true);
  assert.equal(isMeatProduct("MATAMBRE DE CERDO"), true);
});

test("descarta falsos positivos y especies equivocadas", () => {
  assert.equal(isMeatProduct("MAYONESA SABOR ASADO"), false);
  assert.equal(isMeatProduct("PAPAS SABOR ASADO"), false);
  assert.equal(isMeatProduct("PALETA HELADA"), false);
  assert.equal(isMeatProduct("LOMO DE CERDO AHUMADO"), false);
  assert.equal(isMeatProduct("PECHUGA DE PAVO"), false);
});
