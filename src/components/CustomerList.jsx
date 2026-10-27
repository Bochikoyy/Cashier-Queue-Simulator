import React from 'react';

/**
 * Requirement B: List of customers should also be their own component.
 * Exact match to the screenshots:
 * - Red bullet + red text for Priority: "• Customer #X (Y secs)" or "• ID : X | Y"
 * - Blue bullet + blue text for Normal: "• Customer #X (Y secs)" or "• ID : X | Y"
 * - Clean auto scrollbar only when items actually overflow
 */
const CustomerList = ({
  customers = [],
  variant = 'waiting', // 'waiting' | 'cashier'
  emptyMessage = 'No customers waiting.'
}) => {
  if (!customers || customers.length === 0) {
    if (variant === 'waiting') {
      return (
        <div className="pt-2 text-center w-full">
          <p className="text-[13px] text-gray-600 leading-snug">
            {emptyMessage}
          </p>
        </div>
      );
    }
    return null;
  }

  return (
    <ul className="space-y-1.5 w-full text-left overflow-y-auto max-h-[140px] pr-1 custom-scrollbar">
      {customers.map((customer) => {
        const isPriority = customer.type === 'Priority';
        const colorClass = isPriority ? 'text-[#ff0000]' : 'text-[#0000ff]';

        return (
          <li
            key={customer.id}
            className={`flex items-start text-xs font-semibold leading-tight ${colorClass}`}
          >
            <span className="mr-1.5 select-none font-bold text-sm leading-none">•</span>
            {variant === 'waiting' ? (
              <span>
                ID : {customer.id} | {customer.serviceTime}
              </span>
            ) : (
              <span>
                Customer #{customer.id} ({customer.serviceTime} secs)
              </span>
            )}
          </li>
        );
      })}
    </ul>
  );
};

export default CustomerList;
