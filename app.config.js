// Disable EAS Update so the app never tries to download a remote update
// (avoids java.io.IOException: Failed to download remote update on Android)
const appJson = require('./app.json');
module.exports = {
  expo: {
    ...appJson.expo,
    updates: {
      enabled: false,
      checkAutomatically: 'NEVER',
    },
  },
};
