import React, { useEffect, useState } from "react";
import axiosInstance from "../axiosInstance";
import InternalNavbar from "../components/InternalNavbar";
import toast from "react-hot-toast";
import LoaderOverlay from "../components/LoaderOverlay";
import { useNavigate } from "react-router-dom";
import { useParams } from "react-router-dom";
import { useUserContext } from "../context/UserContext";

export default function PurchaseOrderForm() {
  const { user } = useUserContext();
  const canApprove = user?.role?.includes("accounts");
  const [status, setStatus] = useState("pending");

  const [suppliers, setSuppliers] = useState([]);
  const [freightOption, setFreightOption] = useState("");
  const [freightComment, setFreightComment] = useState("");
  const [paymentTerm, setPaymentTerm] = useState("");
  const [paymentComment, setPaymentComment] = useState("");
  const [requiredDate, setRequiredDate] = useState("");
  const { id } = useParams();
  const [products, setProducts] = useState([]);
  const [existingPdfUrl, setExistingPdfUrl] = useState("");
  const [isUploading, setIsUploading] = useState(false);
  const [selectedSupplier, setSelectedSupplier] = useState(null);
  const [poNumber, setPoNumber] = useState("");
  const [supplierSearch, setSupplierSearch] = useState("");
  const [isSupplierDropdownOpen, setIsSupplierDropdownOpen] = useState(false);
  const [showPreviousData, setShowPreviousData] = useState(true);
  const [productEntries, setProductEntries] = useState([
    {
      name: "",
      qty: "",
      unit: "",
      price: "",
      gstPercent: "0",
      description: "",
      remarks: "",
      imageUrls: [],
      narrationImages: [], // ✅ NEW
    },
  ]);

  const navigate = useNavigate();
  const defaultTermsAndConditions = [
    "Material to be delivered on door delivery basis, Freight Paid to factory.",
    "To avoid damage in transport, material must be packed properly.",
    "Material to be weighed at delivery.",
    "Any deviation in sizes, material will be rejected and sent back.",
    "Material delivery at: THERMO PACKERS, VPO SANGAL SOHAL, KAPURTHALA ROAD, JALANDHAR, 144013, PUNJAB - INDIA",
    "All Disputes Subject to Jalandhar, Punjab Jurisdiction only.",
  ];

  const [termsAndConditions, setTermsAndConditions] = useState(
    defaultTermsAndConditions
  );
  const [isEditingTerms, setIsEditingTerms] = useState(false);
  const [newTerm, setNewTerm] = useState("");

  useEffect(() => {
    if (termsAndConditions && termsAndConditions.length > 0) {
      const sanitized = termsAndConditions.map((term) => {
        if (typeof term === "string") return term;
        if (term && typeof term === "object" && term.text) return term.text;
        return String(term || "");
      });
      if (JSON.stringify(sanitized) !== JSON.stringify(termsAndConditions)) {
        setTermsAndConditions(sanitized);
      }
    }
  }, [termsAndConditions]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const suppliersRes = await axiosInstance.get("/suppliers?limit=100000");
        setSuppliers(suppliersRes.data.data);

        const productsRes = await axiosInstance.get("/purchase-products");
        const allProducts = productsRes.data.data;
        setProducts(allProducts);

        if (!id) {
          const poRes = await axiosInstance.get("/purchase-orders/latest-po");
          setPoNumber(poRes.data.nextPoNumber);
        }

        if (id) {
          const poRes = await axiosInstance.get(`/purchase-orders/${id}`);
          const po = poRes.data;
          setPoNumber(po.poNumber);
          setSelectedSupplier(po.supplier);
          setExistingPdfUrl(po.pdfUrl);

          if (po.termsAndConditions && po.termsAndConditions.length > 0) {
            setTermsAndConditions(po.termsAndConditions);
          }

          setFreightOption(po.freightOption || "");
          setFreightComment(po.freightComment || "");
          setPaymentTerm(po.paymentTerm || "");
          setPaymentComment(po.paymentComment || "");
          setRequiredDate(po.requiredDate ? po.requiredDate.slice(0, 10) : "");

          const entries = po.products.map((p) => {
            const masterProduct = allProducts.find(
              (prod) => prod.name === p.productName
            );

            return {
              name: p.productName || "",
              qty: p.qty || "",
              unit: p.unit || masterProduct?.unit || "",
              price: p.rate || masterProduct?.price || "",
              gstPercent:
                p.gst || masterProduct?.gstPercent?.toString() || "0",
              description: masterProduct?.description || p.description || "",
              remarks: p.remarks || "",
              imageUrls: masterProduct?.files || [],
              narrationImages: p.narrationImages || [], // ✅ NEW
              previousQty: p.qty || "",
              previousPrice: p.rate || masterProduct?.price || "",
              previousGst:
                p.gst || masterProduct?.gstPercent?.toString() || "0",
              previousRemarks: p.remarks || "",
              previousDescription: p.description || "",
            };
          });

          setProductEntries(entries);
          setStatus(po.status || "pending");
        }
      } catch (err) {
        console.error("❌ Error loading PO data:", err);
      }
    };

    fetchData();
  }, [id]);

 async function convertImageToBase64(url) {
  try {
    const res = await fetch(url);
    const contentType = res.headers.get("content-type") || "";

    // ✅ Skip non-image files (e.g., PDFs)
    if (!contentType.startsWith("image/")) {
      console.warn("⚠️ Skipping non-image file:", url, contentType);
      return null;
    }

    const blob = await res.blob();
    return await new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onloadend = () => resolve(reader.result);
      reader.onerror = () => reject("FileReader error");
      reader.readAsDataURL(blob);
    });
  } catch (err) {
    console.error("Failed to convert image:", err);
    return null;
  }
}

