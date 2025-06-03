import { useMemo, useState, useEffect } from "react";
import Select from "react-select";
import { useNavigate } from "react-router-dom";
import InternalNavbar from "../components/InternalNavbar";
import axiosInstance from "../axiosInstance";
import { toast } from "react-hot-toast";

export default function AddOrder() {
  const navigate = useNavigate();
  const token = localStorage.getItem("token");

  const [availableSizesList, setAvailableSizesList] = useState([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [clientDetails, setClientDetails] = useState({
    customerName: "",
    po: "",
    poCopy: null,
    deliveryRange: "",
    date: "",
    remarks: "",
  });
  const [productList, setProductList] = useState([
    {
      product: "",
      customProduct: "",
      size: "",
      customSize: "",
      quantity: "",
      price: "",
      density: "",
      packagingCharge: "",
      freight: "",
      freightAmount: "",
    },
  ]);
  const [allProducts, setAllProducts] = useState([]);
  const [allCustomers, setAllCustomers] = useState([]);
  const [loadingProducts, setLoadingProducts] = useState(true);
  const [loadingCustomers, setLoadingCustomers] = useState(true);

  useEffect(() => {
    const fetchProductSizes = async () => {
      try {
        const response = await axiosInstance.get("/products/all-backend-products");
        setAllProducts(response.data);
      } catch (error) {
        console.error("Error fetching product sizes:", error);
      } finally {
        setLoadingProducts(false);
      }
    };

    const fetchCustomers = async () => {
      try {
        const response = await axiosInstance.get("/customers/all/dropdown");
        setAllCustomers(response.data);
      } catch (error) {
        console.error("Error fetching customers:", error);
      } finally {
        setLoadingCustomers(false);
      }
    };

    fetchProductSizes();
    fetchCustomers();
  }, []);

  const customerOptions = useMemo(() => {
    if (loadingCustomers) {
      return [{ label: "Loading customers...", value: "" }];
    }
    return [
      ...allCustomers.map((c) => ({
        label: c.name,
        value: c.name,
      })),
      { label: "Other (Custom Customer)", value: "custom" },
    ];
  }, [allCustomers, loadingCustomers]);

  const productOptions = useMemo(() => {
    if (loadingProducts) {
      return [{ label: "Loading products...", value: "" }];
    }
    return [
      ...allProducts.map((p) => ({
        label: p.name,
        value: p.name,
      })),
      { label: "Other (Custom Product)", value: "custom" },
    ];
  }, [allProducts, loadingProducts]);
const options = useMemo(() => {
  if (loadingProducts) {
    return [{ label: 'Loading products...', value: '' }];
  }
  return [
    ...allProducts.map((p) => ({
      label: p.name,
      value: p.name,
    })),
    { label: 'Other (Custom Product)', value: 'custom' },
  ];
}, [allProducts, loadingProducts]);

  const handleClientChange = (e) => {
    const { name, value, type, files } = e.target;
    if (type === "file") {
      setClientDetails({ ...clientDetails, [name]: files[0] });
    } else if (name === "deliveryRange") {
      const days =
        value === "1week"
          ? 7
          : value === "2weeks"
          ? 14
          : value === "20days"
          ? 20
          : 0;
      const today = new Date();
      today.setDate(today.getDate() + days);
      setClientDetails({
        ...clientDetails,
        deliveryRange: value,
        date: today.toISOString().split("T")[0],
      });
    } else {
      setClientDetails({ ...clientDetails, [name]: value });
    }
  };

  const handleProductChange = (index, field, value) => {
    const updated = [...productList];
    updated[index][field] = value;

    if (field === "product") {
      const product = allProducts.find((p) => p.name === value);
      const sizes = product?.sizes || [];

      updated[index]["size"] = "";
      updated[index]["customSize"] = "";
      updated[index]["customProduct"] = "";

      const BASE_URL = import.meta.env.VITE_REACT_APP_API_URL;
      updated[index]["productImages"] =
        product?.images?.map((img) => `${BASE_URL}${img}`) || [];

      const updatedSizesList = [...availableSizesList];
      updatedSizesList[index] = sizes;
      setAvailableSizesList(updatedSizesList);
    }

    if (field === "freight") {
      if (value !== "To pay" && value !== "Billed in Invoice") {
        updated[index]["freightAmount"] = "";
      }
    }

    setProductList(updated);
  };

  const addAnotherProduct = () => {
    setProductList([
      ...productList,
      {
        product: "",
        customProduct: "",
        size: "",
        customSize: "",
        quantity: "",
        price: "",
        density: "",
        packagingCharge: "",
        freight: "",
        freightAmount: "",
      },
    ]);
  };

  const removeProduct = (index) => {
    const updated = productList.filter((_, i) => i !== index);
    setProductList(updated);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);

    if (
      productList.length === 0 ||
      productList.some((prod) => {
        const missingProduct = !(prod.product || prod.customProduct);
        const missingQuantity = !prod.quantity;
        const missingPrice = !prod.price;
        const missingFreight = !prod.freight;
        const needsFreightAmount =
          prod.freight === "To pay" || prod.freight === "Billed in Invoice";
        const missingFreightAmount = needsFreightAmount && !prod.freightAmount;
        return (
          missingProduct ||
          missingQuantity ||
          missingPrice ||
          missingFreight ||
          missingFreightAmount
        );
      })
    ) {
      toast.error(
        "Please fill at least one complete product entry including freight and amount if applicable."
      );
      setIsSubmitting(false);
      return;
    }

    try {
      const modifiedProductList = productList.map((prod) => ({
        ...prod,
        product: prod.product === "" ? prod.customProduct : prod.product,
        size: prod.size === "" ? prod.customSize : prod.size,
        freightAmount:
          prod.freight === "To pay" || prod.freight === "Billed in Invoice"
            ? prod.freightAmount
            : 0,
      }));

      const formData = new FormData();
      formData.append("customerName", clientDetails.customerName);
      formData.append("po", clientDetails.po);
      formData.append("poCopy", clientDetails.poCopy);
      formData.append("date", clientDetails.date);
      formData.append("remarks", clientDetails.remarks);
      formData.append("products", JSON.stringify(modifiedProductList));

      await axiosInstance.post("/orders/multi", formData, {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "multipart/form-data",
        },
      });

      toast.success("Orders submitted!");
      navigate("/dashboard");
    } catch (err) {
      console.error(err);
      if (err.response?.data?.message === "PO number already exists") {
        toast.error("This P/O Number already exists. Please use a different one.");
      } else {
        toast.error("Failed to submit orders");
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCancel = () => {
    navigate("/orders");
  };

  return (
    <>
      <InternalNavbar />
      <div className="max-w-5xl mx-auto p-6">
        <h2 className="text-3xl md:text-4xl font-bold mb-6 text-center">
          Add New Order
        </h2>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">

            {/* Customer Dropdown */}
            <Select
              options={customerOptions}
              placeholder={loadingCustomers ? "Loading customers..." : "Select Customer"}
              value={
                clientDetails.customerName &&
                customerOptions.find((opt) => opt.value === clientDetails.customerName) || null
              }
              onChange={(selected) => {
                if (selected.value === "custom") {
                  setClientDetails({ ...clientDetails, customerName: "" });
                } else {
                  setClientDetails({ ...clientDetails, customerName: selected.value });
                }
              }}
              className="w-full"
              classNamePrefix="react-select"
            />

            {/* Manual Input for custom customer */}
            {!customerOptions.some((opt) => opt.value === clientDetails.customerName) && (
              <input
                name="customerName"
                placeholder="Enter Customer Name"
                value={clientDetails.customerName}
                onChange={handleClientChange}
                required
                className="border border-gray-400 p-2 rounded w-full"
              />
            )}

            <input
              name="po"
              placeholder="P/O Number"
              value={clientDetails.po}
              onChange={handleClientChange}
              required
              className="border border-gray-400 p-2 rounded w-full"
            />
            <input
              type="file"
              name="poCopy"
              onChange={handleClientChange}
              className="col-span-2 bg-green-100 cursor-pointer p-2 rounded"
            />
            <select
              name="deliveryRange"
              required
              value={clientDetails.deliveryRange}
              onChange={handleClientChange}
              className="p-2 border border-gray-400 rounded"
            >
              <option value="">Delivery Time</option>
              <option value="1week">Within 1 Week</option>
              <option value="2weeks">Within 2 Weeks</option>
              <option value="20days">Within 20 Days</option>
            </select>
            <textarea
              name="remarks"
              required
              placeholder="Remarks"
              value={clientDetails.remarks}
              onChange={handleClientChange}
              className="col-span-2 p-2 border border-gray-400 rounded"
            ></textarea>
          </div>

          <h3 className="text-xl font-semibold mt-4">Product Details</h3>
          {productList.map((prod, index) => (
            <div
              key={index}
              className="grid grid-cols-1 md:grid-cols-2 gap-4 bg-gray-50 p-4 border border-gray-400 rounded-md"
            >



<Select
  options={options}
  isDisabled={loadingProducts}                   // disable if loading
  placeholder={loadingProducts ? "Loading products..." : "Select Product"}  // dynamic placeholder
  value={
    prod.product
      ? options.find((opt) => opt.value === prod.product)
      : prod.customProduct
      ? { label: 'Other (Custom Product)', value: 'custom' }
      : null
  }
  onChange={(selectedOption) => {
    if (selectedOption.value === 'custom') {
      handleProductChange(index, 'product', '');
      handleProductChange(index, 'customProduct', '');
    } else {
      handleProductChange(index, 'product', selectedOption.value);
      handleProductChange(index, 'customProduct', '');
    }
  }}
  className="w-full"
  classNamePrefix="react-select"
/>


              {/* Show custom product input if no product selected */}
              {!prod.product && (
                <input
                  type="text"
                  value={prod.customProduct}
                  placeholder="Enter Custom Product"
                  onChange={(e) =>
                    handleProductChange(index, "customProduct", e.target.value)
                  }
                  className="border border-gray-400 p-2 rounded"
                  required={!prod.product}
                />
              )}

            <select
  value={prod.size}
  onChange={(e) => handleProductChange(index, "size", e.target.value)}
  className="border p-2 rounded"
  disabled={prod.customSize.length > 0}
>
  <option value="">Select Size</option>
  {(availableSizesList[index] || []).map((size, i) => (
    <option key={i} value={size}>
      {size}
    </option>
  ))}
</select>


              {/* Show custom size input if no size selected */}
              {!prod.size && (
                <input
                  type="text"
                  value={prod.customSize}
                  placeholder="Enter Custom Size"
                  onChange={(e) =>
                    handleProductChange(index, "customSize", e.target.value)
                  }
                  className="border border-gray-400 p-2 rounded"
                  // required={!prod.size}
                />
              )}

              <input
                type="number"
                value={prod.quantity}
                placeholder="Qty"
                onChange={(e) =>
                  handleProductChange(index, "quantity", e.target.value)
                }
                className="border border-gray-400 p-2 rounded"
                required
                min={1}
              />
              <input
                type="number"
                value={prod.price}
                placeholder="Price"
                onChange={(e) =>
                  handleProductChange(index, "price", e.target.value)
                }
                className="border border-gray-400 p-2 rounded"
                required
                min={0}
                step="0.01"
              />
              <input
                type="number"
                value={prod.density}
                placeholder="Density"
                onChange={(e) =>
                  handleProductChange(index, "density", e.target.value)
                }
                className="border border-gray-400 p-2 rounded"
                min={0}
                step="0.01"
              />
              <input
                type="number"
                value={prod.packagingCharge}
                placeholder="Packaging Charge"
                onChange={(e) =>
                  handleProductChange(index, "packagingCharge", e.target.value)
                }
                className="border border-gray-400 p-2 rounded"
                min={0}
                step="0.01"
              />
              {/* Freight dropdown */}
              <select
                value={prod.freight}
                onChange={(e) =>
                  handleProductChange(index, "freight", e.target.value)
                }
                className="border border-gray-400 p-2 rounded"
                required
              >
                <option value="">Select Freight</option>
                <option value="To pay">To pay</option>
                <option value="Self Dispatch">Self Pickup</option>
                <option value="Billed in Invoice">Billed in Invoice</option>
              </select>
              {/* Freight amount conditional input */}
            {(prod.freight === "To pay" || prod.freight === "Billed in Invoice") && (
              <div className="mb-3">
                <label className="block mb-1 font-medium">
                  {prod.freight === "To pay"
                    ? "Amount to pay"
                    : "Amount billed in invoice"}
                </label>
                <input
                  type="number"
                  value={prod.freightAmount}
                  onChange={(e) =>
                    handleProductChange(index, "freightAmount", e.target.value)
                  }
                  min="0"
                  step="0.01"
                  required
                  className="w-full border border-gray-400 p-2 rounded"
                />
              </div>
              
            )}
          {prod.productImages?.map((img, i) => (
  <div key={i} className="md:col-span-2">
    <img
      src={img}
      alt={`${prod.product} ${i + 1}`}
      className="max-h-40 object-contain border border-gray-300 rounded-md p-2"
    />
  </div>
))}



              <button
                type="button"
                onClick={() => removeProduct(index)}
                className="text-white bg-red-600 rounded cursor-pointer font-bold text-xl"
                aria-label={`Remove product ${index + 1}`}
              >
                &times;
              </button>
            </div>
          ))}
          

          <button
            type="button"
            onClick={addAnotherProduct}
            className="mt-2 px-4 py-2 rounded bg-blue-600 text-white hover:bg-blue-700"
          >
            + Add Another Product
          </button>

          {/* Submit Buttons */}
          <div className="flex justify-center gap-4 mt-6">
            {isSubmitting ? (
              <div className="flex items-center gap-3">
                <div className="w-6 h-6 border-4 border-blue-300 border-t-blue-600 rounded-full animate-spin"></div>
                <p className="text-blue-700 font-semibold">Submitting...</p>
              </div>
            ) : (
              <>
                <button
                  type="submit"
                  className="bg-green-600 text-white px-8 py-3 rounded hover:bg-green-700"
                >
                  Submit
                </button>
                <button
                  type="button"
                  onClick={handleCancel}
                  className="bg-gray-500 text-white px-8 py-3 rounded hover:bg-gray-600"
                >
                  Cancel
                </button>
              </>
            )}
          </div>
        </form>
      </div>
    </>
  );
}
