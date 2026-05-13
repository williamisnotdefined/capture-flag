import type { UserSummary } from "../../../types";

type MemberListItem = {
  id: string;
  role: string;
  user: UserSummary;
};

type MemberListProps = {
  emptyMessage: string;
  members: MemberListItem[];
};

export function MemberList({ emptyMessage, members }: MemberListProps) {
  if (members.length === 0) {
    return <p className="mt-4 text-sm text-stone-600">{emptyMessage}</p>;
  }

  return (
    <div className="mt-4 grid gap-3">
      {members.map((member) => (
        <div className="rounded-2xl bg-[#f4f0e8] p-4 text-sm text-slate-800" key={member.id}>
          <strong className="block text-slate-900">{member.user.name}</strong>
          <span className="block">{member.user.email ?? member.user.id}</span>
          <span className="block font-semibold">{member.role}</span>
        </div>
      ))}
    </div>
  );
}
