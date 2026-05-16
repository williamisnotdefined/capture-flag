import {
  Button,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "../../components";
import { formatDateTime } from "../../core/date/formatDateTime";
import type { SdkKey } from "../../types";

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
  if (sdkKeys.length === 0 && !isFetching) {
    return <p className="mt-4 text-sm text-stone-600">Sem SDK keys</p>;
  }

  return (
    <div className="mt-4 rounded-md border border-slate-200 bg-white">
      <Table>
        <TableHeader>
          <TableRow className="hover:bg-transparent">
            <TableHead>SDK Key</TableHead>
            <TableHead>Config / ambiente</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Ultimo uso</TableHead>
            <TableHead className="text-right">Acoes</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {sdkKeys.map((sdkKey) => (
            <TableRow className="text-slate-800" key={sdkKey.id}>
              <TableCell className="min-w-48">
                <strong className="block text-slate-900">{sdkKey.name}</strong>
                <span className="font-mono text-xs text-slate-500">{sdkKey.keyPrefix}...</span>
              </TableCell>
              <TableCell className="min-w-48">
                {sdkKey.config.name} / {sdkKey.environment.name}
              </TableCell>
              <TableCell>
                <span className="block font-medium">{sdkKey.revokedAt ? "revogada" : "ativa"}</span>
                <span className="text-xs text-stone-600">
                  Criada {formatDateTime(sdkKey.createdAt)}
                </span>
              </TableCell>
              <TableCell>
                {sdkKey.lastUsedAt ? formatDateTime(sdkKey.lastUsedAt) : "nunca"}
              </TableCell>
              <TableCell>
                <div className="flex justify-end gap-2">
                  <Button
                    className="h-8 px-2"
                    disabled={!canManageProjectResources || isMutating || Boolean(sdkKey.revokedAt)}
                    onClick={() => onRotate(sdkKey.id)}
                    type="button"
                    variant="secondary"
                  >
                    Rotacionar
                  </Button>
                  <Button
                    className="h-8 px-2"
                    disabled={!canManageProjectResources || isMutating || Boolean(sdkKey.revokedAt)}
                    onClick={() => onRevoke(sdkKey.id)}
                    type="button"
                    variant="danger"
                  >
                    Revogar
                  </Button>
                </div>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
