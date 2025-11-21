import React from 'react';
import { CheckSquare } from 'lucide-react';

export default function ExpensesView({ expenses, onMarkPaid, currentUserId }) {
  return (
    <div className="space-y-8 animate-slide-up">
      <h1 className="text-3xl font-extrabold text-slate-900">Shared Expenses</h1>
      <div className="bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden">
        <table className="w-full text-left border-collapse">
          <thead className="bg-gray-50/50 text-slate-500 text-xs font-bold uppercase tracking-wider border-b border-gray-100">
            <tr>
              <th className="p-6">Bill</th>
              <th className="p-6">Date</th>
              <th className="p-6">Payer</th>
              <th className="p-6 text-right">Amount</th>
              <th className="p-6 text-center">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100 text-sm">
            {expenses.map((expense) => (
              <tr key={expense.id} className="hover:bg-yellow-50/50 transition-colors group">
                <td className="p-6 font-bold text-slate-900 text-base">{expense.title}</td>
                <td className="p-6 text-slate-500 font-medium">{expense.date}</td>
                <td className="p-6">
                  <span className={`px-3 py-1 rounded-full text-xs font-bold ${expense.payer === 'You' ? 'bg-indigo-100 text-indigo-700' : 'bg-gray-100 text-slate-600'}`}>
                    {expense.payer}
                  </span>
                </td>
                <td className="p-6 text-right font-bold text-slate-900 text-base">${expense.amount}</td>
                <td className="p-6 text-center">
                  {expense.createdBy !== currentUserId && expense.status !== 'paid' ? (
                    <button onClick={() => onMarkPaid(expense.id)} className="flex items-center justify-center gap-2 px-4 py-2 bg-emerald-500 text-white hover:bg-emerald-600 rounded-lg text-xs font-bold transition-all shadow-md mx-auto transform active:scale-95">
                        <CheckSquare size={14} strokeWidth={3} /> Pay Now
                    </button>
                  ) : (
                    <span className={`px-3 py-1 rounded-full text-xs font-bold ${expense.status === 'paid' ? 'bg-emerald-100 text-emerald-700' : 'bg-gray-100 text-slate-400'}`}>
                        {expense.status || 'Paid'}
                    </span>
                  )}
                </td>
              </tr>
            ))}
            {expenses.length === 0 && <tr><td colSpan="5" className="p-12 text-center text-slate-400 text-lg">No expenses recorded yet.</td></tr>}
          </tbody>
        </table>
      </div>
    </div>
  );
}
