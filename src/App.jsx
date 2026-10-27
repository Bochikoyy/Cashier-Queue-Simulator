import React, { useState, useEffect, useCallback } from 'react';
import {
  Activity,
  ArrowRight,
  CheckCircle2,
  FastForward,
  Info,
  Layers,
  Pause,
  Play,
  PlusCircle,
  RotateCcw,
  ShieldAlert,
  Sparkles,
  UserPlus,
  Users,
  Zap
} from 'lucide-react';
import Cashier from './components/Cashier';
import CustomerList from './components/CustomerList';

// Initial Cashiers Configuration matching the PDF specification:
// 1 Priority Cashier and 2 Regular Cashiers
const createInitialCashiers = () => [
  {
    id: 1,
    name: 'Priority Cashier',
    type: 'Priority',
    currentCustomer: null,
    queue: [],
    servedCount: 0
  },
  {
    id: 2,
    name: 'Regular Cashier',
    type: 'Regular',
    currentCustomer: null,
    queue: [],
    servedCount: 0
  },
  {
    id: 3,
    name: 'Regular Cashier',
    type: 'Regular',
    currentCustomer: null,
    queue: [],
    servedCount: 0
  }
];

/**
 * Pure helper function to compute how a single customer is assigned to the cashiers array.
 * Implements all PDF requirements:
 * 1. "Single customer assignment to Cashier"
 * 2. "Should be assigned to matching cashier type"
 * 3. "If priority cashier is empty, normal customer can be served"
 * 4. "Customers will always queue to the shortest queue for their customer type"
 */
const assignCustomerToCashiers = (cashiersList, customer) => {
  const getCashierLoad = (cashier) =>
    (cashier.currentCustomer ? 1 : 0) + cashier.queue.length;

  const isCashierEmpty = (cashier) =>
    cashier.currentCustomer === null && cashier.queue.length === 0;

  let targetCashierId = null;

  if (customer.type === 'Priority') {
    // Priority customers go to Priority Cashier(s), picking the shortest line
    const priorityCashiers = cashiersList.filter((c) => c.type === 'Priority');
    let shortest = priorityCashiers[0];
    for (const c of priorityCashiers) {
      if (getCashierLoad(c) < getCashierLoad(shortest)) {
        shortest = c;
      }
    }
    targetCashierId = shortest.id;
  } else {
    // Normal customer:
    // Rule: "If priority cashier is empty, normal customer can be served"
    const emptyPriorityCashier = cashiersList.find(
      (c) => c.type === 'Priority' && isCashierEmpty(c)
    );

    if (emptyPriorityCashier) {
      targetCashierId = emptyPriorityCashier.id;
    } else {
      // Rule: "Should be assigned to matching cashier type" &
      // "Customers will always queue to the shortest queue for their customer type"
      const regularCashiers = cashiersList.filter((c) => c.type === 'Regular');
      let shortest = regularCashiers[0];
      for (const c of regularCashiers) {
        if (getCashierLoad(c) < getCashierLoad(shortest)) {
          shortest = c;
        }
      }
      targetCashierId = shortest.id;
    }
  }

  return cashiersList.map((cashier) => {
    if (cashier.id !== targetCashierId) return cashier;

    // If cashier is currently idle (no currentCustomer), serve immediately!
    // Otherwise add to this cashier's queue.
    if (!cashier.currentCustomer) {
      return {
        ...cashier,
        currentCustomer: customer
      };
    }

    return {
      ...cashier,
      queue: [...cashier.queue, customer]
    };
  });
};

