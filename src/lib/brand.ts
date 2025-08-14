export interface BrandConfig {
  name: string;
  logo?: string;
  primaryColor?: string;
  description?: string;
}

export const DEFAULT_BRAND: BrandConfig = {
  name: 'JSX-ReceptionAI',
  primaryColor: '#f97316', // orange-500
  description: 'AI-Powered Call Center Automation',
};

export const getBrandConfig = (): BrandConfig => {
  const brandName = process.env.NEXT_PUBLIC_BRAND_NAME || DEFAULT_BRAND.name;
  const brandLogo = process.env.NEXT_PUBLIC_BRAND_LOGO || DEFAULT_BRAND.logo;
  const brandColor =
    process.env.NEXT_PUBLIC_BRAND_PRIMARY_COLOR || DEFAULT_BRAND.primaryColor;
  const brandDescription =
    process.env.NEXT_PUBLIC_BRAND_DESCRIPTION || DEFAULT_BRAND.description;

  return {
    name: brandName,
    logo: brandLogo,
    primaryColor: brandColor,
    description: brandDescription,
  };
};

export const useBrand = () => {
  return getBrandConfig();
};
