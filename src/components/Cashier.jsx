import React, { useState, useEffect } from 'react';
import {
  BadgeCheck,
  Clock,
  Sparkles,
  Timer,
  UserCheck,
  Users
} from 'lucide-react';
import CustomerList from './CustomerList';

/**
 * Requirement A: Cashiers should be their own component.
 * Requirement: Display remaining time and time must tick.
 * Uses useState and useEffect hooks effectively to manage the active customer's
 * live countdown timer, progress bar, and automatic queue advancement.
 */
const Cashier = ({
  cashier,
  isPaused,
  tickSpeedMs = 1000,
  onServeNext,
  onCustomerCompleted
}) => {
  const { id, name, type, currentCustomer, queue, servedCount } = cashier;

  // Local state tracking the remaining seconds for the currently served customer
  const [remainingTime, setRemainingTime] = useState(
    currentCustomer ? currentCustomer.serviceTime : 0
  );

  // Effect 1: Automatically promote the first customer from this cashier's queue
  // when the cashier becomes idle and there are customers waiting in its line.
  useEffect(() => {
    if (!currentCustomer && queue.length > 0) {
      onServeNext(id);
    }
  }, [currentCustomer, queue.length, id, onServeNext]);

  // Effect 2: Synchronize remainingTime whenever a new customer starts being served
  useEffect(() => {
    if (currentCustomer) {
      setRemainingTime(currentCustomer.serviceTime);
    } else {
      setRemainingTime(0);
    }
  }, [currentCustomer]);

  // Effect 3: Active countdown timer that ticks down every second (or adjusted speed)
  useEffect(() => {
    if (!currentCustomer || isPaused) return;

    const timer = setInterval(() => {
      setRemainingTime((prevTime) => {
        if (prevTime <= 1) {
          clearInterval(timer);
          return 0;
        }
        return prevTime - 1;
      });
    }, tickSpeedMs);

    return () => clearInterval(timer);
  }, [currentCustomer, isPaused, tickSpeedMs]);

  // Effect 4: Complete customer service when remainingTime hits 0
  useEffect(() => {
    if (currentCustomer && remainingTime === 0) {
      onCustomerCompleted(id, currentCustomer);
    }
  }, [remainingTime, currentCustomer, id, onCustomerCompleted]);

  const isPriorityCashier = type === 'Priority';
  const isServingPriorityCustomer = currentCustomer?.type === 'Priority';

  const progressPercentage = currentCustomer
    ? Math.max(
        0,
        Math.min(
          100,
          ((currentCustomer.serviceTime - remainingTime) /
            currentCustomer.serviceTime) *
            100
        )
      )
    : 0;

  const totalLineLoad = (currentCustomer ? 1 : 0) + queue.length;

  return (
    <div
      className={`flex flex-col rounded-2xl border backdrop-blur-md transition-all duration-300 overflow-hidden ${
        isPriorityCashier
          ? 'bg-slate-900/75 border-rose-500/30 shadow-lg shadow-rose-950/20'
          : 'bg-slate-900/75 border-slate-800 shadow-lg shadow-slate-950/40'
      }`}
    >
      {/* Top Cashier Header */}
      <div
        className={`px-5 py-4 border-b flex items-center justify-between ${
          isPriorityCashier
            ? 'bg-gradient-to-r from-rose-950/50 via-slate-900/60 to-slate-900/60 border-rose-500/20'
            : 'bg-gradient-to-r from-blue-950/40 via-slate-900/60 to-slate-900/60 border-slate-800/80'
        }`}
      >
        <div className="flex items-center gap-3">
          <div
            className={`w-10 h-10 rounded-xl flex items-center justify-center border font-bold text-sm ${
              isPriorityCashier
                ? 'bg-rose-500/15 border-rose-500/40 text-rose-300'
                : 'bg-blue-500/15 border-blue-500/40 text-blue-300'
            }`}
          >
            #{id}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="font-bold text-base text-slate-100 tracking-tight">
                {name}
              </h3>
            </div>
            <p className="text-xs text-slate-400 flex items-center gap-1.5 mt-0.5">
              <span
                className={`inline-block w-1.5 h-1.5 rounded-full ${
                  currentCustomer
                    ? 'bg-emerald-400 animate-pulse'
                    : 'bg-slate-500'
                }`}
              />
              {currentCustomer ? 'Actively Serving' : 'Available / Idle'}
            </p>
          </div>
        </div>

        {/* Metrics pill */}
        <div className="flex flex-col items-end gap-1">
          <span
            className={`text-[11px] font-semibold px-2.5 py-0.5 rounded-full border ${
              isPriorityCashier
                ? 'bg-rose-500/10 text-rose-300 border-rose-500/30'
                : 'bg-blue-500/10 text-blue-300 border-blue-500/30'
            }`}
          >
            {isPriorityCashier ? 'Priority Lane' : 'Regular Lane'}
          </span>
          <span className="text-[11px] text-slate-400 font-mono">
            Served: <strong className="text-slate-200">{servedCount}</strong>
          </span>
        </div>
      </div>

      {/* Cashier Body */}
      <div className="p-5 flex-1 flex flex-col gap-5">
        {/* Now Serving Box (Matches PDF wireframe: "Idle Cashier" or "Now serving: Customer X (Ysecs remaining)") */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
              <UserCheck className="w-3.5 h-3.5 text-cyan-400" />
              Service Counter
            </span>
            {currentCustomer && (
              <span
                className={`text-[11px] font-mono font-semibold px-2 py-0.5 rounded border ${
                  isServingPriorityCustomer
                    ? 'bg-rose-500/15 text-rose-300 border-rose-500/30'
                    : 'bg-blue-500/15 text-blue-300 border-blue-500/30'
                }`}
              >
                {currentCustomer.type} Customer
              </span>
            )}
          </div>

          {currentCustomer ? (
            <div
              className={`relative rounded-xl border p-4 transition-all overflow-hidden ${
                isServingPriorityCustomer
                  ? 'bg-rose-950/25 border-rose-500/40'
                  : 'bg-blue-950/25 border-blue-500/40'
              }`}
            >
              <div className="flex items-center justify-between gap-2 mb-2">
                <div className="text-sm font-bold text-slate-100">
                  Now serving: Customer {currentCustomer.id}
                </div>
                <div className="flex items-center gap-1 text-xs font-mono font-bold text-cyan-300 bg-slate-900/80 px-2.5 py-1 rounded-lg border border-cyan-500/30">
                  <Timer className="w-3.5 h-3.5 text-cyan-400 animate-spin" style={{ animationDuration: '6s' }} />
                  <span>({remainingTime}secs remaining)</span>
                </div>
              </div>

              <div className="flex items-center justify-between text-[11px] text-slate-400 mb-2">
                <span>
                  Initial Service Time: {currentCustomer.serviceTime} secs
                </span>
                <span className="font-mono text-slate-300">
                  {Math.round(progressPercentage)}% complete
                </span>
              </div>

              {/* Smooth Progress Bar */}
              <div className="w-full h-2 bg-slate-950/80 rounded-full overflow-hidden border border-slate-800/80">
                <div
                  className={`h-full transition-all duration-300 rounded-full ${
                    isServingPriorityCustomer
                      ? 'bg-gradient-to-r from-rose-500 to-amber-500'
                      : 'bg-gradient-to-r from-blue-500 to-cyan-400'
                  }`}
                  style={{ width: `${progressPercentage}%` }}
                />
              </div>
            </div>
          ) : (
            <div className="rounded-xl border border-slate-800 bg-slate-950/50 py-5 px-4 text-center">
              <p className="text-sm font-medium text-slate-400">Idle Cashier</p>
              <p className="text-[11px] text-slate-500 mt-0.5">
                Ready for next customer assignment
              </p>
            </div>
          )}
        </div>

        {/* Queue Section for this Cashier (Uses CustomerList Component - Requirement B) */}
        <div className="flex-1 flex flex-col">
          <div className="flex items-center justify-between mb-2.5">
            <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
              <Users className="w-3.5 h-3.5 text-slate-400" />
              Queue
            </h4>
            <div className="flex items-center gap-2">
              <span className="text-[11px] font-mono text-slate-400 bg-slate-800/70 px-2 py-0.5 rounded-md">
                Waiting: <strong className="text-slate-200">{queue.length}</strong>
              </span>
              <span className="text-[11px] font-mono text-slate-400 bg-slate-800/70 px-2 py-0.5 rounded-md">
                Total Load: <strong className="text-cyan-300">{totalLineLoad}</strong>
              </span>
            </div>
          </div>

          <div className="flex-1">
            <CustomerList
              customers={queue}
              variant="cashier"
              emptyMessage="No customers queued in this lane."
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export default Cashier;

