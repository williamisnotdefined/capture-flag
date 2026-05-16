import cls from "classnames";
import { Button } from "../../../components";
import type { FeatureFlag } from "../../../types";
import { featureFlagStateLabels, getFeatureFlagOperationalState } from "./utils";

type FeatureFlagListProps = {
  canManageFeatureFlags: boolean;
  environmentId: string;
  flags: FeatureFlag[];
  isDeleting: boolean;
  isFetching: boolean;
  onDelete: (featureFlagId: string) => void;
  onSelect: (featureFlagId: string) => void;
  selectedFeatureFlagId: string;
};

export function FeatureFlagList({
  canManageFeatureFlags,
  environmentId,
  flags,
  isDeleting,
  isFetching,
  onDelete,
  onSelect,
  selectedFeatureFlagId,
}: FeatureFlagListProps) {
  return (
    <div className="grid gap-3 self-start">
      {flags.map((flag) => {
        const state = environmentId
          ? getFeatureFlagOperationalState(flag, environmentId)
          : "missing";
        const isSelected = flag.id === selectedFeatureFlagId;

        return (
          <div
            className={cls("grid gap-3 rounded-lg border p-3 text-sm lg:grid-cols-[1fr_auto]", {
              "border-slate-900 bg-slate-900 text-white": isSelected,
              "border-slate-200 bg-white text-slate-800 hover:bg-slate-50": !isSelected,
            })}
            key={flag.id}
          >
            <button className="text-left" onClick={() => onSelect(flag.id)} type="button">
              <div className="flex flex-wrap items-center gap-2">
                <strong className="block">{flag.name}</strong>
                <span
                  className={cls("rounded-md px-2 py-0.5 text-[0.68rem] font-medium uppercase", {
                    "bg-amber-100 text-amber-800": state === "missing",
                    "bg-emerald-100 text-emerald-800": state === "default",
                    "bg-indigo-100 text-indigo-800": state === "rules",
                    "bg-orange-100 text-orange-800": state === "rollout",
                  })}
                >
                  {featureFlagStateLabels[state]}
                </span>
              </div>
              <span className="block break-all font-mono text-xs">{flag.key}</span>
              <span className="block text-xs opacity-80">{flag.type}</span>
              {flag.tags.length > 0 ? (
                <span className="mt-2 flex flex-wrap gap-1">
                  {flag.tags.map((tag) => (
                    <span
                      className={cls("rounded-full px-2 py-0.5 text-[0.68rem] font-semibold", {
                        "bg-white/15 text-white": isSelected,
                        "bg-slate-100 text-slate-700": !isSelected,
                      })}
                      key={tag}
                    >
                      {tag}
                    </span>
                  ))}
                </span>
              ) : null}
            </button>
            <Button
              className="h-8 px-2"
              disabled={!canManageFeatureFlags || isDeleting}
              onClick={() => onDelete(flag.id)}
              type="button"
              variant="danger"
            >
              Apagar
            </Button>
          </div>
        );
      })}
      {flags.length === 0 && !isFetching ? (
        <p className="text-sm text-stone-600">Nenhuma flag encontrada nesta config.</p>
      ) : null}
      {isFetching ? <p className="text-sm text-stone-600">Atualizando flags...</p> : null}
    </div>
  );
}
