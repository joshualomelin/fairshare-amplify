import React, { useState, useRef, useEffect } from 'react';
import { Home, ChevronDown, PlusCircle } from 'lucide-react';

export default function HouseholdSwitcher({ groups, activeGroup, onSwitch, onAdd }) {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef(null);

  useEffect(() => {
    function handleClickOutside(event) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <div className="relative" ref={dropdownRef}>
      <button 
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center justify-between p-3 bg-slate-800 hover:bg-slate-700 rounded-xl border border-slate-700 transition-colors group"
      >
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-slate-700 rounded-lg flex items-center justify-center text-yellow-400 shadow-sm group-hover:bg-slate-600 transition-colors">
            <Home size={18} strokeWidth={2.5} />
          </div>
          <div className="text-left overflow-hidden">
              <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Current</p>
              <p className="text-sm font-bold text-white truncate max-w-[140px]">{activeGroup.name}</p>
          </div>
        </div>
        <ChevronDown size={16} className={`text-slate-400 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {isOpen && (
        <div className="absolute top-full left-0 w-full mt-2 bg-slate-800 border border-slate-700 rounded-xl shadow-2xl overflow-hidden z-50 animate-slide-up">
           <div className="max-h-60 overflow-y-auto">
             {groups.map(group => (
               <button
                 key={group.groupId}
                 onClick={() => { onSwitch(group.groupId); setIsOpen(false); }}
                 className={`w-full text-left px-4 py-3 flex items-center gap-3 hover:bg-slate-700 transition-colors ${
                   activeGroup.groupId === group.groupId ? 'bg-slate-700/50' : ''
                 }`}
               >
                 <div className={`w-2 h-2 rounded-full ${activeGroup.groupId === group.groupId ? 'bg-yellow-400' : 'bg-slate-500'}`} />
                 <span className={`text-sm font-medium ${activeGroup.groupId === group.groupId ? 'text-white' : 'text-slate-300'}`}>
                   {group.name}
                 </span>
               </button>
             ))}
           </div>
           <div className="border-t border-slate-700 p-2">
             <button 
               onClick={() => { onAdd(); setIsOpen(false); }}
               className="w-full flex items-center justify-center gap-2 p-2 text-sm font-bold text-yellow-400 hover:bg-slate-700 rounded-lg transition-colors"
             >
               <PlusCircle size={16} /> Add / Join New
             </button>
           </div>
        </div>
      )}
    </div>
  );
}
