import { Directory, File, Paths } from 'expo-file-system';

export const RECORDINGS_DIRECTORY_NAME = 'recordings';

export function getRecordingsDirectory(): Directory {
  return new Directory(Paths.document, RECORDINGS_DIRECTORY_NAME);
}

export function ensureRecordingsDirectory(): Directory {
  const dir = getRecordingsDirectory();
  if (!dir.exists) {
    dir.create({ intermediates: true, idempotent: true });
  }
  return dir;
}

export function isRecordingInPersistentDirectory(uri: string): boolean {
  const recordingsDir = getRecordingsDirectory();
  return uri.startsWith(recordingsDir.uri);
}

export async function persistAudioFile(uri: string): Promise<string | null> {
  if (!uri) return null;
  if (isRecordingInPersistentDirectory(uri)) return uri;
  const sourceFile = new File(uri);
  const recordingsDir = ensureRecordingsDirectory();
  const ext = sourceFile.extension || 'm4a';
  const sanitizedExt = ext.startsWith('.') ? ext.slice(1) : ext;
  const targetFile = new File(
    recordingsDir,
    `recording_${Date.now()}_${Math.random().toString(36).slice(2, 8)}.${sanitizedExt}`,
  );

  await sourceFile.copy(targetFile);

  // Limpieza: se elimina el archivo temporal para no duplicar espacio.
  // Si el borrado falla, no abortamos el flujo porque el guardado  fue exitoso
  if (sourceFile.exists && sourceFile.uri !== targetFile.uri) {
    try {
      sourceFile.delete();
    } catch {}
  }

  return targetFile.uri;
}

export async function deleteAudioFile(fileUri: string): Promise<void> {
  const file = new File(fileUri);
  if (file.exists) {
    file.delete();
  }
}
