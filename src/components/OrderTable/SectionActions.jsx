import React from 'react';
import Swal from "sweetalert2";

const SectionActions = ({
  order,
  getStockForProduct,
  sectionToSlipType,
  selectedRadioByOrder,
  disabledOrders,
  sectionsList,
  setSlipType,
  setSelectedOrder,
  setSelectedSections,
  setModalOpen,
  swalWithTailwindButtons
}) => {
  const stock = getStockForProduct(order.product);
  const requiredSections = order.requiredSections || {};
  const requiredKeys = Object.entries(requiredSections)
    .filter(([_, val]) => val)
    .map(([key]) => key);

  const sentToProduction = order.sentTo?.production || [];
  const sentToDispatch = order.sentTo?.dispatch || [];

  const alreadyDispatched = requiredKeys.every((section) =>
    sentToDispatch.includes(section)
  );

  const selectedKey = selectedRadioByOrder[order._id];
  const isSectionSentToProduction = sentToProduction.includes(selectedKey);
  const isSectionSentToDispatch = sentToDispatch.includes(selectedKey);

  const isSectionAlreadySent = ["preExpander", "danaBeads", "shapeMoulding", "cncSection"].includes(selectedKey)
    ? isSectionSentToProduction
    : isSectionSentToDispatch;

  const isShapeOnly = requiredKeys.length === 1 && requiredKeys.includes("shapeMoulding");

  if (isShapeOnly && stock >= order.quantity) {
    return (
      <button
        className="bg-purple-600 text-white px-2 py-1 rounded disabled:opacity-50 disabled:cursor-not-allowed"
        disabled={alreadyDispatched || disabledOrders[order._id]}
        onClick={async () => {
          if (alreadyDispatched) {
            Swal.fire({
              icon: "info",
              title: "Already Sent",
              text: "This order has already been dispatched!",
            });
            return;
          }

          const result = await swalWithTailwindButtons.fire({
            title: "Proceed to Packaging?",
            text: "This shape moulding order is in stock. Fill packaging slip?",
            icon: "question",
            showCancelButton: true,
            confirmButtonText: "Yes!",
            cancelButtonText: "No, cancel!",
            reverseButtons: true,
            customClass: {
              confirmButton: "ml-2 px-4 py-2 bg-green-600 text-white rounded",
              cancelButton: "mr-2 px-4 py-2 bg-red-600 text-white rounded",
            },
          });

          if (result.isConfirmed) {
            setSlipType("packaging");
            setSelectedOrder(order);
            setSelectedSections(order.requiredSections || {});
            setTimeout(() => {
              setModalOpen(true);
            }, 0);
          }
        }}
      >
        📦 Send to Packaging
      </button>
    );
  }

  if (stock >= order.quantity) {
    return (
      <button
        className="bg-green-600 text-white px-2 py-1 rounded disabled:opacity-50 disabled:cursor-not-allowed"
        disabled={alreadyDispatched || disabledOrders[order._id]}
        onClick={async () => {
          if (alreadyDispatched) {
            Swal.fire({
              icon: "info",
              title: "Already Dispatched",
              text: "This order has already been sent to dispatch!",
            });
            return;
          }

          const result = await swalWithTailwindButtons.fire({
            title: "Are you sure?",
            text: "You want to send this order to Dispatch/Cutting!",
            icon: "warning",
            showCancelButton: true,
            confirmButtonText: "Yes!",
            cancelButtonText: "No, cancel!",
            reverseButtons: true,
            customClass: {
              confirmButton: "ml-2 px-4 py-2 bg-green-600 text-white rounded",
              cancelButton: "mr-2 px-4 py-2 bg-red-600 text-white rounded",
            },
          });

          if (result.isConfirmed) {
            const hasShapeMoulding = order.requiredSections?.shapeMoulding;
            setSlipType(hasShapeMoulding ? "packaging" : "dispatch");
            setSelectedOrder(order);
            setTimeout(() => {
              setModalOpen(true);
            }, 0);
          }
        }}
      >
        ✅ Dispatch (In Stock)
      </button>
    );
  }

  return (
    <button
      className="bg-blue-500 text-white px-2 py-1 rounded disabled:opacity-50 disabled:cursor-not-allowed"
      // disabled={isSectionAlreadySent}
      onClick={async () => {
        // if (isSectionAlreadySent) {
        //   Swal.fire({
        //     icon: "info",
        //     title: "Already Sent",
        //     text: `This section (${selectedKey}) has already been sent.`,
        //   });
        //   return;
        // }

        const result = await swalWithTailwindButtons.fire({
          title: "Are you sure?",
          text: "You want to send this order to Production!",
          icon: "warning",
          showCancelButton: true,
          confirmButtonText: "Yes!",
          cancelButtonText: "No, cancel!",
          reverseButtons: true,
          customClass: {
            confirmButton: "ml-2 px-4 py-2 bg-green-600 text-white rounded",
            cancelButton: "mr-2 px-4 py-2 bg-red-600 text-white rounded",
          },
        });

        if (result.isConfirmed) {
          const selectedKey = selectedRadioByOrder[order._id];
          const oneSelected = sectionsList.reduce((acc, curr) => {
            acc[curr.key] = curr.key === selectedKey;
            return acc;
          }, {});

          setSlipType(sectionToSlipType[selectedKey] || "production");
          setSelectedOrder(order);
          setSelectedSections(oneSelected);
          setTimeout(() => {
            setModalOpen(true);
          }, 0);
        }
      }}
    >
      {/* {isSectionAlreadySent ? "✅ Sent" : "🏭 Send to Production"} */}
      🏭 Send to Production
    </button>
  );
};

export default SectionActions;