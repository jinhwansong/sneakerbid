'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { Users, Gavel, BarChart3, Zap, Activity } from 'lucide-react';

const stats = [
  { 
    label: '실시간 입찰자', 
    value: '1,284', 
    icon: Users,
    color: 'text-brand-primary'
  },
  { 
    label: '진행 중인 경매', 
    value: '42', 
    icon: Gavel,
    color: 'text-status-active'
  },
  { 
    label: '24시간 거래액', 
    value: '8.4', 
    unit: '억',
    icon: BarChart3,
    color: 'text-text-main'
  },
  { 
    label: '평균 입찰 속도', 
    value: '0.8', 
    unit: '초',
    icon: Zap,
    color: 'text-status-urgent'
  },
];

export const LiveStats: React.FC = () => {
  return (
    <div className="w-full bg-bg-main border border-border-main rounded-lg overflow-hidden shadow-sm">
      <div className="flex flex-col md:flex-row items-center divide-y md:divide-y-0 md:divide-x divide-border-main/50">
        <div className="w-full md:w-auto px-8 py-6 flex items-center gap-3 shrink-0 bg-bg-sub/30">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-brand-primary text-white shadow-lg shadow-brand-primary/20">
            <Activity size={20} />
          </div>
          <div>
            <p className="text-[10px] font-black text-brand-primary uppercase tracking-widest leading-none mb-1">Live</p>
            <h3 className="text-sm font-bold text-text-main leading-none">실시간 마켓 지표</h3>
          </div>
        </div>

        {/* Stats Items */}
        <div className="flex-1 grid grid-cols-2 lg:grid-cols-4 w-full">
          {stats.map((stat, i) => (
            <motion.div 
              key={stat.label}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.1 }}
              className="px-8 py-4 flex flex-col gap-1 hover:bg-bg-sub/20 transition-colors cursor-default"
            >
              <div className="flex items-center gap-2">
                <stat.icon size={14} className={stat.color} />
                <p className="text-[11px] font-bold text-text-muted uppercase tracking-wider">{stat.label}</p>
              </div>
              <div className="flex items-baseline gap-1">
                <span className="text-2xl font-black text-text-main tabular-nums">
                  {stat.value}
                </span>
                {stat.unit && <span className="text-[11px] font-black text-text-muted ml-0.5 uppercase">{stat.unit}</span>}
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </div>
  );
};
