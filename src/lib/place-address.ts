export type PlaceAddressComponent = {
  types?: string[] | null;
  longText?: string | null;
  shortText?: string | null;
};

export function resolvePlaceAddress(
  components: Array<PlaceAddressComponent | null> | null | undefined,
  fallback: { city: string; state: string; country: string },
) {
  const find = (type: string) =>
    components?.find((component) =>
      Array.isArray(component?.types) && component.types.includes(type),
    );

  return {
    city: find("administrative_area_level_2")?.longText ?? find("locality")?.longText ?? fallback.city,
    state: find("administrative_area_level_1")?.shortText ?? fallback.state,
    country: find("country")?.longText ?? fallback.country,
  };
}