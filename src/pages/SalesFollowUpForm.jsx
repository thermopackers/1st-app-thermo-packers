import React, { useState } from "react";
import axiosInstance from "../axiosInstance";
import toast from "react-hot-toast";
import { WhatsAppShareButton } from "react-share";

const dailyFollowUpOptions = [
  "No Response / Call Not Answered",
  "Number Unreachable / Switched Off",
  "Follow-up Requested – Call Scheduled for Later",
  "Other (Mention comments in Box)",
];

const closeLeadOptions = [
  "Invalid or Irrelevant Inquiry",
  "Customer Not Interested",
  "Quotation Rejected – Price Too High",
  "Delivery Location Not Feasible",
  "Order Fulfilled by Another Vendor",
  "**Order Confirmed – Proceeding with Processing**",
  "Other (Mention comments in Box)",
];

export default function SalesFollowUpForm({ taskId, onFollowUpSubmitted }) {
  const [dailyStatus, setDailyStatus] = useState("");
  const [closeStatus, setCloseStatus] = useState("");
  const [comment, setComment] = useState("");
  const [loading, setLoading] = useState(false);
const [taskDetails, setTaskDetails] = useState(null);

useEffect(() => {
  const fetchTaskDetails = async () => {
    try {
      const res = await axiosInstance.get(`/todos/${taskId}`);
      setTaskDetails(res.data);
    } catch (err) {
      console.error("Error fetching task details:", err);
    }
  };
  
  if (taskId) {
    fetchTaskDetails();
  }
}, [taskId]);

// Add this function to generate WhatsApp message
const generateWhatsAppMessage = () => {
  if (!taskDetails) return "";
  
  const productsText = taskDetails.products && taskDetails.products.length > 0 
    ? `Products: ${taskDetails.products.map(p => p.name).join(", ")}`
    : "";
  
  return `Hello! This is regarding your inquiry about ${taskDetails.title}. ${productsText}`;
};
  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!dailyStatus && !closeStatus) {
      toast.error("Please select at least one response.");
      return;
    }

    const finalStatus = closeStatus || dailyStatus;

    setLoading(true);
    try {
     const source = closeStatus ? "close" : "daily";

const response = await axiosInstance.post(`/todos/${taskId}/follow-up`, {
  status: finalStatus,
  comment: comment,
  source: source,
});


      toast.success("Follow-up submitted successfully");
      onFollowUpSubmitted?.(response.data);
      setDailyStatus("");
      setCloseStatus("");
      setComment("");
    } catch (err) {
      console.error("❌ Failed to submit follow-up", err.message);
      toast.error(err?.response?.data?.message || "Failed to submit follow-up.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="bg-white border border-gray-300 shadow-sm p-6 rounded-lg space-y-5"
    >
      <h3 className="text-lg font-bold text-indigo-700 mb-2">Follow-up Task</h3>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Daily Follow-Up Section */}
        <div>
          <label className="block font-semibold text-gray-800 mb-1">
            Submit Daily Follow Up
          </label>
          <select
            className="w-full border border-gray-300 rounded p-2"
            value={dailyStatus}
            onChange={(e) => setDailyStatus(e.target.value)}
          >
            <option value="">-- Choose an option --</option>
            {dailyFollowUpOptions.map((option, index) => (
              <option key={index} value={option}>
                {option.replace(/\*\*/g, "")}
              </option>
            ))}
          </select>
        </div>

        {/* Close Sales Lead Section */}
        <div>
          <label className="block font-semibold text-gray-800 mb-1">
            Close the Sales Lead
          </label>
          <select
            className="w-full border border-gray-300 rounded p-2"
            value={closeStatus}
            onChange={(e) => setCloseStatus(e.target.value)}
          >
            <option value="">-- Choose an option --</option>
            {closeLeadOptions.map((option, index) => (
              <option key={index} value={option}>
                {option.replace(/\*\*/g, "")}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Comment Box */}
      <div>
        <label className="block font-medium text-gray-700 mt-4 mb-1">
          Other (Mention comments in Box)
        </label>
        <textarea
          rows={3}
          className="w-full border border-gray-300 rounded p-2 resize-none"
          placeholder="Add additional comments here..."
          value={comment}
          onChange={(e) => setComment(e.target.value)}
        />
      </div>

      <button
        type="submit"
        disabled={loading}
        className="bg-indigo-600 text-white px-4 py-2 rounded hover:bg-indigo-700 disabled:opacity-50 mt-4"
      >
        {loading ? "Submitting..." : "Submit"}
      </button>

      {taskDetails?.customerPhone && (
  <div className="mt-4 p-4 bg-green-50 rounded-lg">
    <h4 className="font-semibold text-green-800 mb-2">Customer Contact</h4>
    <p className="mb-2">Phone: {taskDetails.customerPhone}</p>
    
    <WhatsAppShareButton
      url={window.location.href}
      title={generateWhatsAppMessage()}
      separator=":: "
      className="flex items-center bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700"
    >
      <span className="mr-2">📱</span>
      Send WhatsApp Message
    </WhatsAppShareButton>
    
    <p className="text-sm text-gray-600 mt-2">
      This will open WhatsApp with a pre-filled message including product details.
    </p>
  </div>
)}
    </form>
  );
}
