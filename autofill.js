/** Deterministic mock property data autofill. Swap in a real provider when ready. */
export async function autofillFromAddress({ address, city, state, zip }) {
  const seed = (address + zip).split('').reduce((a, c) => a + c.charCodeAt(0), 0);
  const rand = (min, max, offset = 0) =>
    min + Math.floor((((seed + offset * 7) % 1000) / 1000) * (max - min));
  const types = ['Single Family', 'Condo', 'Townhouse', 'Villa', 'Penthouse', 'Loft'];
  return {
    bedrooms: rand(2, 7, 1),
    bathrooms: rand(2, 6, 2),
    squareFeet: rand(1400, 6500, 3),
    lotSize: rand(0, 18000, 4),
    yearBuilt: rand(1965, 2024, 5),
    estimatedValue: rand(800_000, 9_800_000, 6),
    propertyType: types[rand(0, types.length, 7)],
    externalListingUrl: `https://www.zillow.com/homes/${encodeURIComponent(
      `${address} ${city} ${state}`,
    )}`,
  };
}
