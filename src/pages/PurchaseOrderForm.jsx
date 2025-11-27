import React, { useEffect, useState } from "react";
import axiosInstance from "../axiosInstance";
import InternalNavbar from "../components/InternalNavbar";
import toast from "react-hot-toast";
import LoaderOverlay from "../components/LoaderOverlay";
import { useNavigate } from "react-router-dom";
import { useParams } from "react-router-dom";
import { useUserContext } from "../context/UserContext"; // or your correct path

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
  const { id } = useParams(); // Get PO ID if editing
  const [products, setProducts] = useState([]);
  const [existingPdfUrl, setExistingPdfUrl] = useState("");
  const [isUploading, setIsUploading] = useState(false); // State to track upload process
  const [selectedSupplier, setSelectedSupplier] = useState(null);
  const [poNumber, setPoNumber] = useState("");
  const [productEntries, setProductEntries] = useState([
    {
      name: "",
      qty: "",
      unit: "",
      price: "",
      gstPercent: "0",
      description: "", // ✅ added
      remarks: "",
      imageUrls: [], // Store all image URLs
    },
  ]);

  const navigate = useNavigate();
  const termsAndConditions = [
    "Material to be delivered on door delivery basis, Freight Paid to factory.",
    "To avoid damage in transport, material must be packed properly.",
    "Material to be weighed at delivery.",
    "Any deviation in sizes, material will be rejected and sent back.",
    "Material delivery at: THERMO PACKERS, VPO SANGAL SOHAL, KAPURTHALA ROAD, JALANDHAR, 144013, PUNJAB - INDIA",
    "All Disputes Subject to Jalandhar, Punjab Jurisdiction only.",
  ];

  useEffect(() => {
    const fetchData = async () => {
      try {
const suppliersRes = await axiosInstance.get("/suppliers?limit=100000"); // or a large number
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
          // ✅ NEW: Autofill main fields
          setFreightOption(po.freightOption || "");
          setFreightComment(po.freightComment || "");
          setPaymentTerm(po.paymentTerm || "");
          setPaymentComment(po.paymentComment || "");
          setRequiredDate(po.requiredDate ? po.requiredDate.slice(0, 10) : ""); // to match input[date] format

          const entries = po.products.map((p) => {
            const masterProduct = allProducts.find(
              (prod) => prod.name === p.productName
            );

            return {
              name: p.productName || "",
              qty: p.qty || "",
              unit: p.unit || masterProduct?.unit || "", // ✅ fallback to master product's unit
              price: p.rate || masterProduct?.price || "",
              gstPercent: p.gst || masterProduct?.gstPercent?.toString() || "0",
              description: masterProduct?.description || "", // ✅ added
              remarks: p.remarks || "",
              imageUrls: masterProduct?.files || [], // ✅ now this works!
            };
          });

          setProductEntries(entries);
        }
      } catch (err) {
        console.error("❌ Error loading PO data:", err);
      }
    };

    fetchData();
  }, []);

  async function convertImageToBase64(url) {
    try {
      const res = await fetch(url);
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

  const handleGeneratePDF = async () => {
     if (!selectedSupplier) {
    toast.error("Please select a supplier");
    return;
  }
    // Check for required fields
    for (let i = 0; i < productEntries.length; i++) {
      const item = productEntries[i];
      item.gstPercent = item.gstPercent || "0"; // ✅ Add this line


      // Validate required fields
      if (!item.name || !item.qty || !item.price || !item.gstPercent) {
        toast.error(
          `Please fill all required fields for Product ${
            i + 1
          } (Remarks, Payment Comment, and Freight Comment are optional).`
        );
        return; // Exit the function if any required field is missing
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
    setIsUploading(true); // Show the loader overlay
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
        { text: "Unit", bold: true, fontSize: 8 }, // ✅ Add this
        { text: "Basic Price (Rs/unit)", bold: true, fontSize: 8 },
        { text: "Total (₹)", bold: true, fontSize: 8 },
        { text: "GST %", bold: true, fontSize: 8 },
        { text: "Total with GST (₹)", bold: true, fontSize: 8 },

        { text: "Remarks", bold: true, fontSize: 8 },
      ],
    ];

    let grandTotal = 0;

    // Add product entries to the body rows
    for (let i = 0; i < productEntries.length; i++) {
      const item = productEntries[i];
      item.gstPercent = item.gstPercent || "0"; // ✅ Add this line

      const product = products.find((p) => p.name === item.name);
      const imageUrls = product?.files || []; // Get the full files array

      const totalAmount =
        parseFloat(item.qty || 0) * parseFloat(item.price || 0);
      const gstValue = (totalAmount * parseFloat(item.gstPercent || 0)) / 100;
      const totalWithGst = totalAmount + gstValue;
      grandTotal += totalWithGst; // ✅ Now subtotal is based on total with GST

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
        { text: totalWithGst.toFixed(2), fontSize: 8 }, // ✅ New column
        { text: item.remarks || "", fontSize: 8 },
      ]);

      // Group images into rows of 3 (you can change this to 4, etc.)
      let imageRow = [];
      for (let j = 0; j < imageUrls.length; j++) {
        const imageUrl = imageUrls[j]?.url;
        if (imageUrl) {
          const base64Image = await convertImageToBase64(imageUrl);

          imageRow.push({
            image: base64Image,
            width: 80,
            height: 60,
            alignment: "center",
            margin: [5, 2, 5, 2],
          });

          // Push the row when we have 3 images or it's the last one
          if (imageRow.length === 3 || j === imageUrls.length - 1) {
            // Fill remaining columns if not 3
            while (imageRow.length < 3) {
              imageRow.push({ text: "" });
            }

            // Add the row with one cell that spans all 8 columns
            bodyRows.push([
              {
                colSpan: 9,
                columns: imageRow,
                margin: [0, 5, 0, 5],
              },
              ...Array(9).fill({}), // 9 placeholders to make total = 10
            ]);

            imageRow = []; // Reset
          }
        }
      }
    }

    bodyRows.push([
      { text: "", colSpan: 7 },
      {},
      {},
      {},
      {},
      {},
      {}, // 7 merged empty cells
      { text: "Subtotal (With GST)", bold: true, fontSize: 8 },
      { text: `₹ ${grandTotal.toFixed(2)}`, bold: true, fontSize: 8 },
      {}, // empty filler if table has 10 columns total
    ]);

    const docDefinition = {
      content: [
       {
  text: status === "approved" ? "PO APPROVED" : "PO NOT APPROVED",
  absolutePosition: { x: 50, y: 150 }, // Adjusted starting position
  fontSize: 80, // Larger font size
  color: status === "approved" ? "green" : "red",
  opacity: 0.15, // More subtle opacity
  bold: true,
  rotation: -45, // More pronounced diagonal angle
  alignment: 'center'
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
      alignment: "left"
    },
    {
      text: "PURCHASE ORDER",
      bold: true,
      fontSize: 12,
      alignment: "center",
      margin: [0, 0, 0, 0] // Remove extra vertical spacing
    },
    {
      text: `P.O. Date: ${new Date().toLocaleDateString("en-GB")}`,
      bold: true,
      fontSize: 10,
      alignment: "right"
    }
  ],
  margin: [0, 10, 0, 5] // spacing around the whole row
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
                                  text: `Account Name: ${
                                    selectedSupplier?.accountName || "-"
                                  }`,
                                  fontSize: 8,
                                  alignment: "left",
                                },
                              ],
                              [
                                {
                                  text: `Bank Name: ${
                                    selectedSupplier?.bankName || "-"
                                  }`,
                                  fontSize: 8,
                                  alignment: "left",
                                },
                              ],
                              [
                                {
                                  text: `A/C No: ${
                                    selectedSupplier?.accountNumber || "-"
                                  }`,
                                  fontSize: 8,
                                  alignment: "left",
                                },
                              ],
                              [
                                {
                                  text: `IFSC: ${
                                    selectedSupplier?.ifscCode || "-"
                                  }`,
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
                          alignment: "right", // Aligns the whole table to the right side of the page
                          margin: [0, 0, 0, 10],
                          width: 250,
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
                    { ul: termsAndConditions, fontSize: 7 },
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
    ...(status === "approved" ? [{
      text: `Approved by: ${user?.name || "-"} on ${new Date().toLocaleDateString()}`,
      alignment: "right",
      fontSize: 7,
      italics: true,
      color: "green"
    }] : [])
  ],
  margin: [0, 30, 0, 0],
},
                  ],
                  margin: 10,
                  border: [true, true, true, true], // Adding border to the entire document
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
    };
    const logoUrl =
      "https://res.cloudinary.com/dcr8k5amk/image/upload/v1753784825/THERMO_PACKERS_12032021-01_q181qx.jpg";
    const logoBase64 = await convertImageToBase64(logoUrl);
    docDefinition.images = {
      logoImage: logoBase64,
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

        if (data.secure_url) {
          if (id) {
            // 🔄 Update existing
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
              })),
              freightOption,
              freightComment,
              paymentTerm,
              paymentComment,
              requiredDate,
              status,
    approvedBy: status === "approved" ? user._id : null,
    approvedAt: status === "approved" ? new Date() : null,
       
            });
            toast.success("PO updated successfully!");
          } else {
            // 🆕 New
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
              })),
              freightOption,
              freightComment,
              paymentTerm,
              paymentComment,
              requiredDate,
              status,
    approvedBy: status === "approved" ? user._id : null,
    approvedAt: status === "approved" ? new Date() : null,
      createdBy: user._id,  // Add this line

            });

            toast.success("PO saved successfully!");
          }
        } else {
          toast.error("Failed to upload PDF.");
        }
      } catch (err) {
        toast.error("Error uploading PO.");
      } finally {
        // Reset the form fields
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
          },
        ]);
        setIsUploading(false); // Hide the loader after the upload process      }
      }
    });
  };

  return (
    <>
      <LoaderOverlay isLoading={isUploading} />{" "}
      {/* Add the overlay component here */}
      <InternalNavbar />
      <div className="max-w-4xl mx-auto px-4 py-6">
        <h2 className="text-2xl font-bold mb-6 text-center">
          {id ? "✏️ Editing Purchase Order" : "📝 Create Purchase Order"}
        </h2>

        <div className="mb-6">
          <label className="block font-semibold mb-2">Select Supplier</label>
          <select
            className="border border-gray-300 p-2 rounded w-full"
            value={selectedSupplier?._id || ""} // ✅ bind value
            onChange={(e) => {
              const supplier = suppliers.find((s) => s._id === e.target.value);
              setSelectedSupplier(supplier);
            }}
          >
            <option value="">Select Supplier</option>
            {suppliers.map((s) => (
              <option key={s._id} value={s._id}>
                {s.name}
              </option>
            ))}
          </select>
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
            {/* ❌ Delete Button */}
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
            </h3>

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
                    updated[index].unit = p?.unit || ""; // ✅ Auto-fill unit
                    updated[index].description = p?.description || ""; // ✅ Add this line
                    updated[index].imageUrls = p?.files || []; // Get all image URLs from files
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
                {/* Show Product Images */}
                {item.imageUrls && item.imageUrls.length > 0 && (
                  <div className="col-span-3 text-center mt-4">
                    {item.imageUrls.map((file, idx) => (
                      <div key={idx} className="inline-block mx-2">
                        <img
                          src={file.url}
                          alt={`Product Image ${idx + 1}`}
                          className="w-32 h-32 mx-auto mb-2"
                        />
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
            </div>
          </div>
        ))}

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
                  imageUrls: [], // Ensure new product starts with no image
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
