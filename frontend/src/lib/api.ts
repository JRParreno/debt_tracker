import type {
  CardCreate,
  CardUpdate,
  CurrentSummary,
  Debt,
  DebtCreate,
  DebtUpdate,
  IncomeSettings,
  MonthlySummaryItem,
  Occurrence,
  OccurrenceStatus,
  PaymentCard,
  StrategySummary,
} from "./types";

function getApiUrl(): string {
  if (typeof window !== "undefined") {
    return `http://${window.location.hostname}:8000`;
  }
  return process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";
}

async function request<T>(path: string, options?: RequestInit): Promise<T> {
  const res = await fetch(`${getApiUrl()}${path}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...options?.headers,
    },
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(text || `Request failed: ${res.status}`);
  }

  if (res.status === 204) {
    return undefined as T;
  }

  return res.json();
}

export const api = {
  getDebts: () => request<Debt[]>("/debts"),

  createDebt: (data: DebtCreate) =>
    request<Debt>("/debts", { method: "POST", body: JSON.stringify(data) }),

  getDebt: (id: number) => request<Debt>(`/debts/${id}`),

  updateDebt: (id: number, data: DebtUpdate) =>
    request<Debt>(`/debts/${id}`, { method: "PATCH", body: JSON.stringify(data) }),

  deleteDebt: (id: number) =>
    request<Debt>(`/debts/${id}`, { method: "DELETE" }),

  getOccurrences: (params: {
    year: number;
    month: number;
    status?: OccurrenceStatus;
    type?: string;
  }) => {
    const search = new URLSearchParams({
      year: String(params.year),
      month: String(params.month),
    });
    if (params.status) search.set("status", params.status);
    if (params.type && params.type !== "all") search.set("type", params.type);
    return request<Occurrence[]>(`/occurrences?${search}`);
  },

  updateOccurrence: (
    id: number,
    data: {
      is_paid?: boolean;
      amount?: number;
      statement_balance?: number;
      minimum_due?: number;
    }
  ) =>
    request<Occurrence>(`/occurrences/${id}`, {
      method: "PATCH",
      body: JSON.stringify(data),
    }),

  getIncome: () => request<IncomeSettings>("/income"),

  updateIncome: (data: Partial<IncomeSettings>) =>
    request<IncomeSettings>("/income", {
      method: "PATCH",
      body: JSON.stringify(data),
    }),

  getMonthlySummary: (months = 12) =>
    request<MonthlySummaryItem[]>(`/summary/monthly?months=${months}`),

  getCurrentSummary: (year: number, month: number) =>
    request<CurrentSummary>(
      `/summary/current?year=${year}&month=${month}`
    ),

  getStrategy: (year: number, month: number) =>
    request<StrategySummary>(
      `/summary/strategy?year=${year}&month=${month}`
    ),

  getCards: () => request<PaymentCard[]>("/cards"),

  createCard: (data: CardCreate) =>
    request<PaymentCard>("/cards", { method: "POST", body: JSON.stringify(data) }),

  updateCard: (id: number, data: CardUpdate) =>
    request<PaymentCard>(`/cards/${id}`, {
      method: "PATCH",
      body: JSON.stringify(data),
    }),

  deleteCard: (id: number) =>
    request<PaymentCard>(`/cards/${id}`, { method: "DELETE" }),
};
