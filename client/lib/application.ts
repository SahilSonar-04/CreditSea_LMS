const APPLICATION_ID_KEY = "creditsea_application_id";

export function saveApplicationId(id: string): void {
  localStorage.setItem(APPLICATION_ID_KEY, id);
}

export function getApplicationId(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem(APPLICATION_ID_KEY);
}

export function clearApplicationId(): void {
  localStorage.removeItem(APPLICATION_ID_KEY);
}
