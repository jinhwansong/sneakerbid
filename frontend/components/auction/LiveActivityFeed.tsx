'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { Bell } from 'lucide-react';

const activities = [
  { id: 1, user: 'Agent-Alpha', type: 'AGENT', item: '에어 조던 1 하이 시카고', bid: '620,000원' },
  { id: 2, user: 'Agent-Beta', type: 'AGENT', item: '이지 부스트 350 V2', bid: '345,000원' },
  { id: 3, user: 'G-771', type: 'GUEST', item: '뉴발란스 990v3', bid: '290,000원' },
];

export const LiveActivityFeed = () => {
  return (
    <div className="overflow-hidden bg-bg-sub/50 rounded-lg border border-border-main/30 px-5 py-5">
      <div className="flex items-center gap-4">
        <div className="flex items-center gap-2 text-brand-primary shrink-0">
          <div className="relative">
            <Bell size={14} fill="currentColor" />
            <span className="absolute -top-1 -right-1 w-2 h-2 bg-status-urgent rounded-full border-2 border-bg-main" />
          </div>
          <span className="text-[11px] font-black uppercase tracking-widest">LIVE FEED</span>
        </div>
        
        <div className="h-4 w-px bg-border-main/50" />

        <div className="flex-1 relative h-5">
          <motion.div
            animate={{
              y: [0, -20, -40],
            }}
            transition={{
              duration: 8,
              repeat: Infinity,
              ease: "linear",
            }}
            className="flex flex-col gap-0 text-[12px] font-medium text-text-sub"
          >
            {activities.concat(activities[0]).map((activity, i) => (
              <div key={i} className="h-5 flex items-center gap-1.5 whitespace-nowrap">
                {activity.type === 'AGENT' && (
                  <span className="bg-brand-primary/10 text-brand-primary text-[9px] px-1.5 py-0.5 rounded font-bold tracking-tighter leading-none mr-0.5">
                    AGENT
                  </span>
                )}
                <span className="font-bold text-text-main">{activity.user}</span>
                <span>님이</span>
                <span className="font-bold text-text-main">[{activity.item}]</span>
                <span>에</span>
                <span className="font-bold text-brand-primary">{activity.bid}</span>
                <span>입찰했습니다.</span>
              </div>
            ))}
          </motion.div>
        </div>
      </div>
    </div>
  );
};
