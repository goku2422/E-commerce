import React from 'react';
import { CheckCircle2, Clock, Truck, Package, PackageCheck, AlertTriangle } from 'lucide-react';

export default function OrderTracker({ status, statusHistory = [] }) {
  const steps = [
    { key: 'PLACED', label: 'Order Placed', icon: Clock },
    { key: 'CONFIRMED', label: 'Confirmed', icon: CheckCircle2 },
    { key: 'PACKED', label: 'Packed', icon: Package },
    { key: 'SHIPPED', label: 'Shipped', icon: Truck },
    { key: 'OUT FOR DELIVERY', label: 'Out for Delivery', icon: Truck },
    { key: 'DELIVERED', label: 'Delivered', icon: PackageCheck },
  ];

  if (status === 'CANCELLED' || status === 'REFUNDED') {
    return (
      <div className="bg-rose-50 border border-rose-200/80 rounded-3xl p-6 flex items-center space-x-4 text-rose-800">
        <AlertTriangle className="w-6 h-6 shrink-0 text-rose-600" />
        <div>
          <h4 className="font-semibold text-sm uppercase tracking-wider">Order Cancelled</h4>
          <p className="text-xs text-rose-600 font-light mt-0.5">This order has been cancelled and stock returned to inventory.</p>
        </div>
      </div>
    );
  }

  const currentStepIndex = steps.findIndex((s) => s.key === status);
  const activeIndex = currentStepIndex === -1 ? 0 : currentStepIndex;

  return (
    <div className="bg-white rounded-3xl p-8 border border-neutral-200/80 shadow-sm space-y-6">
      <h4 className="text-xs font-semibold text-neutral-400 uppercase tracking-widest">Delivery Progress</h4>
      <div className="relative">
        {/* Progress line */}
        <div className="hidden sm:block absolute left-0 top-1/2 -translate-y-1/2 w-full h-0.5 bg-neutral-100 -z-0">
          <div
            className="h-full bg-neutral-900 transition-all duration-500"
            style={{ width: `${(activeIndex / (steps.length - 1)) * 100}%` }}
          />
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-6 gap-4 relative z-10">
          {steps.map((step, idx) => {
            const isPassed = idx <= activeIndex;
            const isCurrent = idx === activeIndex;
            const Icon = step.icon;

            const historyEntry = statusHistory.find((h) => h.status === step.key);

            return (
              <div key={step.key} className="flex flex-col items-center text-center">
                <div
                  className={`w-10 h-10 rounded-full flex items-center justify-center transition-all ${
                    isCurrent
                      ? 'bg-neutral-900 text-white ring-4 ring-neutral-200 scale-110 shadow-md'
                      : isPassed
                      ? 'bg-emerald-600 text-white'
                      : 'bg-neutral-100 text-neutral-400 border border-neutral-200'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                </div>
                <span className={`text-[11px] font-semibold tracking-tight mt-3 ${isPassed ? 'text-neutral-900' : 'text-neutral-400 font-light'}`}>
                  {step.label}
                </span>
                {historyEntry && (
                  <span className="text-[10px] text-neutral-400 font-mono mt-0.5">
                    {new Date(historyEntry.timestamp).toLocaleDateString([], { month: 'short', day: 'numeric' })}
                  </span>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
