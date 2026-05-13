import { Button, Eyebrow } from "../../components/ui";
import type { MeResponse } from "../../types";

type SessionHeaderProps = {
  isLogoutPending: boolean;
  onLogout: () => void;
  user: MeResponse["user"];
};

export function SessionHeader({ isLogoutPending, onLogout, user }: SessionHeaderProps) {
  return (
    <header className="mb-4 flex flex-col justify-between gap-4 rounded-3xl border border-[#e3d8c7] bg-[#fffaf1] p-4 sm:flex-row sm:items-center">
      <div>
        <Eyebrow>Sessao</Eyebrow>
        <strong className="text-slate-900">{user.name}</strong>
      </div>
      <Button disabled={isLogoutPending} onClick={onLogout} type="button">
        Sair
      </Button>
    </header>
  );
}
