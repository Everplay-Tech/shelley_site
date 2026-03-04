export interface UserPreferences {
  gamesEnabled: boolean;
}

export const DEFAULT_PREFERENCES: UserPreferences = {
  gamesEnabled: true,
};

export const PREFS_COOKIE = "shelley_prefs";
