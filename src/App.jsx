import {useState, useEffect, useCallback } from 'react';
import Cashier from './components/Cashier';
import CustomerList from './components/CustomerList';

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


const assignCustomerToCashiers = (cashiersList, customer) => {
  const getCashierLoad = (cashier) =>
    (cashier.currentCustomer ? 1 : 0) + cashier.queue.length;

  const isCashierEmpty = (cashier) =>
    cashier.currentCustomer === null && cashier.queue.length === 0;

  let targetCashierId = null;

  if (customer.type === 'Priority') {
    const priorityCashiers = cashiersList.filter((c) => c.type === 'Priority');
    let shortest = priorityCashiers[0];
    for (const c of priorityCashiers) {
      if (getCashierLoad(c) < getCashierLoad(shortest)) {
        shortest = c;
      }
    }
    targetCashierId = shortest.id;
  } else {
    const emptyPriorityCashier = cashiersList.find(
      (c) => c.type === 'Priority' && isCashierEmpty(c)
    );

    if (emptyPriorityCashier) {
      targetCashierId = emptyPriorityCashier.id;
    } else {
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
  // useState hooks
  const [waitingQueue, setWaitingQueue] = useState([]);
  const [cashiers, setCashiers] = useState(createInitialCashiers);
  const [nextCustomerId, setNextCustomerId] = useState(1);
  const [isAssigningAll, setIsAssigningAll] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [tickSpeedMs, setTickSpeedMs] = useState(1000);

  const handleAddCustomer = useCallback(() => {
    const serviceTime = Math.floor(Math.random() * (100 - 5 + 1)) + 5;
    const type = Math.random() < 0.5 ? 'Priority' : 'Normal';

    const newCustomer = {
      id: nextCustomerId,
      serviceTime,
      type
    };

    setWaitingQueue((prev) => [...prev, newCustomer]);
    setNextCustomerId((prev) => prev + 1);
  }, [nextCustomerId]);

  const assignCustomer = useCallback(() => {
    if (waitingQueue.length === 0) return;

    const customerToAssign = waitingQueue[0];
    setWaitingQueue((prev) => prev.slice(1));
    setCashiers((prevCashiers) =>
      assignCustomerToCashiers(prevCashiers, customerToAssign)
    );
  }, [waitingQueue]);

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
    }
  }, [isAssigningAll, waitingQueue.length, assignCustomer]);

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

  const handleCustomerCompleted = useCallback((cashierId) => {
    setCashiers((prevCashiers) =>
      prevCashiers.map((cashier) => {
        if (cashier.id !== cashierId) return cashier;

        const [nextCustomer, ...remainingQueue] = cashier.queue;
        return {
          ...cashier,
          currentCustomer: nextCustomer || null,
          queue: nextCustomer ? remainingQueue : [],
          servedCount: cashier.servedCount + 1
        };
      })
    );
  }, []);

  const handleReset = () => {
    setWaitingQueue([]);
    setCashiers(createInitialCashiers());
    setNextCustomerId(1);
    setIsAssigningAll(false);
    setIsPaused(false);
  };

  return (
    <div className="min-h-screen bg-white text-black p-6 sm:p-10 flex flex-col items-center select-none font-sans">

      <h1 className="text-xl sm:text-2xl font-bold text-gray-800 mb-6 text-center">
        Cashier Queue Simulator
      </h1>

      <div className="w-full max-w-245 border border-black bg-white p-4 sm:p-6 mb-6">
        
        <div className="flex flex-col lg:flex-row gap-6 items-start">
          <div className="flex shrink-0 w-full lg:w-105 h-75">
            <div className="w-[68%] bg-[#00ffff] p-5 flex flex-col justify-between">
              <h2 className="text-3xl sm:text-4xl font-extrabold text-[#05445e] tracking-tight leading-tight mt-4">
                Cashier Queue
              </h2>

              <div className="space-y-2 mb-2">
                <div className="flex gap-2">
                  <button
                    onClick={handleAddCustomer}
                    className="bg-white hover:bg-gray-100 text-black text-xs font-semibold py-2 px-3 rounded-lg border border-gray-400 shadow-sm transition active:scale-95"
                  >
                    Add Customer
                  </button>
                  <button
                    onClick={assignCustomer}
                    disabled={waitingQueue.length === 0}
                    className="bg-white hover:bg-gray-100 disabled:opacity-50 text-black text-xs font-semibold py-2 px-3 rounded-lg border border-gray-400 shadow-sm transition active:scale-95"
                  >
                    Assign Customer
                  </button>
                </div>
                <div className="pl-6">
                  <button
                    onClick={handleAssignAllCustomer}
                    disabled={waitingQueue.length === 0}
                    className="bg-white hover:bg-gray-100 disabled:opacity-50 text-black text-xs font-semibold py-2 px-4 rounded-lg border border-gray-400 shadow-sm transition active:scale-95"
                  >
                    Assign All Customer
                  </button>
                </div>
              </div>
            </div>

            <div className="w-[32%] bg-[#cccccc] p-3 flex flex-col items-center">
              <h3 className="font-bold text-gray-800 text-sm sm:text-base text-center leading-tight mb-3 shrink-0">
                Waiting<br />Queue
              </h3>
              
              <div className="w-full flex-1 overflow-y-auto pr-0.5 custom-scrollbar">
                <CustomerList
                  customers={waitingQueue}
                  variant="waiting"
                  emptyMessage="No customers waiting."
                />
              </div>
            </div>
          </div>

          <div className="flex-1 w-full flex flex-col">
            <h2 className="text-base sm:text-lg font-bold text-gray-800 text-center mb-4">
              Cashiers
            </h2>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 items-start justify-items-center">
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
      </div>

      <div className="w-full max-w-245 flex items-center justify-between text-xs text-gray-500 px-1">
        <div className="flex items-center gap-2">
          <span>Simulation Speed:</span>
          <button
            onClick={() => setTickSpeedMs(1000)}
            className={`px-2.5 py-1 rounded border ${
              tickSpeedMs === 1000 ? 'bg-gray-800 text-white border-gray-800' : 'bg-white border-gray-300'
            }`}
          >
            1x Real-time
          </button>
          <button
            onClick={() => setTickSpeedMs(250)}
            className={`px-2.5 py-1 rounded border ${
              tickSpeedMs === 250 ? 'bg-gray-800 text-white border-gray-800' : 'bg-white border-gray-300'
            }`}
          >
            4x Turbo
          </button>
          <button
            onClick={() => setIsPaused((prev) => !prev)}
            className="px-2.5 py-1 rounded border bg-white border-gray-300 ml-2"
          >
            {isPaused ? 'Resume Timers' : 'Pause Timers'}
          </button>
        </div>
        <button
          onClick={handleReset}
          className="text-red-600 hover:underline font-semibold"
        >
          Reset Simulation
        </button>
      </div>

    </div>
  );
}
