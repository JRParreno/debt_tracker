export type DebtType =
  | "bnpl"
  | "utility"
  | "loan"
  | "credit_card"
  | "subscription"
  | "rent"
  | "other";

export type OccurrenceStatus = "paid" | "pending" | "overdue";

export type PayFrequency = "monthly" | "semi_monthly";

export type CardType = "credit_card" | "debit_card" | "online_card";

export interface PaymentCard {
  id: number;
  nickname: string;
  card_type: CardType;
  credit_limit: number | null;
  balance: number;
  minimum_due: number | null;
  due_day: number | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface CardCreate {
  nickname: string;
  card_type: CardType;
  credit_limit?: number | null;
  balance?: number;
  minimum_due?: number | null;
  due_day?: number | null;
}

export interface CardUpdate {
  nickname?: string;
  card_type?: CardType;
  credit_limit?: number | null;
  balance?: number;
  minimum_due?: number | null;
  due_day?: number | null;
}

export const CARD_TYPE_LABELS: Record<CardType, string> = {
  credit_card: "Credit card",
  debit_card: "Debit card",
  online_card: "Online wallet",
};

export interface Debt {
  id: number;
  name: string;
  type: DebtType;
  amount: number;
  due_day: number;
  is_active: boolean;
  notes: string | null;
  start_date: string;
  end_date: string | null;
  credit_limit: number | null;
  statement_balance: number | null;
  minimum_due: number | null;
  payment_card_id: number | null;
  created_at: string;
}

export interface DebtCreate {
  name: string;
  type: DebtType;
  amount: number;
  due_day: number;
  notes?: string | null;
  start_date?: string | null;
  end_date?: string | null;
  total_installments?: number | null;
  installments_paid?: number | null;
  credit_limit?: number | null;
  statement_balance?: number | null;
  minimum_due?: number | null;
  payment_card_id?: number | null;
  paid_this_month?: number | null;
}

export interface DebtUpdate {
  name?: string;
  type?: DebtType;
  amount?: number;
  due_day?: number;
  notes?: string | null;
  start_date?: string | null;
  end_date?: string | null;
  total_installments?: number | null;
  credit_limit?: number | null;
  statement_balance?: number | null;
  minimum_due?: number | null;
  payment_card_id?: number | null;
}

export interface Occurrence {
  id: number;
  debt_id: number;
  debt_name: string;
  debt_type: DebtType;
  year: number;
  month: number;
  due_date: string;
  amount: number;
  scheduled_amount: number;
  statement_balance: number | null;
  minimum_due: number | null;
  credit_limit: number | null;
  is_paid: boolean;
  paid_at: string | null;
  status: OccurrenceStatus;
}

export interface IncomeSettings {
  id: number;
  pay_frequency: PayFrequency;
  monthly_amount: number | null;
  pay_day: number | null;
  cutoff_1_day: number | null;
  cutoff_1_amount: number | null;
  cutoff_2_day: number | null;
  cutoff_2_amount: number | null;
  updated_at: string;
}

export interface MonthlySummaryItem {
  year: number;
  month: number;
  total: number;
  paid: number;
  unpaid: number;
}

export interface CurrentSummary {
  year: number;
  month: number;
  total: number;
  paid: number;
  unpaid: number;
  pending_count: number;
  overdue_count: number;
  total_income: number;
  surplus: number;
}

export interface StrategyDebtItem {
  id: number;
  name: string;
  amount: number;
  due_date: string;
}

export interface StrategyPeriod {
  label: string;
  income: number;
  debts_due: number;
  remaining: number;
  debts: StrategyDebtItem[];
}

export interface StrategySummary {
  year: number;
  month: number;
  total_income: number;
  total_debt_unpaid: number;
  surplus: number;
  periods: StrategyPeriod[];
}

export const DEBT_TYPE_LABELS: Record<DebtType, string> = {
  bnpl: "BNPL",
  utility: "Utility",
  loan: "Loan",
  credit_card: "Credit Card",
  subscription: "Subscription",
  rent: "Rent",
  other: "Other",
};
