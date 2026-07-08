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
  swalWithTailwindButtons,
  filters
}) => {
  
  const displayOrders = sortedOrders.filter(order => {
    if (filters?.customerName) {
      return order.status !== "cancelled";
    } else {
      return order.status !== "completed" && order.status !== "cancelled";
    }
  });
  
  return (
    <div className="w-full mt-10 max-h-[80vh] overflow-auto relative">
      {/* <div className="w-full h-full overflow-x-auto overflow-y-auto"> */}
        <table className="order-table w-full divide-y divide-gray-200 table-auto text-xs sm:text-sm border-separate border-spacing-0">
          <TableHeader role={role} />
          <tbody className="bg-white divide-y divide-gray-200 capitalize">
            {displayOrders.map((order, index) => (
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
            ))}
          </tbody>
        </table>
      {/* </div> */}
    </div>
  );
};

export default OrderTable;