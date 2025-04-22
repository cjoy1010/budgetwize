"use client";

import { useState, useEffect } from "react";
import { usePlaidLink } from "react-plaid-link";

const PlaidConnectButton = () => {
  const [linkToken, setLinkToken] = useState<string | null>(null);

  useEffect(() => {
    const createLinkToken = async () => {
      const res = await fetch("/api/create-link-token");
      const data = await res.json();
      setLinkToken(data.link_token);
    };
    createLinkToken();
  }, []);

  const { open, ready } = usePlaidLink({
    token: linkToken!,
    onSuccess: async (public_token) => {
      await fetch("/api/plaid/set-access-token", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ public_token }),
      });
      alert("✅ Bank linked successfully!");
    },
    onExit: (err) => {
      if (err) console.error("❌ User exited Plaid Link:", err);
    },
  });

  return (
    <button
      onClick={() => open()}
      disabled={!ready}
      className="bg-indigo-600 text-white px-4 py-2 rounded mt-2"
    >
      Connect Bank Account
    </button>
  );
};

export default PlaidConnectButton;
