import { useState, useEffect } from 'react';
import CustomerList from './CustomerList';

const Cashier = ({
  cashier,
  isPaused,
  tickSpeedMs = 1000,
  onServeNext,
  onCustomerCompleted
}) => {
  const { id, name, type, currentCustomer, queue } = cashier;


  const [remainingTime, setRemainingTime] = useState(
    currentCustomer ? currentCustomer.serviceTime : 0
  );
  const [activeCustomerId, setActiveCustomerId] = useState(
    currentCustomer ? currentCustomer.id : null
  );

  useEffect(() => {
    if (!currentCustomer && queue.length > 0) {
      onServeNext(id);
    }
  }, [currentCustomer, queue.length, id, onServeNext]);

  useEffect(() => {
    if (currentCustomer) {
      setRemainingTime(currentCustomer.serviceTime);
      setActiveCustomerId(currentCustomer.id);
    } else {
      setActiveCustomerId(null);
      setRemainingTime(0);
    }
  }, [currentCustomer]);

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

  useEffect(() => {
    if (
      currentCustomer &&
      activeCustomerId === currentCustomer.id &&
      remainingTime === 0
    ) {
      onCustomerCompleted(id, currentCustomer);
    }
  }, [remainingTime, currentCustomer, activeCustomerId, id, onCustomerCompleted]);

  return (
    <div className="flex flex-col items-center w-full min-w-37.5 max-w-52.5">
      <h3 className="font-bold text-[#1f2937] text-sm sm:text-base mb-2 text-center">
        {name}
      </h3>

      <div className="w-full h-57.5 border border-gray-300 rounded-md p-3 bg-white flex flex-col items-center shadow-none">
        <div className="w-full h-13 border border-gray-400 rounded-md p-1.5 bg-white text-center flex flex-col items-center justify-center shrink-0">
          {currentCustomer ? (
            <div className="text-[12px] text-gray-700 leading-snug">
              <div>Now serving: Customer {currentCustomer.id}</div>
              <div className="text-gray-500 text-[11px]">({remainingTime}secs remaining)</div>
            </div>
          ) : (
            <div className="text-[13px] text-gray-600">
              Idle Cashier
            </div>
          )}
        </div>

        <div className="w-full mt-2.5 flex-1 flex flex-col items-center min-h-0">
          <span className="text-xs text-gray-700 mb-1.5 font-normal shrink-0">
            Queue
          </span>
          <div className="w-full flex-1 overflow-y-auto pr-0.5 custom-scrollbar">
            <CustomerList customers={queue} variant="cashier" />
          </div>
        </div>
      </div>
    </div>
  );
};

export default Cashier;
