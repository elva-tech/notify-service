export interface PlaygroundBrandOption {
  brandId: string;
  brandName?: string;
  status?: string;
}

export function resolveBrandDisplayName(
  brands: PlaygroundBrandOption[],
  brandId: string,
): string {
  const normalized = brandId.trim().toLowerCase();
  const match = brands.find((brand) => brand.brandId.toLowerCase() === normalized);
  return match?.brandName?.trim() || '';
}

export function activePlaygroundBrands(
  brands: PlaygroundBrandOption[],
): PlaygroundBrandOption[] {
  return brands.filter((brand) => !brand.status || brand.status === 'active');
}
