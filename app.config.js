// EXPO_BASE_URL se setează doar la publicarea pe GitHub Pages (ex. /AM_Unghii)
module.exports = ({ config }) => ({
  ...config,
  experiments: { ...(config.experiments || {}), ...(process.env.EXPO_BASE_URL ? { baseUrl: process.env.EXPO_BASE_URL } : {}) },
});
