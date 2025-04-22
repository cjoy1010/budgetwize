'use client';

import React, { useState, useEffect } from "react";

type Transaction = {
  id: number;
  date: string;
  description: string;
  amount: number;
  category: string;
  status: "Completed" | "Pending" | "Declined";
  account: string;
};

const initialData: Transaction[] = [
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
  const [deletedTransactions, setDeletedTransactions] = useState<Transaction[]>([]);
  const [showHistory, setShowHistory] = useState(false);
  const [transactions, setTransactions] = useState<Transaction[]>(initialData);
  const [editTransaction, setEditTransaction] = useState<Transaction | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  const [toast, setToast] = useState<string | null>(null);
  const [undoData, setUndoData] = useState<Transaction | null>(null);

  useEffect(() => {
    const stored = localStorage.getItem("transactions");
    if (stored) {
      try {
        setTransactions(JSON.parse(stored));
      } catch (error) {
        console.error("Error parsing transactions from localStorage:", error);
      }
    }
  }, []);

  useEffect(() => {
    localStorage.setItem("transactions", JSON.stringify(transactions));
  }, [transactions]);

  useEffect(() => {
    const deleted = localStorage.getItem("deletedTransactions");
    if (deleted) {
      try {
        setDeletedTransactions(JSON.parse(deleted));
      } catch (error) {
        console.error("Error parsing deletedTransactions from localStorage:", error);
      }
    }
  }, []);

  useEffect(() => {
    localStorage.setItem("deletedTransactions", JSON.stringify(deletedTransactions));
  }, [deletedTransactions]);
  

  const showToast = (message: string, duration = 4000) => {
    setToast(message);
    setTimeout(() => setToast(null), duration);
  };

  const handleDelete = (id: number) => {
    const tx = transactions.find((t) => t.id === id);
    if (!tx) return;
    const confirmDelete = window.confirm(
      `Are you sure you want to delete the transaction: "${tx.description}"?`
    );
    if (confirmDelete) {
      setUndoData(tx);
      setDeletedTransactions((prev) => [...prev, tx]);
      setTransactions((prev) => prev.filter((tx) => tx.id !== id));
      showToast("Transaction deleted. Undo?");
    }
  };

  const restoreFromHistory = (tx: Transaction) => {
    setTransactions((prev) => [...prev, tx]);
    setDeletedTransactions((prev) => prev.filter((t) => t.id !== tx.id));
    showToast("Transaction restored from history.");
  };
  

  const handleUndo = () => {
    if (undoData) {
      setTransactions((prev) => [...prev, undoData]);
      showToast("Transaction restored.");
      setUndoData(null);
    }
  };

  const handleEditClick = (transaction: Transaction) => {
    setEditTransaction({ ...transaction });
    setIsCreating(false);
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    if (!editTransaction) return;
    const { name, value } = e.target;
    setEditTransaction((prev) =>
      prev ? { ...prev, [name]: name === "amount" ? parseFloat(value) : value } : null
    );
  };

  const handleSave = () => {
    if (!editTransaction) return;

    if (isCreating) {
      setTransactions((prev) => [...prev, editTransaction]);
    } else {
      setTransactions((prev) =>
        prev.map((tx) => (tx.id === editTransaction.id ? editTransaction : tx))
      );
    }

    setEditTransaction(null);
    setIsCreating(false);
  };

  const handleNewTransaction = () => {
    setEditTransaction({
      id: Date.now(),
      date: new Date().toISOString().split("T")[0],
      description: "",
      amount: 0,
      category: "",
      status: "Pending",
      account: "",
    });
    setIsCreating(true);
  };

  const closeModal = () => {
    setEditTransaction(null);
    setIsCreating(false);
  };

  return (
    <div className="p-4 relative">
      <h2 className="text-xl font-bold mb-4">Recent Transactions</h2>

      {toast && (
        <div className="fixed bottom-4 left-4 bg-black text-white px-4 py-2 rounded shadow-lg flex items-center gap-4 z-50">
          {toast}
          {undoData && (
            <button onClick={handleUndo} className="underline text-yellow-300">Undo</button>
          )}
        </div>
      )}

      <button
        onClick={handleNewTransaction}
        className="mb-4 px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700"
      >
        + New Transaction
      </button>

      <table className="min-w-full border-collapse">
        <thead>
          <tr className="bg-gray-200">
            <th className="px-4 py-2 text-left">Date</th>
            <th className="px-4 py-2 text-left">Description</th>
            <th className="px-4 py-2 text-left">Amount</th>
            <th className="px-4 py-2 text-left">Category</th>
            <th className="px-4 py-2 text-left">Status</th>
            <th className="px-4 py-2 text-left">Account</th>
            <th className="px-4 py-2 text-left">Actions</th>
          </tr>
        </thead>
        <tbody>
          {transactions.map((tx) => (
            <tr key={tx.id} className="border-b">
              <td className="px-4 py-2">{tx.date}</td>
              <td className="px-4 py-2">{tx.description}</td>
              <td className={`px-4 py-2 ${tx.amount < 0 ? "text-red-500" : "text-green-600"}`}>
                {tx.amount < 0 ? `- $${Math.abs(tx.amount)}` : `+ $${tx.amount}`}
              </td>
              <td className="px-4 py-2">{tx.category}</td>
              <td className="px-4 py-2">{tx.status}</td>
              <td className="px-4 py-2">{tx.account}</td>
              <td className="px-4 py-2 space-x-2">
                <button className="text-blue-600 hover:underline" onClick={() => handleEditClick(tx)}>Edit</button>
                <button className="text-red-600 hover:underline" onClick={() => handleDelete(tx.id)}>Delete</button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      <div className="flex flex-wrap items-center gap-4 my-4">
        <button
          onClick={() => setShowHistory(!showHistory)}
          className="px-4 py-2 bg-gray-600 text-white rounded hover:bg-gray-700"
        >
          {showHistory ? "Hide" : "Show"} Deleted History
        </button>
      </div>

      {showHistory && deletedTransactions.length > 0 && (
        <div className="mt-4">
          <h3 className="text-lg font-semibold mb-2">Deleted Transactions</h3>
          <ul className="text-sm text-gray-700 list-disc list-inside">
            {deletedTransactions.map((tx) => (
              <li key={tx.id} className="flex items-center justify-between">
                <span>{tx.date} – {tx.description} (${tx.amount})</span>
                <button
                  onClick={() => restoreFromHistory(tx)}
                  className="ml-4 text-blue-600 hover:underline text-sm"
                >
                  Restore
                </button>
              </li>
            ))}
          </ul>
        </div>
      )}


      {editTransaction && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50">
          <div className="bg-white p-6 rounded-lg w-full max-w-md shadow-xl">
            <h3 className="text-lg font-semibold mb-4">
              {isCreating ? "New Transaction" : "Edit Transaction"}
            </h3>
            <form className="space-y-4" onSubmit={(e) => { e.preventDefault(); handleSave(); }}>
              <input
                type="date"
                name="date"
                value={editTransaction.date}
                onChange={handleChange}
                className="w-full border px-3 py-2 rounded"
              />
              <input
                type="text"
                name="description"
                value={editTransaction.description}
                onChange={handleChange}
                placeholder="Description"
                className="w-full border px-3 py-2 rounded"
              />
              <input
                type="number"
                name="amount"
                value={editTransaction.amount}
                onChange={handleChange}
                placeholder="Amount"
                className="w-full border px-3 py-2 rounded"
              />
              <div>
                <label className="block text-sm font-medium mb-1">Category</label>
                <select
                  onChange={(e) =>
                    setEditTransaction((prev) =>
                      prev ? { ...prev, category: e.target.value } : null
                    )
                  }
                  value={editTransaction.category}
                  className="w-full border px-3 py-2 rounded mb-1"
                >
                  <option value="">-- Select Category --</option>
                  <option value="Food">Food</option>
                  <option value="Rent">Rent</option>
                  <option value="Transportation">Transportation</option>
                  <option value="Entertainment">Entertainment</option>
                  <option value="Utilities">Utilities</option>
                  <option value="Income">Income</option>
                  <option value="Other">Other</option>
                </select>
                <input
                  type="text"
                  name="category"
                  value={editTransaction.category}
                  onChange={handleChange}
                  placeholder="Or enter a custom category"
                  className="w-full border px-3 py-2 rounded"
                />
              </div>
              <select
                name="status"
                value={editTransaction.status}
                onChange={handleChange}
                className="w-full border px-3 py-2 rounded"
              >
                <option value="Completed">Completed</option>
                <option value="Pending">Pending</option>
                <option value="Declined">Declined</option>
              </select>
              <div>
                <label className="block text-sm font-medium mb-1">Account</label>
                <select
                  onChange={(e) =>
                    setEditTransaction((prev) =>
                      prev ? { ...prev, account: e.target.value } : null
                    )
                  }
                  value={editTransaction.account}
                  className="w-full border px-3 py-2 rounded mb-1"
                >
                  <option value="">-- Select Account --</option>
                  <option value="Checking">Checking</option>
                  <option value="Savings">Savings</option>
                </select>
                <input
                  type="text"
                  name="account"
                  value={editTransaction.account}
                  onChange={handleChange}
                  placeholder="Or enter a custom account"
                  className="w-full border px-3 py-2 rounded"
                />
              </div>
              <div className="flex justify-end space-x-2 pt-4">
                <button type="submit" className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700">
                  Save
                </button>
                <button type="button" onClick={closeModal} className="bg-gray-300 text-gray-800 px-4 py-2 rounded hover:bg-gray-400">
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
