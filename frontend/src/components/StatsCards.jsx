import React from 'react';
import { Users, UserCheck, UserX, Award } from 'lucide-react';

const StatsCards = ({ stats }) => {
  const { total_students = 0, present_today = 0, absent_today = 0, attendance_rate = 0 } = stats;

  const cardConfig = [
    {
      title: 'Total Students',
      value: total_students,
      icon: <Users className="w-6 h-6 text-indigo-400" />,
      bgIcon: 'bg-indigo-950/60 border-indigo-500/20 text-indigo-400',
      glow: 'shadow-indigo-500/5',
      accent: 'from-indigo-500 to-violet-500',
    },
    {
      title: 'Present Today',
      value: present_today,
      icon: <UserCheck className="w-6 h-6 text-emerald-400" />,
      bgIcon: 'bg-emerald-950/60 border-emerald-500/20 text-emerald-400',
      glow: 'shadow-emerald-500/5',
      accent: 'from-emerald-500 to-teal-500',
    },
    {
      title: 'Absent Today',
      value: absent_today,
      icon: <UserX className="w-6 h-6 text-rose-400" />,
      bgIcon: 'bg-rose-950/60 border-rose-500/20 text-rose-400',
      glow: 'shadow-rose-500/5',
      accent: 'from-rose-500 to-pink-500',
    },
    {
      title: 'Attendance Rate',
      value: `${attendance_rate}%`,
      icon: <Award className="w-6 h-6 text-cyan-400" />,
      bgIcon: 'bg-cyan-950/60 border-cyan-500/20 text-cyan-400',
      glow: 'shadow-cyan-500/5',
      accent: 'from-cyan-500 to-sky-500',
    },
  ];

  return (
    <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
      {cardConfig.map((card, index) => (
        <div
          key={index}
          className={`glass-card p-6 rounded-2xl relative overflow-hidden transition-all duration-300 hover:-translate-y-1 shadow-lg ${card.glow}`}
        >
          {/* Subtle background glow */}
          <div className="absolute top-0 right-0 -mt-4 -mr-4 w-20 h-20 bg-slate-500/5 rounded-full blur-xl"></div>
          
          {/* Top border highlight */}
          <div className={`absolute top-0 left-0 right-0 h-1 bg-gradient-to-r ${card.accent}`}></div>

          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
                {card.title}
              </p>
              <h3 className="mt-2 text-3xl font-extrabold text-white tracking-tight">
                {card.value}
              </h3>
            </div>
            <div className={`flex items-center justify-center w-12 h-12 rounded-xl border ${card.bgIcon}`}>
              {card.icon}
            </div>
          </div>
        </div>
      ))}
    </div>
  );
};

export default StatsCards;
