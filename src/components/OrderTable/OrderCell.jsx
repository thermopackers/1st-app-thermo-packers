import React from 'react';

const OrderCell = ({ children, className = "" }) => (
  <td className={`px-2 sm:px-4 py-2 text-[11px] sm:text-sm text-gray-800 ${className}`}>
    {children}
  </td>
);

export default OrderCell;