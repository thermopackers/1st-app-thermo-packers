import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import axiosInstance from "../axiosInstance";
import InternalNavbar from "../components/InternalNavbar";
import Swal from "sweetalert2";
import { motion } from "framer-motion";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

export default function SheetCuttingDispatch() {
  const navigate = useNavigate();
  const [selectedDate, setSelectedDate] = useState(
    new Date().toISOString().split("T")[0]
  );
  const [rows, setRows] = useState([]);
  const [tapeUsed, setTapeUsed] = useState("");
  const [salesProducts, setSalesProducts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [searchTerms, setSearchTerms] = useState({});
  const [showDropdown, setShowDropdown] = useState({});
  const [manualProductInput, setManualProductInput] = useState({});
  const [showManualInput, setShowManualInput] = useState({});
  const [savedBy, setSavedBy] = useState(null);

  // Pagination state
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [allDates, setAllDates] = useState([]);

  // Format date to Indian format (dd/mm/yyyy)
  const formatIndianDate = (dateStr) => {
    if (!dateStr) return "";
    const d = new Date(dateStr);
    const day = String(d.getDate()).padStart(2, "0");
    const month = String(d.getMonth() + 1).padStart(2, "0");
    const year = d.getFullYear();
    return `${day}/${month}/${year}`;
  };

  // Fetch sales products dropdown
  useEffect(() => {
    const fetchProducts = async () => {
      try {
        const res = await axiosInstance.get("/products/dropdown-products");
        setSalesProducts(res.data || []);
      } catch (err) {
        console.error("Failed to fetch sales products", err);
      }
    };
    fetchProducts();
  }, []);

  // Fetch report data for selected date
  useEffect(() => {
    const fetchReport = async () => {
      if (!selectedDate) {
        setLoading(false);
        return;
      }
      setLoading(true);
      try {
        const res = await axiosInstance.get(
          `/sheet-cutting-dispatch?date=${selectedDate}`
        );
               if (res.data) {
          setRows(res.data.rows || []);
          setTapeUsed(res.data.tapeUsed || "");
          setSavedBy(res.data.savedBy || null);
        } else {
          setRows([]);
          setTapeUsed("");
          setSavedBy(null);
        }
          } catch (err) {
        console.error(
          "❌ Report fetch error:",
          err?.response?.status,
          err?.message,
          err?.response?.data
        );
        setRows([]);
        setTapeUsed("");
        setSavedBy(null);
      } finally {
        setLoading(false);
      }
    };
    fetchReport();
  }, [selectedDate]);

  // Fetch paginated report dates for the date chips
  useEffect(() => {
    const fetchDates = async () => {
      try {
        const res = await axiosInstance.get(
          `/sheet-cutting-dispatch/dates?page=${page}&limit=5`
        );
        setAllDates(res.data.dates || []);
        setTotalPages(res.data.totalPages || 1);
      } catch (err) {
        console.error("Failed to fetch report dates", err);
      }
    };
    fetchDates();
  }, [page, selectedDate]);

  // Add a new empty row
  const addRow = () => {
    setRows([
      ...rows,
      {
        _id: Date.now().toString(),
        workers: "",
        thermocolName: "",
        rawBlocksUsed: "",
        qtyReadyForDispatch: "",
        remarks: "",
      },
    ]);
  };

  // Update a row field
  const updateRow = (index, field, value) => {
    const updated = [...rows];
    updated[index][field] = value;
    setRows(updated);
  };

  // Remove a row
  const removeRow = (index) => {
    const updated = rows.filter((_, i) => i !== index);
    setRows(updated);
  };

  // Filter products by search term
  const getFilteredProducts = (rowIndex) => {
    const term = (searchTerms[rowIndex] || "").toLowerCase();
    if (!term) return salesProducts;
    return salesProducts.filter((p) =>
      p.name?.toLowerCase().includes(term)
    );
  };

  // Select a product from dropdown
  const selectProduct = (rowIndex, productName) => {
    const updated = [...rows];
    updated[rowIndex].thermocolName = productName;
    setRows(updated);
    setSearchTerms((prev) => ({ ...prev, [rowIndex]: productName }));
    setShowDropdown((prev) => ({ ...prev, [rowIndex]: false }));
  };

  // Add manual product
  const addManualProduct = (rowIndex) => {
    const manualName = manualProductInput[rowIndex]?.trim();
    if (!manualName) return;
    const updated = [...rows];
    updated[rowIndex].thermocolName = manualName;
    setRows(updated);
    setSearchTerms((prev) => ({ ...prev, [rowIndex]: manualName }));
    setManualProductInput((prev) => ({ ...prev, [rowIndex]: "" }));
    setShowManualInput((prev) => ({ ...prev, [rowIndex]: false }));
    setShowDropdown((prev) => ({ ...prev, [rowIndex]: false }));
  };

  // Save report
  const handleSave = async () => {
    const invalidRows = rows.filter(
      (r) =>
        !r.workers?.trim() ||
        !r.thermocolName?.trim() ||
        r.rawBlocksUsed === "" ||
        r.qtyReadyForDispatch === ""
    );

    if (invalidRows.length > 0) {
      Swal.fire({
        title: "Validation Error",
        text: "Please fill all required fields (Workers, Thermocol Name, Raw Blocks Used, Qty Ready for Dispatch) in every row.",
        icon: "warning",
        confirmButtonColor: "#2563eb",
      });
      return;
    }

    setSaving(true);
    try {
      // Strip client-only _id before sending to backend
      const cleanedRows = rows.map(({ _id, ...rest }) => rest);

           const saveRes = await axiosInstance.post("/sheet-cutting-dispatch", {
        date: selectedDate,
        rows: cleanedRows,
        tapeUsed,
      });

      // Update savedBy immediately so signature shows right after saving
      if (saveRes.data?.savedBy) {
        setSavedBy(saveRes.data.savedBy);
      }

      Swal.fire({
        title: "Saved!",
        text: "Report saved successfully.",
        icon: "success",
        confirmButtonColor: "#2563eb",
      });

      // Refresh the date list
      setPage(1);
    } catch (err) {
      console.error("Save error", err);
      Swal.fire({
        title: "Error",
        text: "Failed to save report. Please try again.",
        icon: "error",
        confirmButtonColor: "#2563eb",
      });
    } finally {
      setSaving(false);
    }
  };

  // Close dropdowns when clicking outside
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (!e.target.closest(".product-dropdown-container")) {
        setShowDropdown({});
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

    // Export current report as PDF
  const handleExportPDF = () => {
    if (rows.length === 0) {
      Swal.fire({
        title: "Nothing to export",
        text: "Add at least one row before exporting.",
        icon: "info",
        confirmButtonColor: "#2563eb",
      });
      return;
    }

    const doc = new jsPDF({ orientation: "landscape", unit: "mm", format: "a4" });

    // ---- Header ----
    doc.setFontSize(16);
    doc.setFont("helvetica", "bold");
    doc.text("Sheet Cutting & Dispatch Report", 14, 15);

    doc.setFontSize(10);
    doc.setFont("helvetica", "normal");
    doc.text(`Date: ${formatIndianDate(selectedDate)}`, 14, 22);
    doc.text(
      `Generated on: ${formatIndianDate(new Date().toISOString().split("T")[0])}`,
      14,
      27
    );

    // ---- Table ----
    const tableBody = rows.map((r, i) => [
      i + 1,
      r.workers || "",
      r.thermocolName || "",
      r.rawBlocksUsed || "0",
      r.qtyReadyForDispatch || "0",
      r.remarks || "",
    ]);

    autoTable(doc, {
      startY: 32,
      head: [["#", "Name of Workers", "Thermocol Name", "Raw Block Used", "Qty Ready for Dispatch", "Remarks"]],
      body: tableBody,
      styles: { fontSize: 9, cellPadding: 2, valign: "top" },
      headStyles: { fillColor: [37, 99, 235], textColor: 255, fontStyle: "bold" },
      alternateRowStyles: { fillColor: [245, 248, 255] },
      columnStyles: {
        0: { cellWidth: 10 },
        1: { cellWidth: 50 },
        2: { cellWidth: 70 },
        3: { cellWidth: 30, halign: "center" },
        4: { cellWidth: 40, halign: "center" },
        5: { cellWidth: 55 },
      },
    });

    let finalY = doc.lastAutoTable.finalY + 8;

    // ---- Tape Used ----
    doc.setFontSize(11);
    doc.setFont("helvetica", "bold");
    doc.text("Tape Used (Full Day):", 14, finalY);
    doc.setFont("helvetica", "normal");
    doc.text(tapeUsed ? `${tapeUsed} pcs` : "-", 70, finalY);

    finalY += 12;

    // ---- Saved By + Signature ----
    doc.setFontSize(10);
    doc.setFont("helvetica", "bold");
    doc.text("Report saved by:", 14, finalY);

    doc.setFont("helvetica", "normal");
    if (savedBy?.name) {
      doc.text(`${savedBy.name}${savedBy.email ? ` (${savedBy.email})` : ""}`, 14, finalY + 6);
    } else {
      doc.text("—", 14, finalY + 6);
    }

    // Digital signature image (if present)
    if (savedBy?.digitalSignature) {
      try {
        // Detect extension from URL (default png for unknown)
        const match = savedBy.digitalSignature.match(/\.(png|jpe?g|webp)(\?.*)?$/i);
        const ext = match ? match[1].toLowerCase() : "png";
        const imageType = ext === "jpg" || ext === "jpeg" ? "JPEG" : "PNG";

        doc.addImage(
          savedBy.digitalSignature,
          imageType,
          120, // x
          finalY - 2, // y
          55, // width mm
          20, // height mm
          undefined,
          "FAST"
        );

        doc.setFontSize(7);
        doc.setTextColor(120);
        doc.text("Authorised Signature", 120, finalY + 20);
        doc.setTextColor(0);
      } catch (imgErr) {
        console.error("Could not embed signature image in PDF:", imgErr);
        doc.setFontSize(8);
        doc.setTextColor(150);
        doc.text("[Signature could not be embedded]", 120, finalY + 8);
        doc.setTextColor(0);
      }
    }

    // ---- Footer line ----
    const pageHeight = doc.internal.pageSize.getHeight();
    doc.setDrawColor(200);
    doc.line(14, pageHeight - 12, 283, pageHeight - 12);
    doc.setFontSize(8);
    doc.setTextColor(120);
    doc.text(
      "Thermo Packers — Sheet Cutting & Dispatch Report",
      14,
      pageHeight - 7
    );

    // ---- Save ----
    const dateForFile = selectedDate.replace(/-/g, "_");
    doc.save(`Sheet_Cutting_Dispatch_${dateForFile}.pdf`);
  };

  return (
    <>
      <InternalNavbar />
      <main
        className="min-h-screen py-8 pt-24"
        style={{
          background:
            "linear-gradient(135deg, rgba(59, 130, 246, 0.08) 0%, rgba(255, 255, 255, 0.4) 40%, rgba(139, 92, 246, 0.08) 100%)",
        }}
      >
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          {/* Back Button */}
          <motion.div
            className="mb-6"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
          >
            <button
              onClick={() => navigate(-1)}
              className="glass-btn inline-flex items-center gap-3 px-4 py-3 rounded-xl text-gray-700 font-medium transition-all duration-300 group"
            >
              <span className="text-xl group-hover:-translate-x-1 transition-transform">
                ←
              </span>
              Back
            </button>
          </motion.div>

          <div className="glass-card p-6 md:p-8">
            <h1 className="text-2xl md:text-3xl font-bold text-gray-900 text-center mb-6">
              ✂️ Sheet Cutting & Dispatch Report
            </h1>

            {/* Date Picker */}
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-8">
              <label className="font-semibold text-gray-700">
                Select Date:
              </label>
              <input
                type="date"
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
                className="border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <span className="text-sm text-gray-600 bg-blue-50 px-3 py-1 rounded-lg">
                📅 {formatIndianDate(selectedDate)}
              </span>
            </div>

            {loading ? (
              <div className="text-center py-10 text-gray-500">
                Loading report...
              </div>
            ) : (
              <>
                {/* Table */}
                <div className="overflow-x-auto rounded-xl border border-gray-200 shadow-sm">
                  <table className="min-w-full bg-white text-sm">
                    <thead className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white">
                      <tr>
                        <th className="px-3 py-3 text-left font-semibold min-w-[200px]">
                          Name of Workers
                        </th>
                        <th className="px-3 py-3 text-left font-semibold min-w-[220px]">
                          Thermocol Name
                        </th>
                        <th className="px-3 py-3 text-left font-semibold min-w-[140px]">
                          Raw Block Used
                        </th>
                        <th className="px-3 py-3 text-left font-semibold min-w-[150px]">
                          Qty Ready for Dispatch
                        </th>
                        <th className="px-3 py-3 text-left font-semibold min-w-[180px]">
                          Remarks
                        </th>
                        <th className="px-3 py-3 text-center font-semibold w-16">
                          Action
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {rows.length === 0 ? (
                        <tr>
                          <td
                            colSpan={6}
                            className="text-center py-8 text-gray-400"
                          >
                            No entries yet. Click "Add Row" to start.
                          </td>
                        </tr>
                      ) : (
                        rows.map((row, index) => (
                          <tr
                            key={row._id || index}
                            className="border-b border-gray-100 hover:bg-blue-50/30"
                          >
                            {/* Workers */}
                            <td className="px-3 py-2 align-top">
                              <textarea
                                value={row.workers}
                                onChange={(e) =>
                                  updateRow(index, "workers", e.target.value)
                                }
                                placeholder="e.g. Ramesh, Suresh, Mahesh"
                                rows={2}
                                className="w-full border border-gray-300 rounded-lg px-2 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-y"
                              />
                              <p className="text-[10px] text-gray-400 mt-1">
                                Comma separated names
                              </p>
                            </td>

                                                      {/* Thermocol Name - Searchable */}
                            <td className="px-3 py-2 align-top product-dropdown-container">
                              <div className="relative">
                                <input
                                  type="text"
                                  value={
                                    searchTerms[index] ??
                                    row.thermocolName ??
                                    ""
                                  }
                                  onChange={(e) => {
                                    setSearchTerms((prev) => ({
                                      ...prev,
                                      [index]: e.target.value,
                                    }));
                                    updateRow(
                                      index,
                                      "thermocolName",
                                      e.target.value
                                    );
                                    setShowDropdown((prev) => ({
                                      ...prev,
                                      [index]: true,
                                    }));
                                  }}
                                  onFocus={() =>
                                    setShowDropdown((prev) => ({
                                      ...prev,
                                      [index]: true,
                                    }))
                                  }
                                  placeholder="Search or type product..."
                                  className="w-full border border-gray-300 rounded-lg px-2 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                                />

                                {showDropdown[index] && (
                                  <div className="absolute z-20 top-full left-0 right-0 mt-1 bg-white border border-gray-200 rounded-lg shadow-lg max-h-48 overflow-y-auto">
                                    {getFilteredProducts(index).length === 0 ? (
                                      <div className="p-2">
                                        <p className="text-xs text-gray-500">
                                          No match found
                                        </p>
                                      </div>
                                    ) : (
                                      getFilteredProducts(index).map((p) => (
                                        <button
                                          type="button"
                                          key={p._id || p.name}
                                          onClick={() =>
                                            selectProduct(index, p.name)
                                          }
                                          className="w-full text-left px-3 py-2 text-sm hover:bg-blue-50 transition-colors"
                                        >
                                          {p.name}
                                        </button>
                                      ))
                                    )}
                                  </div>
                                )}
                              </div>

                              {/* + Add manually button always below input */}
                              {!showManualInput[index] ? (
                                <button
                                  type="button"
                                  onClick={() =>
                                    setShowManualInput((prev) => ({
                                      ...prev,
                                      [index]: true,
                                    }))
                                  }
                                  className="mt-1 text-xs text-blue-600 hover:underline font-medium"
                                >
                                  + Add manually
                                </button>
                              ) : (
                                <div className="mt-1 flex gap-1">
                                  <input
                                    type="text"
                                    value={manualProductInput[index] || ""}
                                    onChange={(e) =>
                                      setManualProductInput((prev) => ({
                                        ...prev,
                                        [index]: e.target.value,
                                      }))
                                    }
                                    placeholder="Enter name"
                                    className="flex-1 border border-gray-300 rounded px-2 py-1 text-xs"
                                  />
                                  <button
                                    type="button"
                                    onClick={() => addManualProduct(index)}
                                    className="bg-blue-600 text-white text-xs px-2 py-1 rounded"
                                  >
                                    Add
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() =>
                                      setShowManualInput((prev) => ({
                                        ...prev,
                                        [index]: false,
                                      }))
                                    }
                                    className="text-gray-500 text-xs px-1"
                                    title="Cancel"
                                  >
                                    ✕
                                  </button>
                                </div>
                              )}
                            </td>

                            {/* Raw Blocks Used */}
                            <td className="px-3 py-2 align-top">
                              <input
                                type="number"
                                min="0"
                                value={row.rawBlocksUsed}
                                onChange={(e) =>
                                  updateRow(
                                    index,
                                    "rawBlocksUsed",
                                    e.target.value
                                  )
                                }
                                placeholder="0"
                                className="w-full border border-gray-300 rounded-lg px-2 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                              />
                            </td>

                            {/* Qty Ready for Dispatch */}
                            <td className="px-3 py-2 align-top">
                              <input
                                type="number"
                                min="0"
                                value={row.qtyReadyForDispatch}
                                onChange={(e) =>
                                  updateRow(
                                    index,
                                    "qtyReadyForDispatch",
                                    e.target.value
                                  )
                                }
                                placeholder="0"
                                className="w-full border border-gray-300 rounded-lg px-2 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                              />
                            </td>

                            {/* Remarks */}
                            <td className="px-3 py-2 align-top">
                              <textarea
                                value={row.remarks}
                                onChange={(e) =>
                                  updateRow(index, "remarks", e.target.value)
                                }
                                placeholder="Any remarks..."
                                rows={2}
                                className="w-full border border-gray-300 rounded-lg px-2 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-y"
                              />
                            </td>

                            {/* Remove */}
                            <td className="px-3 py-2 align-top text-center">
                              <button
                                type="button"
                                onClick={() => removeRow(index)}
                                className="text-red-500 hover:text-red-700 text-lg font-bold"
                                title="Remove row"
                              >
                                ✕
                              </button>
                            </td>
                          </tr>
                        ))
                      )}

                                                                {/* Inline Action Row: Add Row + Save Report + Export PDF */}
                      <tr className="bg-gradient-to-r from-blue-50 to-indigo-50 border-t-2 border-blue-200">
                        <td colSpan={6} className="px-3 py-3">
                          <div className="flex items-center justify-between flex-wrap gap-3">
                            <span className="text-sm text-gray-600 font-medium">
                              {rows.length} row{rows.length !== 1 ? "s" : ""}{" "}
                              entered
                            </span>
                            <div className="flex items-center gap-2 flex-wrap">
                              <button
                                type="button"
                                onClick={addRow}
                                className="bg-green-600 hover:bg-green-700 text-white px-5 py-2.5 rounded-xl font-semibold shadow-md transition-all"
                              >
                                ➕ Add Row
                              </button>
                              <button
                                type="button"
                                onClick={handleExportPDF}
                                className="bg-red-600 hover:bg-red-700 text-white px-5 py-2.5 rounded-xl font-semibold shadow-md transition-all"
                              >
                                📄 Export PDF
                              </button>
                              <button
                                type="button"
                                onClick={handleSave}
                                disabled={saving}
                                className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white px-6 py-2.5 rounded-xl font-bold shadow-md transition-all disabled:opacity-60"
                              >
                                {saving ? "Saving..." : "💾 Save Report"}
                              </button>
                            </div>
                          </div>
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>

               

                {/* ============ PAGINATION ============ */}
                {totalPages > 1 && (
                  <div className="mt-6 flex items-center justify-center gap-3">
                    <button
                      type="button"
                      onClick={() => setPage((p) => Math.max(1, p - 1))}
                      disabled={page === 1}
                      className="px-4 py-2 rounded-lg bg-white border border-gray-300 text-gray-700 font-medium hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed"
                    >
                      ← Prev
                    </button>

                    <span className="text-sm text-gray-600 font-medium">
                      Page {page} of {totalPages}
                    </span>

                    <button
                      type="button"
                      onClick={() =>
                        setPage((p) => Math.min(totalPages, p + 1))
                      }
                      disabled={page === totalPages}
                      className="px-4 py-2 rounded-lg bg-white border border-gray-300 text-gray-700 font-medium hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed"
                    >
                      Next →
                    </button>
                  </div>
                )}

                               {/* Quick Date Jump (paginated report list) */}
                {allDates.length > 0 && (
                  <div className="mt-6">
                    <p className="text-xs text-gray-500 text-center mb-2">
                      Jump to a saved report:
                    </p>
                    <div className="flex flex-wrap gap-2 justify-center">
                      {allDates.map((d) => (
                        <button
                          key={d}
                          type="button"
                          onClick={() => {
                            setSelectedDate(d);
                            window.scrollTo({ top: 0, behavior: "smooth" });
                          }}
                          className={`text-xs px-3 py-1.5 rounded-lg border transition-all ${
                            selectedDate === d
                              ? "bg-blue-600 text-white border-blue-600"
                              : "bg-white text-gray-700 border-gray-300 hover:bg-blue-50"
                          }`}
                        >
                          {formatIndianDate(d)}
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                              {/* Tape Used (Full Day) - at the very end */}
                <div className="mt-8 p-4 bg-amber-50 border border-amber-200 rounded-xl">
                  <label className="block font-semibold text-amber-900 mb-2">
                    🎗️ Tape Used (Full Day)
                  </label>
                  <input
                    type="text"
                    value={tapeUsed}
                    onChange={(e) => setTapeUsed(e.target.value)}
                    placeholder="e.g. 5 rolls"
                    className="w-full md:w-1/2 border border-amber-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-amber-500 bg-white"
                  />
                  <span className="ml-2">pcs</span>
                </div>

                {/* Saved By + Digital Signature */}
                {savedBy && (
                  <div className="mt-6 p-4 bg-slate-50 border border-slate-200 rounded-xl flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                    <div>
                      <p className="text-xs uppercase tracking-wide text-slate-500 font-semibold">
                        Report saved by
                      </p>
                      <p className="text-base font-semibold text-slate-900 mt-1">
                        {savedBy.name || "—"}
                      </p>
                      {savedBy.email && (
                        <p className="text-xs text-slate-600">{savedBy.email}</p>
                      )}
                    </div>

                                    {savedBy.digitalSignature ? (
                      <div className="flex flex-col items-center sm:items-end">
                        <img
                          src={savedBy.digitalSignature}
                          alt="Digital Signature"
                          className="h-16 max-w-[200px] object-contain border border-slate-200 rounded bg-white p-1 cursor-pointer hover:shadow-md hover:border-blue-400 transition-all"
                          onClick={() =>
                            Swal.fire({
                              title: "Authorised Signature",
                              imageUrl: savedBy.digitalSignature,
                              imageAlt: "Digital Signature",
                              html: `
                                <p style="margin-top:8px;font-size:12px;color:#64748b;">
                                  ${savedBy.name || ""}${savedBy.email ? ` — ${savedBy.email}` : ""}
                                </p>
                              `,
                              showCloseButton: true,
                              showConfirmButton: false,
                              showCancelButton: true,
                              cancelButtonText: "Close",
                              cancelButtonColor: "#6b7280",
                              width: "min(90vw, 600px)",
                              background: "rgba(255,255,255,0.95)",
                              backdrop: "rgba(0,0,0,0.4)",
                              customClass: {
                                image: "swal-signature-image",
                                popup: "rounded-2xl",
                              },
                              didOpen: () => {
                                // Make the image clickable to open full in new tab
                                const imgEl = Swal.getImage();
                                if (imgEl) {
                                  imgEl.style.cursor = "zoom-in";
                                  imgEl.style.maxHeight = "70vh";
                                  imgEl.style.objectFit = "contain";
                                  imgEl.addEventListener("click", () => {
                                    window.open(savedBy.digitalSignature, "_blank");
                                  });
                                }
                              },
                            })
                          }
                        />
                        <p className="text-[10px] uppercase tracking-wider text-slate-500 mt-1">
                          Authorised Signature · Click to view
                        </p>
                      </div>
                    ) : (
                      <p className="text-xs italic text-slate-400">
                        No digital signature on file for this user.
                      </p>
                    )}
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      </main>
    </>
  );
}