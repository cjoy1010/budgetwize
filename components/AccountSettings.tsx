'use client';
import React, { useState } from "react";

export default function AccountSettings() {
  const [email, setEmail] = useState("user@example.com");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [message, setMessage] = useState("");

  const handleSave = () => {
    if (password !== confirmPassword) {
      setMessage("Passwords do not match.");
      return;
    }
    setMessage("Account settings saved!");
  };

  return (
    <div>
      <h2 className="text-2xl font-semibold mb-4">Account Settings</h2>
      <div className="mb-4">
        <label className="block font-medium">Email</label>
        <input
          type="email"
          className="w-full p-2 border rounded"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />
      </div>
      <div className="mb-4">
        <label className="block font-medium">New Password</label>
        <input
          type="password"
          className="w-full p-2 border rounded"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />
      </div>
      <div className="mb-4">
        <label className="block font-medium">Confirm Password</label>
        <input
          type="password"
          className="w-full p-2 border rounded"
          value={confirmPassword}
          onChange={(e) => setConfirmPassword(e.target.value)}
        />
      </div>
      <button onClick={handleSave} className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700">
        Save Changes
      </button>
      {message && <p className="mt-2 text-green-600">{message}</p>}
    </div>
  );
}
