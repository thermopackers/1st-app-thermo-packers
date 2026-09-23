// src/pages/PurchaseProductSuppliers.jsx
import React, { useState, useEffect } from "react";
import { NavLink, useNavigate } from "react-router-dom";
import { useUserContext } from "../context/UserContext";
import InternalNavbar from "../components/InternalNavbar";
import { DollarSign, Search, X, Download, Eye, Loader2 } from "lucide-react";
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import axiosInstance from "../axiosInstance";

// Helper function to parse roles properly
const parseUserRoles = (user) => {
  if (!user || !user.role) {
    return [];
  }
  
  let userRoles = [];
  if (Array.isArray(user.role)) {
    if (user.role.length > 0 && typeof user.role[0] === 'string' && user.role[0].startsWith('[')) {
      try {
        userRoles = JSON.parse(user.role[0]);
      } catch (parseError) {
        userRoles = user.role;
      }
    } else {
      userRoles = user.role;
    }
  } else if (typeof user.role === 'string') {
    try {
      userRoles = JSON.parse(user.role);
    } catch (parseError) {
      userRoles = [user.role];
    }
  } else {
    userRoles = [user.role];
  }
  return userRoles;
};

export default function PurchaseProductSuppliers() {
    const { user } = useUserContext();
    const navigate = useNavigate();
    const [searchTerm, setSearchTerm] = useState("");
    const [searchType, setSearchType] = useState("products");
    const [searchResults, setSearchResults] = useState([]);
    const [loading, setLoading] = useState(false);
    const [selectedProduct, setSelectedProduct] = useState(null);
    const [showProductModal, setShowProductModal] = useState(false);
    const [selectedSupplier, setSelectedSupplier] = useState(null);
    const [showSupplierModal, setShowSupplierModal] = useState(false);
    const [pdfGenerating, setPdfGenerating] = useState(false);
    const [matchingSuppliers, setMatchingSuppliers] = useState([]);
    const [loadingSuppliers, setLoadingSuppliers] = useState(false);
    
    const userRoles = user ? parseUserRoles(user) : [];

    // Search function
    const handleSearch = async () => {
        if (!searchTerm.trim()) {
            setSearchResults([]);
            return;
        }

        setLoading(true);
        try {
            const token = localStorage.getItem("token");
            
            if (searchType === "products") {
                const response = await axiosInstance.get(
                    `/purchase-products?search=${encodeURIComponent(searchTerm)}&limit=100`,
                    { headers: { Authorization: `Bearer ${token}` } }
                );
                setSearchResults(response.data.data || []);
            } else {
                const response = await axiosInstance.get(
                    `/suppliers?search=${encodeURIComponent(searchTerm)}&limit=100`,
                    { headers: { Authorization: `Bearer ${token}` } }
                );
                setSearchResults(response.data.data || []);
            }
        } catch (error) {
            console.error("Search error:", error);
        } finally {
            setLoading(false);
        }
    };

    // Handle Enter key press
    const handleKeyPress = (e) => {
        if (e.key === "Enter") {
            handleSearch();
        }
    };

    // Clear search
    const clearSearch = () => {
        setSearchTerm("");
        setSearchResults([]);
    };

    // Fetch suppliers matching the product's category
    const fetchMatchingSuppliers = async (categoryName) => {
        if (!categoryName) {
            setMatchingSuppliers([]);
            return;
        }
        setLoadingSuppliers(true);
        try {
            const res = await axiosInstance.get(
                `/suppliers/by-category/${encodeURIComponent(categoryName)}`
            );
            if (res.data.success) {
                setMatchingSuppliers(res.data.suppliers || []);
            } else {
                setMatchingSuppliers([]);
            }
        } catch (err) {
            console.warn("Failed to fetch matching suppliers", err);
            setMatchingSuppliers([]);
        } finally {
            setLoadingSuppliers(false);
        }
    };

    // View product details
    const viewProductDetails = (product) => {
        setSelectedProduct(product);
        setShowProductModal(true);
        // Fetch matching suppliers based on product's category
        if (product?.category?.name) {
            fetchMatchingSuppliers(product.category.name);
        } else {
            setMatchingSuppliers([]);
        }
    };

    // View supplier details
    const viewSupplierDetails = (supplier) => {
        setSelectedSupplier(supplier);
        setShowSupplierModal(true);
    };

    // Generate PDF for product with smaller images
    const generateProductPDF = async (product) => {
        setPdfGenerating(true);
        try {
            const doc = new jsPDF({
                unit: 'mm',
                format: 'a4',
                orientation: 'portrait'
            });

            const PAGE_WIDTH = 210;
            const PAGE_HEIGHT = 297;
            const MARGIN = 10;
            const CONTENT_WIDTH = PAGE_WIDTH - MARGIN * 2; // 190mm

            let yPos = MARGIN;

            // ==================== HEADER ====================
            doc.setFillColor(41, 128, 185);
            doc.rect(0, 0, PAGE_WIDTH, 14, 'F');
            doc.setTextColor(255, 255, 255);
            doc.setFontSize(14);
            doc.setFont("helvetica", "bold");
            doc.text("PRODUCT DETAILS", PAGE_WIDTH / 2, 9, { align: 'center' });
            doc.setTextColor(0, 0, 0);

            yPos = 18;
            doc.setFontSize(8);
            doc.setFont("helvetica", "normal");
            doc.setTextColor(100, 100, 100);
            doc.text(`Generated: ${new Date().toLocaleString()}`, MARGIN, yPos);
            doc.setTextColor(0, 0, 0);

            yPos += 3;
            doc.setDrawColor(200, 200, 200);
            doc.line(MARGIN, yPos, PAGE_WIDTH - MARGIN, yPos);
            yPos += 4;

            // ==================== PRODUCT DETAILS (2-column grid) ====================
            doc.setFontSize(10);
            doc.setFont("helvetica", "bold");
            doc.setTextColor(41, 128, 185);
            doc.text("Product Information", MARGIN, yPos);
            doc.setTextColor(0, 0, 0);
            yPos += 4;

            const details = [
                ["Name", product.name || "N/A"],
                ["Unit", product.unit || "N/A"],
                ["Weight", product.weight ? `${product.weight} kg` : "N/A"],
                ["HSN Code", product.hsnCode || "N/A"],
                ["GST %", product.gstPercent ? `${product.gstPercent}%` : "N/A"],
                ["Price", product.price ? `Rs. ${product.price}` : "N/A"],
                ["Stock", product.stock || 0],
                ["Available Qty", product.availableQuantity || 0],
                ["Category", product.category?.name || "N/A"],
                ["Is Gift Item", product.isGiftItem ? "Yes" : "No"],
                ["Gift Category", product.giftCategory || "N/A"],
                ["Created At", product.createdAt ? new Date(product.createdAt).toLocaleDateString() : "N/A"]
            ];

            // 2-column layout for details
            const colWidth = CONTENT_WIDTH / 2;
            const rowHeight = 5.5;
            const labelWidth = 22;

            details.forEach(([label, value], index) => {
                const col = index % 2;
                const row = Math.floor(index / 2);
                const xBase = MARGIN + col * colWidth;
                const yBase = yPos + row * rowHeight;

                doc.setFontSize(8);
                doc.setFont("helvetica", "bold");
                doc.setTextColor(80, 80, 80);
                doc.text(`${label}:`, xBase, yBase);

                doc.setFont("helvetica", "normal");
                doc.setTextColor(0, 0, 0);
                const valueStr = String(value);
                const truncated = valueStr.length > 30 ? valueStr.slice(0, 28) + "…" : valueStr;
                doc.text(truncated, xBase + labelWidth, yBase);
            });

            const detailRows = Math.ceil(details.length / 2);
            yPos += detailRows * rowHeight + 3;

            // ==================== DESCRIPTION & COMMENT ====================
            if (product.description || product.comment) {
                doc.setDrawColor(220, 220, 220);
                doc.line(MARGIN, yPos, PAGE_WIDTH - MARGIN, yPos);
                yPos += 4;

                if (product.description) {
                    doc.setFontSize(8);
                    doc.setFont("helvetica", "bold");
                    doc.setTextColor(80, 80, 80);
                    doc.text("Description:", MARGIN, yPos);
                    doc.setFont("helvetica", "normal");
                    doc.setTextColor(0, 0, 0);
                    const descLines = doc.splitTextToSize(product.description, CONTENT_WIDTH - 25);
                    doc.text(descLines, MARGIN + 25, yPos);
                    yPos += descLines.length * 3.5 + 1;
                }

                if (product.comment) {
                    doc.setFontSize(8);
                    doc.setFont("helvetica", "bold");
                    doc.setTextColor(80, 80, 80);
                    doc.text("Comment:", MARGIN, yPos);
                    doc.setFont("helvetica", "normal");
                    doc.setTextColor(0, 0, 0);
                    const commentLines = doc.splitTextToSize(product.comment, CONTENT_WIDTH - 25);
                    doc.text(commentLines, MARGIN + 25, yPos);
                    yPos += commentLines.length * 3.5 + 1;
                }
                yPos += 2;
            }

            // ==================== PRODUCT IMAGES ====================
            const allImages = [
                ...(product.files || []).slice(0, 4).map(f => ({ url: f.url, type: 'Product' })),
                ...(product.internalImages || []).slice(0, 4).map(f => ({ url: f.url, type: 'Internal' }))
            ];

            if (allImages.length > 0) {
                doc.setDrawColor(220, 220, 220);
                doc.line(MARGIN, yPos, PAGE_WIDTH - MARGIN, yPos);
                yPos += 4;

                doc.setFontSize(10);
                doc.setFont("helvetica", "bold");
                doc.setTextColor(41, 128, 185);
                doc.text(`Product Images (${allImages.length})`, MARGIN, yPos);
                doc.setTextColor(0, 0, 0);
                yPos += 4;

                // Load images in parallel
                const imagePromises = allImages.map(async (img, index) => {
                    try {
                        const controller = new AbortController();
                        const timeoutId = setTimeout(() => controller.abort(), 5000);
                        
                        const response = await fetch(img.url, { 
                            signal: controller.signal,
                            mode: 'cors'
                        });
                        clearTimeout(timeoutId);
                        
                        if (!response.ok) return null;
                        
                        const blob = await response.blob();
                        const reader = new FileReader();
                        
                        return new Promise((resolve) => {
                            reader.onload = () => resolve({
                                data: reader.result,
                                index: index,
                                type: img.type
                            });
                            reader.readAsDataURL(blob);
                        });
                    } catch (error) {
                        console.error(`Error loading image ${index}:`, error);
                        return null;
                    }
                });

                const results = await Promise.all(imagePromises);
                const loadedImages = results.filter(r => r !== null);

                // Grid layout - 4 images per row, compact cells
                const maxImagesPerRow = 4;
                const cellWidth = (CONTENT_WIDTH - 9) / 4; // ~45mm each with gaps
                const cellHeight = 32;
                const gapX = 3;
                const gapY = 3;
                const startX = MARGIN;
                const imageStartY = yPos;

                for (let i = 0; i < loadedImages.length; i++) {
                    const imgData = loadedImages[i];
                    try {
                        const img = new Image();
                        img.src = imgData.data;
                        await new Promise((resolve) => {
                            img.onload = resolve;
                            img.onerror = resolve;
                        });

                        let naturalWidth = img.width || 200;
                        let naturalHeight = img.height || 200;

                        // Fit inside cell preserving aspect ratio
                        const scale = Math.min(
                            cellWidth / naturalWidth,
                            cellHeight / naturalHeight
                        );
                        const widthMm = naturalWidth * scale;
                        const heightMm = naturalHeight * scale;

                        const colIndex = i % maxImagesPerRow;
                        const rowIndex = Math.floor(i / maxImagesPerRow);

                        const cellX = startX + colIndex * (cellWidth + gapX);
                        const cellY = imageStartY + rowIndex * (cellHeight + gapY);

                        // Center inside cell
                        const xPos = cellX + (cellWidth - widthMm) / 2;
                        const yPosImg = cellY + (cellHeight - heightMm) / 2;

                        doc.addImage(imgData.data, 'JPEG', xPos, yPosImg, widthMm, heightMm);
                    } catch (error) {
                        console.error("Error adding image to PDF:", error);
                    }
                }

                const totalRows = Math.ceil(loadedImages.length / maxImagesPerRow) || 1;
                yPos = imageStartY + totalRows * (cellHeight + gapY) + 2;
            }

            // ==================== MATCHING SUPPLIERS ====================
            if (matchingSuppliers.length > 0) {
                doc.setDrawColor(220, 220, 220);
                doc.line(MARGIN, yPos, PAGE_WIDTH - MARGIN, yPos);
                yPos += 4;

                doc.setFontSize(10);
                doc.setFont("helvetica", "bold");
                doc.setTextColor(41, 128, 185);
                doc.text(`Suppliers for "${product?.category?.name || 'N/A'}" (${matchingSuppliers.length})`, MARGIN, yPos);
                doc.setTextColor(0, 0, 0);
                yPos += 2;

                const supplierData = matchingSuppliers.map(s => [
                    s.name || "N/A",
                    [s.phone, s.phone2].filter(Boolean).join(", ") || "N/A",
                    s.email || "N/A",
                    s.gstNumber || "N/A",
                    s.address || "N/A"
                ]);

                autoTable(doc, {
                    startY: yPos,
                    head: [["Supplier Name", "Phone", "Email", "GST Number", "Address"]],
                    body: supplierData,
                    theme: "grid",
                    margin: { left: MARGIN, right: MARGIN, top: MARGIN, bottom: MARGIN },
                    styles: { 
                        fontSize: 7, 
                        cellPadding: 1.2,
                        overflow: 'linebreak',
                        lineColor: [220, 220, 220],
                        lineWidth: 0.1
                    },
                    headStyles: { 
                        fillColor: [41, 128, 185],
                        textColor: [255, 255, 255],
                        fontSize: 7.5,
                        fontStyle: 'bold',
                        halign: 'center'
                    },
                    alternateRowStyles: { fillColor: [245, 248, 252] },
                    columnStyles: {
                        0: { cellWidth: 32 },
                        1: { cellWidth: 30 },
                        2: { cellWidth: 42 },
                        3: { cellWidth: 30 },
                        4: { cellWidth: 56 }
                    }
                });

                yPos = doc.lastAutoTable.finalY + 3;
            }

            // ==================== STOCK HISTORY ====================
            if (product.stockHistory && product.stockHistory.length > 0) {
                // Check if we need a page break
                if (yPos > PAGE_HEIGHT - 50) {
                    doc.addPage();
                    yPos = MARGIN;
                }

                doc.setDrawColor(220, 220, 220);
                doc.line(MARGIN, yPos, PAGE_WIDTH - MARGIN, yPos);
                yPos += 4;

                doc.setFontSize(10);
                doc.setFont("helvetica", "bold");
                doc.setTextColor(41, 128, 185);
                doc.text(`Stock History (Latest ${Math.min(product.stockHistory.length, 10)})`, MARGIN, yPos);
                doc.setTextColor(0, 0, 0);
                yPos += 2;

                const historyData = product.stockHistory.slice(0, 10).map(entry => [
                    new Date(entry.date).toLocaleDateString(),
                    entry.added || 0,
                    entry.removed || 0,
                    entry.newStock || 0,
                    entry.reason || "N/A"
                ]);

                autoTable(doc, {
                    startY: yPos,
                    head: [["Date", "Added", "Removed", "New Stock", "Reason"]],
                    body: historyData,
                    theme: "grid",
                    margin: { left: MARGIN, right: MARGIN, top: MARGIN, bottom: MARGIN },
                    styles: { 
                        fontSize: 7, 
                        cellPadding: 1.2,
                        overflow: 'linebreak',
                        lineColor: [220, 220, 220],
                        lineWidth: 0.1
                    },
                    headStyles: { 
                        fillColor: [41, 128, 185],
                        textColor: [255, 255, 255],
                        fontSize: 7.5,
                        fontStyle: 'bold',
                        halign: 'center'
                    },
                    alternateRowStyles: { fillColor: [245, 248, 252] },
                    columnStyles: {
                        0: { cellWidth: 30, halign: 'center' },
                        1: { cellWidth: 25, halign: 'center' },
                        2: { cellWidth: 25, halign: 'center' },
                        3: { cellWidth: 30, halign: 'center' },
                        4: { cellWidth: 80 }
                    }
                });
            }

            // ==================== FOOTER ====================
            const totalPages = doc.internal.getNumberOfPages();
            for (let i = 1; i <= totalPages; i++) {
                doc.setPage(i);
                doc.setFontSize(7);
                doc.setTextColor(150, 150, 150);
                doc.text(
                    `Page ${i} of ${totalPages}`,
                    PAGE_WIDTH / 2,
                    PAGE_HEIGHT - 5,
                    { align: 'center' }
                );
            }

            // Save PDF
            doc.save(`${(product.name || 'product').replace(/\s+/g, '_')}_details.pdf`);
        } catch (error) {
            console.error("PDF generation error:", error);
            alert("Error generating PDF. Please try again.");
        } finally {
            setPdfGenerating(false);
        }
    };
    return (
        <>
        <InternalNavbar />

        {userRoles.includes("accounts") && (
        <div className="p-6">
            {/* Search Bar Section */}
            <div className="bg-white rounded-lg shadow-md p-4 mb-6">
                <h2 className="text-lg font-semibold mb-3">Search Products / Suppliers</h2>
                <div className="flex flex-col sm:flex-row gap-3">
                    <div className="flex-1 flex gap-2">
                        <select
                            value={searchType}
                            onChange={(e) => setSearchType(e.target.value)}
                            className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        >
                            <option value="products">Products</option>
                            <option value="suppliers">Suppliers</option>
                        </select>
                        <div className="flex-1 relative">
                            <input
                                type="text"
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                onKeyPress={handleKeyPress}
                                placeholder={`Search ${searchType} by name, description, HSN code...`}
                                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                            />
                            {searchTerm && (
                                <button
                                    onClick={clearSearch}
                                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                                >
                                    <X size={18} />
                                </button>
                            )}
                        </div>
                    </div>
                    <button
                        onClick={handleSearch}
                        disabled={loading}
                        className="px-6 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg font-semibold flex items-center justify-center gap-2 disabled:opacity-50"
                    >
                        <Search size={18} />
                        {loading ? "Searching..." : "Search"}
                    </button>
                </div>

                {/* Search Results */}
                {searchResults.length > 0 && (
                    <div className="mt-4">
                        <h3 className="font-semibold text-gray-700 mb-2">
                            Found {searchResults.length} {searchType}:
                        </h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 max-h-96 overflow-y-auto">
                            {searchResults.map((item) => (
                                <div
                                    key={item._id}
                                    className="border border-gray-200 rounded-lg p-3 hover:bg-gray-50 cursor-pointer"
                                    onClick={() => {
                                        if (searchType === "products") {
                                            viewProductDetails(item);
                                        } else {
                                            viewSupplierDetails(item);
                                        }
                                    }}
                                >
                                    <div className="flex justify-between items-start">
                                        <div>
                                            <p className="font-semibold text-gray-800">
                                                {searchType === "products" ? item.name : item.name}
                                            </p>
                                            {searchType === "products" ? (
                                                <p className="text-sm text-gray-500">
                                                    {item.unit || "N/A"} • Stock: {item.stock || 0}
                                                </p>
                                            ) : (
                                                <p className="text-sm text-gray-500">
                                                    {item.company || "No company"} • {item.email || "No email"}
                                                </p>
                                            )}
                                        </div>
                                        <button
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                if (searchType === "products") {
                                                    viewProductDetails(item);
                                                } else {
                                                    viewSupplierDetails(item);
                                                }
                                            }}
                                            className="text-blue-500 hover:text-blue-700"
                                        >
                                            <Eye size={16} />
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}
            </div>

            <h1 className="text-2xl font-bold mb-4">Purchase Product / Suppliers</h1>
            
            {/* RFQ Section */}
            <div className="bg-white rounded-lg shadow-md p-4 mb-6">
                <h3 className="text-xl font-bold text-gray-800 text-center mb-4">
                    RFQ (Request for Quotation)
                </h3>
                <div className="grid grid-cols-1 gap-4">
                    <button
                        onClick={() => navigate("/send-rfq")}
                        className="w-full bg-blue-500 hover:bg-blue-600 text-white border border-gray-300 rounded-lg p-6 text-sm sm:text-base text-center cursor-pointer font-semibold"
                    >
                        📩 Raise New RFQ
                    </button>
                    <button
                        onClick={() => navigate("/view-rfqs")}
                        className="w-full bg-green-500 hover:bg-green-600 text-white border border-gray-300 rounded-lg p-6 text-sm sm:text-base text-center cursor-pointer font-semibold"
                    >
                        📜 View/Edit/Delete/Share OLD RFQ
                    </button>
                </div>
            </div>

            {(userRoles.includes("admin") || userRoles.includes("accounts")) && (
                <div className="mt-6">
                    {/* Purchase - Products / Services */}
                    <div className="bg-white rounded-lg shadow-md p-4 mb-6">
                        <h3 className="text-xl font-bold text-gray-800 text-center mb-4">
                            PURCHASE - Products / Services
                        </h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <NavLink to="/add-purchase-product" className="w-full">
                                <button className="w-full bg-indigo-500 hover:bg-indigo-600 text-white border border-gray-300 rounded-lg p-6 text-sm sm:text-base text-center cursor-pointer">
                                    ➕ Add New Product/Service for Purchase
                                </button>
                            </NavLink>
                            <NavLink to="/all-purchase-products" className="w-full">
                                <button className="w-full bg-blue-500 hover:bg-blue-600 text-white border border-gray-300 rounded-lg p-6 text-sm sm:text-base text-center cursor-pointer">
                                    📦 View/Edit/Delete Products/Services for Purchase
                                </button>
                            </NavLink>
                            <NavLink to="/stock-management" className="w-full">
                                <button className="w-full bg-purple-500 hover:bg-purple-600 text-white border border-gray-300 rounded-lg p-6 text-sm sm:text-base text-center cursor-pointer">
                                    📊 Stock Management
                                </button>
                            </NavLink>
                        </div>
                    </div>

                    {/* Supplier/Vendor Info */}
                    <div className="bg-white rounded-lg shadow-md p-4 mb-6">
                        <h3 className="text-xl font-bold text-gray-800 text-center mb-4">
                            SUPPLIER / VENDOR Information
                        </h3>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            <NavLink to="/add-supplier" className="w-full">
                                <button className="w-full bg-emerald-500 hover:bg-emerald-600 text-white border border-gray-300 rounded-lg p-6 text-sm sm:text-base text-center cursor-pointer">
                                    ➕ Add New Supplier/Vendor
                                </button>
                            </NavLink>
                            <NavLink to="/all-suppliers" className="w-full">
                                <button className="w-full bg-teal-500 hover:bg-teal-600 text-white border border-gray-300 rounded-lg p-6 text-sm sm:text-base text-center cursor-pointer">
                                    📂 View/Edit/Delete Supplier/Vendor
                                </button>
                            </NavLink>
                            <NavLink to="/add-category" className="w-full">
                                <button className="w-full bg-pink-500 hover:bg-pink-600 text-white border border-gray-300 rounded-lg p-6 text-sm sm:text-base text-center cursor-pointer">
                                    ➕ Add New Supplier/Vendor Category
                                </button>
                            </NavLink>
                        </div>
                    </div>

                    {/* Purchase Order Section */}
                    <div className="bg-white rounded-lg shadow-md p-4">
                        <h3 className="text-xl font-bold text-gray-800 text-center mb-4">
                            PURCHASE ORDER - To Suppliers/Vendors
                        </h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <NavLink to="/create-purchase-order" className="w-full">
                                <button className="w-full bg-orange-500 hover:bg-orange-600 text-white border border-gray-300 rounded-lg p-6 text-sm sm:text-base text-center cursor-pointer">
                                    📝 Make New Purchase Order
                                </button>
                            </NavLink>
                            <NavLink to="/purchase-orders" className="w-full">
                                <button className="w-full bg-yellow-500 hover:bg-yellow-600 text-white border border-gray-300 rounded-lg p-6 text-sm sm:text-base text-center cursor-pointer">
                                    📄 View/Edit Old Purchase Orders
                                </button>
                            </NavLink>
                        </div>
                    </div>
                </div>
            )}
        </div>
        )}

        {/* Product Details Modal */}
        {showProductModal && selectedProduct && (
            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
                <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
                    <div className="sticky top-0 bg-white border-b p-4 flex justify-between items-center">
                        <h2 className="text-xl font-bold">Product Details</h2>
                        <div className="flex gap-2">
                            <button
                                onClick={() => generateProductPDF(selectedProduct)}
                                disabled={pdfGenerating}
                                className="px-4 py-2 bg-green-500 hover:bg-green-600 text-white rounded-lg flex items-center gap-2 disabled:opacity-50"
                            >
                                {pdfGenerating ? (
                                    <>
                                        <Loader2 size={18} className="animate-spin" />
                                        Generating...
                                    </>
                                ) : (
                                    <>
                                        <Download size={18} />
                                        Download PDF
                                    </>
                                )}
                            </button>
                            <button
                                onClick={() => {
                                    setShowProductModal(false);
                                    setMatchingSuppliers([]);
                                }}
                                className="p-2 hover:bg-gray-100 rounded-full"
                            >
                                <X size={24} />
                            </button>
                        </div>
                    </div>
                    <div className="p-6">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <p className="text-sm text-gray-500">Name</p>
                                <p className="font-semibold">{selectedProduct.name || "N/A"}</p>
                            </div>
                            <div>
                                <p className="text-sm text-gray-500">Unit</p>
                                <p className="font-semibold">{selectedProduct.unit || "N/A"}</p>
                            </div>
                            <div>
                                <p className="text-sm text-gray-500">Weight</p>
                                <p className="font-semibold">{selectedProduct.weight ? `${selectedProduct.weight} kg` : "N/A"}</p>
                            </div>
                            <div>
                                <p className="text-sm text-gray-500">HSN Code</p>
                                <p className="font-semibold">{selectedProduct.hsnCode || "N/A"}</p>
                            </div>
                            <div>
                                <p className="text-sm text-gray-500">GST Percent</p>
                                <p className="font-semibold">{selectedProduct.gstPercent ? `${selectedProduct.gstPercent}%` : "N/A"}</p>
                            </div>
                            <div>
                                <p className="text-sm text-gray-500">Price</p>
                                <p className="font-semibold">{selectedProduct.price ? `₹${selectedProduct.price}` : "N/A"}</p>
                            </div>
                            <div>
                                <p className="text-sm text-gray-500">Stock</p>
                                <p className="font-semibold">{selectedProduct.stock || 0}</p>
                            </div>
                            <div>
                                <p className="text-sm text-gray-500">Available Quantity</p>
                                <p className="font-semibold">{selectedProduct.availableQuantity || 0}</p>
                            </div>
                            <div>
                                <p className="text-sm text-gray-500">Category</p>
                                <p className="font-semibold">{selectedProduct.category?.name || "N/A"}</p>
                            </div>
                            <div>
                                <p className="text-sm text-gray-500">Is Gift Item</p>
                                <p className="font-semibold">{selectedProduct.isGiftItem ? "Yes" : "No"}</p>
                            </div>
                            <div>
                                <p className="text-sm text-gray-500">Gift Category</p>
                                <p className="font-semibold">{selectedProduct.giftCategory || "N/A"}</p>
                            </div>
                            <div>
                                <p className="text-sm text-gray-500">Created At</p>
                                <p className="font-semibold">{selectedProduct.createdAt ? new Date(selectedProduct.createdAt).toLocaleDateString() : "N/A"}</p>
                            </div>
                            <div className="md:col-span-2">
                                <p className="text-sm text-gray-500">Description</p>
                                <p className="font-semibold">{selectedProduct.description || "N/A"}</p>
                            </div>
                            <div className="md:col-span-2">
                                <p className="text-sm text-gray-500">Comment</p>
                                <p className="font-semibold">{selectedProduct.comment || "N/A"}</p>
                            </div>

                            {/* Product Images in Modal */}
                            {selectedProduct.files && selectedProduct.files.length > 0 && (
                                <div className="md:col-span-2 mt-4">
                                    <p className="text-sm text-gray-500 mb-2">Product Images</p>
                                    <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                                        {selectedProduct.files.slice(0, 4).map((file, idx) => (
                                            <div key={idx} className="border rounded-lg overflow-hidden">
                                                <img 
                                                    src={file.url} 
                                                    alt={`Product ${idx + 1}`}
                                                    className="w-full h-32 object-cover"
                                                    onError={(e) => {
                                                        e.target.src = 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="100" height="100" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"%3E%3Crect x="3" y="3" width="18" height="18" rx="2"%3E%3C/rect%3E%3Ccircle cx="8.5" cy="8.5" r="1.5"%3E%3C/circle%3E%3Cpath d="M21 15l-5-5L5 21"%3E%3C/path%3E%3C/svg%3E';
                                                    }}
                                                />
                                            </div>
                                        ))}
                                    </div>
                                    {selectedProduct.files.length > 4 && (
                                        <p className="text-sm text-gray-500 mt-2">+ {selectedProduct.files.length - 4} more images</p>
                                    )}
                                </div>
                            )}

                            {/* Internal Images in Modal */}
                            {selectedProduct.internalImages && selectedProduct.internalImages.length > 0 && (
                                <div className="md:col-span-2 mt-4">
                                    <p className="text-sm text-gray-500 mb-2">Internal Images</p>
                                    <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                                        {selectedProduct.internalImages.slice(0, 4).map((file, idx) => (
                                            <div key={idx} className="border rounded-lg overflow-hidden">
                                                <img 
                                                    src={file.url} 
                                                    alt={`Internal ${idx + 1}`}
                                                    className="w-full h-32 object-cover"
                                                    onError={(e) => {
                                                        e.target.src = 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="100" height="100" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"%3E%3Crect x="3" y="3" width="18" height="18" rx="2"%3E%3C/rect%3E%3Ccircle cx="8.5" cy="8.5" r="1.5"%3E%3C/circle%3E%3Cpath d="M21 15l-5-5L5 21"%3E%3C/path%3E%3C/svg%3E';
                                                    }}
                                                />
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* ✅ NEW: Matching Suppliers Section */}
                        <div className="md:col-span-2 mt-6 border-t pt-4">
                            <h3 className="font-semibold mb-3 text-blue-700">
                                🏭 Suppliers for "{selectedProduct?.category?.name || 'N/A'}" Category
                            </h3>
                            
                            {loadingSuppliers ? (
                                <div className="flex items-center gap-2 text-gray-500">
                                    <Loader2 size={18} className="animate-spin" />
                                    Loading suppliers...
                                </div>
                            ) : matchingSuppliers.length > 0 ? (
                                <div className="overflow-x-auto border rounded-lg">
                                    <table className="min-w-full table-auto border-collapse text-sm">
                                        <thead className="bg-gray-100 text-left">
                                            <tr>
                                                <th className="px-4 py-2 border">Supplier Name</th>
                                                <th className="px-4 py-2 border">Phone</th>
                                                <th className="px-4 py-2 border">Email</th>
                                                <th className="px-4 py-2 border">GST Number</th>
                                                <th className="px-4 py-2 border">Address</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {matchingSuppliers.map((supplier, i) => (
                                                <tr key={supplier._id || i} className="hover:bg-gray-50">
                                                    <td className="px-4 py-2 border font-semibold">
                                                        {supplier.name || "N/A"}
                                                    </td>
                                                    <td className="px-4 py-2 border">
                                                        {[supplier.phone, supplier.phone2].filter(Boolean).join(", ") || "-"}
                                                    </td>
                                                    <td className="px-4 py-2 border">
                                                        {supplier.email || "-"}
                                                    </td>
                                                    <td className="px-4 py-2 border">
                                                        {supplier.gstNumber || "-"}
                                                    </td>
                                                    <td className="px-4 py-2 border">
                                                        {supplier.address || "-"}
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            ) : (
                                <p className="text-gray-500 text-sm italic">
                                    No suppliers found for this category.
                                </p>
                            )}
                        </div>

                        {/* Stock History */}
                        {selectedProduct.stockHistory && selectedProduct.stockHistory.length > 0 && (
                            <div className="mt-6">
                                <h3 className="font-semibold mb-2">Stock History</h3>
                                <div className="overflow-x-auto">
                                    <table className="min-w-full divide-y divide-gray-200">
                                        <thead className="bg-gray-50">
                                            <tr>
                                                <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">Date</th>
                                                <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">Added</th>
                                                <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">Removed</th>
                                                <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">New Stock</th>
                                                <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">Reason</th>
                                            </tr>
                                        </thead>
                                        <tbody className="bg-white divide-y divide-gray-200">
                                            {selectedProduct.stockHistory.slice(0, 10).map((entry, index) => (
                                                <tr key={index}>
                                                    <td className="px-3 py-2 text-sm">{new Date(entry.date).toLocaleDateString()}</td>
                                                    <td className="px-3 py-2 text-sm">{entry.added || 0}</td>
                                                    <td className="px-3 py-2 text-sm">{entry.removed || 0}</td>
                                                    <td className="px-3 py-2 text-sm">{entry.newStock || 0}</td>
                                                    <td className="px-3 py-2 text-sm">{entry.reason || "N/A"}</td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        )}

        {/* Supplier Details Modal */}
        {showSupplierModal && selectedSupplier && (
            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
                <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
                    <div className="sticky top-0 bg-white border-b p-4 flex justify-between items-center">
                        <h2 className="text-xl font-bold">Supplier Details</h2>
                        <button
                            onClick={() => setShowSupplierModal(false)}
                            className="p-2 hover:bg-gray-100 rounded-full"
                        >
                            <X size={24} />
                        </button>
                    </div>
                    <div className="p-6">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <p className="text-sm text-gray-500">Name</p>
                                <p className="font-semibold">{selectedSupplier.name || "N/A"}</p>
                            </div>
                            <div>
                                <p className="text-sm text-gray-500">Company</p>
                                <p className="font-semibold">{selectedSupplier.company || "N/A"}</p>
                            </div>
                            <div>
                                <p className="text-sm text-gray-500">Phone</p>
                                <p className="font-semibold">{selectedSupplier.phone || "N/A"}</p>
                            </div>
                            <div>
                                <p className="text-sm text-gray-500">Phone 2</p>
                                <p className="font-semibold">{selectedSupplier.phone2 || "N/A"}</p>
                            </div>
                            <div>
                                <p className="text-sm text-gray-500">Email</p>
                                <p className="font-semibold">{selectedSupplier.email || "N/A"}</p>
                            </div>
                            <div>
                                <p className="text-sm text-gray-500">GST Number</p>
                                <p className="font-semibold">{selectedSupplier.gstNumber || "N/A"}</p>
                            </div>
                            <div className="md:col-span-2">
                                <p className="text-sm text-gray-500">Address</p>
                                <p className="font-semibold">{selectedSupplier.address || "N/A"}</p>
                            </div>
                            <div>
                                <p className="text-sm text-gray-500">Account Name</p>
                                <p className="font-semibold">{selectedSupplier.accountName || "N/A"}</p>
                            </div>
                            <div>
                                <p className="text-sm text-gray-500">Bank Name</p>
                                <p className="font-semibold">{selectedSupplier.bankName || "N/A"}</p>
                            </div>
                            <div>
                                <p className="text-sm text-gray-500">Account Number</p>
                                <p className="font-semibold">{selectedSupplier.accountNumber || "N/A"}</p>
                            </div>
                            <div>
                                <p className="text-sm text-gray-500">IFSC Code</p>
                                <p className="font-semibold">{selectedSupplier.ifscCode || "N/A"}</p>
                            </div>
                            <div className="md:col-span-2">
                                <p className="text-sm text-gray-500">Vendor Categories</p>
                                <div className="flex flex-wrap gap-2 mt-1">
                                    {selectedSupplier.vendorCategory && selectedSupplier.vendorCategory.length > 0 ? (
                                        selectedSupplier.vendorCategory.map((cat, idx) => (
                                            <span key={idx} className="px-2 py-1 bg-blue-100 text-blue-800 rounded-full text-sm">
                                                {cat}
                                            </span>
                                        ))
                                    ) : (
                                        <p className="font-semibold">N/A</p>
                                    )}
                                </div>
                            </div>
                            <div>
                                <p className="text-sm text-gray-500">Location Link</p>
                                {selectedSupplier.locationLink ? (
                                    <a href={selectedSupplier.locationLink} target="_blank" rel="noopener noreferrer" className="text-blue-500 hover:underline">
                                        View Location
                                    </a>
                                ) : (
                                    <p className="font-semibold">N/A</p>
                                )}
                            </div>
                            <div>
                                <p className="text-sm text-gray-500">Created At</p>
                                <p className="font-semibold">{selectedSupplier.createdAt ? new Date(selectedSupplier.createdAt).toLocaleDateString() : "N/A"}</p>
                            </div>
                        </div>

                        {/* Files Section */}
                        {(selectedSupplier.files && selectedSupplier.files.length > 0) && (
                            <div className="mt-6">
                                <h3 className="font-semibold mb-2">GST Files</h3>
                                <div className="flex flex-wrap gap-2">
                                    {selectedSupplier.files.map((file, idx) => (
                                        <a key={idx} href={file.url} target="_blank" rel="noopener noreferrer" className="text-blue-500 hover:underline">
                                            View File {idx + 1}
                                        </a>
                                    ))}
                                </div>
                            </div>
                        )}

                        {(selectedSupplier.chequeFiles && selectedSupplier.chequeFiles.length > 0) && (
                            <div className="mt-4">
                                <h3 className="font-semibold mb-2">Cheque/Passbook Files</h3>
                                <div className="flex flex-wrap gap-2">
                                    {selectedSupplier.chequeFiles.map((file, idx) => (
                                        <a key={idx} href={file.url} target="_blank" rel="noopener noreferrer" className="text-blue-500 hover:underline">
                                            View File {idx + 1}
                                        </a>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        )}
        </>
    );
}