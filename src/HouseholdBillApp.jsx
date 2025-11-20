import React, { useState, useEffect } from 'react';
import { DollarSign, Plus, LogOut, Home, Users, CreditCard, CheckCircle, Loader2 } from 'lucide-react';

// ==========================================
// AWS AMPLIFY SETUP
// ==========================================
import { Amplify } from 'aws-amplify';
import { Authenticator } from '@aws-amplify/ui-react';
import '@aws-amplify/ui-react/styles.css';
import outputs from '../amplify_outputs.json'; 

Amplify.configure(outputs);

// ==========================================
// API CONFIGURATION
// ==========================================
const API_BASE_URL = "https://lfesbjfali.execute-api.us-west-1.amazonaws.com";

// For prototype logic, we assume the current user corresponds to "dummy-user"
const CURRENT_USER_API_ID = 'dummy-user'; 

// ==========================================
// MAIN APP COMPONENT
// ==========================================
export default function App() {
  return (
    <Authenticator>
      {({ signOut, user }) => (
        <AppContent user={user} signOut={signOut} />
      )}
    </Authenticator>
  );
}

function AppContent({ user, signOut }) {
  const [view, setView] = useState('dashboard'); 
  const [summaryData, setSummaryData] = useState(null);
  const [expenses, setExpenses] = useState([]);
  const [housemates, setHousemates] = useState([]);
  const [myGroups, setMyGroups] = useState([]); 
  const [activeGroupId, setActiveGroupId] = useState(null); 
  const [loading, setLoading] = useState(true);
  const [showNotification, setShowNotification] = useState(false);

  const userEmail = user?.signInDetails?.loginId || user?.username || 'User';
  const displayName = userEmail.split('@')[0]; 
  const initials = displayName.substring(0, 2).toUpperCase();

  // ----------------------------------------
  // DATA FETCHING
  // ----------------------------------------
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        
        // 1. Fetch Groups
        const groupsRes = await fetch(`${API_BASE_URL}/groups`);
        const groupsJson = await groupsRes.json();
        setMyGroups(groupsJson);

        let targetGroupId = null;
        if (groupsJson.length > 0) {
          targetGroupId = groupsJson[0].groupId;
          setActiveGroupId(targetGroupId);
        } else {
           setLoading(false);
           return; 
        }

        // 2. Fetch Dashboard Summary
        // Now using the updated response structure with 'myAmount'
        const summaryRes = await fetch(`${API_BASE_URL}/me/summary`);
        const summaryJson = await summaryRes.json();
        setSummaryData(summaryJson);

        // 3. Fetch Group Bills
        if (targetGroupId) {
            const billsRes = await fetch(`${API_BASE_URL}/groups/${targetGroupId}/bills`);
            const billsJson = await billsRes.json();
            
            const formattedBills = billsJson.map(bill => ({
              id: bill.billId,
              title: bill.description,
              amount: bill.amount,
              payer: bill.createdBy === CURRENT_USER_API_ID ? 'You' : 'Housemate',
              createdBy: bill.createdBy,
              date: bill.createdAt ? bill.createdAt.split('T')[0] : '2025-11-01', 
              type: 'General',
              status: 'Pending'
            }));
            setExpenses(formattedBills);

            // 4. Fetch Group Details (Housemates)
            const groupDetailRes = await fetch(`${API_BASE_URL}/groups/${targetGroupId}`);
            const groupDetailJson = await groupDetailRes.json();
            
            const formattedHousemates = (groupDetailJson.members || []).map(member => ({
              id: member.userId,
              name: member.userId === CURRENT_USER_API_ID ? 'You' : member.userId, 
              email: 'unknown@example.com', 
              role: member.role,
              avatar: member.userId.substring(0, 2).toUpperCase() 
            }));
            setHousemates(formattedHousemates);
        }

      } catch (error) {
        console.error("Data Load Error:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  // ----------------------------------------
  // ADD EXPENSE ACTION
  // ----------------------------------------
  const addExpense = async (newExpenseData) => {
    if (!activeGroupId) {
        alert("No active group found. Cannot create bill.");
        return;
    }

    const shareCount = housemates.length;
    if (shareCount === 0) return; 

    const splitAmount = parseFloat((newExpenseData.amount / shareCount).toFixed(2));
    
    const sharesPayload = housemates.map(member => ({
        userId: member.id,
        amount: splitAmount,
        status: "due"
    }));

    try {
      const response = await fetch(`${API_BASE_URL}/groups/${activeGroupId}/bills`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          description: newExpenseData.title,
          amount: newExpenseData.amount,
          dueDate: newExpenseData.date,
          shares: sharesPayload
        })
      });

      if (response.ok) {
        const savedBill = await response.json();
        
        const newBillUI = {
          id: savedBill.billId || Date.now(),
          title: savedBill.description,
          amount: savedBill.amount,
          payer: 'You',
          createdBy: CURRENT_USER_API_ID,
          date: newExpenseData.date,
          type: 'Personal',
          status: 'Pending'
        };
        
        setExpenses([newBillUI, ...expenses]);
        setView('expenses');
        setShowNotification(true);
        setTimeout(() => setShowNotification(false), 3000);
      }
    } catch (error) {
      console.error("Error adding expense:", error);
      alert("Could not save expense. Please try again later.");
    }
  };

  if (loading) {
    return (
      <div className="h-screen flex items-center justify-center bg-gray-50 text-indigo-600">
        <Loader2 className="animate-spin mr-2" /> Loading household...
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-gray-50 font-sans text-slate-800">
      {/* SIDEBAR */}
      <aside className="w-64 bg-white border-r border-gray-200 hidden md:flex flex-col">
        <div className="p-6 border-b border-gray-100">
          <div className="flex items-center gap-2 font-bold text-indigo-600 text-xl">
            <Home size={24} />
            <span>FairShare</span>
          </div>
          <p className="text-xs text-gray-400 mt-1">Household Bill Service</p>
        </div>
        
        <nav className="flex-1 p-4 space-y-2">
          <NavButton active={view === 'dashboard'} onClick={() => setView('dashboard')} icon={<Home size={20}/>} label="Dashboard" />
          <NavButton active={view === 'expenses'} onClick={() => setView('expenses')} icon={<CreditCard size={20}/>} label="Expenses" />
          <NavButton active={view === 'add-expense'} onClick={() => setView('add-expense')} icon={<Plus size={20}/>} label="Add Bill" />
          <NavButton active={view === 'housemates'} onClick={() => setView('housemates')} icon={<Users size={20}/>} label="Housemates" />
        </nav>

        <div className="p-4 border-t border-gray-100">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-8 h-8 rounded-full bg-indigo-100 text-indigo-600 flex items-center justify-center text-sm font-bold">
              {initials}
            </div>
            <div className="text-sm overflow-hidden">
              <p className="font-medium truncate max-w-[140px]" title={userEmail}>{displayName}</p>
              <p className="text-xs text-green-600 flex items-center gap-1">
                <span className="w-2 h-2 bg-green-500 rounded-full"></span> Online
              </p>
            </div>
          </div>
          <button onClick={signOut} className="flex items-center gap-2 text-sm text-gray-600 hover:text-red-600 transition-colors w-full">
            <LogOut size={16} /> Sign Out
          </button>
        </div>
      </aside>

      {/* MAIN CONTENT */}
      <main className="flex-1 overflow-y-auto">
        <header className="bg-white border-b border-gray-200 p-4 md:hidden flex justify-between items-center sticky top-0 z-10">
          <span className="font-bold text-indigo-600">FairShare</span>
          <button onClick={signOut}><LogOut size={20} className="text-gray-500" /></button>
        </header>

        <div className="max-w-5xl mx-auto p-6">
          {showNotification && (
            <div className="fixed top-4 right-4 bg-green-600 text-white px-4 py-3 rounded-lg shadow-lg flex items-center gap-2 animate-bounce z-50">
              <CheckCircle size={20} />
              <span>Expense saved successfully.</span>
            </div>
          )}

          {view === 'dashboard' && <DashboardView summary={summaryData} myGroups={myGroups} displayName={displayName} />}
          {view === 'expenses' && <ExpensesView expenses={expenses} />}
          {view === 'add-expense' && <AddExpenseForm onAdd={addExpense} housemates={housemates} onCancel={() => setView('dashboard')} />}
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
    <button
      onClick={onClick}
      className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-all ${
        active ? 'bg-indigo-50 text-indigo-700 font-medium' : 'text-gray-600 hover:bg-gray-50'
      }`}
    >
      {icon}
      {label}
    </button>
  );
}

function DashboardView({ summary, myGroups, displayName }) {
  const totalOwed = summary?.totalowed || 0;
  
  // Calculate "Owed to Me" based on the new summary bills array
  // Logic: Sum 'myAmount' for all bills where 'status' is 'due' (and potentially filter by payer if API provides it)
  // For this iteration, we sum 'myAmount' from the bills list as a proxy for active credit/debit activity
  const bills = summary?.bills || [];
  const activeBillSum = bills.reduce((sum, bill) => sum + (bill.myAmount || 0), 0);

  // Since 'totalOwed' is what I OWE, and 'activeBillSum' tracks my stake in bills...
  // We approximate 'Owed to Me' by checking if I paid the full amount but 'totalOwed' tracks my share.
  // NOTE: This logic is simplified. A real system needs distinct 'owedToMe' field.
  // We'll treat positive 'myAmount' on bills I created as potential credit.
  const owedToMe = activeBillSum > totalOwed ? (activeBillSum - totalOwed) : 0; 
  
  const netBalance = owedToMe - totalOwed;

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-end">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
          <p className="text-gray-500">Welcome back, <span className="capitalize">{displayName}</span>!</p>
        </div>
      </div>

      {/* SUMMARY CARDS */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
          <p className="text-sm text-gray-500 mb-1">Net Balance</p>
          <p className={`text-3xl font-bold ${netBalance >= 0 ? 'text-gray-900' : 'text-red-600'}`}>
            ${Math.abs(netBalance).toFixed(2)}
          </p>
          <p className="text-xs text-gray-400 mt-1">{netBalance >= 0 ? 'You are owed money' : 'You are in debt'}</p>
        </div>
        <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
          <p className="text-sm text-gray-500 mb-1">You Owe</p>
          <p className="text-3xl font-bold text-red-600">${totalOwed}</p>
          <p className="text-xs text-red-400 mt-1">Outgoing</p>
        </div>
        <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
          <p className="text-sm text-gray-500 mb-1">Owed to You</p>
          <p className="text-3xl font-bold text-green-600">${owedToMe.toFixed(2)}</p>
          <p className="text-xs text-green-400 mt-1">Incoming</p>
        </div>
      </div>

      {/* GROUPS LIST */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
        <div className="p-4 border-b border-gray-100">
          <h2 className="font-bold text-gray-800">My Groups</h2>
        </div>
        <div className="divide-y divide-gray-100">
          {myGroups?.map((group) => (
            <div key={group.groupId} className="p-4 flex items-center justify-between hover:bg-gray-50">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-600 font-bold">
                  <Home size={18} />
                </div>
                <div>
                  <p className="font-medium text-gray-900">{group.name}</p>
                  <p className="text-xs text-gray-500">ID: {group.groupId}</p>
                </div>
              </div>
              <div className="text-right">
                <span className="font-bold text-gray-700">
                  Owner
                </span>
              </div>
            </div>
          ))}
          {!myGroups?.length && (
            <div className="p-4 text-center text-gray-500 text-sm">No groups found.</div>
          )}
        </div>
      </div>
    </div>
  );
}

function ExpensesView({ expenses }) {
  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-gray-900">Group Expenses</h1>
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
        <table className="w-full text-left border-collapse">
          <thead className="bg-gray-50 text-gray-500 text-sm uppercase">
            <tr>
              <th className="p-4 font-medium">Bill</th>
              <th className="p-4 font-medium">Date</th>
              <th className="p-4 font-medium">Payer</th>
              <th className="p-4 font-medium text-right">Amount</th>
              <th className="p-4 font-medium text-center">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {expenses.map((expense) => (
              <tr key={expense.id} className="hover:bg-gray-50">
                <td className="p-4 font-medium text-gray-900">{expense.title}</td>
                <td className="p-4 text-gray-600">{expense.date}</td>
                <td className="p-4 text-gray-600">{expense.payer}</td>
                <td className="p-4 text-right font-bold text-gray-900">${expense.amount}</td>
                <td className="p-4 text-center">
                  <span className="px-2 py-1 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                    {expense.status}
                  </span>
                </td>
              </tr>
            ))}
            {expenses.length === 0 && (
               <tr>
                 <td colSpan="5" className="p-8 text-center text-gray-500">No expenses recorded yet.</td>
               </tr>
            )}
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

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!amount || !title) return;
    
    onAdd({
      title,
      amount: parseFloat(amount),
      date
    });
  };

  return (
    <div className="max-w-lg mx-auto">
      <h1 className="text-2xl font-bold text-gray-900 mb-6">Add New Bill</h1>
      <form onSubmit={handleSubmit} className="bg-white p-8 rounded-xl border border-gray-200 shadow-lg space-y-6">
        
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Description</label>
          <input 
            type="text" 
            placeholder="e.g. PG&E Bill"
            className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:outline-none"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Amount ($)</label>
            <input 
              type="number" 
              placeholder="0.00"
              className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:outline-none"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Due Date</label>
            <input 
              type="date"
              className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:outline-none bg-white"
              value={date}
              onChange={(e) => setDate(e.target.value)}
            />
          </div>
        </div>

        <div className="pt-4 flex gap-3">
          <button 
            type="button"
            onClick={onCancel}
            className="flex-1 px-4 py-3 text-gray-700 font-medium bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
          >
            Cancel
          </button>
          <button 
            type="submit"
            className="flex-1 px-4 py-3 text-white font-medium bg-indigo-600 rounded-lg hover:bg-indigo-700 transition-colors shadow-md"
          >
            Save Expense
          </button>
        </div>
      </form>
    </div>
  );
}

function HousematesView({ housemates, currentUser }) {
  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-gray-900">Your Household</h1>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Current User Card */}
        <div className="bg-indigo-50 p-6 rounded-xl border border-indigo-100 shadow-sm flex items-center gap-4">
          <div className="w-16 h-16 bg-indigo-600 rounded-full flex items-center justify-center text-2xl font-bold text-white">
            ME
          </div>
          <div>
            <h3 className="font-bold text-gray-900 text-lg">You</h3>
            <p className="text-gray-600 text-sm">{currentUser}</p>
            <span className="inline-block mt-1 text-xs bg-indigo-200 text-indigo-800 px-2 py-0.5 rounded font-medium">Active User</span>
          </div>
        </div>

        {/* Other Housemates */}
        {housemates.map(mate => (
          <div key={mate.id} className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm flex items-center gap-4">
            <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center text-2xl font-bold text-gray-500">
              {mate.avatar}
            </div>
            <div>
              <h3 className="font-bold text-gray-900 text-lg">{mate.name}</h3>
              <p className="text-gray-500 text-sm">{mate.email}</p>
              {mate.role && <span className="inline-block mt-1 text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded font-medium capitalize">{mate.role}</span>}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
