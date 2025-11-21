import React, { useState } from 'react';
import { Home, Users, Plus, ArrowRight, LogOut } from 'lucide-react';

export default function OnboardingView({ displayName, onJoin, onCreate, signOut }) {
  const [joinCode, setJoinCode] = useState('');
  const [createName, setCreateName] = useState(''); 

  return (
    <div className="min-h-screen bg-slate-900 flex flex-col items-center justify-center p-6 relative overflow-hidden">
      <div className="absolute top-8 right-8">
        <button onClick={signOut} className="text-slate-400 hover:text-white flex items-center gap-2 text-sm font-bold transition-colors">
            Sign Out <LogOut size={16} />
        </button>
      </div>
      
      <div className="absolute top-[-10%] left-[-10%] w-96 h-96 bg-indigo-600 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob"></div>
      <div className="absolute bottom-[-10%] right-[-10%] w-96 h-96 bg-yellow-400 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob animation-delay-2000"></div>

      <div className="max-w-4xl w-full text-center space-y-12 z-10">
        <div className="space-y-4 animate-slide-up">
            <div className="inline-flex justify-center mb-4">
                <div className="w-24 h-24 bg-yellow-400 rounded-3xl flex items-center justify-center text-slate-900 shadow-2xl">
                    <Home size={48} strokeWidth={3} />
                </div>
            </div>
            <h1 className="text-5xl md:text-6xl font-black text-white tracking-tight">Welcome, {displayName}!</h1>
            <p className="text-xl text-slate-400 max-w-2xl mx-auto">You aren't part of a household yet. Join your roommates or start a new group to get organized.</p>
        </div>

        <div className="grid md:grid-cols-2 gap-8 text-left">
          {/* Option 1: Join - Dark Theme */}
          <div className="bg-slate-800 p-10 rounded-3xl shadow-2xl border border-slate-700 hover:border-yellow-400/50 hover:transform hover:-translate-y-2 transition-all duration-300 animate-slide-up delay-100">
            <div className="w-14 h-14 bg-yellow-400/20 text-yellow-400 rounded-2xl flex items-center justify-center mb-6">
                <Users size={28} strokeWidth={3} />
            </div>
            <h3 className="text-2xl font-black text-white mb-3">Join Existing</h3>
            <p className="text-slate-400 mb-8 font-medium">Got a code from a roommate? Enter it here to sync up instantly.</p>
            <form onSubmit={(e) => { e.preventDefault(); if(joinCode) onJoin(joinCode); }}>
                <input type="text" placeholder="Paste Group ID..." className="w-full p-4 bg-slate-700 border-2 border-slate-600 rounded-xl focus:border-yellow-400 focus:ring-0 mb-4 font-bold text-white placeholder-slate-400 outline-none transition-all" value={joinCode} onChange={(e) => setJoinCode(e.target.value)} />
                <button type="submit" className="w-full py-4 bg-yellow-400 text-slate-900 font-bold rounded-xl hover:bg-yellow-300 flex items-center justify-center gap-3 shadow-lg transition-all transform active:scale-95">
                    Join Now <ArrowRight size={20} strokeWidth={3} />
                </button>
            </form>
          </div>

          {/* Option 2: Create - Light Theme */}
          <div className="bg-white p-10 rounded-3xl shadow-2xl border border-gray-200 hover:border-indigo-500 hover:transform hover:-translate-y-2 transition-all duration-300 flex flex-col animate-slide-up delay-200">
            <div className="w-14 h-14 bg-indigo-100 text-indigo-600 rounded-2xl flex items-center justify-center mb-6">
                <Plus size={28} strokeWidth={3} />
            </div>
            <h3 className="text-2xl font-black text-slate-900 mb-3">Create New</h3>
            <p className="text-slate-500 mb-8 font-medium">Moving into a new place? Be the first to set up the digital household.</p>
            <form onSubmit={(e) => { e.preventDefault(); if(createName) onCreate(createName); }} className="mt-auto">
                <input type="text" placeholder="Household Name..." className="w-full p-4 bg-gray-50 border-2 border-gray-100 rounded-xl focus:border-indigo-500 focus:ring-0 mb-4 font-bold text-slate-900 outline-none transition-all" value={createName} onChange={(e) => setCreateName(e.target.value)} />
                <button type="submit" className="w-full py-4 bg-indigo-600 text-white font-bold rounded-xl hover:bg-indigo-700 flex items-center justify-center gap-3 shadow-lg transition-all transform active:scale-95">
                    Start Household
                </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
