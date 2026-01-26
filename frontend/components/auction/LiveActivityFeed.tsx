'use client';

import React from 'react';
import { Activity, Zap, Gavel } from 'lucide-react';

interface ActivityItem {
  id: string;
  type: 'bid' | 'sold';
  user: string;
  model: string;
  amount: string;
  time: string;
}

const DUMMY_ACTIVITIES: ActivityItem[] = [
  { id: '1', type: 'bid', user: 'Guest_241', model: 'Air Jordan 1 Retro High OG', amount: '₩580,000', time: '방금 전' },
  { id: '2', type: 'sold', user: 'Guest_112', model: 'Dunk Low "Panda"', amount: '₩125,000', time: '1분 전' },
  { id: '3', type: 'bid', user: 'Guest_889', model: '990v5 MiUSA Gray Classic', amount: '₩325,000', time: '2분 전' },
  { id: '4', type: 'bid', user: 'Guest_004', model: 'Yeezy Boost 350 V2', amount: '₩290,000', time: '3분 전' },
];

export default function LiveActivityFeed() {
  return (
    <div className="w-full bg-bg-main border-y border-border-main/50 overflow-hidden py-3">
      <div className="max-w-7xl mx-auto px-5">
        <div className="flex items-center">
          {/* Label: Fixed area on the left */}
          <div className="flex items-center gap-3 shrink-0 bg-bg-main pr-6 z-10 relative">
            <div className="flex h-6 w-6 items-center justify-center rounded-full bg-brand-primary/10 text-brand-primary">
              <Activity size={14} className="animate-pulse" />
            </div>
            <span className="text-xs font-black text-brand-primary tracking-tighter uppercase">Live Activity</span>
            <div className="h-4 w-px bg-border-main ml-2" />
          </div>

          {/* Marquee Container: Clipping area for scrolling content */}
          <div className="flex-1 overflow-hidden relative">
            {/* Gradient Shadows: Fade in/out effect */}
            <div className="absolute left-0 top-0 bottom-0 w-12 bg-linear-to-r from-bg-main to-transparent z-10 pointer-events-none" />
            <div className="absolute right-0 top-0 bottom-0 w-12 bg-linear-to-l from-bg-main to-transparent z-10 pointer-events-none" />

            {/* Scrolling Items */}
            <div className="flex gap-12 animate-marquee hover:pause-marquee whitespace-nowrap">
              {[...DUMMY_ACTIVITIES, ...DUMMY_ACTIVITIES, ...DUMMY_ACTIVITIES].map((item, index) => (
                <div key={`${item.id}-${index}`} className="flex items-center gap-3 text-[13px] py-1">
                  <span className="font-bold text-text-main shrink-0">{item.user}</span>
                  <span className="text-text-muted shrink-0 text-[11px]">님이</span>
                  <span className="font-bold text-text-main truncate max-w-[150px]">{item.model}</span>
                  <span className="text-text-muted shrink-0 text-[11px]">에</span>
                  <div className="flex items-center gap-1.5">
                    <span className={item.type === 'bid' ? 'text-status-active font-bold' : 'text-status-urgent font-bold'}>
                      {item.amount}
                    </span>
                    <span className="text-text-sub font-bold">
                      {item.type === 'bid' ? '입찰' : '낙찰'}
                    </span>
                    {item.type === 'bid' ? <Zap size={12} className="text-status-active" /> : <Gavel size={12} className="text-status-urgent" />}
                  </div>
                  <span className="text-[11px] text-text-muted ml-1 shrink-0">{item.time}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
