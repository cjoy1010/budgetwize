'use client';

import React, { useState } from 'react';

interface Subscription {
  id: string;
  name: string;
  amount: number;
  checked: boolean;
  isEditing?: boolean;
  isRecurring: boolean;
}

const CreditCardPayoffCalculator: React.FC = () => {
  const [balance, setBalance] = useState<string>('');
  const [monthlyPayment, setMonthlyPayment] = useState<string>('');
  const [apr, setApr] = useState<string>('');
  const [totalPaid, setTotalPaid] = useState<number>(0);
  const [totalBalance, setTotalBalance] = useState<number>(0);
  const [payoffSchedule, setPayoffSchedule] = useState<any[]>([]);
  const [newSubscriptionName, setNewSubscriptionName] = useState<string>('');
  const [newSubscriptionAmount, setNewSubscriptionAmount] = useState<string>('');
  const [newSubscriptionIsRecurring, setNewSubscriptionIsRecurring] = useState<boolean>(true);
  const [subscriptions, setSubscriptions] = useState<Subscription[]>([
    { id: '1', name: 'Netflix', amount: 15, checked: false, isRecurring: true },
    { id: '2', name: 'Spotify', amount: 10, checked: false, isRecurring: true },
    { id: '3', name: 'Amazon Prime', amount: 20, checked: false, isRecurring: true },
  ]);

  const calculatePayoffTime = (balance: number, monthlyPayment: number, apr: number, recurringExpenses: number = 0) => {
    const monthlyInterestRate = apr / 12 / 100;
    let months = 0;
    let currentBalance = balance;
    let schedule = [];

    while (currentBalance > 0) {
      // Add recurring expenses to the balance each month
      currentBalance += recurringExpenses;
      
      const interestPayment = currentBalance * monthlyInterestRate;
      const principalPayment = monthlyPayment - interestPayment;
      currentBalance = currentBalance - principalPayment;
      months++;

      schedule.push({
        month: months,
        payment: monthlyPayment,
        principal: principalPayment,
        interest: interestPayment,
        recurringExpenses,
        remaining: Math.max(0, currentBalance)
      });

      if (months > 600) break;
    }

    return { months, schedule };
  };

  const handleCalculate = () => {
    const balanceNum = parseFloat(balance);
    const monthlyPaymentNum = parseFloat(monthlyPayment);
    const aprNum = parseFloat(apr);

    if (!balanceNum || !monthlyPaymentNum || aprNum === undefined || aprNum < 0) {
      alert('Please fill in all fields with valid values');
      return;
    }

    // Calculate recurring expenses from checked subscriptions
    const recurringExpenses = subscriptions
      .filter(sub => sub.checked && sub.isRecurring)
      .reduce((sum, sub) => sum + sub.amount, 0);

    const monthlyRate = aprNum / 12 / 100;
    if (monthlyPaymentNum <= (balanceNum + recurringExpenses) * monthlyRate && aprNum > 0) {
      alert('Monthly payment is too low to pay off the debt');
      return;
    }

    const { months, schedule } = calculatePayoffTime(balanceNum, monthlyPaymentNum, aprNum, recurringExpenses);
    setPayoffSchedule(schedule);
    setTotalBalance(balanceNum);
  };

  const handleLogPayment = () => {
    const monthlyPaymentNum = parseFloat(monthlyPayment);
    if (!monthlyPaymentNum) {
      alert('Please enter a monthly payment amount');
      return;
    }

    setTotalPaid(prev => prev + monthlyPaymentNum);
  };

  const handleSubscriptionChange = (id: string) => {
    const newSubscriptions = subscriptions.map(sub => 
      sub.id === id ? { ...sub, checked: !sub.checked } : sub
    );
    setSubscriptions(newSubscriptions);
    updateMonthlyPayment(newSubscriptions);
  };

  const handleSubscriptionEdit = (id: string) => {
    const newSubscriptions = subscriptions.map(sub =>
      sub.id === id ? { ...sub, isEditing: true } : sub
    );
    setSubscriptions(newSubscriptions);
  };

  const handleSubscriptionSave = (id: string, newName: string, newAmount: string, isRecurring: boolean) => {
    const amount = parseFloat(newAmount);
    if (isNaN(amount)) {
      alert('Please enter a valid amount');
      return;
    }

    const newSubscriptions = subscriptions.map(sub =>
      sub.id === id ? { ...sub, name: newName, amount, isRecurring, isEditing: false } : sub
    );
    setSubscriptions(newSubscriptions);
    updateMonthlyPayment(newSubscriptions);
  };

  const handleAddSubscription = () => {
    if (!newSubscriptionName || !newSubscriptionAmount) {
      alert('Please enter both name and amount');
      return;
    }

    const amount = parseFloat(newSubscriptionAmount);
    if (isNaN(amount)) {
      alert('Please enter a valid amount');
      return;
    }

    const newSubscription: Subscription = {
      id: Date.now().toString(),
      name: newSubscriptionName,
      amount,
      checked: false,
      isRecurring: newSubscriptionIsRecurring
    };

    setSubscriptions([...subscriptions, newSubscription]);
    setNewSubscriptionName('');
    setNewSubscriptionAmount('');
  };

  const handleDeleteSubscription = (id: string) => {
    const newSubscriptions = subscriptions.filter(sub => sub.id !== id);
    setSubscriptions(newSubscriptions);
    updateMonthlyPayment(newSubscriptions);
  };

  const updateMonthlyPayment = (currentSubscriptions: Subscription[]) => {
    // Only add one-time savings to the monthly payment
    const oneTimeSavings = currentSubscriptions
      .filter(sub => sub.checked && !sub.isRecurring)
      .reduce((sum, sub) => sum + sub.amount, 0);

    const basePayment = parseFloat(monthlyPayment) || 0;
    const currentOneTimeSavings = subscriptions
      .filter(sub => sub.checked && !sub.isRecurring)
      .reduce((sum, sub) => sum + sub.amount, 0);
    
    const newPayment = basePayment - currentOneTimeSavings + oneTimeSavings;
    setMonthlyPayment(newPayment.toString());
  };

  const progressPercentage = totalBalance > 0 ? (totalPaid / totalBalance) * 100 : 0;

  return (
    <div className="p-4 bg-white rounded-lg shadow-lg">
      <h2 className="text-2xl font-bold mb-4">Credit Card Payoff Calculator</h2>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
        <div className="space-y-1">
          <label className="block text-sm font-medium">Current Balance</label>
          <input
            type="number"
            value={balance}
            onChange={(e) => setBalance(e.target.value)}
            className="w-full p-2 border rounded"
            placeholder="0"
            min="0"
            step="0.01"
          />
        </div>

        <div className="space-y-1">
          <label className="block text-sm font-medium">Monthly Payment</label>
          <input
            type="number"
            value={monthlyPayment}
            onChange={(e) => setMonthlyPayment(e.target.value)}
            className="w-full p-2 border rounded"
            placeholder="0"
            min="0"
            step="0.01"
          />
        </div>

        <div className="space-y-1">
          <label className="block text-sm font-medium">APR (%)</label>
          <input
            type="number"
            value={apr}
            onChange={(e) => setApr(e.target.value)}
            className="w-full p-2 border rounded"
            placeholder="0"
            min="0"
            max="100"
            step="0.01"
          />
        </div>
      </div>

      <div className="mb-4">
        <h3 className="text-lg font-semibold mb-3">Subscriptions & Expenses</h3>
        
        <div className="grid grid-cols-1 md:grid-cols-4 gap-3 mb-3 p-3 bg-gray-50 rounded-lg">
          <input
            type="text"
            value={newSubscriptionName}
            onChange={(e) => setNewSubscriptionName(e.target.value)}
            placeholder="Name"
            className="p-2 border rounded"
          />
          <input
            type="number"
            value={newSubscriptionAmount}
            onChange={(e) => setNewSubscriptionAmount(e.target.value)}
            placeholder="Amount"
            min="0"
            step="0.01"
            className="p-2 border rounded"
          />
          <div className="flex items-center space-x-2">
            <input
              type="checkbox"
              id="recurring"
              checked={newSubscriptionIsRecurring}
              onChange={(e) => setNewSubscriptionIsRecurring(e.target.checked)}
              className="rounded"
            />
            <label htmlFor="recurring" className="text-sm">Recurring monthly expense</label>
          </div>
          <button
            onClick={handleAddSubscription}
            className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700"
          >
            Add
          </button>
        </div>

        <div className="space-y-2">
          {subscriptions.map((sub) => (
            <div key={sub.id} className="flex items-center justify-between p-3 bg-white border rounded-lg shadow-sm">
              <div className="flex items-center space-x-3">
                <input
                  type="checkbox"
                  checked={sub.checked}
                  onChange={() => handleSubscriptionChange(sub.id)}
                  className="rounded"
                />
                {sub.isEditing ? (
                  <div className="flex space-x-2">
                    <input
                      type="text"
                      defaultValue={sub.name}
                      className="p-1 border rounded"
                      onBlur={(e) => handleSubscriptionSave(sub.id, e.target.value, sub.amount.toString(), sub.isRecurring)}
                    />
                    <input
                      type="number"
                      defaultValue={sub.amount}
                      min="0"
                      step="0.01"
                      className="p-1 border rounded w-24"
                      onBlur={(e) => handleSubscriptionSave(sub.id, sub.name, e.target.value, sub.isRecurring)}
                    />
                    <div className="flex items-center space-x-2">
                      <input
                        type="checkbox"
                        id={`recurring-${sub.id}`}
                        defaultChecked={sub.isRecurring}
                        className="rounded"
                        onChange={(e) => handleSubscriptionSave(sub.id, sub.name, sub.amount.toString(), e.target.checked)}
                      />
                      <label htmlFor={`recurring-${sub.id}`} className="text-sm">Recurring</label>
                    </div>
                  </div>
                ) : (
                  <div className="flex items-center space-x-2">
                    <span>{sub.name} - ${sub.amount}</span>
                    {sub.isRecurring && (
                      <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded">Monthly</span>
                    )}
                  </div>
                )}
              </div>
              <div className="flex space-x-2">
                <button
                  onClick={() => handleSubscriptionEdit(sub.id)}
                  className="px-3 py-1 text-sm bg-blue-600 text-white rounded hover:bg-blue-700"
                >
                  Edit
                </button>
                <button
                  onClick={() => handleDeleteSubscription(sub.id)}
                  className="px-3 py-1 text-sm bg-red-600 text-white rounded hover:bg-red-700"
                >
                  Delete
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="flex space-x-4 mb-4">
        <button
          onClick={handleCalculate}
          className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
        >
          Calculate Payoff Time
        </button>
        <button
          onClick={handleLogPayment}
          className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700"
        >
          Log This Month's Payment
        </button>
      </div>

      <div className="mb-4">
        <h3 className="text-lg font-semibold mb-3">Your Debt Payoff Progress</h3>
        <div className="w-full bg-gray-200 rounded-full h-4">
          <div
            className="bg-blue-600 h-4 rounded-full transition-all duration-300"
            style={{ width: `${progressPercentage}%` }}
          />
        </div>
        <p className="mt-2 text-sm">
          You have paid off ${totalPaid.toFixed(2)} of ${totalBalance.toFixed(2)} ({progressPercentage.toFixed(1)}%)
        </p>
      </div>

      {payoffSchedule.length > 0 && (
        <div className="overflow-x-auto">
          <h3 className="text-lg font-semibold mb-3">Monthly Payment Schedule</h3>
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Month</th>
                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Payment</th>
                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Principal</th>
                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Interest</th>
                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Recurring Expenses</th>
                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Remaining</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {payoffSchedule.map((row, index) => (
                <tr key={index}>
                  <td className="px-4 py-2 whitespace-nowrap">{row.month}</td>
                  <td className="px-4 py-2 whitespace-nowrap">${row.payment.toFixed(2)}</td>
                  <td className="px-4 py-2 whitespace-nowrap">${row.principal.toFixed(2)}</td>
                  <td className="px-4 py-2 whitespace-nowrap">${row.interest.toFixed(2)}</td>
                  <td className="px-4 py-2 whitespace-nowrap">${row.recurringExpenses.toFixed(2)}</td>
                  <td className="px-4 py-2 whitespace-nowrap">${row.remaining.toFixed(2)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default CreditCardPayoffCalculator; 