import { AuctionStatus } from '@/types/auction';

interface BadgeProps {
  status: AuctionStatus;
}

export default function Badge({ status }: BadgeProps) {
  const statusConfig = {
    ongoing: {
      label: '진행중',
      className: 'bg-status-active/10 text-status-active',
    },
    ending_soon: {
      label: '종료임박',
      className: 'bg-status-urgent/10 text-status-urgent animate-pulse',
    },
    closed: {
      label: '종료',
      className: 'bg-text-muted/10 text-text-muted',
    },
  };
  const { label, className } = statusConfig[status];

  return (
    <span
      className={`px-2 py-0.5 rounded-full text-[10px] font-bold tracking-tight ${className}`}
    >
      {label}
    </span>
  );
}
