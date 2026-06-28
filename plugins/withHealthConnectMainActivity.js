const { withMainActivity, withAndroidManifest } = require('@expo/config-plugins');

const IMPORT_LINE = 'import dev.matinzd.healthconnect.permissions.HealthConnectPermissionDelegate';
const SET_DELEGATE_LINE = '    HealthConnectPermissionDelegate.setPermissionDelegate(this)';

const withHealthConnectMainActivityCode = (config) => {
  return withMainActivity(config, (config) => {
    let contents = config.modResults.contents;

    if (!contents.includes(IMPORT_LINE)) {
      contents = contents.replace(
        /(import expo\.modules\.ReactActivityDelegateWrapper)/,
        `${IMPORT_LINE}\n\n$1`
      );
    }

    if (!contents.includes('setPermissionDelegate')) {
      contents = contents.replace(
        /(super\.onCreate\(null\)\s*\n)/,
        `$1${SET_DELEGATE_LINE}\n`
      );
    }

    config.modResults.contents = contents;
    return config;
  });
};

// Required by Health Connect on Android 14+ so it knows this app is eligible
// to show the permission UI. Without it, the system silently finishes the
// permission request activity in a few ms and returns an empty grant set.
const withHealthConnectPermissionUsageIntent = (config) => {
  return withAndroidManifest(config, (config) => {
    const mainActivity = config.modResults.manifest.application[0].activity.find(
      (activity) => activity.$['android:name'] === '.MainActivity'
    );

    const alreadyAdded = mainActivity['intent-filter'].some((filter) =>
      filter.action?.some((a) => a.$['android:name'] === 'android.intent.action.VIEW_PERMISSION_USAGE')
    );

    if (!alreadyAdded) {
      mainActivity['intent-filter'].push({
        action: [{ $: { 'android:name': 'android.intent.action.VIEW_PERMISSION_USAGE' } }],
        category: [{ $: { 'android:name': 'android.intent.category.HEALTH_PERMISSIONS' } }],
      });
    }

    return config;
  });
};

const withHealthConnectMainActivity = (config) => {
  config = withHealthConnectMainActivityCode(config);
  config = withHealthConnectPermissionUsageIntent(config);
  return config;
};

module.exports = withHealthConnectMainActivity;
