let featuresCache: Record<string, boolean> | null = null;

export async function loadFeatures(): Promise<Record<string, boolean>> {
  if (featuresCache) return featuresCache;

  try {
    const response = await fetch("/features.json");
    if (response.ok) {
      featuresCache = await response.json();
      return featuresCache!;
    }
  } catch {
    // Features file not found, return defaults
  }

  featuresCache = {
    onlineOrdering: true,
    tableReservation: true,
    kitchenDisplay: false,
    inventoryManagement: false,
    loyaltyProgram: false,
    deliveryTracking: false,
  };

  return featuresCache;
}

export function isFeatureEnabled(featureName: string): boolean {
  if (!featuresCache) {
    // Return defaults if features haven't been loaded yet
    const defaults: Record<string, boolean> = {
      onlineOrdering: true,
      tableReservation: true,
      kitchenDisplay: false,
      inventoryManagement: false,
      loyaltyProgram: false,
      deliveryTracking: false,
    };
    return defaults[featureName] ?? false;
  }

  return featuresCache[featureName] ?? false;
}

export function resetFeaturesCache(): void {
  featuresCache = null;
}
