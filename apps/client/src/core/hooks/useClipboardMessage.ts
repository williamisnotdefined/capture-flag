import { useState } from "react";

type UseClipboardMessageOptions = {
  errorMessage?: string;
  successMessage?: string;
};

export function useClipboardMessage({
  errorMessage = "Nao foi possivel copiar automaticamente.",
  successMessage = "Copiado.",
}: UseClipboardMessageOptions = {}) {
  const [copyMessage, setCopyMessage] = useState("");

  async function copyText(text: string) {
    try {
      await navigator.clipboard.writeText(text);
      setCopyMessage(successMessage);
    } catch {
      setCopyMessage(errorMessage);
    }
  }

  function clearCopyMessage() {
    setCopyMessage("");
  }

  return { clearCopyMessage, copyMessage, copyText };
}
