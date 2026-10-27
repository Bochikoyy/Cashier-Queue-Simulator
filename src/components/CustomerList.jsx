import React from 'react';
import { Clock, ShieldAlert, User } from 'lucide-react';

/**
 * Requirement B: List of customers should also be their own component.
 * Used in both the central Waiting Queue and each Cashier's individual queue.
 * Color codes customers:
 *  - Priority: Red / Rose theme (matches the red text in the PDF specification)
 *  - Normal: Blue / Indigo theme (matches the blue text in the PDF specification)
 */
const CustomerList = ({
  customers = [],
  variant = 'waiting', // 'waiting' | 'cashier'
  emptyMessage = 'No customers waiting.'
}) => {
  if (!customers || customers.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-8 px-4 text-center border border-dashed border-slate-800/80 rounded-xl bg-slate-900/30">
        <div className="w-9 h-9 rounded-full bg-slate-800/60 flex items-center justify-center mb-2 text-slate-500">
          <User className="w-4 h-4" />
        </div>
        <p className="text-xs font-medium text-slate-500 italic">
          {emptyMessage}
        </p>
      </div>
    );
  }

  return (
    <ul className="space-y-2 max-h-[360px] overflow-y-auto pr-1 custom-scrollbar">
      {customers.map((customer, index) => {
        const isPriority = customer.type === 'Priority';

        return (
          <li
            key={customer.id}
            className={`group relative flex items-center justify-between px-3 py-2.5 rounded-xl border transition-all duration-200 ${
              isPriority
                ? 'bg-rose-950/35 border-rose-500/30 hover:border-rose-500/50 text-rose-200 shadow-sm shadow-rose-950/30'
                : 'bg-blue-950/35 border-blue-500/30 hover:border-blue-500/50 text-blue-200 shadow-sm shadow-blue-950/30'
            }`}
          >
            {/* Left accent bar + bullet indicator */}
            <div className="flex items-center gap-2.5 min-w-0">
              <span
                className={`w-2 h-2 rounded-full shrink-0 ${
                  isPriority
                    ? 'bg-rose-500 shadow-[0_0_8px_rgba(244,63,94,0.8)]'
                    : 'bg-blue-400 shadow-[0_0_8px_rgba(96,165,250,0.8)]'
                }`}
              />

              {variant === 'waiting' ? (
                <div className="flex items-center gap-2 truncate">
                  <span
                    className={`font-mono text-xs font-semibold tracking-tight ${
                      isPriority ? 'text-rose-300' : 'text-blue-300'
                    }`}
                  >
                    ID: {customer.id} | {customer.serviceTime}
                  </span>
                </div>
              ) : (
                <div className="flex items-center gap-1.5 truncate">
                  <span
                    className={`font-mono text-xs font-semibold tracking-tight ${
                      isPriority ? 'text-rose-300' : 'text-blue-300'
                    }`}
                  >
                    Customer #{customer.id} ({customer.serviceTime} secs)
                  </span>
                </div>
              )}
            </div>

            {/* Right badge showing type & queue position */}
            <div className="flex items-center gap-1.5 shrink-0 ml-2">
              {variant === 'waiting' && (
                <span className="inline-flex items-center gap-1 text-[10px] font-mono text-slate-400 bg-slate-900/70 px-1.5 py-0.5 rounded border border-slate-800">
                  <Clock className="w-2.5 h-2.5" />
                  {customer.serviceTime}s
                </span>
              )}
              <span
                className={`inline-flex items-center gap-1 text-[10px] font-semibold uppercase tracking-wider px-2 py-0.5 rounded-full border ${
                  isPriority
                    ? 'bg-rose-500/15 text-rose-300 border-rose-500/30'
                    : 'bg-blue-500/15 text-blue-300 border-blue-500/30'
                }`}
              >
                {isPriority && <ShieldAlert className="w-2.5 h-2.5" />}
                {customer.type}
              </span>
              {index === 0 && (
                <span className="text-[10px] font-mono font-medium text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-1.5 py-0.5 rounded">
                  Next
                </span>
              )}
            </div>
          </li>
        );
      })}
    </ul>
  );
};

export default CustomerList;

