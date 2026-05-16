import { Button } from "@components/Button";

type CreatedSdkKeyNoticeProps = {
  copyMessage: string;
  onCopy: () => void;
  publicConfigUrl: string;
  sdkKey: string;
};

export function CreatedSdkKeyNotice({
  copyMessage,
  onCopy,
  publicConfigUrl,
  sdkKey,
}: CreatedSdkKeyNoticeProps) {
  return (
    <div className="mt-4 grid gap-3 rounded-lg border border-primary/20 bg-primary p-3 text-primary-foreground">
      <span>Copie agora. A chave completa nao sera exibida novamente.</span>
      <code className="break-all">{sdkKey}</code>
      <span className="text-sm text-primary-foreground/80">Endpoint publico</span>
      <code className="break-all text-sm text-primary-foreground/90">{publicConfigUrl}</code>
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
        <Button onClick={onCopy} type="button" variant="secondary">
          Copiar
        </Button>
        {copyMessage ? (
          <span className="text-sm text-primary-foreground/80">{copyMessage}</span>
        ) : null}
      </div>
    </div>
  );
}
