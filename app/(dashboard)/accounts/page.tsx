"use client";

import { useState } from "react";
import { SignedIn, SignedOut } from "@clerk/nextjs";
import Chatbot from "@/components/Chatbot";
import PlaidConnectButton from "@/components/PlaidConnectionButton";

interface Account {
  account_id: string;
  name: string;
  subtype: string;
  mask: string;
  balances: {
    available?: number;
    current: number;
    iso_currency_code?: string;
  };
}

interface Transaction {
  transactionId: string;
  name: string;
  category: string | string[];
  amount: number;
  date: string;
  iso_currency_code?: string;
  pending?: boolean;
  account_id: string;
  account_owner?: string | null;
  transaction_type?: string;
  merchant_name?: string; // updated from string | null | undefined to string | undefined
  location?: {
    address?: string | null;
    city?: string | null;
    region?: string | null;
    postal_code?: string | null;
    country?: string | null;
    lat?: number | null;
    lon?: number | null;
  };
  payment_channel?: string;
  authorized_date?: string | null;
  datetime?: string | null;
  payment_meta?: {
    reference_number?: string | null;
    ppd_id?: string | null;
    payee?: string | null;
    by_order_of?: string | null;
    payer?: string | null;
    payment_method?: string | null;
    reason?: string | null;
  };
  security_context?: string | null;
  check_number?: string | null;
}

const AccountsPage = () => {
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("");
  const [dateRange, setDateRange] = useState("all");

  const fetchAccounts = async () => {
    try {
      const res = await fetch("/api/plaid/accounts");
      if (!res.ok) {
        console.error(`Failed to fetch accounts: ${res.status}`);
        return;
      }
      const data: Account[] = await res.json();
      setAccounts(data);
    } catch (error) {
      console.error("Error fetching accounts:", error);
    }
  };

  const fetchTransactions = async () => {
    try {
      const res = await fetch("/api/plaid/stored-transactions");
      if (!res.ok) {
        console.error(`Failed to fetch transactions: ${res.status}`);
        return;
      }
      const data: Transaction[] = await res.json();
      setTransactions(data);
    } catch (error) {
      console.error("Error fetching transactions:", error);
    }
  };

  const filteredTransactions = transactions.filter((tx) => {
    const search = searchTerm.toLowerCase();
    const matchesSearch =
      tx.name.toLowerCase().includes(search) ||
      tx.merchant_name?.toLowerCase().includes(search);

    const matchesCategory = categoryFilter
      ? Array.isArray(tx.category)
        ? tx.category.includes(categoryFilter)
        : tx.category === categoryFilter
      : true;

    const matchesDate = (() => {
      if (dateRange === "all") return true;
      const txDate = new Date(tx.date);
      const now = new Date();
      const diffInDays =
        (now.getTime() - txDate.getTime()) / (1000 * 60 * 60 * 24);
      return diffInDays <= Number(dateRange);
    })();

    return matchesSearch && matchesCategory && matchesDate;
  });

  return (
    <>
      <SignedIn>
        <div className="min-h-screen p-6 bg-gray-100 flex flex-col">
          <h1 className="text-2xl font-bold mb-2">Your Account</h1>
          <p className="mb-4">Manage your profile and settings here.</p>
          <PlaidConnectButton />

          <div className="mb-6">
            <button
              onClick={fetchAccounts}
              className="bg-blue-600 text-white px-4 py-2 rounded mr-4"
            >
              Fetch Bank Accounts
            </button>
            <button
              onClick={fetchTransactions}
              className="bg-green-600 text-white px-4 py-2 rounded"
            >
              Load My Transactions
            </button>
          </div>

          <div className="flex flex-1 gap-6">
            <div className="w-1/2 flex flex-col gap-6">
              {accounts.length > 0 && (
                <div>
                  <h2 className="text-xl font-semibold mb-2">
                    Linked Accounts
                  </h2>
                  <div className="grid gap-4">
                    {accounts.map((acc: Account) => (
                      <div
                        key={acc.account_id}
                        className="bg-white shadow rounded p-4"
                      >
                        <div className="font-bold text-lg">{acc.name}</div>
                        <div className="text-sm text-gray-500">
                          {acc.subtype} ({acc.mask})
                        </div>
                        <div className="text-sm text-gray-700 mt-1">
                          Balance:{" "}
                          <span className="text-green-600 font-semibold">
                            $
                            {acc.balances.available?.toFixed(2) ??
                              acc.balances.current.toFixed(2)}
                          </span>{" "}
                          {acc.balances.iso_currency_code ?? ""}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div className="bg-white shadow rounded p-4">
                <h2 className="text-xl font-semibold mb-2">Chat Assistant</h2>
                <Chatbot accounts={accounts} transactions={transactions} />
              </div>
            </div>

            <div className="w-1/2 flex flex-col">
              <h2 className="text-xl font-semibold mb-2">
                Recent Transactions
              </h2>

              <div className="mb-4 flex flex-wrap gap-4">
                <input
                  type="text"
                  placeholder="Search by name or merchant"
                  className="border p-2 rounded w-full sm:w-1/3"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />

                <select
                  className="border p-2 rounded w-full sm:w-1/4"
                  value={categoryFilter}
                  onChange={(e) => setCategoryFilter(e.target.value)}
                >
                  <option value="">All Categories</option>
                  {Array.from(
                    new Set(
                      transactions
                        .flatMap((t) =>
                          Array.isArray(t.category) ? t.category : [t.category]
                        )
                        .filter(Boolean)
                    )
                  ).map((cat) => (
                    <option key={cat} value={cat}>
                      {cat}
                    </option>
                  ))}
                </select>

                <select
                  className="border p-2 rounded w-full sm:w-1/4"
                  value={dateRange}
                  onChange={(e) => setDateRange(e.target.value)}
                >
                  <option value="all">All Time</option>
                  <option value="7">Last 7 Days</option>
                  <option value="30">Last 30 Days</option>
                </select>
              </div>

              <div className="grid gap-4">
                {filteredTransactions.map((tx: Transaction) => (
                  <div
                    key={tx.transactionId}
                    className="bg-white shadow rounded p-4"
                  >
                    <div className="flex justify-between items-center">
                      <div className="text-lg font-medium">{tx.name}</div>
                      <div className="text-green-600 font-bold">
                        {tx.iso_currency_code ?? "USD"} ${tx.amount?.toFixed(2)}
                      </div>
                    </div>

                    {tx.merchant_name && (
                      <div className="text-sm text-gray-500">
                        Merchant: {tx.merchant_name}
                      </div>
                    )}

                    <div className="text-sm text-gray-500">
                      {Array.isArray(tx.category)
                        ? tx.category.join(", ")
                        : tx.category}
                    </div>

                    <div className="text-xs text-gray-400">
                      {tx.pending ? "Pending • " : ""}
                      {new Date(tx.date).toLocaleDateString(undefined, {
                        weekday: "short",
                        year: "numeric",
                        month: "short",
                        day: "numeric",
                      })}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </SignedIn>

      <SignedOut>
        <div className="min-h-screen flex items-center justify-center bg-gray-100">
          <p className="text-lg text-red-600">
            You must be signed in to view your account and transactions.
          </p>
        </div>
      </SignedOut>
    </>
  );
};

export default AccountsPage;
