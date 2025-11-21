import React, { useState, useEffect } from 'react';
import { DollarSign, Plus, LogOut, Home, Users, CreditCard, CheckCircle, Loader2, UserPlus, CheckSquare, ArrowRight, LayoutDashboard } from 'lucide-react';

// ==========================================
// AWS AMPLIFY SETUP
// ==========================================
import { Amplify } from 'aws-amplify';
import { Authenticator } from '@aws-amplify/ui-react';
import { fetchAuthSession } from 'aws-amplify/auth'; 
import '@aws-amplify/ui-react/styles.css';
import outputs from '../amplify_outputs.json'; 

Amplify.configure(outputs);

// ==========================================
// API CONFIGURATION
// ==========================================
const API_BASE_URL = "https://lfesbjfali.execute-api.us-west-1.amazonaws.com";

// ==========================================
// HELPER: SECURE FETCH
// ==========================================
async function authenticatedFetch(url, options = {}) {
  try {
    const session = await fetchAuthSession();
    const token = session.tokens?.idToken?.toString();

    const headers = {
      'Content-Type': 'application/json',
      ...(token && { 'Authorization': `Bearer ${token}` }),
      ...options.headers
    };

    const response = await fetch(url, { ...options, headers });
    return response;
  } catch (error) {
    console.error("Auth Fetch Error:", error);
    throw error;
  }
}

// ==========================================
// MAIN APP COMPONENT
// ==========================================
export default function App() {
  return (
    <>
      {/* Global Styles for Custom Animations */}
      <style>{`
        @keyframes swing-in {
          0% { transform: rotate(-45deg) scale(0.5); opacity: 0; }
          60% { transform: rotate(10deg) scale(1.05); opacity: 1; }
          80% { transform: rotate(-5deg) scale(1); }
          100% { transform: rotate(0deg) scale(1); }
        }
        @keyframes slide-up {
          from { transform: translateY(20px); opacity: 0; }
          to { transform: translateY(0); opacity: 1; }
        }
        .animate-swing {
          transform-origin: 50% 100%; /* Pivot from bottom center */
          animation: swing-in 1s cubic-bezier(0.175, 0.885, 0.32, 1.275) forwards;
        }
        .animate-slide-up {
          animation: slide-up 0.8s ease-out forwards;
          opacity: 0; /* Start hidden */
        }
        .delay-100 { animation-delay: 0.1s; }
        .delay-200 { animation-delay: 0.2s; }
        .delay-300 { animation-delay: 0.3s; }
        
        /* Blob Animation */
        @keyframes blob {
          0% { transform: translate(0px, 0px) scale(1); }
          33% { transform: translate(30px, -50px) scale(1.1); }
          66% { transform: translate(-20px, 20px) scale(0.9); }
          100% { transform: translate(0px, 0px) scale(1); }
        }
        .animate-blob {
          animation: blob 7s infinite;
        }
        .animation-delay-2000 {
          animation-delay: 2s;
        }
      `}</style>
      
      <Authenticator>
        {({ signOut, user }) => (
          <AppContent user={user} signOut={signOut} />
        )}
      </Authenticator>
    </>
  );
}

