import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";
import { createMeatMatcher, hasExactKilogramBasis, isPlausibleMeatPrice } from "../meat-matcher.mjs";

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
  assert.equal(isMeatProduct("BONDIOLA CON DEMIGLACE", "NUESTRA COCINA"), false);
  assert.equal(isMeatProduct("PALETA CORDERO PATAGONICO"), false);
  assert.equal(isMeatProduct("SUPREMA CONG IQF"), false);
  assert.equal(isMeatProduct("Bondiola Paladini Fetas Finas", "PALADINI"), false);
});

test("sólo acepta una base de precio declarada exactamente para un kilo", () => {
  assert.equal(hasExactKilogramBasis("1 KG", "KG"), true);
  assert.equal(hasExactKilogramBasis("1.00 Kg", "Kg"), true);
  assert.equal(hasExactKilogramBasis("1 kgr", "kgr"), true);
  assert.equal(hasExactKilogramBasis("16 KG", "KG"), false);
  assert.equal(hasExactKilogramBasis("420 gr", "gr"), false);
  assert.equal(hasExactKilogramBasis("1 EA", "EA"), false);
});

test("pone en cuarentena precios de carne fuera de un rango prudente", () => {
  assert.equal(isPlausibleMeatPrice(8_399), true);
  assert.equal(isPlausibleMeatPrice(525), false);
  assert.equal(isPlausibleMeatPrice(2_337), false);
});
