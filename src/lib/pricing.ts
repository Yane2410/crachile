import type { Ingredient, PublicSettings } from "./types";

export function priceCustomEmpanada(
  selectedIds: string[],
  ingredients: Ingredient[],
  settings: PublicSettings,
): number {
  const count = selectedIds.length;
  if (count < 1 || count > 3) return 0;
  const base =
    count === 1
      ? settings.empanada1
      : count === 2
        ? settings.empanada2
        : settings.empanada3;
  let premium = 0;
  for (const id of selectedIds) {
    const ing = ingredients.find((i) => i.id === id);
    if (ing?.premium) premium += settings.empanadaPremium;
  }
  return base + premium;
}

export function priceCustomFajita(
  selectedIds: string[],
  ingredients: Ingredient[],
  settings: PublicSettings,
): number {
  if (selectedIds.length < 1 || selectedIds.length > 8) return 0;
  let total = settings.fajitaBase;
  for (const id of selectedIds) {
    const ing = ingredients.find((i) => i.id === id);
    if (ing) total += ing.fajitaPrice;
  }
  return total;
}
