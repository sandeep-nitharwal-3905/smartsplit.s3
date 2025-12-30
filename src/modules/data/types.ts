export interface Profile {
  id: string;
  email: string;
  name: string;
  createdAt?: string;
}

export interface Group {
  id: string;
  name: string;
  members: string[];
  createdBy: string;
  createdAt?: string;
}

export interface Expense {
  id: string;
  description: string;
  amount: number;
  paidBy: string;
  participants: string[];
  // In the new schema, expenses must always belong to a group,
  // but we keep the union type to avoid breaking existing UI code
  // that still treats personal (non-group) expenses specially.
  groupId: string | null;
  createdAt?: string;
  createdBy?: string;
  isSettlement?: boolean;
  splitAmounts?: Record<string, number> | null;
}

export interface Settlement {
  id: string;
  from: string;
  to: string;
  amount: number;
  groupId: string | null;
  settledAt?: string;
}
