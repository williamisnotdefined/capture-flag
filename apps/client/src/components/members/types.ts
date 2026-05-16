export type MemberFormValues = {
  email?: string;
  userId?: string;
  role: string;
};

export type MemberTargetOption = {
  description?: string;
  label: string;
  value: string;
};

export type MemberListItem = {
  id: string;
  role: string;
  user: {
    id: string;
    name: string;
    email: string | null;
    avatarUrl: string | null;
  };
};
