import React from 'react';
import { Home } from 'lucide-react';

export default function DashboardView({ summary, myGroups, displayName, currentUserId, expenses = [] }) {
  const totalOwed = summary?.totalowed || 0;
  
  // FIX: Use 'expenses' (the full list) instead of 'summary.bills' (just your debts)
  // We filter for bills YOU created.
  // Note: Since the API doesn't give us the exact "owed to me" split here, 
  // we sum the total Face Value of bills you paid for.
  const totalIPaid = expenses
    .filter(bill => bill.createdBy === currentUserId)
    .reduce((sum, bill) => sum + (bill.amount || 0), 0); 
  
  // Simple Net Calculation: (What I Paid) - (What I Owe)
  // A positive number means you are a "Creditor" to the house.
  const netBalance = totalIPaid - totalOwed;

  return (
    <div className="space-y-8">
      <div className="flex justify-between items-end">
        <div className="animate-slide-up">
          <h1 className="text-4xl font-extrabold text-slate-900 tracking-tight mb-1">Dashboard</h1>
          <p className="text-slate-500 font-medium text-lg">Welcome back, <span className="text-indigo-600">{displayName}</span>!</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white p-8 rounded-3xl shadow-sm border border-gray-100 hover:shadow-md transition-shadow animate-slide-up delay-100">
            <p className="text-sm font-bold text-slate-400 uppercase tracking-wider mb-2">Net Position</p>
            <p className={`text-4xl font-black ${netBalance >= 0 ? 'text-slate-900' : 'text-red-500'}`}>
                ${Math.abs(netBalance).toFixed(2)}
            </p>
            <span className={`inline-block mt-3 px-3 py-1 rounded-full text-xs font-bold ${netBalance >= 0 ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                {netBalance >= 0 ? 'You are owed money' : 'You owe money'}
            </span>
        </div>
        <div className="bg-white p-8 rounded-3xl shadow-sm border border-gray-100 hover:shadow-md transition-shadow animate-slide-up delay-200">
            <p className="text-sm font-bold text-slate-400 uppercase tracking-wider mb-2">Outgoing (Debts)</p>
            <p className="text-4xl font-black text-red-500">${totalOwed}</p>
        </div>
        <div className="bg-white p-8 rounded-3xl shadow-sm border border-gray-100 hover:shadow-md transition-shadow animate-slide-up delay-300">
            <p className="text-sm font-bold text-slate-400 uppercase tracking-wider mb-2">Total Paid By You</p>
            <p className="text-4xl font-black text-emerald-500">${totalIPaid.toFixed(2)}</p>
        </div>
      </div>

      <div className="bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden animate-slide-up delay-300">
        <div className="p-6 border-b border-gray-100 bg-gray-50/50">
            <h2 className="font-bold text-xl text-slate-900">Active Households</h2>
        </div>
        <div className="divide-y divide-gray-100">
          {myGroups?.map((group) => (
            <div key={group.groupId} className="p-6 flex items-center justify-between hover:bg-gray-50 transition-colors">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-2xl bg-indigo-600 flex items-center justify-center text-white font-bold shadow-md">
                  <Home size={24} />
                </div>
                <div>
                  <p className="font-bold text-slate-900 text-lg">{group.name}</p>
                  <p className="text-sm text-slate-500 font-mono">ID: {group.groupId}</p>
                </div>
              </div>
              <span className="px-4 py-1.5 bg-indigo-50 text-indigo-700 rounded-full text-sm font-bold border border-indigo-100">Member</span>
            </div>
          ))}
          {!myGroups?.length && <div className="p-12 text-center text-slate-400 text-lg font-medium">You haven't joined any households yet.</div>}
        </div>
      </div>
    </div>
  );
}
