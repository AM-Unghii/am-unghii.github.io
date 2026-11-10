/** Versiunea aplicației; se mărește la fiecare livrare (vezi CHANGELOG.md). */
export const APP_VERSION = '1.5.2';
/** Commit-ul din care s-a construit versiunea web (pus de GitHub Actions); gol local. */
export const BUILD_ID = (process.env.EXPO_PUBLIC_COMMIT || '').slice(0, 7);
