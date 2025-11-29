import React from 'react';

const TableHeader = ({ role }) => (
  <thead className="bg-gray-200 sticky top-0 z-30">
    <tr>
      <TableHeaderCell>Order Date</TableHeaderCell>
      <TableHeaderCell>Order ID</TableHeaderCell>
      <TableHeaderCell>Handled By</TableHeaderCell>
      <TableHeaderCell>Client Name</TableHeaderCell>
      <TableHeaderCell>Order Actions</TableHeaderCell>
      <TableHeaderCell>Product Name</TableHeaderCell>
      <TableHeaderCell>Narration</TableHeaderCell>
      <TableHeaderCell>Narration Images</TableHeaderCell>
      <TableHeaderCell>Bill To</TableHeaderCell>
      <TableHeaderCell>Ship To</TableHeaderCell>
      <TableHeaderCell>Size</TableHeaderCell>
      <TableHeaderCell>Qty</TableHeaderCell>
      <TableHeaderCell>Stock</TableHeaderCell>
      <TableHeaderCell>Remaining to Produce</TableHeaderCell>
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

const TableHeaderCell = ({ children }) => (
  <th className="sticky top-0 z-20 px-2 sm:px-4 py-2 text-left font-bold text-gray-700 uppercase tracking-wider bg-gray-200 text-[10px] sm:text-xs md:text-sm">
    {children}
  </th>
);

export default TableHeader;