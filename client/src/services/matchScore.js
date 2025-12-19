// backend/src/services/matchScore.js
export function calculateMatchScore(userA, userB) {
  // ===== GENRES (50%) =====
  const genresA = new Set(userA.genres || []);
  const genresB = new Set(userB.genres || []);

  const genreIntersection = [...genresA].filter((g) => genresB.has(g));
  const genreUnion = new Set([...genresA, ...genresB]);

  const genreScore =
    genreUnion.size === 0 ? 0 : genreIntersection.length / genreUnion.size;

  // ===== ARTISTS (30%) =====
  const artistsA = new Set((userA.topArtists || []).map((a) => a.id || a));
  const artistsB = new Set((userB.topArtists || []).map((a) => a.id || a));

  const artistIntersection = [...artistsA].filter((a) => artistsB.has(a));
  const artistScore =
    Math.max(artistsA.size, artistsB.size) === 0
      ? 0
      : artistIntersection.length / Math.max(artistsA.size, artistsB.size);

  // ===== AUDIO FEATURES (20%) =====
  const fa = userA.audioFeatures || {};
  const fb = userB.audioFeatures || {};

  const normTempoA = fa.tempo != null ? fa.tempo / 200 : 0;
  const normTempoB = fb.tempo != null ? fb.tempo / 200 : 0;

  const diffs = [
    Math.abs((fa.danceability ?? 0) - (fb.danceability ?? 0)),
    Math.abs((fa.energy ?? 0) - (fb.energy ?? 0)),
    Math.abs(normTempoA - normTempoB),
    Math.abs((fa.valence ?? 0) - (fb.valence ?? 0)),
  ];

  const avgDiff = diffs.reduce((a, b) => a + b, 0) / diffs.length;
  const audioScore = 1 - avgDiff;

  // ===== FINAL SCORE 0..100 =====
  const score = genreScore * 50 + artistScore * 30 + audioScore * 20;
  return Math.round(score);
}
