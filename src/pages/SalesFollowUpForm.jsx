import React, { useState } from "react";
import axiosInstance from "../axiosInstance";
import toast from "react-hot-toast";

const followUpOptions = [
  "No Response / Call Not Answered",
  "Invalid or Irrelevant Inquiry",
  "Customer Not Interested",
  "Number Unreachable / Switched Off",
  "Follow-up Requested – Call Scheduled for Later",
  "Quotation Rejected – Price Too High",
  "Delivery Location Not Feasible",
  "Order Fulfilled by Another Vendor",
  "**Order Confirmed – Proceeding with Processing**",
];

const SalesFollowUpForm = ({ taskId, onFollowUpSubmitted }) => {
  const [selectedStatus, setSelectedStatus] = useState("");
  const [customComment, setCustomComment] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!selectedStatus) {
      toast.error("Please select a follow-up status.");
      return;
    }

    setLoading(true);
    try {
      const response = await axiosInstance.post(`/todos/${taskId}/follow-up`, {
        status: selectedStatus,
        comment: customComment,
      });

      toast.success("Follow-up submitted successfully");
      onFollowUpSubmitted?.(response.data);
      setSelectedStatus("");
      setCustomComment("");
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
      className="bg-white border border-gray-300 shadow-sm p-6 rounded-lg space-y-4"
    >
      <h3 className="text-lg font-bold text-indigo-700">Daily Follow-Up</h3>

      <div className="space-y-2">
        <label className="block font-medium text-gray-700">Select Response:</label>
        <select
          className="w-full border border-gray-300 rounded p-2"
          value={selectedStatus}
          onChange={(e) => setSelectedStatus(e.target.value)}
          required
        >
          <option value="">-- Choose an option --</option>
          {followUpOptions.map((option, index) => (
            <option
              key={index}
              value={option}
              className={option.startsWith("**") ? "font-bold" : ""}
            >
              {option.replace(/\*\*/g, "")}
            </option>
          ))}
        </select>
      </div>

      <div className="space-y-2">
        <label className="block font-medium text-gray-700">
          Additional Comments (optional):
        </label>
        <textarea
          rows={3}
          className="w-full border border-gray-300 rounded p-2 resize-none"
          value={customComment}
          onChange={(e) => setCustomComment(e.target.value)}
        />
      </div>

      <button
        type="submit"
        disabled={loading}
        className="bg-indigo-600 text-white px-4 py-2 rounded hover:bg-indigo-700 disabled:opacity-50"
      >
        {loading ? "Submitting..." : "Submit Follow-Up"}
      </button>
    </form>
  );
};

export default SalesFollowUpForm;
