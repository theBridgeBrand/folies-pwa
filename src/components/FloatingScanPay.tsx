import { Smartphone } from 'lucide-react';

interface FloatingScanPayProps {
  onClick: () => void;
}

export function FloatingScanPay({ onClick }: FloatingScanPayProps) {
  return (
    <button
      onClick={onClick}
      className="fixed bottom-6 right-6 z-40 bg-gradient-to-br from-primary to-primary-700 text-white p-5 rounded-full shadow-2xl hover:shadow-3xl hover:scale-105 transition-all duration-300 flex items-center gap-3 group"
      aria-label="Scan & Pay"
    >
      <Smartphone className="w-7 h-7" />
      <span className="font-bold text-lg whitespace-nowrap">
        Scan&Pay
      </span>
      <div className="absolute inset-0 rounded-full bg-white opacity-0 group-hover:opacity-20 transition-opacity"></div>
    </button>
  );
}
