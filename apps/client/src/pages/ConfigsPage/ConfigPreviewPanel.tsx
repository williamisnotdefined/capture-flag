import { useGetConfigPreview } from "@api/configs";
import { Button } from "@components/Button";
import { ErrorMessage } from "@components/ErrorMessage";
import { Eyebrow } from "@components/Eyebrow";
import { Panel } from "@components/Panel";
import { useClipboardMessage } from "@core/hooks/useClipboardMessage";
import { formatJson } from "@core/json/formatJson";
import { useProjectResourcesRouteContext } from "@routing/useRouteContext";

export function ConfigPreviewPanel() {
  const { selectedConfig, selectedEnvironment } = useProjectResourcesRouteContext();
  const previewQuery = useGetConfigPreview({
    configId: selectedConfig?.id ?? "",
    environmentId: selectedEnvironment?.id ?? "",
  });
  const clipboard = useClipboardMessage({ successMessage: "JSON copiado." });
  const previewText = previewQuery.data
    ? formatJson(previewQuery.data.body)
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
          <p className="text-sm text-muted-foreground">
            {selectedConfig?.name ?? "Config"} / {selectedEnvironment?.name ?? "ambiente"}
          </p>
          {previewQuery.data ? (
            <p className="mt-1 break-all font-mono text-xs text-muted-foreground">
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
      <pre className="mt-4 max-h-96 overflow-auto rounded-lg border border-border bg-muted p-4 text-xs text-foreground">
        {previewText}
      </pre>
      {previewQuery.isFetching ? (
        <p className="mt-3 text-sm text-muted-foreground">Atualizando preview...</p>
      ) : null}
    </Panel>
  );
}
