const { withMainActivity, withAndroidManifest } = require('@expo/config-plugins');

const IMPORT_LINE = 'import dev.matinzd.healthconnect.permissions.HealthConnectPermissionDelegate';
const SET_DELEGATE_LINE = '    HealthConnectPermissionDelegate.setPermissionDelegate(this)';

// O link "política de privacidade" do Health Connect abre a MainActivity com uma dessas actions;
// trocamos pelo deep link apsicare://privacidade, que o app abre na tela DocumentoLegal.
const PRIVACY_IMPORTS = 'import android.content.Intent\nimport android.net.Uri';
const PRIVACY_HELPER = `
  private fun redirecionarPoliticaHealthConnect(intent: Intent?) {
    val acao = intent?.action ?: return
    if (acao == "androidx.health.ACTION_SHOW_PERMISSIONS_RATIONALE" || acao == "android.intent.action.VIEW_PERMISSION_USAGE") {
      intent.data = Uri.parse("apsicare://privacidade")
    }
  }

  override fun onNewIntent(intent: Intent) {
    redirecionarPoliticaHealthConnect(intent)
    super.onNewIntent(intent)
  }
`;

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

    if (!contents.includes('import android.net.Uri')) {
      contents = contents.replace(/(import android\.os\.Bundle)/, `$1\n${PRIVACY_IMPORTS}`);
    }
    if (!contents.includes('private fun redirecionarPoliticaHealthConnect')) {
      contents = contents.replace(/(class MainActivity : ReactActivity\(\) \{\r?\n)/, `$1${PRIVACY_HELPER}`);
    }
    if (!/redirecionarPoliticaHealthConnect\(intent\)\s*\r?\n\s*(\/\/ )?setTheme/.test(contents)) {
      contents = contents.replace(
        /(\r?\n(\s*)(\/\/ )?setTheme\(R\.style\.AppTheme\);?)/,
        '\n$2redirecionarPoliticaHealthConnect(intent)$1'
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