function AppContent({ user, signOut }) {
  const [view, setView] = useState('loading'); 
  const [summaryData, setSummaryData] = useState(null);
  const [expenses, setExpenses] = useState([]);
  const [housemates, setHousemates] = useState([]);
  const [myGroups, setMyGroups] = useState([]); 
  const [activeGroupId, setActiveGroupId] = useState(null); 
  const [notification, setNotification] = useState(null);

  const userEmail = user?.signInDetails?.loginId || user?.username || 'User';
  const userId = user?.username; 
  const displayName = userEmail.split('@')[0]; 
  const initials = displayName.substring(0, 2).toUpperCase();

  const showToast = (msg, type = 'success') => {
    setNotification({ message: msg, type });
    setTimeout(() => setNotification(null), 3000);
  };

  const refreshData = async () => {
    try {
      const groupsRes = await authenticatedFetch(`${API_BASE_URL}/groups`);
      
      if (!groupsRes.ok) {
         console.warn("Failed to fetch groups:", groupsRes.status);
         setMyGroups([]);
         setView('onboarding'); 
         return; 
      }

      const groupsJson = await groupsRes.json();
      setMyGroups(groupsJson);

      let targetGroupId = activeGroupId;
      
      if (!groupsJson || groupsJson.length === 0) {
        setView('onboarding');
        return;
      } else if (!targetGroupId) {
        targetGroupId = groupsJson[0].groupId;
        setActiveGroupId(targetGroupId);
      }
      
      if (targetGroupId) {
        if (view === 'loading' || view === 'onboarding') setView('dashboard');

        const summaryRes = await authenticatedFetch(`${API_BASE_URL}/me/summary`);
        if (summaryRes.ok) {
            const summaryJson = await summaryRes.json();
            setSummaryData(summaryJson);
        }

        const billsRes = await authenticatedFetch(`${API_BASE_URL}/groups/${targetGroupId}/bills`);
        if (billsRes.ok) {
            const billsJson = await billsRes.json();
            const formattedBills = billsJson.map(bill => ({
              id: bill.billId,
              title: bill.description,
              amount: bill.amount,
              payer: bill.createdBy === userId ? 'You' : 'Housemate',
              createdBy: bill.createdBy,
              date: bill.dueDate || '2025-11-01', 
              status: bill.status || 'pending' 
            }));
            setExpenses(formattedBills);
        }

        const groupRes = await authenticatedFetch(`${API_BASE_URL}/groups/${targetGroupId}`);
        if (groupRes.ok) {
            const groupJson = await groupRes.json();
            const formattedHousemates = (groupJson.members || []).map(member => ({
              id: member.userId,
              name: member.userId === userId ? 'You' : member.name || member.userId, 
              email: member.email || 'unknown@example.com', 
              role: member.role,
              avatar: (member.name || member.userId).substring(0, 2).toUpperCase() 
            }));
            setHousemates(formattedHousemates);
        }
      }
    } catch (error) {
      console.error("Data Load Error:", error);
      if (view === 'loading') setView('onboarding');
    } finally {
      // Ensure loading is cleared
    }
  };

  useEffect(() => {
    refreshData();
  }, [activeGroupId]);

  const joinGroup = async (groupIdToJoin) => {
    try {
      const response = await authenticatedFetch(`${API_BASE_URL}/groups/${groupIdToJoin}/join`, {
        method: 'POST',
        body: JSON.stringify({
          userId: userId,
          email: userEmail,
          name: displayName
        })
      });

      if (response.ok) {
        showToast("Joined group successfully!");
        setActiveGroupId(groupIdToJoin); 
        refreshData(); 
        setView('dashboard');
      } else {
        showToast("Failed to join group. Check ID.", "error");
      }
    } catch (error) {
      showToast("Network error joining group", "error");
    }
  };

  const markAsPaid = async (billId) => {
    if (!activeGroupId) return;
    try {
      const response = await authenticatedFetch(
        `${API_BASE_URL}/groups/${activeGroupId}/bills/${billId}/shares/${userId}`, 
        { method: 'PATCH', body: JSON.stringify({ status: "paid" }) }
      );
      if (response.ok) { showToast("Marked as paid!"); refreshData(); } 
      else { showToast("Failed to update status.", "error"); }
    } catch (error) { showToast("Error updating payment status", "error"); }
  };

  const addExpense = async (newExpenseData) => {
    if (!activeGroupId) return;
    const shareCount = housemates.length;
    if (shareCount === 0) return; 
    const splitAmount = parseFloat((newExpenseData.amount / shareCount).toFixed(2));
    const sharesPayload = housemates.map(member => ({ userId: member.id, amount: splitAmount, status: "due" }));

    try {
      const response = await authenticatedFetch(`${API_BASE_URL}/groups/${activeGroupId}/bills`, {
        method: 'POST',
        body: JSON.stringify({
          description: newExpenseData.title,
          amount: newExpenseData.amount,
          dueDate: newExpenseData.date,
          shares: sharesPayload
        })
      });
      if (response.ok) { showToast("Expense added successfully!"); refreshData(); setView('expenses'); }
    } catch (error) { showToast("Could not save expense.", "error"); }
  };


  // RENDER LOGIC
  if (view === 'loading') {
    return (
      <div className="h-screen flex items-center justify-center bg-slate-900 text-white">
        <Loader2 className="animate-spin mr-3 text-yellow-400" size={32} /> 
        <span className="font-bold text-xl">FairShare</span>
      </div>
    );
  }

  if (view === 'onboarding') {
    return (
      <OnboardingView 
        displayName={displayName} 
        onJoin={joinGroup} 
        signOut={signOut} 
        onCreate={() => alert("Create Group feature coming soon!")} 
      />
    );
  }

  return (
    <div className="flex h-screen bg-gray-100 font-sans text-slate-900">
      {/* SIDEBAR */}
      <aside className="w-72 bg-slate-900 hidden md:flex flex-col shadow-2xl z-20">
        <div className="p-8">
          <div className="flex items-center gap-3 font-extrabold text-white text-2xl tracking-tight">
            <div className="w-10 h-10 bg-yellow-400 rounded-xl flex items-center justify-center text-slate-900 shadow-lg">
              <Home size={24} strokeWidth={3} />
            </div>
            <span>FairShare</span>
          </div>
        </div>
        
        <nav className="flex-1 px-4 space-y-3">
          <NavButton active={view === 'dashboard'} onClick={() => setView('dashboard')} icon={<LayoutDashboard size={20}/>} label="Dashboard" />
          <NavButton active={view === 'expenses'} onClick={() => setView('expenses')} icon={<CreditCard size={20}/>} label="Expenses" />
          <NavButton active={view === 'add-expense'} onClick={() => setView('add-expense')} icon={<Plus size={20}/>} label="Add Bill" />
          <NavButton active={view === 'housemates'} onClick={() => setView('housemates')} icon={<Users size={20}/>} label="Housemates" />
          <div className="pt-4 border-t border-slate-700 mt-4">
             <NavButton active={view === 'join-group'} onClick={() => setView('onboarding')} icon={<UserPlus size={20}/>} label="Switch Household" />
          </div>
        </nav>

        <div className="p-6 mt-auto">
          <div className="flex items-center gap-3 mb-6 p-3 bg-slate-800 rounded-xl border border-slate-700">
            <div className="w-10 h-10 rounded-full bg-indigo-500 text-white flex items-center justify-center text-sm font-bold ring-2 ring-slate-600">
              {initials}
            </div>
            <div className="text-sm overflow-hidden">
              <p className="font-bold text-white truncate max-w-[120px]">{displayName}</p>
              <p className="text-xs text-slate-400">Online</p>
            </div>
          </div>
          <button onClick={signOut} className="flex items-center gap-2 text-sm text-slate-400 hover:text-yellow-400 transition-colors w-full px-2">
            <LogOut size={18} /> Sign Out
          </button>
        </div>
      </aside>

      {/* MAIN CONTENT */}
      <main className="flex-1 overflow-y-auto bg-gray-100">
        <header className="bg-white/80 backdrop-blur-md border-b border-gray-200 p-6 md:hidden flex justify-between items-center sticky top-0 z-10">
          <span className="font-extrabold text-slate-900 text-xl">FairShare</span>
          <button onClick={signOut}><LogOut size={20} className="text-slate-500" /></button>
        </header>

        <div className="max-w-6xl mx-auto p-8">
          {notification && (
            <div className={`fixed top-6 right-6 px-6 py-4 rounded-xl shadow-2xl flex items-center gap-3 animate-bounce z-50 font-bold ${
              notification.type === 'error' ? 'bg-red-500 text-white' : 'bg-emerald-500 text-white'
            }`}>
              <CheckCircle size={24} strokeWidth={3} />
              <span>{notification.message}</span>
            </div>
          )}

          {view === 'dashboard' && <DashboardView summary={summaryData} myGroups={myGroups} displayName={displayName} currentUserId={userId} />}
          {view === 'expenses' && <ExpensesView expenses={expenses} onMarkPaid={markAsPaid} currentUserId={userId} />}
          {view === 'add-expense' && <AddExpenseForm onAdd={addExpense} housemates={housemates} onCancel={() => setView('dashboard')} />}
          {view === 'join-group' && <JoinGroupForm onJoin={joinGroup} />}
          {view === 'housemates' && <HousematesView housemates={housemates} currentUser={userEmail} />}
        </div>
      </main>
    </div>
  );
}

