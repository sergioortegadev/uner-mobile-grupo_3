// La tarea de background tiene que definirse durante la evaluación del bundle, antes de
// que expo-router cargue las rutas de forma diferida: en un arranque headless no se
// renderiza nada, así que un `defineTask` colgado de app/_layout.tsx nunca se ejecuta y
// React Native avisa "No task registered for key expo-task-manager".
import './src/services/background-sync';
import 'expo-router/entry';
