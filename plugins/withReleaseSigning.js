const { withAppBuildGradle } = require('@expo/config-plugins');

// Senhas ficam em ~/.gradle/gradle.properties (fora do repo). Sem elas, o release cai na chave debug.
const RELEASE_SIGNING = `
        release {
            if (project.hasProperty('APSICARE_UPLOAD_STORE_FILE')) {
                storeFile file(APSICARE_UPLOAD_STORE_FILE)
                storePassword APSICARE_UPLOAD_STORE_PASSWORD
                keyAlias APSICARE_UPLOAD_KEY_ALIAS
                keyPassword APSICARE_UPLOAD_KEY_PASSWORD
            }
        }`;

module.exports = (config) =>
  withAppBuildGradle(config, (config) => {
    let gradle = config.modResults.contents;
    if (!gradle.includes('APSICARE_UPLOAD_STORE_FILE')) {
      gradle = gradle.replace(/(signingConfigs\s*\{\s*debug\s*\{[^}]*\})/, `$1${RELEASE_SIGNING}`);
      gradle = gradle.replace(
        /(buildTypes\s*\{[\s\S]*?release\s*\{[\s\S]*?)signingConfig signingConfigs\.debug/,
        "$1signingConfig project.hasProperty('APSICARE_UPLOAD_STORE_FILE') ? signingConfigs.release : signingConfigs.debug"
      );
    }
    config.modResults.contents = gradle;
    return config;
  });
