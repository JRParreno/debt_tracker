import demoJson from "@/data/demo.json";
import type {
  CurrentSummary,
  DebtType,
  IncomeSettings,
  MonthlySummaryItem,
  Occurrence,
  OccurrenceStatus,
  PaymentCard,
  StrategyDebtItem,
  StrategySummary,
} from "@/lib/types";

export interface DemoDataset {
  asOfDate: string;
  defaultYear: number;
  defaultMonth: number;
  income: IncomeSettings;
  cards: PaymentCard[];
  occurrences: Occurrence[];
  monthlyHistory: MonthlySummaryItem[];
}

export function getDemoDataset(): DemoDataset {
  return demoJson as DemoDataset;
}

export function cloneOccurrences(occurrences: Occurrence[]): Occurrence[] {
  return occurrences.map((o) => ({ ...o }));
}

function asOfDate(): Date {
  return new Date(getDemoDataset().asOfDate + "T12:00:00");
}

export function refreshOccurrenceStatus(occ: Occurrence): Occurrence {
  const asOf = asOfDate();
  let status: OccurrenceStatus = "pending";
  if (occ.is_paid) status = "paid";
  else if (new Date(occ.due_date + "T12:00:00") < asOf) status = "overdue";
  return { ...occ, status };
}

export function filterOccurrences(
  occurrences: Occurrence[],
  year: number,
  month: number,
  statusFilter: OccurrenceStatus | "all",
  typeFilter: DebtType | "all"
): Occurrence[] {
  return occurrences
    .filter((o) => o.year === year && o.month === month)
    .map(refreshOccurrenceStatus)
    .filter((o) => (statusFilter === "all" ? true : o.status === statusFilter))
    .filter((o) => (typeFilter === "all" ? true : o.debt_type === typeFilter))
    .sort((a, b) => a.due_date.localeCompare(b.due_date));
}

export function computeCurrentSummary(
  occurrences: Occurrence[],
  income: IncomeSettings,
  year: number,
  month: number
): CurrentSummary {
  const rows = occurrences
    .filter((o) => o.year === year && o.month === month)
    .map(refreshOccurrenceStatus);

  const total = rows.reduce((s, r) => s + r.amount, 0);
  const paid = rows.filter((r) => r.is_paid).reduce((s, r) => s + r.amount, 0);
  const pending_count = rows.filter((r) => r.status === "pending").length;
  const overdue_count = rows.filter((r) => r.status === "overdue").length;

  const total_income =
    income.pay_frequency === "monthly"
      ? income.monthly_amount ?? 0
      : (income.cutoff_1_amount ?? 0) + (income.cutoff_2_amount ?? 0);

  return {
    year,
    month,
    total,
    paid,
    unpaid: total - paid,
    pending_count,
    overdue_count,
    total_income,
    surplus: total_income - (total - paid),
  };
}

export function computeStrategy(
  occurrences: Occurrence[],
  income: IncomeSettings,
  year: number,
  month: number
): StrategySummary {
  const unpaid = occurrences
    .filter((o) => o.year === year && o.month === month && !o.is_paid)
    .map(refreshOccurrenceStatus);

  const total_debt_unpaid = unpaid.reduce((s, o) => s + o.amount, 0);

  const toDebtItem = (o: Occurrence): StrategyDebtItem => ({
    id: o.id,
    name: o.debt_name,
    amount: o.amount,
    due_date: o.due_date,
  });

  if (income.pay_frequency === "monthly") {
    const total_income = income.monthly_amount ?? 0;
    return {
      year,
      month,
      total_income,
      total_debt_unpaid,
      surplus: total_income - total_debt_unpaid,
      periods: [
        {
          label: `Monthly (day ${income.pay_day ?? 15})`,
          income: total_income,
          debts_due: total_debt_unpaid,
          remaining: total_income - total_debt_unpaid,
          debts: unpaid
            .sort((a, b) => a.due_date.localeCompare(b.due_date))
            .map(toDebtItem),
        },
      ],
    };
  }

  const cutoff1 = income.cutoff_1_day ?? 15;
  const cutoff2 = income.cutoff_2_day ?? 28;
  const income1 = income.cutoff_1_amount ?? 0;
  const income2 = income.cutoff_2_amount ?? 0;
  const total_income = income1 + income2;

  const bucket1 = unpaid.filter((o) => {
    const day = parseInt(o.due_date.slice(8, 10), 10);
    return day <= cutoff1;
  });
  const bucket2 = unpaid.filter((o) => {
    const day = parseInt(o.due_date.slice(8, 10), 10);
    return day > cutoff1;
  });

  const due1 = bucket1.reduce((s, o) => s + o.amount, 0);
  const due2 = bucket2.reduce((s, o) => s + o.amount, 0);

  return {
    year,
    month,
    total_income,
    total_debt_unpaid,
    surplus: total_income - total_debt_unpaid,
    periods: [
      {
        label: `Cutoff 1 (day ${cutoff1})`,
        income: income1,
        debts_due: due1,
        remaining: income1 - due1,
        debts: bucket1
          .sort((a, b) => a.due_date.localeCompare(b.due_date))
          .map(toDebtItem),
      },
      {
        label: `Cutoff 2 (day ${cutoff2})`,
        income: income2,
        debts_due: due2,
        remaining: income2 - due2,
        debts: bucket2
          .sort((a, b) => a.due_date.localeCompare(b.due_date))
          .map(toDebtItem),
      },
    ],
  };
}

export function recomputeMonthlyHistory(
  occurrences: Occurrence[],
  baseHistory: MonthlySummaryItem[]
): MonthlySummaryItem[] {
  const byKey = new Map(
    baseHistory.map((h) => [`${h.year}-${h.month}`, { ...h }])
  );

  const groups = new Map<string, Occurrence[]>();
  for (const occ of occurrences.map(refreshOccurrenceStatus)) {
    const key = `${occ.year}-${occ.month}`;
    if (!groups.has(key)) groups.set(key, []);
    groups.get(key)!.push(occ);
  }

  for (const [key, rows] of groups) {
    const total = rows.reduce((s, r) => s + r.amount, 0);
    const paid = rows.filter((r) => r.is_paid).reduce((s, r) => s + r.amount, 0);
    const existing = byKey.get(key);
    if (existing) {
      existing.total = total;
      existing.paid = paid;
      existing.unpaid = total - paid;
    }
  }

  return Array.from(byKey.values()).sort((a, b) =>
    a.year !== b.year ? a.year - b.year : a.month - b.month
  );
}
