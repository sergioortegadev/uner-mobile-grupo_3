import { getQrValue } from "@/helpers/qr";
import { useCallback, useState } from "react";

/** Controla el modal del QR: `open(id)` lo muestra con el texto del id, `close` lo cierra. */
export function useQrModal() {
  const [value, setValue] = useState<string | null>(null);

  const open = useCallback((reportId: string) => setValue(getQrValue(reportId)), []);
  const close = useCallback(() => setValue(null), []);

  return { open, close, modalProps: { value, onClose: close } };
}
