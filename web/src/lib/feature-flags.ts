export interface FeatureFlags {
  rewards: boolean;
  fourthWall: boolean;
  aiDialogue: boolean;
  transitionGames: boolean;
  poStatusHud: boolean;
}

const DEFAULT_FLAGS: FeatureFlags = {
  rewards: false,
  fourthWall: false,
  aiDialogue: false,
  transitionGames: true,
  poStatusHud: true,
};

let _flags: FeatureFlags | null = null;
let _loading: Promise<FeatureFlags> | null = null;

export async function loadFlags(): Promise<FeatureFlags> {
  if (_flags) return _flags;
  if (_loading) return _loading;

  _loading = fetch("/config/flags.json")
    .then((res) => res.json())
    .then((data): FeatureFlags => {
      const flags: FeatureFlags = { ...DEFAULT_FLAGS, ...data.features };
      _flags = flags;
      return flags;
    })
    .catch((): FeatureFlags => {
      _flags = DEFAULT_FLAGS;
      return DEFAULT_FLAGS;
    });

  return _loading;
}

export function getFlag(key: keyof FeatureFlags): boolean {
  return (_flags ?? DEFAULT_FLAGS)[key];
}

export function getFlags(): FeatureFlags {
  return _flags ?? DEFAULT_FLAGS;
}