function isPdfUrl(url) {
  if (!url) return false;
  const clean = url.split("?")[0].toLowerCase();
  return clean.endsWith(".pdf");
}


  const handleGeneratePDF = async () => {
    if (!selectedSupplier) {
      toast.error("Please select a supplier");
      return;
    }

    for (let i = 0; i < productEntries.length; i++) {
      const item = productEntries[i];
      item.gstPercent = item.gstPercent || "0";

      if (!item.name || !item.qty || !item.price || !item.gstPercent) {
        toast.error(
          `Please fill all required fields for Product ${
            i + 1
          } (Remarks, Payment Comment, and Freight Comment are optional).`
        );
        return;
      }

      if (!freightOption && !freightComment) {
        toast.error(
          "Please select a Freight Option or enter a Freight Comment."
        );
        return;
      }

      if (!paymentTerm && !paymentComment) {
        toast.error("Please select a Payment Term or enter a Payment Comment.");
        return;
      }

      if (!requiredDate) {
        toast.error("Please select Material Required Date.");
        return;
      }
    }

    setIsUploading(true);
    const pdfMakeModule = await import("pdfmake/build/pdfmake");
    const pdfFontsModule = await import("pdfmake/build/vfs_fonts");
    pdfMakeModule.default.vfs = pdfFontsModule.default.vfs;
    const pdfMake = pdfMakeModule.default;

    const bodyRows = [
      [
        { text: "SL.NO", bold: true, fontSize: 8 },
        { text: "Product Name", bold: true, fontSize: 8 },
        { text: "Description", bold: true, fontSize: 8 },
        { text: "Qty (Kg)", bold: true, fontSize: 8 },
        { text: "Unit", bold: true, fontSize: 8 },
        { text: "Basic Price (Rs/unit)", bold: true, fontSize: 8 },
        { text: "Total (₹)", bold: true, fontSize: 8 },
        { text: "GST %", bold: true, fontSize: 8 },
        { text: "Total with GST (₹)", bold: true, fontSize: 8 },
        { text: "Remarks", bold: true, fontSize: 8 },
      ],
    ];

    let grandTotal = 0;

    for (let i = 0; i < productEntries.length; i++) {
      const item = productEntries[i];
      item.gstPercent = item.gstPercent || "0";

      const product = products.find((p) => p.name === item.name);
      const imageUrls = product?.files || [];

      const totalAmount =
        parseFloat(item.qty || 0) * parseFloat(item.price || 0);
      const gstValue = (totalAmount * parseFloat(item.gstPercent || 0)) / 100;
      const totalWithGst = totalAmount + gstValue;
      grandTotal += totalWithGst;

      bodyRows.push([
        { text: i + 1, fontSize: 8 },
        { text: item.name, fontSize: 8 },
        {
          text: item.description || "-",
          fontSize: 8,
          alignment: "left",
          noWrap: false,
        },
        { text: item.qty, fontSize: 8 },
        { text: item.unit || "-", fontSize: 8 },
        { text: item.price, fontSize: 8 },
        { text: totalAmount.toFixed(2), fontSize: 8 },
        { text: item.gstPercent, fontSize: 8 },
        { text: totalWithGst.toFixed(2), fontSize: 8 },
        { text: item.remarks || "", fontSize: 8 },
      ]);

      // Group product images into rows of 3
      let imageRow = [];
      for (let j = 0; j < imageUrls.length; j++) {
        const imageUrl = imageUrls[j]?.url;
        if (imageUrl) {
          const base64Image = await convertImageToBase64(imageUrl);
          if (base64Image) {
            imageRow.push({
              image: base64Image,
              width: 80,
              height: 60,
              alignment: "center",
              margin: [5, 2, 5, 2],
            });
          }
        }

        if (imageRow.length === 3 || j === imageUrls.length - 1) {
          while (imageRow.length < 3) {
            imageRow.push({ text: "" });
          }

          bodyRows.push([
            {
              colSpan: 9,
              columns: imageRow,
              margin: [0, 5, 0, 5],
            },
            ...Array(9).fill(null),
          ]);

          imageRow = [];
        }
      }

      // ✅ NEW: Narration images (with PDF support)
      if (item.narrationImages && item.narrationImages.length > 0) {
        let narrationRow = [];
        for (let k = 0; k < item.narrationImages.length; k++) {
          const narrationUrl = item.narrationImages[k]?.url;
          if (narrationUrl) {
            if (isPdfUrl(narrationUrl)) {
              // ✅ Render PDFs as a clickable link (pdfmake can't embed PDFs as images)
              narrationRow.push({
                stack: [
                  { text: "📄 PDF", fontSize: 9, bold: true, alignment: "center" },
                  {
                    text: "View PDF",
                    link: narrationUrl,
                    color: "blue",
                    fontSize: 7,
                    alignment: "center",
                    decoration: "underline",
                  },
                ],
                width: 80,
                margin: [5, 2, 5, 2],
              });
            } else {
              const base64Narration = await convertImageToBase64(narrationUrl);
              if (base64Narration) {
                narrationRow.push({
                  image: base64Narration,
                  width: 80,
                  height: 60,
                  alignment: "center",
                  margin: [5, 2, 5, 2],
                });
              }
            }
          }

          if (
            narrationRow.length === 3 ||
            k === item.narrationImages.length - 1
          ) {
            while (narrationRow.length < 3) narrationRow.push({ text: "" });
            bodyRows.push([
              {
                colSpan: 9,
                columns: [
                  { text: "Narration:", fontSize: 8, bold: true, width: 50 },
                  ...narrationRow,
                ],
                margin: [0, 5, 0, 5],
              },
              ...Array(9).fill(null),
            ]);
            narrationRow = [];
          }
        }
      }
    }

    bodyRows.push([
      { text: "", colSpan: 7 },
      { text: "" },
      { text: "" },
      { text: "" },
      { text: "" },
      { text: "" },
      { text: "" },
      { text: "Subtotal (With GST)", bold: true, fontSize: 8 },
      { text: `₹ ${grandTotal.toFixed(2)}`, bold: true, fontSize: 8 },
      { text: "" },
    ]);

       const logoUrl =
      "https://res.cloudinary.com/dcr8k5amk/image/upload/v1753784825/THERMO_PACKERS_12032021-01_q181qx.jpg";
    const logoBase64 = await convertImageToBase64(logoUrl);

    let chequeBase64 = null;
    if (
      selectedSupplier?.chequeFiles &&
      selectedSupplier.chequeFiles.length > 0
    ) {
      const chequeUrl =
        selectedSupplier.chequeFiles[0]?.url || selectedSupplier.chequeFiles[0];
      chequeBase64 = await convertImageToBase64(chequeUrl);
    }

const docDefinition = {
  content: [
    {
      text: status === "approved" ? "PO APPROVED" : "PO NOT APPROVED",
      absolutePosition: { x: 50, y: 150 },
      fontSize: 80,
      color: status === "approved" ? "green" : "red",
      opacity: 0.15,
      bold: true,
      rotation: -45,
      alignment: "center",
    },
    {
      table: {
        widths: ["100%"],
        body: [
          [
            {
              stack: [
                {
                  image: "logoImage",
                  absolutePosition: { x: 470, y: 20 },
                  fit: [100, 100],
                },
                {
                  stack: [
                    {
                      text: "THERMO PACKERS",
                      style: "header",
                      alignment: "center",
                      fontSize: 12,
                    },
                    {
                      text:
                        "KAPURTHALA ROAD, VILLAGE SANGAL SOHAL, JALANDHAR\n" +
                        "www.thermopackers.com | thermopackers@gmail.com\n" +
                        "M: 9216860160, 9216562160, 9878165432\n" +
                        "GST NO. : 03AACFT3599H1Z1",
                      style: "subheader",
                      alignment: "center",
                      fontSize: 8,
                      margin: [0, 0, 0, 10],
                    },
                  ],
                },
                {
                  columns: [
                    {
                      text: `P.O. Number: ${poNumber}`,
                      bold: true,
                      fontSize: 10,
                      alignment: "left",
                    },
                    {
                      text: "PURCHASE ORDER",
                      bold: true,
                      fontSize: 12,
                      alignment: "center",
                      margin: [0, 0, 0, 0],
                    },
                    {
                      text: `P.O. Date: ${new Date().toLocaleDateString(
                        "en-GB"
                      )}`,
                      bold: true,
                      fontSize: 10,
                      alignment: "right",
                    },
                  ],
                  margin: [0, 10, 0, 5],
                },
                {
                  columns: [
                    {
                      width: "*",
                      stack: [
                        { text: "To:", bold: true, fontSize: 10 },
                        { text: selectedSupplier?.name, fontSize: 8 },
                        { text: selectedSupplier?.address, fontSize: 8 },
                        {
                          text: `GST No: ${selectedSupplier?.gstNumber}`,
                          fontSize: 8,
                        },
                      ],
                    },
                    {
                      stack: [
                        {
                          table: {
                            widths: ["*"],
                            body: [
                              [
                                {
                                  text: "Supplier/Vendor Bank Details",
                                  bold: true,
                                  fontSize: 9,
                                  alignment: "left",
                                },
                              ],
                              [
                                {
                                  text: `Account Name: ${selectedSupplier?.accountName || "-"}`,
                                  fontSize: 8,
                                  alignment: "left",
                                },
                              ],
                              [
                                {
                                  text: `Bank Name: ${selectedSupplier?.bankName || "-"}`,
                                  fontSize: 8,
                                  alignment: "left",
                                },
                              ],
                              [
                                {
                                  text: `A/C No: ${selectedSupplier?.accountNumber || "-"}`,
                                  fontSize: 8,
                                  alignment: "left",
                                },
                              ],
                              [
                                {
                                  text: `IFSC: ${selectedSupplier?.ifscCode || "-"}`,
                                  fontSize: 8,
                                  alignment: "left",
                                },
                              ],
                            ],
                          },
                          layout: {
                            hLineWidth: () => 1,
                            vLineWidth: () => 1,
                            hLineColor: () => "black",
                            vLineColor: () => "black",
                            paddingLeft: () => 5,
                            paddingRight: () => 5,
                          },
                          width: 250,
                        },
                        {
                          stack: [
                            {
                              text: "Cheque Photo:",
                              bold: true,
                              fontSize: 8,
                              margin: [0, 5, 0, 2],
                            },
                            chequeBase64
                              ? {
                                  image: "chequeImage",
                                  width: 80,
                                  height: 40,
                                  alignment: "center",
                                  margin: [0, 2, 0, 5],
                                }
                              : {
                                  text: "No cheque photo available",
                                  fontSize: 7,
                                  italics: true,
                                  color: "gray",
                                },
                          ],
                        },
                      ],
                      alignment: "right",
                      margin: [0, 0, 0, 10],
                    },
                  ],
                  margin: [0, 0, 0, 20],
                },
                {
                  columns: [
                    {
                      width: "*",
                      stack: [
                        {
                          text: `Freight: ${
                            freightOption || freightComment || "-"
                          }`,
                          fontSize: 8,
                          bold: true,
                        },
                      ],
                    },
                    {
                      width: "*",
                      stack: [
                        {
                          text: `Payment Term: ${
                            paymentTerm || paymentComment || "-"
                          }`,
                          fontSize: 8,
                          bold: true,
                        },
                      ],
                    },
                    {
                      width: "*",
                      stack: [
                        {
                          text: `Required Date: ${requiredDate || "-"}`,
                          fontSize: 8,
                          bold: true,
                        },
                      ],
                    },
                  ],
                  margin: [0, 0, 0, 10],
                },
                {
                  table: {
                    headerRows: 1,
                    widths: [20, 70, 85, 30, 20, 20, 40, 25, 50, 35],
                    body: bodyRows,
                  },
                  layout: "lightHorizontalLines",
                  dontBreakRows: true,
                  margin: [0, 0, 0, 20],
                },
                {
                  text: "TERMS AND CONDITIONS",
                  style: "termsTitle",
                  margin: [0, 0, 0, 10],
                  fontSize: 9,
                },
                { ul: [...termsAndConditions], fontSize: 7 },
                {
                  stack: [
                    {
                      text: "\nFor THERMO PACKERS",
                      alignment: "right",
                      fontSize: 8,
                    },
                    {
                      text: `Generated by: ${user?.name || "-"}`,
                      alignment: "right",
                      fontSize: 7,
                      italics: true,
                    },
                    ...(status === "approved"
                      ? [
                          {
                            text: `Approved by: ${
                              user?.name || "-"
                            } on ${new Date().toLocaleDateString()}`,
                            alignment: "right",
                            fontSize: 7,
                            italics: true,
                            color: "green",
                          },
                        ]
                      : []),
                  ],
                  margin: [0, 30, 0, 0],
                },
              ],
              margin: 10,
              border: [true, true, true, true],
            },
          ],
        ],
      },
    },
  ],
  pageMargins: [20, 20, 20, 30],
  styles: {
    header: { fontSize: 12, bold: true },
    subheader: { fontSize: 8 },
    termsTitle: { fontSize: 9, bold: true },
  },
  // ✅ Images dictionary MUST be part of the same object literal
  images: {
    logoImage: logoBase64,
    ...(chequeBase64 && { chequeImage: chequeBase64 }),
  },
};

  

    pdfMake.createPdf(docDefinition).getBlob(async (blob) => {
      try {
        const formData = new FormData();
        formData.append("file", blob, `PurchaseOrder-${poNumber}.pdf`);
        formData.append("upload_preset", "preset_purchase_orders");
        formData.append("folder", "purchase_orders");
        formData.append("cloud_name", "dcr8k5amk");

        // 🧹 If editing, delete the old PDF from Cloudinary first
        if (id && existingPdfUrl) {
          const afterUpload = existingPdfUrl.split("/upload/")[1];
          const withoutVersion = afterUpload.replace(/^v\d+\//, "");
          const publicId = withoutVersion.replace(/\.[^/.]+$/, "");
          const resourceType = existingPdfUrl.includes("/raw/")
            ? "raw"
            : "image";

          try {
            await axiosInstance.post("/cloudinary/delete-file", {
              publicId,
              resourceType,
            });
          } catch (err) {
            console.error("❌ Failed to delete old PDF:", err);
          }
        }

        const res = await fetch(
          "https://api.cloudinary.com/v1_1/dcr8k5amk/auto/upload",
          {
            method: "POST",
            body: formData,
          }
        );

        const data = await res.json();

        // Sanitize terms to ensure they're just strings
        const cleanTermsForBackend = termsAndConditions.map((term) => {
          if (typeof term === "string") return term;
          if (term && typeof term === "object" && term.text) return term.text;
          return String(term || "");
        });

        if (data.secure_url) {
          if (id) {
            await axiosInstance.put(`/purchase-orders/update/${id}`, {
              poNumber,
              supplier: selectedSupplier._id,
              pdfUrl: data.secure_url,
              products: productEntries.map((p) => ({
                name: p.name,
                qty: p.qty,
                price: p.price,
                gstPercent: p.gstPercent || "0",
                remarks: p.remarks,
                narrationImages: p.narrationImages || [], // ✅ NEW
              })),
              freightOption,
              freightComment,
              paymentTerm,
              paymentComment,
              requiredDate,
              status,
              termsAndConditions: cleanTermsForBackend,
              approvedBy: status === "approved" ? user._id : null,
              approvedAt: status === "approved" ? new Date() : null,
            });
            toast.success("PO updated successfully!");
          } else {
            await axiosInstance.post("/purchase-orders/save", {
              poNumber,
              supplier: selectedSupplier._id,
              pdfUrl: data.secure_url,
              products: productEntries.map((p) => ({
                name: p.name,
                qty: p.qty,
                price: p.price,
                gstPercent: p.gstPercent || "0",
                remarks: p.remarks,
                narrationImages: p.narrationImages || [], // ✅ NEW
              })),
              freightOption,
              freightComment,
              paymentTerm,
              paymentComment,
              requiredDate,
              status,
              termsAndConditions: cleanTermsForBackend,
              approvedBy: status === "approved" ? user._id : null,
              approvedAt: status === "approved" ? new Date() : null,
              createdBy: user._id,
            });

            toast.success("PO saved successfully!");
          }
        } else {
          toast.error("Failed to upload PDF.");
        }
      } catch (err) {
        toast.error("Error uploading PO.");
      } finally {
        navigate("/purchase-orders");
        setSelectedSupplier(null);
        setPoNumber("");
        setProductEntries([
          {
            name: "",
            qty: "",
            price: "",
            gstPercent: "",
            remarks: "",
            imageUrls: [],
            narrationImages: [], // ✅ NEW
          },
        ]);
        setIsUploading(false);
      }
    });
  };

  const filteredSuppliers = suppliers.filter((supplier) =>
    supplier.name.toLowerCase().includes(supplierSearch.toLowerCase())
  );

  return (
    <>
      <LoaderOverlay isLoading={isUploading} />
      <InternalNavbar />
      <div className="max-w-4xl mx-auto px-4 py-6">
        <h2 className="text-2xl font-bold mb-6 text-center">
          {id ? "✏️ Editing Purchase Order" : "📝 Create Purchase Order"}
        </h2>

        {id && (
          <div className="mb-4 flex items-center gap-2">
            <label className="text-sm font-medium">
              <input
                type="checkbox"
                checked={showPreviousData}
                onChange={() => setShowPreviousData(!showPreviousData)}
                className="mr-2"
              />
              Show previous product data
            </label>
          </div>
        )}

        <div className="mb-6">
          <label className="block font-semibold mb-2">Select Supplier</label>
          <div className="relative">
            <input
              type="text"
              className="border border-gray-300 p-2 rounded w-full"
              placeholder="Type to search supplier..."
              value={supplierSearch}
              onChange={(e) => {
                setSupplierSearch(e.target.value);
                setIsSupplierDropdownOpen(true);
              }}
              onFocus={() => {
                setIsSupplierDropdownOpen(true);
                if (selectedSupplier && !supplierSearch) {
                  setSupplierSearch(selectedSupplier.name);
                }
              }}
              onBlur={() => {
                setTimeout(() => {
                  setIsSupplierDropdownOpen(false);
                  if (!selectedSupplier) {
                    setSupplierSearch("");
                  }
                }, 200);
              }}
            />

            {isSupplierDropdownOpen && (
              <div className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded shadow-lg max-h-60 overflow-y-auto">
                {filteredSuppliers.length > 0 ? (
                  filteredSuppliers.map((supplier) => (
                    <div
                      key={supplier._id}
                      className={`px-4 py-2 hover:bg-blue-100 cursor-pointer ${
                        selectedSupplier?._id === supplier._id
                          ? "bg-blue-50"
                          : ""
                      }`}
                      onClick={() => {
                        setSelectedSupplier(supplier);
                        setSupplierSearch(supplier.name);
                        setIsSupplierDropdownOpen(false);
                      }}
                    >
                      {supplier.name}
                    </div>
                  ))
                ) : (
                  <div className="px-4 py-2 text-gray-500">
                    {supplierSearch
                      ? "No suppliers found"
                      : "Start typing to search..."}
                  </div>
                )}
              </div>
            )}

            {selectedSupplier && (
              <div className="mt-2 p-2 bg-green-50 rounded border border-green-200 text-sm">
                <span className="font-medium">✓ Selected:</span>{" "}
                {selectedSupplier.name}
                <button
                  className="ml-3 text-red-500 hover:text-red-700"
                  onClick={() => {
                    setSelectedSupplier(null);
                    setSupplierSearch("");
                    setIsSupplierDropdownOpen(false);
                  }}
                >
                  ✕ Clear
                </button>
              </div>
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 mb-6">
          <div>
            <label className="block font-medium mb-1">Freight Option</label>
            <select
              className="border p-2 rounded w-full"
              value={freightOption}
              onChange={(e) => setFreightOption(e.target.value)}
            >
              <option value="">Select Option</option>
              <option value="Freight Paid">Freight Paid</option>
              <option value="To Pay">To Pay</option>
              <option value="Picked by Thermo Packers">
                Picked by Thermo Packers
              </option>
            </select>

            <label className="block font-medium mt-2 mb-1">
              Freight Comment (Optional)
            </label>
            <input
              type="text"
              className="border p-2 rounded w-full"
              value={freightComment}
              onChange={(e) => setFreightComment(e.target.value)}
            />
          </div>

          <div>
            <label className="block font-medium mb-1">Payment Term</label>
            <select
              className="border p-2 rounded w-full"
              value={paymentTerm}
              onChange={(e) => setPaymentTerm(e.target.value)}
            >
              <option value="">Select Option</option>
              <option value="100% Advance">100% Advance</option>
              <option value="45 Days Credit">45 Days Credit</option>
              <option value="Cheque on Delivery">Cheque on Delivery</option>
              <option value="10 days payment">10 days payment</option>
            </select>

            <label className="block font-medium mt-2 mb-1">
              Payment Comment (Optional)
            </label>
            <input
              type="text"
              className="border p-2 rounded w-full"
              value={paymentComment}
              onChange={(e) => setPaymentComment(e.target.value)}
            />
          </div>

          <div>
            <label className="block font-medium mb-1">
              Material Required Date
            </label>
            <input
              type="date"
              className="border p-2 rounded w-full"
              value={requiredDate}
              onChange={(e) => setRequiredDate(e.target.value)}
            />
          </div>
        </div>

        {productEntries.map((item, index) => (
          <div
            key={index}
            className="mb-6 border border-gray-300 rounded p-4 shadow-sm bg-white relative"
          >
            {productEntries.length > 1 && (
              <button
                onClick={() => {
                  const updated = [...productEntries];
                  updated.splice(index, 1);
                  setProductEntries(updated);
                }}
                className="absolute top-2 right-2 text-red-600 hover:text-red-800 text-xl font-bold"
                title="Remove this product"
              >
                ×
              </button>
            )}

            <h3 className="font-semibold mb-3 text-lg text-blue-700">
              Product {index + 1}
              {id && (
                <span className="text-sm font-normal text-gray-500 ml-2">
                  (Previous: {item.previousQty || 0} units @ ₹
                  {item.previousPrice || 0})
                </span>
              )}
            </h3>

            {id && showPreviousData && (
              <div className="mb-4 p-3 bg-blue-50 rounded border border-blue-200 text-sm">
                <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                  <div>
                    <span className="font-medium">Previous Qty:</span>{" "}
                    {item.previousQty || 0}
                  </div>
                  <div>
                    <span className="font-medium">Previous Price:</span> ₹
                    {item.previousPrice || 0}
                  </div>
                  <div>
                    <span className="font-medium">Previous GST:</span>{" "}
                    {item.previousGst || 0}%
                  </div>
                  {item.previousRemarks && (
                    <div className="col-span-2">
                      <span className="font-medium">Previous Remarks:</span>{" "}
                      {item.previousRemarks}
                    </div>
                  )}
                  {item.previousDescription && (
                    <div className="col-span-2">
                      <span className="font-medium">
                        Previous Description:
                      </span>{" "}
                      {item.previousDescription}
                    </div>
                  )}
                </div>
              </div>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
              {/* Product Name */}
              <div>
                <label
                  htmlFor={`product-${index}`}
                  className="block font-medium mb-1"
                >
                  Product Name
                </label>
                <select
                  id={`product-${index}`}
                  className="border p-2 rounded w-full"
                  value={item.name}
                  onChange={(e) => {
                    const p = products.find((p) => p.name === e.target.value);
                    const updated = [...productEntries];
                    updated[index].name = e.target.value;
                    updated[index].price = p?.price || "";
                    updated[index].gstPercent = p?.gstPercent || "";
                    updated[index].unit = p?.unit || "";
                    updated[index].description = p?.description || "";
                    updated[index].imageUrls = p?.files || [];

                    if (!updated[index].previousQty) {
                      updated[index].previousQty = item.qty;
                    }
                    if (!updated[index].previousPrice) {
                      updated[index].previousPrice = item.price;
                    }
                    if (!updated[index].previousGst) {
                      updated[index].previousGst = item.gstPercent;
                    }

                    setProductEntries(updated);
                  }}
                >
                  <option>Select Product</option>
                  {products.map((p) => (
                    <option key={p._id} value={p.name}>
                      {p.name}
                    </option>
                  ))}
                </select>

                {/* Show Product Images with cross button */}
                {item.imageUrls && item.imageUrls.length > 0 && (
                  <div className="col-span-3 text-center mt-4">
                    {item.imageUrls.map((file, idx) => (
                      <div key={idx} className="inline-block mx-2 relative">
                        <img
                          src={file.url}
                          alt={`Product Image ${idx + 1}`}
                          className="w-32 h-32 mx-auto mb-2 border rounded"
                        />
                        <button
                          type="button"
                          onClick={() => {
                            const updated = [...productEntries];
                            updated[index].imageUrls = updated[
                              index
                            ].imageUrls.filter((_, i) => i !== idx);
                            setProductEntries(updated);
                          }}
                          className="absolute top-0 right-0 bg-red-600 text-white rounded-full w-5 h-5 flex items-center justify-center text-xs hover:bg-red-800"
                          title="Remove image"
                        >
                          ×
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Description */}
              <div>
                <label
                  htmlFor={`description-${index}`}
                  className="block font-medium mb-1"
                >
                  Description
                </label>
                <input
                  id={`description-${index}`}
                  type="text"
                  placeholder="Enter product description"
                  className="border p-2 rounded w-full"
                  value={item.description}
                  onChange={(e) => {
                    const updated = [...productEntries];
                    updated[index].description = e.target.value;
                    setProductEntries(updated);
                  }}
                />
              </div>

              {/* Qty */}
              <div>
                <label
                  htmlFor={`qty-${index}`}
                  className="block font-medium mb-1"
                >
                  Quantity to Order
                </label>
                <input
                  id={`qty-${index}`}
                  type="number"
                  placeholder="Quantity"
                  className="border p-2 rounded w-full"
                  value={item.qty}
                  onChange={(e) => {
                    const updated = [...productEntries];
                    updated[index].qty = e.target.value;
                    setProductEntries(updated);
                  }}
                />
              </div>

              {/* Unit */}
              <div>
                <label
                  htmlFor={`unit-${index}`}
                  className="block font-medium mb-1"
                >
                  Unit (e.g., Kg, Nos)
                </label>
                <input
                  id={`unit-${index}`}
                  type="text"
                  placeholder="Unit"
                  className="border p-2 rounded w-full"
                  value={item.unit}
                  readOnly
                  onChange={(e) => {
                    const updated = [...productEntries];
                    updated[index].unit = e.target.value;
                    setProductEntries(updated);
                  }}
                />
              </div>

              {/* Rate */}
              <div>
                <label
                  htmlFor={`rate-${index}`}
                  className="block font-medium mb-1"
                >
                  Basic Price
                </label>
                <input
                  id={`rate-${index}`}
                  type="text"
                  placeholder="Rate"
                  className="border p-2 rounded w-full"
                  value={item.price}
                  onChange={(e) => {
                    const updated = [...productEntries];
                    updated[index].price = e.target.value;
                    setProductEntries(updated);
                  }}
                />
              </div>

              {/* GST */}
              <div>
                <label
                  htmlFor={`gst-${index}`}
                  className="block font-medium mb-1"
                >
                  GST (%)
                </label>
                <input
                  id={`gst-${index}`}
                  type="text"
                  placeholder="GST"
                  className="border p-2 rounded w-full"
                  value={item.gstPercent}
                  readOnly
                  onChange={(e) => {
                    const updated = [...productEntries];
                    updated[index].gstPercent = e.target.value;
                    setProductEntries(updated);
                  }}
                />
              </div>

              {/* Remarks */}
              <div>
                <label
                  htmlFor={`remarks-${index}`}
                  className="block font-medium mb-1"
                >
                  Remarks
                </label>
                <input
                  id={`remarks-${index}`}
                  type="text"
                  placeholder="Remarks"
                  className="border p-2 rounded w-full"
                  value={item.remarks}
                  onChange={(e) => {
                    const updated = [...productEntries];
                    updated[index].remarks = e.target.value;
                    setProductEntries(updated);
                  }}
                />
              </div>

              {/* ✅ NEW: Narration Images Upload */}
              <div className="col-span-1 sm:col-span-2 md:col-span-3">
                <label className="block font-medium mb-1">
                  Upload Narration Images
                </label>
                <input
                  type="file"
                  accept="image/*,application/pdf"
                  multiple
                  className="border bg-yellow-300 p-2 rounded w-full"
                  onChange={async (e) => {
                    const files = Array.from(e.target.files);
                    if (files.length === 0) return;

                    const uploadPreset = "preset_purchase_orders";
                    const cloudName = "dcr8k5amk";

                    try {
                      const uploaded = [];
                      for (const file of files) {
                        const formData = new FormData();
                        formData.append("file", file);
                        formData.append("upload_preset", uploadPreset);
                        formData.append("folder", "purchase_orders/narration");

                        const res = await fetch(
                          `https://api.cloudinary.com/v1_1/${cloudName}/auto/upload`,
                          { method: "POST", body: formData }
                        );
                        const data = await res.json();
                        if (data.secure_url) {
                          uploaded.push({
                            url: data.secure_url,
                            publicId: data.public_id,
                          });
                        }
                      }

                      const updated = [...productEntries];
                      updated[index].narrationImages = [
                        ...(updated[index].narrationImages || []),
                        ...uploaded,
                      ];
                      setProductEntries(updated);
                      toast.success("Narration images uploaded!");
                    } catch (err) {
                      console.error("Upload error:", err);
                      toast.error("Failed to upload narration images");
                    }
                  }}
                />

                {/* Show uploaded narration images with cross buttons */}
                {item.narrationImages && item.narrationImages.length > 0 && (
                  <div className="flex flex-wrap gap-3 mt-3">
                    {item.narrationImages.map((img, imgIdx) => (
                      <div key={imgIdx} className="relative inline-block">
                        {img.url.toLowerCase().endsWith(".pdf") ? (
                          <a
                            href={img.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center justify-center w-24 h-24 bg-gray-100 border rounded text-xs text-blue-600 underline"
                          >
                            📄 PDF
                          </a>
                        ) : (
                          <img
                            src={img.url}
                            alt={`Narration ${imgIdx + 1}`}
                            className="w-24 h-24 object-cover border rounded"
                          />
                        )}
                        <button
                          type="button"
                          onClick={() => {
                            const updated = [...productEntries];
                            updated[index].narrationImages = updated[
                              index
                            ].narrationImages.filter((_, i) => i !== imgIdx);
                            setProductEntries(updated);
                          }}
                          className="absolute -top-2 -right-2 bg-red-600 text-white rounded-full w-5 h-5 flex items-center justify-center text-xs hover:bg-red-800"
                          title="Remove image"
                        >
                          ×
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        ))}

        {/* Terms and Conditions Section */}
        <div className="mt-6 mb-6 border border-gray-300 rounded p-4 bg-gray-50">
          <div className="flex justify-between items-center mb-3">
            <h3 className="text-lg font-bold text-gray-800">
              Terms and Conditions
            </h3>
            <button
              onClick={() => setIsEditingTerms(!isEditingTerms)}
              className="text-blue-600 hover:text-blue-800 text-sm font-medium"
            >
              {isEditingTerms ? "Cancel" : "Edit Terms"}
            </button>
          </div>

          {isEditingTerms ? (
            <div>
              <div className="mb-3">
                {termsAndConditions.map((term, idx) => (
                  <div key={idx} className="flex items-center gap-2 mb-2">
                    <input
                      type="text"
                      value={term}
                      onChange={(e) => {
                        const updated = [...termsAndConditions];
                        updated[idx] = e.target.value;
                        setTermsAndConditions(updated);
                      }}
                      className="flex-1 border border-gray-300 p-2 rounded text-sm"
                    />
                    <button
                      onClick={() => {
                        const updated = termsAndConditions.filter(
                          (_, i) => i !== idx
                        );
                        setTermsAndConditions(updated);
                      }}
                      className="text-red-600 hover:text-red-800 px-2"
                    >
                      ✕
                    </button>
                  </div>
                ))}
              </div>

              <div className="flex gap-2 mb-3">
                <input
                  type="text"
                  value={newTerm}
                  onChange={(e) => setNewTerm(e.target.value)}
                  placeholder="Add new term..."
                  className="flex-1 border border-gray-300 p-2 rounded text-sm"
                />
                <button
                  onClick={() => {
                    if (newTerm.trim()) {
                      setTermsAndConditions([
                        ...termsAndConditions,
                        newTerm.trim(),
                      ]);
                      setNewTerm("");
                    }
                  }}
                  className="bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded text-sm"
                >
                  Add Term
                </button>
              </div>
            </div>
          ) : (
            <ul className="list-disc pl-5 text-sm text-gray-700">
              {termsAndConditions.map((term, idx) => (
                <li key={idx} className="mb-1">
                  {term}
                </li>
              ))}
            </ul>
          )}
        </div>

        <div className="flex flex-wrap justify-center gap-4 mt-4">
          <button
            onClick={() =>
              setProductEntries([
                ...productEntries,
                {
                  name: "",
                  qty: "",
                  price: "",
                  gstPercent: "",
                  remarks: "",
                  imageUrls: [],
                  narrationImages: [], // ✅ NEW
                },
              ])
            }
            className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded shadow"
          >
            ➕ Add Product
          </button>

          <button
            onClick={handleGeneratePDF}
            className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded shadow"
          >
            {id ? "🔄 Update PDF" : "📄 Generate PDF"}
          </button>

          {id && (
            <button
              onClick={() => navigate("/purchase-orders")}
              className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded shadow"
            >
              ❌ Cancel Edit
            </button>
          )}
        </div>
      </div>
    </>
  );
}