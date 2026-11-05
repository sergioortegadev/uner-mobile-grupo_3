/**
 * expo-notifications solo para Android.
 *
 * El plugin oficial agrega la entitlement `aps-environment` en iOS, que una cuenta gratuita de
 * Apple no puede firmar (la app no compilaría en un iPhone). Este plugin aplica solo la parte de
 * Android (ícono, color y canal por defecto) y deja iOS sin tocar.
 *
 * Se registra como "run once" con el nombre `expo-notifications`: así el plugin automático que
 * @expo/prebuild-config aplica a ese paquete (el oficial, con la parte de iOS) detecta que ya
 * corrió y se saltea. Verificado en expo-notifications ~57.0.24 (plugin/build/withNotifications.js).
 * Si se actualiza la librería, revisar que `withNotificationsAndroid` siga en esa ruta.
 */
const { createRunOncePlugin } = require("expo/config-plugins");
const { withNotificationsAndroid } = require("expo-notifications/plugin/build/withNotificationsAndroid");
const pkg = require("expo-notifications/package.json");

const withNotificationsAndroidOnly = (config, props) => withNotificationsAndroid(config, props || {});

module.exports = createRunOncePlugin(withNotificationsAndroidOnly, pkg.name, pkg.version);
