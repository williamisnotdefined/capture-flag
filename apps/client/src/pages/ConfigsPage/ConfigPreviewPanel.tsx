import { useGetConfigPreview } from "../../api/configs";
import { Button, ErrorMessage, Eyebrow, Panel } from "../../components";
import type { Config, Environment } from "../../types";
import { useClipboardMessage } from "../_shared/useClipboardMessage";

type ConfigPreviewPanelProps = {
  selectedConfig: Config | undefined;
  selectedEnvironment: Environment | undefined;
};

export function ConfigPreviewPanel({
  selectedConfig,
  selectedEnvironment,
}: ConfigPreviewPanelProps) {
  const previewQuery = useGetConfigPreview({
    configId: selectedConfig?.id ?? "",
    environmentId: selectedEnvironment?.id ?? "",
  });
  const clipboard = useClipboardMessage();
  const previewText = previewQuery.data
    ? JSON.stringify(previewQuery.data.body, null, 2)
    : "Selecione config e ambiente para visualizar o JSON.";

  async function copyPreview() {
    if (!previewQuery.data) {
      return;
    }

    await clipboard.copyText(previewText);
  }

  return (
    <Panel title="JSON Preview" wide>
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <Eyebrow>Config entregue ao SDK</Eyebrow>
          <p className="text-sm text-stone-600">
            {selectedConfig?.name ?? "Config"} / {selectedEnvironment?.name ?? "ambiente"}
          </p>
          {previewQuery.data ? (
            <p className="mt-1 break-all font-mono text-xs text-stone-500">
              ETag {previewQuery.data.etag}
            </p>
          ) : null}
        </div>
        <Button
          disabled={!previewQuery.data}
          onClick={copyPreview}
          type="button"
          variant="secondary"
        >
          {clipboard.copyMessage || "Copiar JSON"}
        </Button>
      </div>
      <ErrorMessage error={previewQuery.error} />
      <pre className="mt-4 max-h-96 overflow-auto rounded-2xl bg-slate-950 p-4 text-xs text-slate-100">
        {previewText}
      </pre>
      {previewQuery.isFetching ? (
        <p className="mt-3 text-sm text-stone-600">Atualizando preview...</p>
      ) : null}
    </Panel>
  );
}
