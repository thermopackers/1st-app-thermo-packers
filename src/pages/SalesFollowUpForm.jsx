import React, { useState } from "react";
import axiosInstance from "../axiosInstance";
import toast from "react-hot-toast";

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

export default function SalesFollowUpForm({ taskId, onFollowUpSubmitted, task }) {
  const [dailyStatus, setDailyStatus] = useState("");
  const [closeStatus, setCloseStatus] = useState("");
  const [comment, setComment] = useState("");
  const [loading, setLoading] = useState(false);

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

  // Add this function to the SalesFollowUpForm component
const sendWhatsAppMessage = () => {
  if (!task.customerPhone) {
    toast.error("No customer phone number available");
    return;
  }

  // Get product information
  const productList = task.products
    .map(p => `${p.name} (${p.unit})`)
    .join("%0A- ");

  // Get image URLs (first 3 images)
  const imageUrls = task.images
    .filter(url => !url.endsWith('.webm') && !url.endsWith('.mp3'))
    .slice(0, 3);

  // Create message with product details
  let message = `Hello! This is regarding your inquiry about our products:%0A%0A- ${productList}%0A%0APlease let me know if you have any questions.`;

  // Add image references if available
  if (imageUrls.length > 0) {
    message += "%0A%0AImages:%0A";
    imageUrls.forEach((url, index) => {
      message += `${index + 1}. ${url}%0A`;
    });
  }

  // Open WhatsApp with pre-filled message
  window.open(`https://wa.me/${task.customerPhone}?text=${message}`, "_blank");
};

// Add this button in the form (place it after the submit button)
{task.customerPhone && (
  <button
    type="button"
    onClick={sendWhatsAppMessage}
    className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700 ml-3"
  >
    📱 Send to WhatsApp
  </button>
)}

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
    </form>
  );
}