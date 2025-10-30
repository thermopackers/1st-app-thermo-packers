import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import axiosInstance from "../axiosInstance";
import Swal from "sweetalert2";

export default function OutgoingPaymentForm({ onClose, editPaymentId = null }) {
  const getCurrentDate = () => {
    const now = new Date();
    const timezoneOffset = now.getTimezoneOffset() * 60000;
    const localDate = new Date(now.getTime() - timezoneOffset);
    return localDate.toISOString().split('T')[0];
  };

  const [formData, setFormData] = useState({
    dateOfPayment: getCurrentDate(),
    supplierName: "",
    billNo: "",
    amount: "",
    paymentAuthorizedBy: "",
    modeOfPayment: "upi",
    remarks: ""
  });
  
  const [suppliers, setSuppliers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [isEditing, setIsEditing] = useState(false);

  const navigate = useNavigate();

  // Fetch suppliers
  useEffect(() => {
    const fetchSuppliers = async () => {
      try {
        const response = await axiosInstance.get("/suppliers");
        console.log("Suppliers API Response:", response.data);
        
        let suppliersData = [];
        
        if (Array.isArray(response.data)) {
          suppliersData = response.data;
        } else if (response.data && Array.isArray(response.data.data)) {
          suppliersData = response.data.data;
        } else if (response.data && response.data.suppliers && Array.isArray(response.data.suppliers)) {
          suppliersData = response.data.suppliers;
        }
        
        console.log("Processed suppliers data:", suppliersData);
        setSuppliers(suppliersData);
        
      } catch (error) {
        console.error("Error fetching suppliers:", error);
        Swal.fire({
          title: "Error!",
          text: "Failed to fetch suppliers",
          icon: "error",
          confirmButtonColor: "#2563eb",
        });
      }
    };
    fetchSuppliers();
  }, []);

  // Fetch payment data if editing
  useEffect(() => {
    if (editPaymentId) {
      const fetchPaymentData = async () => {
        try {
          setLoading(true);
          const response = await axiosInstance.get(`/outgoing-payments/${editPaymentId}`);
          const payment = response.data.data;
          
          console.log("Fetched outgoing payment data:", payment);
          
          setFormData({
            dateOfPayment: new Date(payment.dateOfPayment).toISOString().split('T')[0],
            supplierName: payment.supplierName,
            billNo: payment.billNo,
            amount: payment.amount.toString(),
            paymentAuthorizedBy: payment.paymentAuthorizedBy,
            modeOfPayment: payment.modeOfPayment,
            remarks: payment.remarks || ""
          });
          
          setIsEditing(true);
        } catch (error) {
          console.error("Error fetching payment data:", error);
          Swal.fire({
            title: "Error!",
            text: "Failed to load payment data",
            icon: "error",
            confirmButtonColor: "#2563eb",
          });
          onClose();
        } finally {
          setLoading(false);
        }
      };
      
      fetchPaymentData();
    }
  }, [editPaymentId, onClose]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Validate required fields
    const missingFields = [];
    if (!formData.dateOfPayment) missingFields.push("Date of Payment");
    if (!formData.supplierName) missingFields.push("Supplier Name");
    if (!formData.billNo) missingFields.push("Bill No");
    if (!formData.amount) missingFields.push("Amount");
    if (!formData.paymentAuthorizedBy) missingFields.push("Payment Authorized By");
    if (!formData.modeOfPayment) missingFields.push("Mode of Payment");

    if (missingFields.length > 0) {
      Swal.fire({
        title: "Missing Fields!",
        text: `Please fill in all required fields: ${missingFields.join(", ")}`,
        icon: "warning",
        confirmButtonColor: "#2563eb",
      });
      return;
    }

    setLoading(true);
    try {
      const payload = {
        ...formData,
        amount: parseFloat(formData.amount)
      };

      console.log("Submitting outgoing payment:", payload);

      let response;
      if (isEditing) {
        response = await axiosInstance.put(`/outgoing-payments/${editPaymentId}`, payload);
      } else {
        response = await axiosInstance.post("/outgoing-payments", payload);
      }
      
      console.log("Response:", response);
      
      Swal.fire({
        title: "Success!",
        text: `Outgoing payment ${isEditing ? 'updated' : 'recorded'} successfully`,
        icon: "success",
        confirmButtonColor: "#2563eb",
      });
      
      if (onClose) {
        onClose();
      } else {
        // If used as standalone page, navigate back
        navigate("/outgoing-payment-records");
      }
    } catch (error) {
      console.error("Error submitting payment:", error);
      
      if (error.response) {
        Swal.fire({
          title: "Error!",
          text: error.response.data.message || `Failed to ${isEditing ? 'update' : 'record'} payment`,
          icon: "error",
          confirmButtonColor: "#2563eb",
        });
      } else {
        Swal.fire({
          title: "Error!",
          text: error.message,
          icon: "error",
          confirmButtonColor: "#2563eb",
        });
      }
    } finally {
      setLoading(false);
    }
  };

  const getMaxDate = () => {
    return getCurrentDate();
  };

  if (loading && isEditing) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-white">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin" />
          <p className="text-blue-700 font-semibold">Loading payment data...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-white py-8">
      <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-white rounded-2xl shadow-lg p-6">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl font-bold text-gray-900">
              {isEditing ? 'Edit Outgoing Payment' : 'Record Outgoing Payment'}
            </h2>
            {onClose && (
              <button
                onClick={onClose}
                className="text-gray-500 hover:text-gray-700 text-2xl p-2 rounded-full hover:bg-gray-100 transition-colors"
              >
                ✕
              </button>
            )}
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Date of Payment */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Date of Payment *
              </label>
              <input
                type="date"
                name="dateOfPayment"
                value={formData.dateOfPayment}
                onChange={handleInputChange}
                max={getMaxDate()}
                className="w-full border-2 border-gray-200 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-300"
                required
              />
            </div>

            {/* Supplier Name */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Supplier Name *
              </label>
              <select
                name="supplierName"
                value={formData.supplierName}
                onChange={handleInputChange}
                className="w-full border-2 border-gray-200 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-300"
                required
              >
                <option value="">Select Supplier</option>
                {Array.isArray(suppliers) && suppliers.length > 0 ? (
                  suppliers.map((supplier) => (
                    <option key={supplier._id} value={supplier.name}>
                      {supplier.name}
                    </option>
                  ))
                ) : (
                  <option value="" disabled>Loading suppliers...</option>
                )}
              </select>
            </div>

            {/* Bill No */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Bill No *
              </label>
              <input
                type="text"
                name="billNo"
                value={formData.billNo}
                onChange={handleInputChange}
                placeholder="Enter bill number"
                className="w-full border-2 border-gray-200 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-300"
                required
              />
            </div>

            {/* Amount */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Amount *
              </label>
              <input
                type="number"
                name="amount"
                value={formData.amount}
                onChange={handleInputChange}
                placeholder="Enter amount"
                step="0.01"
                min="0"
                className="w-full border-2 border-gray-200 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-300"
                required
              />
            </div>

            {/* Payment Authorized By */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Payment Authorized By *
              </label>
              <input
                type="text"
                name="paymentAuthorizedBy"
                value={formData.paymentAuthorizedBy}
                onChange={handleInputChange}
                placeholder="Enter authorizer name"
                className="w-full border-2 border-gray-200 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-300"
                required
              />
            </div>

            {/* Mode of Payment */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Mode of Payment *
              </label>
              <select
                name="modeOfPayment"
                value={formData.modeOfPayment}
                onChange={handleInputChange}
                className="w-full border-2 border-gray-200 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-300"
                required
              >
                <option value="upi">UPI</option>
                <option value="bankTransfer">Bank Transfer</option>
              </select>
            </div>

            {/* Remarks */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Remarks
              </label>
              <textarea
                name="remarks"
                value={formData.remarks}
                onChange={handleInputChange}
                placeholder="Enter any additional remarks"
                rows="3"
                className="w-full border-2 border-gray-200 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-300"
              />
            </div>

            {/* Submit Button */}
            <div className="flex gap-4 pt-4">
              <button
                type="button"
                onClick={onClose || (() => navigate("/outgoing-payment-records"))}
                className="flex-1 bg-gray-500 text-white py-3 rounded-xl font-semibold hover:bg-gray-600 transition-all duration-300"
                disabled={loading}
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={loading}
                className="flex-1 bg-blue-600 text-white py-3 rounded-xl font-semibold hover:bg-blue-700 transition-all duration-300 disabled:opacity-50"
              >
                {loading ? "Processing..." : (isEditing ? "Update Payment" : "Record Payment")}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}