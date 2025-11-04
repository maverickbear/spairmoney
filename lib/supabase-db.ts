import { createServerClient } from "./supabase-server";

// Tipos para as tabelas do Supabase
export interface Database {
  Account: {
    id: string;
    name: string;
    type: string;
    createdAt: string;
    updatedAt: string;
  };
  Macro: {
    id: string;
    name: string;
    createdAt: string;
    updatedAt: string;
  };
  Category: {
    id: string;
    name: string;
    macroId: string;
    createdAt: string;
    updatedAt: string;
  };
  Subcategory: {
    id: string;
    name: string;
    categoryId: string;
    createdAt: string;
    updatedAt: string;
  };
  Transaction: {
    id: string;
    date: string;
    type: string;
    amount: number;
    accountId: string;
    categoryId: string | null;
    subcategoryId: string | null;
    description: string | null;
    tags: string;
    transferToId: string | null;
    transferFromId: string | null;
    createdAt: string;
    updatedAt: string;
  };
  Budget: {
    id: string;
    period: string;
    categoryId: string;
    amount: number;
    note: string | null;
    createdAt: string;
    updatedAt: string;
  };
  InvestmentAccount: {
    id: string;
    name: string;
    type: string;
    accountId: string | null;
    createdAt: string;
    updatedAt: string;
  };
  Security: {
    id: string;
    symbol: string;
    name: string;
    class: string;
    createdAt: string;
    updatedAt: string;
  };
  InvestmentTransaction: {
    id: string;
    date: string;
    accountId: string;
    securityId: string | null;
    type: string;
    quantity: number | null;
    price: number | null;
    fees: number;
    notes: string | null;
    transferToId: string | null;
    transferFromId: string | null;
    createdAt: string;
    updatedAt: string;
  };
  SecurityPrice: {
    id: string;
    securityId: string;
    date: string;
    price: number;
    createdAt: string;
  };
}

// Helper para obter o cliente Supabase
export function getSupabaseClient() {
  return createServerClient();
}

