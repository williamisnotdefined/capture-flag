import { useState } from "react";

export function useClipboardMessage() {
  const [copyMessage, setCopyMessage] = useState("");

  async function copyText(text: string) {
    try {
      await navigator.clipboard.writeText(text);
      setCopyMessage("Chave copiada.");
    } catch {
      setCopyMessage("Nao foi possivel copiar automaticamente.");
    }
  }

  return { copyMessage, copyText };
}
