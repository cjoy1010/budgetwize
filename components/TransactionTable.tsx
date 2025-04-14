import React from "react";

type Transaction = {
  id: number;
  date: string;
  description: string;
  amount: number;
  category: string;
  status: "Completed" | "Pending" | "Declined";
  account: string;
};

const dummyData: Transaction[] = [
  {
    id: 1,
    date: "2025-04-10",
    description: "Grocery Shopping - Trader Joe's",
    amount: -54.32,
    category: "Food",
    status: "Completed",
    account: "Checking",
  },
  {
    id: 2,
    date: "2025-04-09",
    description: "Paycheck",
    amount: 1200,
    category: "Income",
    status: "Completed",
    account: "Savings",
  },
];

export default function TransactionTable() {
  return (
    <div className="p-4">
      <h2 className="text-xl font-bold mb-4">Recent Transactions</h2>
      <table className="min-w-full border-collapse">
        <thead>
          <tr className="bg-gray-200">
            <th className="px-4 py-2 text-left">Date</th>
            <th className="px-4 py-2 text-left">Description</th>
            <th className="px-4 py-2 text-left">Amount</th>
            <th className="px-4 py-2 text-left">Category</th>
            <th className="px-4 py-2 text-left">Status</th>
            <th className="px-4 py-2 text-left">Account</th>
          </tr>
        </thead>
        <tbody>
          {dummyData.map((tx) => (
            <tr key={tx.id} className="border-b">
              <td className="px-4 py-2">{tx.date}</td>
              <td className="px-4 py-2">{tx.description}</td>
              <td
                className={`px-4 py-2 ${
                  tx.amount < 0 ? "text-red-500" : "text-green-600"
                }`}
              >
                {tx.amount < 0 ? `- $${Math.abs(tx.amount)}` : `+ $${tx.amount}`}
              </td>
              <td className="px-4 py-2">{tx.category}</td>
              <td className="px-4 py-2">{tx.status}</td>
              <td className="px-4 py-2">{tx.account}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
