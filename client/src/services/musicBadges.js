const GENRE_MAP = [
  { label: 'Pop', keywords: ['pop'] },
  { label: 'Hip Hop', keywords: ['hip hop', 'rap', 'trap', 'drill'] },
  { label: 'R&B', keywords: ['r&b', 'rnb', 'neo soul', 'rhythm and blues'] },
  { label: 'EDM', keywords: ['edm', 'electronic', 'house', 'techno', 'trance', 'dubstep', 'dnb', 'drum and bass'] },
  { label: 'Rock', keywords: ['rock', 'alternative', 'garage', 'grunge'] },
  { label: 'Metal', keywords: ['metal', 'metalcore', 'deathcore', 'hardcore'] },
  { label: 'Indie', keywords: ['indie'] },
  { label: 'Jazz', keywords: ['jazz', 'bebop', 'swing'] },
  { label: 'Classical', keywords: ['classical', 'orchestra', 'opera', 'baroque'] },
  { label: 'Country', keywords: ['country', 'bluegrass', 'americana'] },
  { label: 'Latin', keywords: ['latin', 'reggaeton', 'salsa', 'bachata', 'cumbia'] },
  { label: 'Soul', keywords: ['soul', 'motown'] },
  { label: 'Funk', keywords: ['funk', 'boogie'] },
  { label: 'Reggae', keywords: ['reggae', 'dancehall', 'dub', 'ska'] },
  { label: 'Folk', keywords: ['folk', 'singer-songwriter'] },
  { label: 'Punk', keywords: ['punk', 'emo', 'screamo'] },
  { label: 'K-Pop', keywords: ['k-pop', 'kpop'] },
  { label: 'Afrobeats', keywords: ['afrobeat', 'afrobeats', 'afropop'] },
];

const BADGE_VARIANTS = {
  chill: {
    label: 'Chill',
    suffix: 'Chill',
    tone: 'chill',
  },
  beast: {
    label: 'Beast',
    suffix: 'Beast',
    tone: 'beast',
  },
  vibe: {
    label: 'Vibe',
    suffix: 'Vibe',
    tone: 'vibe',
  },
};

const toTitleCase = (value) =>
  String(value || '')
    .toLowerCase()
    .split(/[\s/_-]+/)
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(' ');

export const simplifyGenreLabel = (genre) => {
  const lower = String(genre || '').trim().toLowerCase();
  if (!lower) return null;

  const mapped = GENRE_MAP.find(({ keywords }) =>
    keywords.some((keyword) => lower.includes(keyword)));
  if (mapped) return mapped.label;

  return toTitleCase(lower);
};

export const getMusicMoodDetails = (audioFeatures = {}) => {
  const danceability = Number(audioFeatures?.danceability);
  const energy = Number(audioFeatures?.energy);

  if (!Number.isFinite(danceability) || !Number.isFinite(energy)) {
    return {
      key: 'vibe',
      label: BADGE_VARIANTS.vibe.label,
      rule: 'Fallback when audio data is incomplete',
      description: 'Spotify has no full danceability and energy snapshot yet, so the mixed Vibe variant is used.',
      danceability: null,
      energy: null,
    };
  }

  if (danceability < 0.45 && energy < 0.45) {
    return {
      key: 'chill',
      label: BADGE_VARIANTS.chill.label,
      rule: 'Danceability under 45% and energy under 45%',
      description: 'Both values are low, so your genres get the calmer Chill variant.',
      danceability,
      energy,
    };
  }

  if (danceability > 0.62 && energy > 0.62) {
    return {
      key: 'beast',
      label: BADGE_VARIANTS.beast.label,
      rule: 'Danceability above 62% and energy above 62%',
      description: 'Both values are high, so your genres get the high-intensity Beast variant.',
      danceability,
      energy,
    };
  }

  return {
    key: 'vibe',
    label: BADGE_VARIANTS.vibe.label,
    rule: 'Mixed or mid-range danceability and energy values',
    description: 'Your audio profile sits between calm and high-energy extremes, so the balanced Vibe variant is used.',
    danceability,
    energy,
  };
};

export const detectMusicMood = (audioFeatures = {}) => getMusicMoodDetails(audioFeatures).key;

export const buildMusicBadges = (profile = {}, limit = 3) => {
  const genres = Array.isArray(profile?.genres) ? profile.genres : [];
  const moodDetails = getMusicMoodDetails(profile?.audioFeatures);
  const variant = BADGE_VARIANTS[moodDetails.key];
  const danceability = Number(profile?.audioFeatures?.danceability);
  const energy = Number(profile?.audioFeatures?.energy);
  const seen = new Set();

  return genres
    .map(simplifyGenreLabel)
    .filter(Boolean)
    .filter((genre) => {
      if (seen.has(genre)) return false;
      seen.add(genre);
      return true;
    })
    .slice(0, limit)
    .map((genre, index) => ({
      id: `${genre}-${moodDetails.key}-${index}`,
      genre,
      title: `${genre} ${variant.suffix}`,
      mood: moodDetails.key,
      moodLabel: moodDetails.label,
      tone: variant.tone,
      rule: moodDetails.rule,
      description: moodDetails.description,
      danceability: Number.isFinite(danceability) ? danceability : null,
      energy: Number.isFinite(energy) ? energy : null,
    }));
};
