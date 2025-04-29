"use client";

import { useState } from "react";
import Image from "next/image";
import PlaidConnectButton from "@/components/PlaidConnectionButton";
import Chatbot from "@/components/Chatbot";

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

export default function CardPage() {
  const [accounts, setAccounts] = useState<Account[]>([]);

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

  return (
    <div className="min-h-screen p-6 bg-gray-100 flex flex-col items-center">
      <h1 className="text-2xl font-bold mb-4">Your Linked Card</h1>

      <PlaidConnectButton />
      <button
        onClick={fetchAccounts}
        className="bg-blue-600 text-white px-4 py-2 rounded mb-6"
      >
        Connect Bank & Fetch Card
      </button>

      <div className="flex w-full max-w-5xl gap-6">
        {/* Card column: display two cards per row */}
        <div className="grid grid-cols-2 gap-6 w-2/3">
          {accounts.map((acc) => (
            <div
              key={acc.account_id}
              className="relative bg-white rounded-2xl shadow-lg overflow-hidden h-64 w-full"
            >
              {/* Full-cover card image */}
              <Image
                src="/card-front.png"
                alt="Generic Credit Card"
                fill
                className="object-cover"
              />

              {/* Masked number overlay */}
              <div className="absolute top-4 left-4 text-white font-mono text-lg">
                **** **** **** {acc.mask}
              </div>
              {/* Cardholder name overlay */}
              <div className="absolute bottom-12 left-4 text-white font-semibold text-xl">
                {acc.name}
              </div>
              {/* Balance label overlay */}
              <div className="absolute bottom-4 left-4 text-white text-sm">
                Balance: {acc.balances.iso_currency_code ?? "USD"}$
                {(acc.balances.available ?? acc.balances.current).toFixed(2)}
              </div>
              {/* Current balance amount overlay */}
              <div className="absolute bottom-4 right-4 text-white font-bold text-xl">
                ${(acc.balances.available ?? acc.balances.current).toFixed(2)}
              </div>
            </div>
          ))}
        </div>

        {/* Chatbot sidebar */}
        <div className="w-1/3 bg-white rounded-2xl shadow-lg p-6">
          <h2 className="text-xl font-semibold mb-4">Chat Assistant</h2>
          <Chatbot accounts={accounts} transactions={[]} />
        </div>
      </div>
    </div>
  );
}