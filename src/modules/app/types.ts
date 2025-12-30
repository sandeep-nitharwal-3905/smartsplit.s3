export interface User {
  id: string;
  email: string;
  name: string;
  createdAt: string;
}

export interface Group {
  id: string;
  name: string;
  members: string[];
  createdBy: string;
  createdAt: string;
}

export interface Expense {
  id: string;
  description: string;
  amount: number;
  paidBy: string;
  participants: string[];
  // DB now enforces group_id NOT NULL, but UI still
  // distinguishes group vs personal expenses using this field.
  groupId: string | null;
  createdAt: string;
  createdBy?: string;
  isSettlement?: boolean;
  splitAmounts?: Record<string, number>;
}

export interface Notification {
  id: string;
  message: string;
  type: 'expense' | 'settlement' | 'group';
  timestamp: number;
}
