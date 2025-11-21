import React, { useState } from 'react';
import { Users } from 'lucide-react';

export function AddExpenseForm({ onAdd, housemates, onCancel }) {
  const [amount, setAmount] = useState('');
  const [title, setTitle] = useState('');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);

  const handleSubmit = (e) => { 
      e.preventDefault(); 
      if (!amount || !title) return; 
      onAdd({ title, amount: parseFloat(amount), date }); 
  };

  return (
    <div className="max-w-2xl mx-auto mt-8 animate-slide-up">
      <h1 className="text-3xl font-extrabold text-slate-900 mb-8">Log New Expense</h1>
      <form onSubmit={handleSubmit} className="bg-white p-10 rounded-3xl border border-gray-100 shadow-xl space-y-8">
        
        {/* VISUAL CONFIRMATION OF SPLIT */}
        <div className="bg-indigo-50 p-4 rounded-xl border border-indigo-100">
          <p className="text-xs font-bold text-indigo-600 uppercase tracking-wide mb-2">Splitting between {housemates.length} people:</p>
          <div className="flex flex-wrap gap-2">
            {housemates.map(mate => (
              <span key={mate.id} className="px-2 py-1 bg-white text-indigo-900 text-xs font-bold rounded border border-indigo-100">
                {mate.name}
              </span>
            ))}
          </div>
        </div>

        <div>
            <label className="block text-sm font-bold text-slate-700 uppercase tracking-wider mb-3">What was it for?</label>
            <input type="text" placeholder="e.g. Monthly Internet" className="w-full p-4 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-yellow-400 focus:border-transparent font-medium text-lg outline-none transition-all" value={title} onChange={(e) => setTitle(e.target.value)} />
        </div>
        <div className="grid grid-cols-2 gap-6">
          <div>
              <label className="block text-sm font-bold text-slate-700 uppercase tracking-wider mb-3">Amount ($)</label>
              <input type="number" placeholder="0.00" className="w-full p-4 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-yellow-400 focus:border-transparent font-bold text-lg outline-none transition-all" value={amount} onChange={(e) => setAmount(e.target.value)} />
          </div>
          <div>
              <label className="block text-sm font-bold text-slate-700 uppercase tracking-wider mb-3">Date</label>
              <input type="date" className="w-full p-4 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-yellow-400 focus:border-transparent font-medium text-lg outline-none transition-all" value={date} onChange={(e) => setDate(e.target.value)} />
          </div>
        </div>
        <div className="pt-6 flex gap-4">
            <button type="button" onClick={onCancel} className="flex-1 px-6 py-4 bg-gray-100 text-slate-600 font-bold rounded-xl hover:bg-gray-200 transition-colors">Cancel</button>
            <button type="submit" className="flex-1 px-6 py-4 bg-yellow-400 text-slate-900 font-bold rounded-xl hover:bg-yellow-500 transition-all shadow-lg hover:shadow-xl transform active:scale-95">Save Expense</button>
        </div>
      </form>
    </div>
  );
}

export function JoinGroupForm({ onJoin }) {
  const [groupId, setGroupId] = useState('');
  const handleSubmit = (e) => { e.preventDefault(); if (groupId) onJoin(groupId); };

  return (
    <div className="max-w-lg mx-auto mt-16 animate-slide-up">
        <div className="bg-white p-10 rounded-3xl border border-gray-100 shadow-2xl text-center">
            <div className="w-20 h-20 bg-yellow-400 text-slate-900 rounded-3xl flex items-center justify-center mx-auto mb-6 shadow-lg transform -rotate-6">
                <Users size={40} strokeWidth={2.5} />
            </div>
            <h2 className="text-3xl font-black text-slate-900 mb-3">Join a Household</h2>
            <p className="text-slate-500 mb-8 font-medium">Enter the Group ID shared by your housemate to start splitting bills.</p>
            <form onSubmit={handleSubmit} className="space-y-4">
                <input type="text" placeholder="e.g. grp-c3796..." className="w-full p-4 border-2 border-gray-100 bg-gray-50 rounded-xl focus:ring-0 focus:border-yellow-400 text-center font-mono text-lg font-bold outline-none transition-all" value={groupId} onChange={(e) => setGroupId(e.target.value)} />
                <button type="submit" className="w-full py-4 bg-slate-900 text-white font-bold rounded-xl hover:bg-slate-800 shadow-lg hover:shadow-xl transition-all transform active:scale-95">Join Group</button>
            </form>
        </div>
    </div>
  );
}
