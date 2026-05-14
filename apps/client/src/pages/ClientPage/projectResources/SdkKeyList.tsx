import { Button } from "../../../components";
import type { SdkKey } from "../../../types";

type SdkKeyListProps = {
  canManageProjectResources: boolean;
  isFetching: boolean;
  isMutating: boolean;
  onRevoke: (sdkKeyId: string) => void;
  onRotate: (sdkKeyId: string) => void;
  sdkKeys: SdkKey[];
};

export function SdkKeyList({
  canManageProjectResources,
  isFetching,
  isMutating,
  onRevoke,
  onRotate,
  sdkKeys,
}: SdkKeyListProps) {
  return (
    <div className="mt-4 grid gap-3">
      {sdkKeys.map((sdkKey) => (
        <div
          className="grid items-center gap-3 rounded-2xl bg-[#f4f0e8] p-4 text-sm text-slate-800 lg:grid-cols-[1.2fr_1fr_1fr_1fr_auto]"
          key={sdkKey.id}
        >
          <div>
            <strong className="block text-slate-900">{sdkKey.name}</strong>
            <span className="font-mono text-xs">{sdkKey.keyPrefix}...</span>
          </div>
          <span>
            {sdkKey.config.name} / {sdkKey.environment.name}
          </span>
          <span>
            <strong className="block">{sdkKey.revokedAt ? "revogada" : "ativa"}</strong>
            <span className="text-xs text-stone-600">
              Criada {formatDateTime(sdkKey.createdAt)}
            </span>
          </span>
          <span>
            <strong className="block">Ultimo uso</strong>
            <span className="text-xs text-stone-600">
              {sdkKey.lastUsedAt ? formatDateTime(sdkKey.lastUsedAt) : "nunca"}
            </span>
          </span>
          <div className="flex flex-wrap gap-2">
            <Button
              disabled={!canManageProjectResources || isMutating || Boolean(sdkKey.revokedAt)}
              onClick={() => onRotate(sdkKey.id)}
              type="button"
              variant="secondary"
            >
              Rotacionar
            </Button>
            <Button
              disabled={!canManageProjectResources || isMutating || Boolean(sdkKey.revokedAt)}
              onClick={() => onRevoke(sdkKey.id)}
              type="button"
              variant="danger"
            >
              Revogar
            </Button>
          </div>
        </div>
      ))}
      {sdkKeys.length === 0 && !isFetching ? (
        <p className="text-sm text-stone-600">Sem SDK keys</p>
      ) : null}
    </div>
  );
}

function formatDateTime(value: string) {
  return new Intl.DateTimeFormat("pt-BR", {
    dateStyle: "short",
    timeStyle: "short",
  }).format(new Date(value));
}
