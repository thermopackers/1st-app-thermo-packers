import React from 'react';

const TableHeader = ({ role }) => (
  <thead className="bg-gray-200 sticky top-0 z-30">
    <tr>
      <TableHeaderCell>Order Date</TableHeaderCell>
      <TableHeaderCell>Order ID</TableHeaderCell>
      <TableHeaderCell>Customer Handled By</TableHeaderCell>
      <TableHeaderCell>Order Added By</TableHeaderCell>
      <TableHeaderCell className="sticky left-0 z-40 bg-gray-200">Customer Name</TableHeaderCell>      
      <TableHeaderCell className="sticky md:left-[110px] left-[80px] z-40 bg-gray-200">Product Name</TableHeaderCell>
      <TableHeaderCell>Order Actions</TableHeaderCell>
      <TableHeaderCell>Narration</TableHeaderCell>
      <TableHeaderCell>Narration Images</TableHeaderCell>
      <TableHeaderCell>Bill To</TableHeaderCell>
      <TableHeaderCell>Ship To</TableHeaderCell>
      <TableHeaderCell>Size</TableHeaderCell>
      <TableHeaderCell>Qty</TableHeaderCell>
      <TableHeaderCell>Delivered Qty</TableHeaderCell>
      <TableHeaderCell>Balance Qty to be Delivered</TableHeaderCell>
      <TableHeaderCell>Basic Price</TableHeaderCell>
      <TableHeaderCell>Density</TableHeaderCell>
      <TableHeaderCell>Packaging Charge</TableHeaderCell>
      <TableHeaderCell>P/O</TableHeaderCell>
      <TableHeaderCell>Freight</TableHeaderCell>
      <TableHeaderCell>Payments Terms</TableHeaderCell>
      <TableHeaderCell>Dispatch Time</TableHeaderCell>
      <TableHeaderCell>Remarks</TableHeaderCell>
      <TableHeaderCell>PO Copy</TableHeaderCell>
      {!role.includes("production") && !role.includes("dispatch") && !role.includes("packaging") && (
        <TableHeaderCell>Actions</TableHeaderCell>
      )}
      {!role.includes("production") && !role.includes("dispatch") && !role.includes("admin") && !role.includes("packaging") && (
        <>
          <TableHeaderCell>Section</TableHeaderCell>
          <TableHeaderCell>Actions</TableHeaderCell>
        </>
      )}
      <TableHeaderCell>Production Status</TableHeaderCell>
      <TableHeaderCell>Packaging Status</TableHeaderCell>
      <TableHeaderCell>Dispatch Status</TableHeaderCell>
    </tr>
  </thead>
);

const TableHeaderCell = ({ children, className = "" }) => (
  <th className={`sticky top-0 z-20 px-2 sm:px-4 py-2 text-left font-bold text-gray-700 uppercase tracking-wider bg-gray-200 text-[10px] sm:text-xs md:text-sm ${className}`}>
    {children}
  </th>
);

export default TableHeader;