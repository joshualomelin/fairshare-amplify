import React from 'react';

export default function HousematesView({ housemates, currentUser }) {
  const filteredHousemates = housemates.filter(mate => mate.email !== currentUser);
  
  return (
    <div className="space-y-8 animate-slide-up">
      <h1 className="text-3xl font-extrabold text-slate-900">Your Household</h1>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-gradient-to-br from-slate-900 to-slate-800 p-8 rounded-3xl shadow-lg flex items-center gap-6 border border-slate-700 transform hover:scale-[1.02] transition-transform">
            <div className="w-20 h-20 bg-yellow-400 rounded-2xl flex items-center justify-center text-3xl font-black text-slate-900 shadow-lg">ME</div>
            <div>
                <h3 className="font-black text-white text-2xl">You</h3>
                <p className="text-slate-400 font-medium mb-2">{currentUser}</p>
                <span className="inline-block px-3 py-1 bg-slate-700 text-white text-xs font-bold rounded-lg tracking-wide uppercase">Admin</span>
            </div>
        </div>
        {filteredHousemates.map(mate => (
          <div key={mate.id} className="bg-white p-8 rounded-3xl shadow-sm border border-gray-100 flex items-center gap-6 hover:shadow-md transition-shadow">
              <div className="w-20 h-20 bg-gray-100 rounded-2xl flex items-center justify-center text-3xl font-bold text-slate-400">
                {mate.avatar}
              </div>
              <div>
                  <h3 className="font-bold text-slate-900 text-xl">{mate.name}</h3>
                  <p className="text-slate-500 font-medium mb-2">{mate.email}</p>
                  {mate.role && <span className="inline-block px-3 py-1 bg-indigo-50 text-indigo-700 border border-indigo-100 text-xs font-bold rounded-lg tracking-wide uppercase">{mate.role}</span>}
              </div>
          </div>
        ))}
      </div>
    </div>
  );
}
