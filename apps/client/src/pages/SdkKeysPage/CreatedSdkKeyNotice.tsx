import { Button } from "@components/Button";

type CreatedSdkKeyNoticeProps = {
  onCopyPublicConfigUrl: () => void;
  onCopySdkKey: () => void;
  publicConfigUrl: string;
  publicConfigUrlCopyMessage: string;
  sdkKey: string;
  sdkKeyCopyMessage: string;
};

export function CreatedSdkKeyNotice({
  onCopyPublicConfigUrl,
  onCopySdkKey,
  publicConfigUrl,
  publicConfigUrlCopyMessage,
  sdkKey,
  sdkKeyCopyMessage,
}: CreatedSdkKeyNoticeProps) {
  return (
    <div className="mt-4 grid gap-3 rounded-lg border border-primary/20 bg-primary p-3 text-primary-foreground">
      <span>Copie agora. A chave completa nao sera exibida novamente.</span>
      <code className="break-all">{sdkKey}</code>
      <span className="text-sm text-primary-foreground/80">Endpoint publico</span>
      <code className="break-all text-sm text-primary-foreground/90">{publicConfigUrl}</code>
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
        <Button onClick={onCopySdkKey} type="button" variant="secondary">
          Copiar chave
        </Button>
        <Button onClick={onCopyPublicConfigUrl} type="button" variant="secondary">
          Copiar URL
        </Button>
        {sdkKeyCopyMessage ? (
          <span className="text-sm text-primary-foreground/80">{sdkKeyCopyMessage}</span>
        ) : null}
        {publicConfigUrlCopyMessage ? (
          <span className="text-sm text-primary-foreground/80">{publicConfigUrlCopyMessage}</span>
        ) : null}
      </div>
    </div>
  );
}
