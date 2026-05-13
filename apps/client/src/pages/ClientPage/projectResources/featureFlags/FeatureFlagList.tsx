import cls from "classnames";
import { Button } from "../../../../components";
import type { FeatureFlag } from "../../../../types";

type FeatureFlagListProps = {
  canManageFeatureFlags: boolean;
  flags: FeatureFlag[];
  isDeleting: boolean;
  isFetching: boolean;
  onDelete: (featureFlagId: string) => void;
  onSelect: (featureFlagId: string) => void;
  selectedFeatureFlagId: string;
};

export function FeatureFlagList({
  canManageFeatureFlags,
  flags,
  isDeleting,
  isFetching,
  onDelete,
  onSelect,
  selectedFeatureFlagId,
}: FeatureFlagListProps) {
  return (
    <div className="grid gap-3 self-start">
      {flags.map((flag) => (
        <div
          className={cls("grid gap-3 rounded-2xl p-4 text-sm lg:grid-cols-[1fr_auto]", {
            "bg-slate-900 text-white": flag.id === selectedFeatureFlagId,
            "bg-[#f4f0e8] text-slate-800": flag.id !== selectedFeatureFlagId,
          })}
          key={flag.id}
        >
          <button className="text-left" onClick={() => onSelect(flag.id)} type="button">
            <strong className="block">{flag.name}</strong>
            <span className="block break-all font-mono text-xs">{flag.key}</span>
            <span className="block text-xs opacity-80">{flag.type}</span>
          </button>
          <Button
            disabled={!canManageFeatureFlags || isDeleting}
            onClick={() => onDelete(flag.id)}
            type="button"
            variant="danger"
          >
            Apagar
          </Button>
        </div>
      ))}
      {flags.length === 0 && !isFetching ? (
        <p className="text-sm text-stone-600">Sem flags nesta config.</p>
      ) : null}
      {isFetching ? <p className="text-sm text-stone-600">Atualizando flags...</p> : null}
    </div>
  );
}
