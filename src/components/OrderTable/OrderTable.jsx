import React from 'react';
import OrderRow from './OrderRow';
import TableHeader from './TableHeader';

const OrderTable = ({ 
  sortedOrders, 
  products, 
  role, 
  customers,
  resolvedPOUrls,
  sectionsList,
  localSections,
  selectedRadioByOrder,
  disabledOrders,
  handleComplete,
  handleCancel,
  handleDelete,
  setEditOrder,
  handleSectionRadioChange,
  setActiveProductImage,
  setSlipType,
  setSelectedOrder,
  setSelectedSections,
  setModalOpen,
  getStockForProduct,
  getCustomerPhone,
  sectionToSlipType,
  swalWithTailwindButtons
}) => {
  return (
    <div className="w-full overflow-x-auto mt-10 max-h-[80vh]">
      <div className="min-w-full inline-block align-middle">
        <div className="w-full overflow-x-auto overflow-y-auto max-h-[80vh]">
          <table className="order-table min-w-full divide-y divide-gray-200 table-auto text-xs sm:text-sm">
            <TableHeader role={role} />
            <tbody className="bg-white divide-y divide-gray-200 capitalize">
              {sortedOrders
                .filter(order => order.status !== "completed")
                .map((order, index) => (
                  <OrderRow 
                    key={order._id}
                    order={order}
                    index={index}
                    products={products}
                    role={role}
                    customers={customers}
                    resolvedPOUrls={resolvedPOUrls}
                    sectionsList={sectionsList}
                    localSections={localSections}
                    selectedRadioByOrder={selectedRadioByOrder}
                    disabledOrders={disabledOrders}
                    handleComplete={handleComplete}
                    handleCancel={handleCancel}
                    handleDelete={handleDelete}
                    setEditOrder={setEditOrder}
                    handleSectionRadioChange={handleSectionRadioChange}
                    setActiveProductImage={setActiveProductImage}
                    setSlipType={setSlipType}
                    setSelectedOrder={setSelectedOrder}
                    setSelectedSections={setSelectedSections}
                    setModalOpen={setModalOpen}
                    getStockForProduct={getStockForProduct}
                    getCustomerPhone={getCustomerPhone}
                    sectionToSlipType={sectionToSlipType}
                    swalWithTailwindButtons={swalWithTailwindButtons}
                  />
                ))
              }
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default OrderTable;