export default function App() {
  // Core Simulation States using useState
  const [waitingQueue, setWaitingQueue] = useState([]);
  const [cashiers, setCashiers] = useState(createInitialCashiers);
  const [nextCustomerId, setNextCustomerId] = useState(0);
  const [isAssigningAll, setIsAssigningAll] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [tickSpeedMs, setTickSpeedMs] = useState(1000); // 1000ms = 1x real-time
  const [recentActivity, setRecentActivity] = useState(
    'Simulator initialized. Ready to add customers to the waiting queue.'
  );

  /**
   * Requirement: Add Customer
   * - Create customer and add to a waiting queue
   * - Random service time from 5-100
   * - Customer type Priority or Normal
   * - Color code the customers
   */
  const handleAddCustomer = useCallback(() => {
    const serviceTime = Math.floor(Math.random() * (100 - 5 + 1)) + 5; // 5 to 100 inclusive
    const type = Math.random() < 0.5 ? 'Priority' : 'Normal';

    const newCustomer = {
      id: nextCustomerId,
      serviceTime,
      type
    };

    setWaitingQueue((prev) => [...prev, newCustomer]);
    setNextCustomerId((prev) => prev + 1);
    setRecentActivity(
      `Added Customer #${newCustomer.id} (${newCustomer.type}, ${newCustomer.serviceTime}s) to Waiting Queue.`
    );
  }, [nextCustomerId]);

  /**
   * Helper to add a batch of sample customers quickly if desired
   */
  const handleAddBatchCustomers = useCallback(
    (count = 5) => {
      const newCustomers = [];
      let currentId = nextCustomerId;

      for (let i = 0; i < count; i++) {
        const serviceTime = Math.floor(Math.random() * (100 - 5 + 1)) + 5;
        const type = Math.random() < 0.5 ? 'Priority' : 'Normal';
        newCustomers.push({
          id: currentId,
          serviceTime,
          type
        });
        currentId++;
      }

      setWaitingQueue((prev) => [...prev, ...newCustomers]);
      setNextCustomerId(currentId);
      setRecentActivity(`Added ${count} new customers to the Waiting Queue.`);
    },
    [nextCustomerId]
  );

  /**
   * Requirement: Assign Customer
   * - Single customer assignment to Cashier
   * - Should be assigned to matching cashier type
   * - If priority cashier is empty, normal customer can be served
   */
  const assignCustomer = useCallback(() => {
    if (waitingQueue.length === 0) return;

    const customerToAssign = waitingQueue[0];

    setWaitingQueue((prev) => prev.slice(1));
    setCashiers((prevCashiers) =>
      assignCustomerToCashiers(prevCashiers, customerToAssign)
    );
    setRecentActivity(
      `Assigned Customer #${customerToAssign.id} (${customerToAssign.type}, ${customerToAssign.serviceTime}s) to a cashier lane.`
    );
  }, [waitingQueue]);

  /**
   * Requirement: Assign All
   * "Use the function from [assign customer] for each of the customers in queue"
   * We use a state flag `isAssigningAll` + `useEffect` that invokes `assignCustomer()`
   * for each customer in the waitingQueue until the waitingQueue is empty.
   */
  const handleAssignAllCustomer = useCallback(() => {
    if (waitingQueue.length === 0) return;
    setIsAssigningAll(true);
  }, [waitingQueue.length]);

  useEffect(() => {
    if (!isAssigningAll) return;

    if (waitingQueue.length > 0) {
      assignCustomer();
    } else {
      setIsAssigningAll(false);
      setRecentActivity(
        'Assigned all waiting customers to their optimal cashier queues.'
      );
    }
  }, [isAssigningAll, waitingQueue.length, assignCustomer]);

  /**
   * Callback triggered by a Cashier component when it is idle and has queued customers
   */
  const handleServeNext = useCallback((cashierId) => {
    setCashiers((prevCashiers) =>
      prevCashiers.map((cashier) => {
        if (
          cashier.id === cashierId &&
          !cashier.currentCustomer &&
          cashier.queue.length > 0
        ) {
          const [nextCustomer, ...remainingQueue] = cashier.queue;
          return {
            ...cashier,
            currentCustomer: nextCustomer,
            queue: remainingQueue
          };
        }
        return cashier;
      })
    );
  }, []);

  /**
   * Callback triggered by a Cashier component when its active customer finishes countdown
   */
  const handleCustomerCompleted = useCallback(
    (cashierId, completedCustomer) => {
      setCashiers((prevCashiers) =>
        prevCashiers.map((cashier) => {
          if (cashier.id !== cashierId) return cashier;

          // Immediately promote the next customer in queue if available
          const [nextCustomer, ...remainingQueue] = cashier.queue;
          return {
            ...cashier,
            currentCustomer: nextCustomer || null,
            queue: nextCustomer ? remainingQueue : [],
            servedCount: cashier.servedCount + 1
          };
        })
      );

      setRecentActivity(
        `Customer #${completedCustomer.id} (${completedCustomer.type}) finished service at Cashier #${cashierId}.`
      );
    },
    []
  );

  /**
   * Reset entire simulation
   */
  const handleReset = () => {
    setWaitingQueue([]);
    setCashiers(createInitialCashiers());
    setNextCustomerId(0);
    setIsAssigningAll(false);
    setIsPaused(false);
    setRecentActivity('Simulation reset to initial state.');
  };

  // Summary metrics
  const priorityWaitingCount = waitingQueue.filter(
    (c) => c.type === 'Priority'
  ).length;
  const normalWaitingCount = waitingQueue.length - priorityWaitingCount;
  const totalInCashierSystem = cashiers.reduce(
    (acc, c) => acc + (c.currentCustomer ? 1 : 0) + c.queue.length,
    0
  );
  const totalServed = cashiers.reduce((acc, c) => acc + c.servedCount, 0);

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col selection:bg-cyan-500/30">
      {/* Decorative Background Glows */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div className="absolute -top-40 -left-40 w-96 h-96 bg-cyan-500/10 rounded-full blur-3xl" />
        <div className="absolute top-1/4 right-0 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl" />
        <div className="absolute bottom-0 left-1/3 w-96 h-96 bg-rose-500/5 rounded-full blur-3xl" />
      </div>

      {/* Top Navigation / Header Bar */}
      <header className="relative z-10 border-b border-slate-800/80 bg-slate-900/60 backdrop-blur-xl">
        <div className="max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-8 py-4 flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-cyan-400 to-blue-600 flex items-center justify-center shadow-lg shadow-cyan-500/20">
              <Layers className="w-6 h-6 text-slate-950 stroke-[2.2]" />
            </div>
            <div>
              <div className="flex items-center gap-2.5">
                <h1 className="text-xl sm:text-2xl font-extrabold tracking-tight text-white">
                  Cashier Queue Simulator
                </h1>
                <span className="hidden sm:inline-flex items-center gap-1 text-[11px] font-semibold uppercase tracking-wider px-2.5 py-0.5 rounded-full bg-cyan-500/10 text-cyan-300 border border-cyan-500/20">
                  Real-Time Dispatch
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                Smart priority & shortest-queue customer routing system
              </p>
            </div>
          </div>

          {/* Simulation Toolbar & Global Stats */}
          <div className="flex flex-wrap items-center gap-3">
            {/* Speed Toggle */}
            <div className="flex items-center bg-slate-950/80 border border-slate-800 rounded-xl p-1 text-xs">
              <button
                onClick={() => setTickSpeedMs(1000)}
                className={`px-2.5 py-1 rounded-lg font-medium transition ${
                  tickSpeedMs === 1000
                    ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/30'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
                title="Normal 1x Timer Speed (1s per tick)"
              >
                1x Speed
              </button>
              <button
                onClick={() => setTickSpeedMs(250)}
                className={`px-2.5 py-1 rounded-lg font-medium transition flex items-center gap-1 ${
                  tickSpeedMs === 250
                    ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/30'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
                title="Fast 4x Timer Speed (0.25s per tick)"
              >
                <Zap className="w-3 h-3" />
                4x Turbo
              </button>
            </div>

            {/* Pause / Resume Button */}
            <button
              onClick={() => setIsPaused((prev) => !prev)}
              className={`inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold border transition ${
                isPaused
                  ? 'bg-amber-500/15 text-amber-300 border-amber-500/30 hover:bg-amber-500/25'
                  : 'bg-slate-800/70 text-slate-200 border-slate-700 hover:bg-slate-800'
              }`}
            >
              {isPaused ? (
                <>
                  <Play className="w-3.5 h-3.5 fill-current" />
                  Resume Timers
                </>
              ) : (
                <>
                  <Pause className="w-3.5 h-3.5" />
                  Pause Timers
                </>
              )}
            </button>

            {/* Reset Button */}
            <button
              onClick={handleReset}
              className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold bg-slate-800/70 hover:bg-rose-950/60 text-slate-300 hover:text-rose-200 border border-slate-700 hover:border-rose-500/30 transition"
              title="Reset Simulation"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              Reset
            </button>
          </div>
        </div>
      </header>

      {/* Main Content Layout matching the PDF 3-Zone Structure:
          Left: Cashier Queue Controls | Middle: Waiting Queue | Right: Cashiers */}
      <main className="relative z-10 flex-1 max-w-[1440px] w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 flex flex-col gap-6">
        {/* Top Status & Legend Strip */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
          <div className="md:col-span-2 flex items-center gap-3 px-4 py-3 rounded-xl bg-slate-900/70 border border-slate-800/80">
            <Activity className="w-4 h-4 text-cyan-400 shrink-0" />
            <p className="text-xs text-slate-300 truncate font-medium">
              {recentActivity}
            </p>
          </div>

          <div className="flex items-center justify-between px-4 py-3 rounded-xl bg-slate-900/70 border border-slate-800/80">
            <span className="text-xs text-slate-400">Color Coding</span>
            <div className="flex items-center gap-3">
              <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-rose-300">
                <span className="w-2.5 h-2.5 rounded-full bg-rose-500 shadow-[0_0_8px_rgba(244,63,94,0.8)]" />
                Priority
              </span>
              <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-blue-300">
                <span className="w-2.5 h-2.5 rounded-full bg-blue-400 shadow-[0_0_8px_rgba(96,165,250,0.8)]" />
                Normal
              </span>
            </div>
          </div>

          <div className="flex items-center justify-between px-4 py-3 rounded-xl bg-slate-900/70 border border-slate-800/80">
            <div className="flex items-center gap-2 text-xs text-slate-400">
              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
              <span>Completed</span>
            </div>
            <div className="flex items-center gap-3 font-mono text-xs">
              <span className="text-slate-300">
                Active: <strong className="text-cyan-300">{totalInCashierSystem}</strong>
              </span>
              <span className="text-slate-300">
                Served: <strong className="text-emerald-400">{totalServed}</strong>
              </span>
            </div>
          </div>
        </div>

        {/* Primary Simulator Board (Mirrors the PDF layout in a sleek modern container) */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
          {/* LEFT PANEL: "Cashier Queue" Control Panel + "Waiting Queue" List */}
          <div className="lg:col-span-5 grid grid-cols-1 sm:grid-cols-12 rounded-2xl overflow-hidden border border-slate-800 bg-slate-900/70 shadow-2xl">
            {/* Cyan-themed Control Panel ("Cashier Queue") */}
            <div className="sm:col-span-7 relative p-6 flex flex-col justify-between bg-gradient-to-br from-cyan-500/20 via-cyan-950/40 to-slate-900 border-b sm:border-b-0 sm:border-r border-cyan-500/20">
              <div>
                <div className="inline-flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-widest text-cyan-300 bg-cyan-500/10 px-2.5 py-1 rounded-md border border-cyan-500/20 mb-3">
                  <Sparkles className="w-3 h-3" />
                  Control Center
                </div>
                <h2 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
                  Cashier Queue
                </h2>
                <p className="text-xs text-cyan-100/70 mt-1.5 leading-relaxed">
                  Generate random customers (5–100s service time) and dispatch
                  them to the optimal cashier line.
                </p>
              </div>

              {/* Primary Action Buttons matching PDF */}
              <div className="my-6 space-y-3">
                <div className="grid grid-cols-2 gap-2.5">
                  <button
                    onClick={handleAddCustomer}
                    className="flex items-center justify-center gap-1.5 px-3.5 py-3 rounded-xl font-semibold text-xs sm:text-sm bg-white text-slate-950 hover:bg-cyan-50 active:scale-[0.99] transition shadow-md shadow-cyan-950/50"
                  >
                    <UserPlus className="w-4 h-4 text-cyan-600 shrink-0" />
                    <span>Add Customer</span>
                  </button>

                  <button
                    onClick={assignCustomer}
                    disabled={waitingQueue.length === 0}
                    className="flex items-center justify-center gap-1.5 px-3.5 py-3 rounded-xl font-semibold text-xs sm:text-sm bg-cyan-500 hover:bg-cyan-400 disabled:bg-slate-800 disabled:text-slate-500 text-slate-950 active:scale-[0.99] transition shadow-md shadow-cyan-950/50 disabled:shadow-none"
                  >
                    <ArrowRight className="w-4 h-4 shrink-0" />
                    <span>Assign Customer</span>
                  </button>
                </div>

                <button
                  onClick={handleAssignAllCustomer}
                  disabled={waitingQueue.length === 0}
                  className="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-xl font-semibold text-xs sm:text-sm bg-slate-900/90 hover:bg-slate-800 disabled:bg-slate-900/40 disabled:text-slate-600 text-cyan-200 border border-cyan-400/30 disabled:border-slate-800 active:scale-[0.99] transition"
                >
                  <FastForward className="w-4 h-4 text-cyan-400" />
                  <span>Assign All Customer</span>
                </button>

                {/* Quick +5 helper for rapid testing */}
                <button
                  onClick={() => handleAddBatchCustomers(5)}
                  className="w-full flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg text-[11px] font-medium text-cyan-300/80 hover:text-cyan-200 hover:bg-cyan-500/10 border border-transparent hover:border-cyan-500/20 transition"
                >
                  <PlusCircle className="w-3.5 h-3.5" />
                  Quick Add +5 Customers
                </button>
              </div>

              {/* Routing Rules Reminder Card */}
              <div className="rounded-xl bg-slate-950/60 border border-cyan-500/20 p-3 space-y-1.5 text-[11px] text-slate-300">
                <div className="font-semibold text-cyan-300 flex items-center gap-1.5">
                  <Info className="w-3.5 h-3.5" />
                  Dispatch Logic
                </div>
                <p className="text-slate-400 leading-normal">
                  • <span className="text-rose-300 font-medium">Priority</span>{' '}
                  customers route to Priority Cashier.
                </p>
                <p className="text-slate-400 leading-normal">
                  • <span className="text-blue-300 font-medium">Normal</span>{' '}
                  customers use Priority Cashier if completely empty; otherwise
                  pick the shortest Regular Cashier queue.
                </p>
              </div>
            </div>

            {/* Waiting Queue Column */}
            <div className="sm:col-span-5 p-5 flex flex-col bg-slate-900/90">
              <div className="flex items-center justify-between mb-3 pb-3 border-b border-slate-800">
                <div>
                  <h3 className="text-base font-bold text-slate-100 tracking-tight">
                    Waiting Queue
                  </h3>
                  <p className="text-[11px] text-slate-400">
                    Unassigned lobby customers
                  </p>
                </div>
                <span className="px-2.5 py-1 rounded-full text-xs font-mono font-bold bg-slate-800 text-cyan-300 border border-slate-700">
                  {waitingQueue.length}
                </span>
              </div>

              {/* Mini Breakdown of Waiting Queue */}
              {waitingQueue.length > 0 && (
                <div className="grid grid-cols-2 gap-2 mb-3">
                  <div className="px-2.5 py-1.5 rounded-lg bg-rose-950/30 border border-rose-500/20 flex items-center justify-between text-[11px]">
                    <span className="text-rose-300 font-medium">Priority</span>
                    <span className="font-mono font-bold text-rose-200">
                      {priorityWaitingCount}
                    </span>
                  </div>
                  <div className="px-2.5 py-1.5 rounded-lg bg-blue-950/30 border border-blue-500/20 flex items-center justify-between text-[11px]">
                    <span className="text-blue-300 font-medium">Normal</span>
                    <span className="font-mono font-bold text-blue-200">
                      {normalWaitingCount}
                    </span>
                  </div>
                </div>
              )}

              {/* CustomerList Component (Requirement B) */}
              <div className="flex-1">
                <CustomerList
                  customers={waitingQueue}
                  variant="waiting"
                  emptyMessage="No customers waiting."
                />
              </div>
            </div>
          </div>

          {/* RIGHT PANEL: Cashiers Section (1 Priority Cashier + 2 Regular Cashiers) */}
          <div className="lg:col-span-7 flex flex-col rounded-2xl border border-slate-800 bg-slate-900/50 p-5 sm:p-6 shadow-2xl">
            <div className="flex flex-wrap items-center justify-between gap-2 mb-5 pb-3 border-b border-slate-800/80">
              <div className="flex items-center gap-2.5">
                <Users className="w-5 h-5 text-cyan-400" />
                <h2 className="text-xl font-bold text-white tracking-tight">
                  Cashiers
                </h2>
              </div>
              <div className="flex items-center gap-2 text-xs text-slate-400">
                <span>1 Priority Lane</span>
                <span>•</span>
                <span>2 Regular Lanes</span>
              </div>
            </div>

            {/* Grid of 3 Cashier Components (Requirement A) */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 flex-1">
              {cashiers.map((cashier) => (
                <Cashier
                  key={cashier.id}
                  cashier={cashier}
                  isPaused={isPaused}
                  tickSpeedMs={tickSpeedMs}
                  onServeNext={handleServeNext}
                  onCustomerCompleted={handleCustomerCompleted}
                />
              ))}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}

