import { useState } from "react";
import axiosInstance from "../axiosInstance";
import { toast } from "react-hot-toast";
import InternalNavbar from "../components/InternalNavbar";
import imageCompression from "browser-image-compression";

export default function TourExpenses() {
  const [date, setDate] = useState("");
  const [location, setLocation] = useState("");
  const [expenses, setExpenses] = useState([{ description: "", amount: "" }]);
  const [files, setFiles] = useState([]);
  const [loading, setLoading] = useState(false); // <-- loader state

  const addExpense = () => setExpenses([...expenses, { description: "", amount: "" }]);
  const removeExpense = (index) => setExpenses(expenses.filter((_, i) => i !== index));

  const handleFileChange = async (e) => {
    const newFiles = Array.from(e.target.files);
    const processedFiles = await Promise.all(
      newFiles.map(async (file) => {
        if (file.type.startsWith("image/")) {
          try {
            const options = { maxSizeMB: 1, maxWidthOrHeight: 1280, useWebWorker: true };
            return await imageCompression(file, options);
          } catch (err) {
            console.error("Image compression failed:", err);
            return file;
          }
        }
        return file;
      })
    );
    setFiles((prev) => [...prev, ...processedFiles]);
  };

  const removeFile = (index) => setFiles(files.filter((_, i) => i !== index));
  const total = expenses.reduce((sum, exp) => sum + (parseFloat(exp.amount) || 0), 0);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true); // show loader
    try {
      const formData = new FormData();
      formData.append("date", date);
      formData.append("location", location);
      formData.append("expenses", JSON.stringify(expenses));
      formData.append("total", total);
      files.forEach((file) => formData.append("files", file));

      await axiosInstance.post("/tour-expenses", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });

      toast.success("Tour expenses submitted!");
      setDate("");
      setLocation("");
      setExpenses([{ description: "", amount: "" }]);
      setFiles([]);
    } catch (err) {
      toast.error("Failed to submit expenses");
      console.error(err);
    } finally {
      setLoading(false); // hide loader
    }
  };

  return (
    <>
      <InternalNavbar />
      {loading && (
        <div className="fixed inset-0 bg-[#00000098] bg-opacity-50 flex items-center justify-center z-50">
          <div className="loader ease-linear rounded-full border-8 border-t-8 border-gray-200 h-20 w-20"></div>
        </div>
      )}

      <div className="max-w-4xl mx-auto bg-white p-6 rounded-xl shadow-md mt-8 relative">
        <h2 className="text-2xl font-bold text-slate-800 mb-4 text-center">
          🧾 Submit Tour Expenses
        </h2>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Date */}
          <div>
            <label className="block text-sm font-medium">Date</label>
            <input
              type="date"
              lang="en-GB"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="mt-1 w-full rounded-lg border px-3 py-2"
              required
            />
          </div>

          {/* Location */}
          <div>
            <label className="block text-sm font-medium">Tour Location</label>
            <input
              type="text"
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              placeholder="Enter location"
              className="mt-1 w-full rounded-lg border px-3 py-2"
              required
            />
          </div>

          {/* Expenses */}
          <div>
            <label className="block text-sm font-medium">Expenses</label>
            {expenses.map((exp, index) => (
              <div
                key={index}
                className="flex gap-2 mt-2 items-center border p-2 rounded-lg"
              >
                <input
                  type="text"
                  placeholder="Description"
                  value={exp.description}
                  onChange={(e) => {
                    const newExp = [...expenses];
                    newExp[index].description = e.target.value;
                    setExpenses(newExp);
                  }}
                  className="flex-1 rounded-lg border px-2 py-1"
                  required
                />
                <input
                  type="number"
                  placeholder="Amount"
                  value={exp.amount}
                  onChange={(e) => {
                    const newExp = [...expenses];
                    newExp[index].amount = e.target.value;
                    setExpenses(newExp);
                  }}
                  className="w-28 rounded-lg border px-2 py-1"
                  required
                />
                {expenses.length > 1 && (
                  <button
                    type="button"
                    onClick={() => removeExpense(index)}
                    className="text-red-600 text-lg"
                  >
                    ✖
                  </button>
                )}
              </div>
            ))}
            <button
              type="button"
              onClick={addExpense}
              className="mt-2 px-3 py-1 rounded-lg bg-indigo-600 text-white"
            >
              ➕ Add Expense
            </button>
          </div>

          {/* Total */}
          <div className="font-semibold text-lg">
            Total: <span className="text-green-600">₹{total}</span>
          </div>

          {/* File Upload */}
          <div>
            <label className="block text-sm font-medium">Upload Files</label>
            <input
              type="file"
              multiple
              onChange={handleFileChange}
              className="mt-1 w-full bg-amber-200 p-2 rounded"
              accept="image/*,.pdf"
            />
            <div className="mt-2 flex flex-wrap gap-3">
              {files.map((file, index) => (
                <div
                  key={index}
                  className="relative border rounded-lg p-2 bg-slate-50"
                >
                  <span className="text-xs block w-28 truncate">{file.name}</span>
                  <button
                    type="button"
                    onClick={() => removeFile(index)}
                    className="absolute -top-2 -right-2 bg-red-600 text-white text-xs rounded-full px-1"
                  >
                    ✖
                  </button>
                </div>
              ))}
            </div>
          </div>

          {/* Submit */}
          <button
            type="submit"
            disabled={loading} // prevent double submit
            className="w-full py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 disabled:opacity-50"
          >
            Submit Tour Expenses
          </button>
        </form>
      </div>

      {/* Loader CSS */}
      <style jsx>{`
        .loader {
          border-top-color: #3498db;
          animation: spin 1s linear infinite;
        }
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
      `}</style>
    </>
  );
}
