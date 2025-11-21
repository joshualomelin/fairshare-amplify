import React, { useState, useEffect } from 'react';
import { Amplify } from 'aws-amplify';
import { Authenticator } from '@aws-amplify/ui-react';
import '@aws-amplify/ui-react/styles.css';
import { Loader2, Home, LayoutDashboard, CreditCard, Plus, Users, LogOut, CheckCircle } from 'lucide-react';
import outputs from '../amplify_outputs.json';

// Imports
import { API_BASE_URL, authenticatedFetch } from './utils/api';
import HouseholdSwitcher from './components/HouseholdSwitcher';
import DashboardView from './views/DashboardView';
import ExpensesView from './views/ExpensesView';
import HousematesView from './views/HousematesView';
import OnboardingView from './views/OnboardingView';
import { AddExpenseForm, JoinGroupForm } from './views/Forms';

Amplify.configure(outputs);

export default function App() {
  return (
    <>
      <style>{`
        @keyframes slide-up { from { transform: translateY(20px); opacity: 0; } to { transform: translateY(0); opacity: 1; } }
        .animate-slide-up { animation: slide-up 0.8s ease-out forwards; opacity: 0; }
        .delay-100 { animation-delay: 0.1s; }
        .delay-200 { animation-delay: 0.2s; }
        .delay-300 { animation-delay: 0.3s; }
        @keyframes blob { 0% { transform: translate(0px, 0px) scale(1); } 33% { transform: translate(30px, -50px) scale(1.1); } 66% { transform: translate(-20px, 20px) scale(0.9); } 100% { transform: translate(0px, 0px) scale(1); } }
        .animate-blob { animation: blob 7s infinite; }
        .animation-delay-2000 { animation-delay: 2s; }
      `}</style>
      
      <Authenticator>
        {({ signOut, user }) => <AppContent user={user} signOut={signOut} />}
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

  // User Identity
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
      // 1. Fetch Groups
      const groupsRes = await authenticatedFetch(`${API_BASE_URL}/groups`);
      
      if (!groupsRes.ok) {
         console.warn("Failed to fetch groups:", groupsRes.status);
         setMyGroups([]);
         if (view === 'loading') setView('onboarding'); 
         return; 
      }

      const groupsJson = await groupsRes.json();
      setMyGroups(groupsJson);

      let targetGroupId = activeGroupId;
      
      if (!groupsJson || groupsJson.length === 0) {
        if (view === 'loading') setView('onboarding');
        return;
      } else if (!targetGroupId) {
        targetGroupId = groupsJson[0].groupId;
        setActiveGroupId(targetGroupId);
      }
      
      if (targetGroupId) {
        if (view === 'loading' || view === 'onboarding') setView('dashboard');

        const [summaryRes, billsRes, groupRes] = await Promise.all([
            authenticatedFetch(`${API_BASE_URL}/me/summary`),
            authenticatedFetch(`${API_BASE_URL}/groups/${targetGroupId}/bills`),
            authenticatedFetch(`${API_BASE_URL}/groups/${targetGroupId}`)
        ]);

        if (summaryRes.ok) setSummaryData(await summaryRes.json());

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
    }
  };

  useEffect(() => {
    refreshData();
  }, [activeGroupId]);

  const switchGroup = (groupId) => {
    setActiveGroupId(groupId);
    setView('dashboard');
    showToast("Switched household!");
  };

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

  const createGroup = async (groupName) => {
    try {
        const response = await authenticatedFetch(`${API_BASE_URL}/groups`, {
            method: 'POST',
            body: JSON.stringify({ name: groupName })
        });

        if (response.ok) {
            const newGroup = await response.json();
            showToast("Household created successfully!");
            setActiveGroupId(newGroup.groupId); 
            refreshData();
            setView('dashboard');
        } else {
            showToast("Failed to create group.", "error");
        }
    } catch (error) {
        showToast("Network error creating group", "error");
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
    
    // LOGIC UPDATE: Creator is marked 'paid' immediately. Others are 'due'.
    const sharesPayload = housemates.map(member => ({ 
      userId: member.id, 
      amount: splitAmount, 
      status: member.id === userId ? 'paid' : 'due' 
    }));

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
        onCreate={createGroup} 
      />
    );
  }

  const activeGroup = myGroups.find(g => g.groupId === activeGroupId) || { name: "My Household" };

  return (
    <div className="flex h-screen bg-gray-100 font-sans text-slate-900">
      <aside className="w-72 bg-slate-900 hidden md:flex flex-col shadow-2xl z-20">
        <div className="p-6 pb-2">
          <div className="flex items-center gap-3 font-extrabold text-white text-2xl tracking-tight mb-6">
            <div className="w-10 h-10 bg-yellow-400 rounded-xl flex items-center justify-center text-slate-900 shadow-lg">
              <Home size={24} strokeWidth={3} />
            </div>
            <span>FairShare</span>
          </div>

           <HouseholdSwitcher 
             groups={myGroups} 
             activeGroup={activeGroup} 
             onSwitch={switchGroup}
             onAdd={() => setView('onboarding')}
           />
        </div>
        
        <nav className="flex-1 px-4 space-y-3 mt-2">
          <NavButton active={view === 'dashboard'} onClick={() => setView('dashboard')} icon={<LayoutDashboard size={20}/>} label="Dashboard" />
          <NavButton active={view === 'expenses'} onClick={() => setView('expenses')} icon={<CreditCard size={20}/>} label="Expenses" />
          <NavButton active={view === 'add-expense'} onClick={() => setView('add-expense')} icon={<Plus size={20}/>} label="Add Bill" />
          <NavButton active={view === 'housemates'} onClick={() => setView('housemates')} icon={<Users size={20}/>} label="Housemates" />
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
          <button 
            onClick={signOut} 
            className="flex items-center gap-2 text-sm text-slate-400 hover:text-yellow-400 transition-colors w-full px-2"
          >
            <LogOut size={18} /> Sign Out
          </button>
        </div>
      </aside>

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

          {view === 'dashboard' && <DashboardView summary={summaryData} myGroups={myGroups} displayName={displayName} currentUserId={userId} expenses={expenses} />}
          {view === 'expenses' && <ExpensesView expenses={expenses} onMarkPaid={markAsPaid} currentUserId={userId} />}
          {view === 'add-expense' && <AddExpenseForm onAdd={addExpense} housemates={housemates} onCancel={() => setView('dashboard')} />}
          {view === 'join-group' && <JoinGroupForm onJoin={joinGroup} />}
          {view === 'housemates' && <HousematesView housemates={housemates} currentUser={userEmail} />}
        </div>
      </main>
    </div>
  );
}

function NavButton({ active, onClick, icon, label }) {
  return (
    <button
      onClick={onClick}
      className={`w-full flex items-center gap-3 px-4 py-3.5 rounded-xl transition-all font-bold text-sm ${
        active 
          ? 'bg-yellow-400 text-slate-900 shadow-md transform scale-105' 
          : 'text-slate-400 hover:bg-slate-800 hover:text-white'
      }`}
    >
      {icon}
      {label}
    </button>
  );
}
