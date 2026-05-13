import type { SdkKey } from "../../../types";

type SdkKeyListProps = {
  isFetching: boolean;
  sdkKeys: SdkKey[];
};

export function SdkKeyList({ isFetching, sdkKeys }: SdkKeyListProps) {
  return (
    <div className="mt-4 grid gap-3">
      {sdkKeys.map((sdkKey) => (
        <div
          className="grid items-center gap-2 rounded-2xl bg-[#f4f0e8] p-4 text-sm text-slate-800 lg:grid-cols-[1.2fr_1fr_1fr_auto]"
          key={sdkKey.id}
        >
          <strong className="text-slate-900">{sdkKey.name}</strong>
          <span>{sdkKey.keyPrefix}...</span>
          <span>
            {sdkKey.config.name} / {sdkKey.environment.name}
          </span>
          <span>{sdkKey.revokedAt ? "revogada" : "ativa"}</span>
        </div>
      ))}
      {sdkKeys.length === 0 && !isFetching ? (
        <p className="text-sm text-stone-600">Sem SDK keys</p>
      ) : null}
    </div>
  );
}
