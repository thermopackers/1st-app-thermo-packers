import React from 'react';
import PaginationButton from './PaginationButton';

const OrderPagination = ({ currentPage, totalPages, setCurrentPage, filteredOrders }) => {
  if (filteredOrders?.length === 0) return null;

  return (
    <div className="overflow-x-auto w-full">
      <div className="flex justify-center items-center gap-2 mt-8 px-4 min-w-max">
        <PaginationButton
          onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
          disabled={currentPage === 1}
          label="⏮ Prev"
        />
        
        {Array.from({ length: totalPages }, (_, i) => (
          <PaginationButton
            key={i}
            onClick={() => setCurrentPage(i + 1)}
            isActive={currentPage === i + 1}
            label={i + 1}
          />
        ))}
        
        <PaginationButton
          onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
          disabled={currentPage === totalPages}
          label="Next ⏭"
        />
      </div>
    </div>
  );
};

export default OrderPagination;