import { Directory, File, Paths } from "expo-file-system";
import { Foto } from "@/types";

export const PHOTOS_DIRECTORY_NAME = "photos";

export function getPhotosDirectory(): Directory {
  return new Directory(Paths.document, PHOTOS_DIRECTORY_NAME);
}

export function ensurePhotosDirectory(): Directory {
  const dir = getPhotosDirectory();
  if (!dir.exists) {
    dir.create({ intermediates: true, idempotent: true });
  }
  return dir;
}

export function isPhotoInPersistentDirectory(uri: string): boolean {
  const photosDir = getPhotosDirectory();
  return uri.startsWith(photosDir.uri);
}

export async function persistPhotoFile(tempUri: string): Promise<string> {
  if (isPhotoInPersistentDirectory(tempUri)) {
    return tempUri;
  }

  const sourceFile = new File(tempUri);
  const photosDir = ensurePhotosDirectory();
  const ext = sourceFile.extension || "jpg";
  const sanitizedExt = ext.startsWith(".") ? ext.slice(1) : ext;
  const targetFile = new File(
    photosDir,
    `photo_${Date.now()}_${Math.random().toString(36).slice(2, 8)}.${sanitizedExt}`,
  );

  await sourceFile.copy(targetFile);

  return targetFile.uri;
}

export async function deletePhotoFile(fileUri: string): Promise<void> {
  const file = new File(fileUri);
  if (file.exists) {
    file.delete();
  }
}

export async function persistReportPhotos(photos: Foto[]): Promise<Foto[]> {
  return Promise.all(
    photos.map(async (foto) => ({
      ...foto,
      url: await persistPhotoFile(foto.url),
    })),
  );
}
