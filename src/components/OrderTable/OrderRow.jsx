import React from 'react';
import OrderCell from './OrderCell';
import SectionSelection from './SectionSelection';
import StatusIndicator from './StatusIndicator';
import POCopySection from './POCopySection';
import SectionActions from './SectionActions';
import OrderActions from './OrderActions';

const OrderRow = ({
  order,
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
    <tr className="order-row odd:bg-white even:bg-gray-50 hover:bg-gray-100">
      <OrderCell>
        {new Date(order.createdAt).toLocaleDateString("en-GB", {
          day: "2-digit",
          month: "2-digit",
          year: "numeric",
        })}
      </OrderCell>
      
      <OrderCell>{order.shortId}</OrderCell>
      
      <OrderCell className="whitespace-nowrap">
        {order.employee ? (
          <>
            <div>{order.employee.name}</div>
            <div className="text-xs text-gray-500">{order.employee.email}</div>
          </>
        ) : (
          "N/A"
        )}
      </OrderCell>

      <OrderCell className="whitespace-nowrap">
        {order.customer?.name || order.customerName}
      </OrderCell>

      <OrderCell>
        <OrderActions
          order={order}
          handleComplete={handleComplete}
          handleCancel={handleCancel}
        />
      </OrderCell>

      <OrderCell className="text-blue-600 underline cursor-pointer">
        <button
          onClick={() => {
            const product = products.find((p) => p.name === order.product);
            if (product?.images?.length > 0) {
              setActiveProductImage({
                name: product.name,
                images: product.images,
              });
            } else {
              Swal.fire({
                icon: "info",
                title: "No Image",
                text: "No images available for this product.",
              });
            }
          }}
        >
          {order.product}
        </button>
      </OrderCell>

      <OrderCell>
        {order.narration ? (
          <span>
            <strong>Narration:</strong> {order.narration}
          </span>
        ) : (
          <span>-</span>
        )}
      </OrderCell>

      <OrderCell>
        <strong>Narration Images:</strong>
        <div className="flex gap-2 flex-wrap mt-1">
          {order.narrationImages?.map((img, i) => (
            <img
              key={i}
              src={img}
              alt={`Narration ${i + 1}`}
              className="w-16 h-16 object-cover rounded cursor-pointer"
              onClick={() => window.open(img, "_blank")}
            />
          ))}
        </div>
      </OrderCell>

      <OrderCell>
        <strong>Bill To:</strong>
        <br />
        {order.billTo || "—"}
        <br />
        <span className="text-gray-600">
          📞 {order.customer?.phone || getCustomerPhone(order.customerName)}
        </span>
      </OrderCell>

      <OrderCell>
        <strong>Ship To:</strong>
        <br />
        {order.shipTo || "—"}
        <br />
        <span className="text-gray-600">
          📞 {order.customer?.phone || getCustomerPhone(order.customerName)}
        </span>
      </OrderCell>

      <OrderCell>{order.size ? order.size : "N/A"}</OrderCell>
      <OrderCell>{order.quantity}</OrderCell>
      <OrderCell>{getStockForProduct(order.product)}</OrderCell>
      <OrderCell>
        {Math.max(order.quantity - getStockForProduct(order.product), 0)}
      </OrderCell>
      <OrderCell>₹{order.price}</OrderCell>
      <OrderCell>{order.density}kg/m<sup>3</sup></OrderCell>
      <OrderCell>₹{order.packagingCharge}</OrderCell>
      <OrderCell>{order.po}</OrderCell>
      <OrderCell>{`${order.freight}: ₹${order.freightAmount}`}</OrderCell>
      <OrderCell>{order.paymentTerms || "—"}</OrderCell>

      <OrderCell>
        {(() => {
          if (!order.date) return "N/A";
          const today = new Date();
          const deliveryDate = new Date(order.date);
          today.setHours(0, 0, 0, 0);
          deliveryDate.setHours(0, 0, 0, 0);
          const diffDays = Math.ceil((deliveryDate - today) / (1000 * 60 * 60 * 24));
          
          if (diffDays <= 7) return "Within 1 Week";
          if (diffDays <= 14) return "Within 2 Weeks";
          if (diffDays <= 20) return "Within 20 Days";
          
          return deliveryDate.toLocaleDateString("en-GB", {
            day: "2-digit",
            month: "2-digit",
            year: "numeric",
          });
        })()}
      </OrderCell>

      <OrderCell>{order.remarks || "N/A"}</OrderCell>

      <OrderCell>
        <POCopySection 
          order={order}
          resolvedPOUrls={resolvedPOUrls}
        />
      </OrderCell>

      {!role.includes("production") && !role.includes("dispatch") && !role.includes("packaging") && (
        <OrderCell>
          <div className="flex flex-col sm:flex-row sm:items-center gap-2">
            <button
              className={`flex items-center gap-1 px-2 py-1 sm:px-4 sm:py-1.5 rounded-lg text-xs sm:text-sm shadow-md transition ${
                order.status === "completed" || order.status === "cancelled"
                  ? "bg-gray-400 cursor-not-allowed"
                  : "bg-yellow-500 hover:bg-yellow-600 text-white"
              }`}
              onClick={() => order.status !== "completed" && order.status !== "cancelled" && setEditOrder(order)}
              disabled={order.status === "completed" || order.status === "cancelled"}
            >
              ✏️ Edit
            </button>

            <button
              className={`flex items-center gap-1 px-2 py-1 sm:px-4 sm:py-1.5 rounded-lg text-xs sm:text-sm shadow-md transition ${
                order.status === "completed" || order.status === "cancelled"
                  ? "bg-gray-400 cursor-not-allowed"
                  : "bg-red-500 hover:bg-red-600 text-white"
              }`}
              onClick={() => order.status !== "completed" && order.status !== "cancelled" && handleDelete(order._id)}
              disabled={order.status === "completed" || order.status === "cancelled"}
            >
              🗑️ Delete
            </button>
          </div>
        </OrderCell>
      )}

      {!role.includes("production") && !role.includes("dispatch") && !role.includes("admin") && !role.includes("packaging") && (
        <>
          <OrderCell className="whitespace-nowrap">
            <SectionSelection
              order={order}
              sectionsList={sectionsList}
              localSections={localSections}
              handleSectionRadioChange={handleSectionRadioChange}
            />
          </OrderCell>

          <OrderCell>
            <SectionActions
              order={order}
              getStockForProduct={getStockForProduct}
              sectionToSlipType={sectionToSlipType}
              selectedRadioByOrder={selectedRadioByOrder}
              disabledOrders={disabledOrders}
              sectionsList={sectionsList}
              setSlipType={setSlipType}
              setSelectedOrder={setSelectedOrder}
              setSelectedSections={setSelectedSections}
              setModalOpen={setModalOpen}
              swalWithTailwindButtons={swalWithTailwindButtons}
            />
          </OrderCell>
        </>
      )}

      <OrderCell>
        <StatusIndicator 
          status={order.status}
          dispatchStatus={order.dispatchStatus}
          type="production"
        />
      </OrderCell>

      <OrderCell>
        <StatusIndicator 
          status={order.status}
          packagingStatus={order.packagingStatus}
          dispatchStatus={order.dispatchStatus}
          type="packaging"
        />
      </OrderCell>

      <OrderCell>
        <StatusIndicator 
          status={order.status}
          dispatchStatus={order.dispatchStatus}
          type="dispatch"
        />
      </OrderCell>
    </tr>
  );
};

export default OrderRow;