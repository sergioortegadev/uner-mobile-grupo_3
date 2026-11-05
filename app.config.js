// Parte de app.json. Solo reemplaza el plugin `expo-notifications` por una versión que no toca
// iOS (ver plugins/with-notifications-android-only.js). Con ENABLE_IOS_PUSH=true se usa el plugin
// oficial completo (requiere cuenta Apple Developer paga).
module.exports = ({ config }) => {
  if (process.env.ENABLE_IOS_PUSH === "true") return config;

  const nombreDe = (plugin) => (Array.isArray(plugin) ? plugin[0] : plugin);
  const plugins = (config.plugins ?? []).map((plugin) =>
    nombreDe(plugin) === "expo-notifications"
      ? ["./plugins/with-notifications-android-only", Array.isArray(plugin) ? plugin[1] : {}]
      : plugin,
  );
  return { ...config, plugins };
};