// ==========================================
// SUB-COMPONENTS
// ==========================================

function NavButton({ active, onClick, icon, label }) {
  return (
    <button onClick={onClick} className={`w-full flex items-center gap-3 px-4 py-3.5 rounded-xl transition-all font-bold text-sm ${
        active ? 'bg-yellow-400 text-slate-900 shadow-md transform scale-105' : 'text-slate-400 hover:bg-slate-800 hover:text-white'
      }`}>
      {icon} {label}
    </button>
  );
}

function DashboardView({ summary, myGroups, displayName, currentUserId }) {
  const totalOwed = summary?.totalowed || 0;
  const bills = summary?.bills || [];
  const owedToMe = bills.filter(bill => bill.createdBy === currentUserId).reduce((sum, bill) => sum + (bill.myAmount || 0), 0); 
  const netBalance = owedToMe - totalOwed;

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
            <p className="text-sm font-bold text-slate-400 uppercase tracking-wider mb-2">Net Balance</p>
            <p className={`text-4xl font-black ${netBalance >= 0 ? 'text-slate-900' : 'text-red-500'}`}>${Math.abs(netBalance).toFixed(2)}</p>
            <span className={`inline-block mt-3 px-3 py-1 rounded-full text-xs font-bold ${netBalance >= 0 ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                {netBalance >= 0 ? 'You are clear' : 'You owe money'}
            </span>
        </div>
        <div className="bg-white p-8 rounded-3xl shadow-sm border border-gray-100 hover:shadow-md transition-shadow animate-slide-up delay-200">
            <p className="text-sm font-bold text-slate-400 uppercase tracking-wider mb-2">Outgoing</p>
            <p className="text-4xl font-black text-red-500">${totalOwed}</p>
        </div>
        <div className="bg-white p-8 rounded-3xl shadow-sm border border-gray-100 hover:shadow-md transition-shadow animate-slide-up delay-300">
            <p className="text-sm font-bold text-slate-400 uppercase tracking-wider mb-2">Incoming</p>
            <p className="text-4xl font-black text-emerald-500">${owedToMe.toFixed(2)}</p>
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

function ExpensesView({ expenses, onMarkPaid, currentUserId }) {
  return (
    <div className="space-y-8 animate-slide-up">
      <h1 className="text-3xl font-extrabold text-slate-900">Shared Expenses</h1>
      <div className="bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden">
        <table className="w-full text-left border-collapse">
          <thead className="bg-gray-50/50 text-slate-500 text-xs font-bold uppercase tracking-wider border-b border-gray-100">
            <tr><th className="p-6">Bill</th><th className="p-6">Date</th><th className="p-6">Payer</th><th className="p-6 text-right">Amount</th><th className="p-6 text-center">Status</th></tr>
          </thead>
          <tbody className="divide-y divide-gray-100 text-sm">
            {expenses.map((expense) => (
              <tr key={expense.id} className="hover:bg-yellow-50/50 transition-colors group">
                <td className="p-6 font-bold text-slate-900 text-base">{expense.title}</td>
                <td className="p-6 text-slate-500 font-medium">{expense.date}</td>
                <td className="p-6"><span className={`px-3 py-1 rounded-full text-xs font-bold ${expense.payer === 'You' ? 'bg-indigo-100 text-indigo-700' : 'bg-gray-100 text-slate-600'}`}>{expense.payer}</span></td>
                <td className="p-6 text-right font-bold text-slate-900 text-base">${expense.amount}</td>
                <td className="p-6 text-center">
                  {expense.createdBy !== currentUserId && expense.status !== 'paid' ? (
                    <button onClick={() => onMarkPaid(expense.id)} className="flex items-center justify-center gap-2 px-4 py-2 bg-emerald-500 text-white hover:bg-emerald-600 rounded-lg text-xs font-bold transition-all shadow-md mx-auto transform active:scale-95"><CheckSquare size={14} strokeWidth={3} /> Pay Now</button>
                  ) : (<span className={`px-3 py-1 rounded-full text-xs font-bold ${expense.status === 'paid' ? 'bg-emerald-100 text-emerald-700' : 'bg-gray-100 text-slate-400'}`}>{expense.status || 'Paid'}</span>)}
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

function AddExpenseForm({ onAdd, housemates, onCancel }) {
  const [amount, setAmount] = useState('');
  const [title, setTitle] = useState('');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const handleSubmit = (e) => { e.preventDefault(); if (!amount || !title) return; onAdd({ title, amount: parseFloat(amount), date }); };

  return (
    <div className="max-w-2xl mx-auto mt-8 animate-slide-up">
      <h1 className="text-3xl font-extrabold text-slate-900 mb-8">Log New Expense</h1>
      <form onSubmit={handleSubmit} className="bg-white p-10 rounded-3xl border border-gray-100 shadow-xl space-y-8">
        <div><label className="block text-sm font-bold text-slate-700 uppercase tracking-wider mb-3">What was it for?</label><input type="text" placeholder="e.g. Monthly Internet" className="w-full p-4 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-yellow-400 focus:border-transparent font-medium text-lg outline-none transition-all" value={title} onChange={(e) => setTitle(e.target.value)} /></div>
        <div className="grid grid-cols-2 gap-6">
          <div><label className="block text-sm font-bold text-slate-700 uppercase tracking-wider mb-3">Amount ($)</label><input type="number" placeholder="0.00" className="w-full p-4 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-yellow-400 focus:border-transparent font-bold text-lg outline-none transition-all" value={amount} onChange={(e) => setAmount(e.target.value)} /></div>
          <div><label className="block text-sm font-bold text-slate-700 uppercase tracking-wider mb-3">Date</label><input type="date" className="w-full p-4 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-yellow-400 focus:border-transparent font-medium text-lg outline-none transition-all" value={date} onChange={(e) => setDate(e.target.value)} /></div>
        </div>
        <div className="pt-6 flex gap-4"><button type="button" onClick={onCancel} className="flex-1 px-6 py-4 bg-gray-100 text-slate-600 font-bold rounded-xl hover:bg-gray-200 transition-colors">Cancel</button><button type="submit" className="flex-1 px-6 py-4 bg-yellow-400 text-slate-900 font-bold rounded-xl hover:bg-yellow-500 transition-all shadow-lg hover:shadow-xl transform active:scale-95">Save Expense</button></div>
      </form>
    </div>
  );
}

function JoinGroupForm({ onJoin }) {
  const [groupId, setGroupId] = useState('');
  const handleSubmit = (e) => { e.preventDefault(); if (groupId) onJoin(groupId); };
  return (
    <div className="max-w-lg mx-auto mt-16 animate-slide-up">
        <div className="bg-white p-10 rounded-3xl border border-gray-100 shadow-2xl text-center">
            <div className="w-20 h-20 bg-yellow-400 text-slate-900 rounded-3xl flex items-center justify-center mx-auto mb-6 shadow-lg transform -rotate-6"><Users size={40} strokeWidth={2.5} /></div>
            <h2 className="text-3xl font-black text-slate-900 mb-3">Join a Household</h2>
            <p className="text-slate-500 mb-8 font-medium">Enter the Group ID shared by your housemate to start splitting bills.</p>
            <form onSubmit={handleSubmit} className="space-y-4"><input type="text" placeholder="e.g. grp-c3796..." className="w-full p-4 border-2 border-gray-100 bg-gray-50 rounded-xl focus:ring-0 focus:border-yellow-400 text-center font-mono text-lg font-bold outline-none transition-all" value={groupId} onChange={(e) => setGroupId(e.target.value)} /><button type="submit" className="w-full py-4 bg-slate-900 text-white font-bold rounded-xl hover:bg-slate-800 shadow-lg hover:shadow-xl transition-all transform active:scale-95">Join Group</button></form>
        </div>
    </div>
  );
}

function OnboardingView({ displayName, onJoin, onCreate, signOut }) {
  const [joinCode, setJoinCode] = useState('');
  return (
    <div className="min-h-screen bg-slate-900 flex flex-col items-center justify-center p-6 relative overflow-hidden">
      <div className="absolute top-8 right-8"><button onClick={signOut} className="text-slate-400 hover:text-white flex items-center gap-2 text-sm font-bold transition-colors">Sign Out <LogOut size={16} /></button></div>
      
      <div className="absolute top-[-10%] left-[-10%] w-96 h-96 bg-indigo-600 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob"></div>
      <div className="absolute bottom-[-10%] right-[-10%] w-96 h-96 bg-yellow-400 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob animation-delay-2000"></div>

      <div className="max-w-4xl w-full text-center space-y-12 z-10">
        <div className="space-y-4 animate-slide-up">
            <div className="inline-flex justify-center mb-4">
                <div className="w-24 h-24 bg-yellow-400 rounded-3xl flex items-center justify-center text-slate-900 shadow-2xl animate-swing">
                    <Home size={48} strokeWidth={3} />
                </div>
            </div>
            <h1 className="text-5xl md:text-6xl font-black text-white tracking-tight">Welcome, {displayName}!</h1>
            <p className="text-xl text-slate-400 max-w-2xl mx-auto">You aren't part of a household yet. Join your roommates or start a new group to get organized.</p>
        </div>

        <div className="grid md:grid-cols-2 gap-8 text-left">
          {/* Option 1: Join - Dark Theme */}
          <div className="bg-slate-800 p-10 rounded-3xl shadow-2xl border border-slate-700 hover:border-yellow-400/50 hover:transform hover:-translate-y-2 transition-all duration-300 animate-slide-up delay-100">
            <div className="w-14 h-14 bg-yellow-400/20 text-yellow-400 rounded-2xl flex items-center justify-center mb-6"><Users size={28} strokeWidth={3} /></div>
            <h3 className="text-2xl font-black text-white mb-3">Join Existing</h3>
            <p className="text-slate-400 mb-8 font-medium">Got a code from a roommate? Enter it here to sync up instantly.</p>
            <form onSubmit={(e) => { e.preventDefault(); if(joinCode) onJoin(joinCode); }}>
                <input type="text" placeholder="Paste Group ID..." className="w-full p-4 bg-slate-700 border-2 border-slate-600 rounded-xl focus:border-yellow-400 focus:ring-0 mb-4 font-bold text-white placeholder-slate-400 outline-none transition-all" value={joinCode} onChange={(e) => setJoinCode(e.target.value)} />
                <button type="submit" className="w-full py-4 bg-yellow-400 text-slate-900 font-bold rounded-xl hover:bg-yellow-300 flex items-center justify-center gap-3 shadow-lg transition-all transform active:scale-95">Join Now <ArrowRight size={20} strokeWidth={3} /></button>
            </form>
          </div>

          {/* Option 2: Create - Light Theme */}
          <div className="bg-white p-10 rounded-3xl shadow-2xl border border-gray-200 hover:border-indigo-500 hover:transform hover:-translate-y-2 transition-all duration-300 flex flex-col animate-slide-up delay-200">
            <div className="w-14 h-14 bg-indigo-100 text-indigo-600 rounded-2xl flex items-center justify-center mb-6"><Plus size={28} strokeWidth={3} /></div>
            <h3 className="text-2xl font-black text-slate-900 mb-3">Create New</h3>
            <p className="text-slate-500 mb-8 font-medium">Moving into a new place? Be the first to set up the digital household.</p>
            <div className="mt-auto"><button onClick={onCreate} className="w-full py-4 bg-indigo-600 text-white font-bold rounded-xl hover:bg-indigo-700 flex items-center justify-center gap-3 shadow-lg transition-all transform active:scale-95">Start Household</button></div>
          </div>
        </div>
      </div>
    </div>
  );
}

function HousematesView({ housemates, currentUser }) {
  const filteredHousemates = housemates.filter(mate => mate.email !== currentUser);
  return (
    <div className="space-y-8 animate-slide-up">
      <h1 className="text-3xl font-extrabold text-slate-900">Your Household</h1>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-gradient-to-br from-slate-900 to-slate-800 p-8 rounded-3xl shadow-lg flex items-center gap-6 border border-slate-700 transform hover:scale-[1.02] transition-transform"><div className="w-20 h-20 bg-yellow-400 rounded-2xl flex items-center justify-center text-3xl font-black text-slate-900 shadow-lg">ME</div><div><h3 className="font-black text-white text-2xl">You</h3><p className="text-slate-400 font-medium mb-2">{currentUser}</p><span className="inline-block px-3 py-1 bg-slate-700 text-white text-xs font-bold rounded-lg tracking-wide uppercase">Admin</span></div></div>
        {filteredHousemates.map(mate => (
          <div key={mate.id} className="bg-white p-8 rounded-3xl shadow-sm border border-gray-100 flex items-center gap-6 hover:shadow-md transition-shadow"><div className="w-20 h-20 bg-gray-100 rounded-2xl flex items-center justify-center text-3xl font-bold text-slate-400">{mate.avatar}</div><div><h3 className="font-bold text-slate-900 text-xl">{mate.name}</h3><p className="text-slate-500 font-medium mb-2">{mate.email}</p>{mate.role && <span className="inline-block px-3 py-1 bg-indigo-50 text-indigo-700 border border-indigo-100 text-xs font-bold rounded-lg tracking-wide uppercase">{mate.role}</span>}</div></div>
        ))}
      </div>
    </div>
  );
}
