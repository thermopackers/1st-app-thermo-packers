import { useState } from "react";
import axiosInstance from "../axiosInstance";
import { toast } from "react-hot-toast";
import InternalNavbar from "../components/InternalNavbar";
import imageCompression from "browser-image-compression";

export default function TourExpenses() {
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [location, setLocation] = useState("");
  const [expenses, setExpenses] = useState([{ description: "", amount: "" }]);
  const [files, setFiles] = useState([]);
  const [loading, setLoading] = useState(false); // <-- loader state
const [moneyTaken, setMoneyTaken] = useState([{ date: "", amount: "", remarks: "" }]);
const [selectedVehicle, setSelectedVehicle] = useState("");
const vehicleOptions = [
  "PB08 DQ 5360",
  "PB08 DC 2570", 
  "PB08 DQ 8496",
  "PB08 CS 0496"
];
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
const moneyTakenTotal = moneyTaken.reduce((sum, m) => sum + (parseFloat(m.amount) || 0), 0);
const balance = moneyTakenTotal - total;
  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true); // show loader
    try {
      const formData = new FormData();
          formData.append("vehicleNumber", selectedVehicle); // ✅ ADD THIS LINE
formData.append("startDate", startDate);
formData.append("endDate", endDate);
      formData.append("location", location);
      formData.append("expenses", JSON.stringify(expenses));
      formData.append("total", total);
      formData.append("moneyTaken", JSON.stringify(moneyTaken));
      files.forEach((file) => formData.append("files", file));

      await axiosInstance.post("/tour-expenses", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });

      toast.success("Tour expenses submitted!");
          setSelectedVehicle(""); // ✅ ADD THIS LINE
setStartDate("");
setEndDate("");
      setLocation("");
      setExpenses([{ description: "", amount: "" }]);
        setMoneyTaken([{ date: "", amount: "", remarks: "" }]);
      setFiles([]);
    } catch (err) {
      toast.error("Failed to submit expenses");
      console.error(err);
    } finally {
      setLoading(false); // hide loader
    }
  };

  const addMoneyTaken = () => setMoneyTaken([...moneyTaken, { date: "", amount: "", remarks: "" }]);
const removeMoneyTaken = (index) => setMoneyTaken(moneyTaken.filter((_, i) => i !== index));

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
   {/* Tour Start Date */}
 <div>
   <label className="block text-sm font-medium">Tour Start Date</label>
   <input
     type="date"
     value={startDate}
     onChange={(e) => setStartDate(e.target.value)}
     className="mt-1 w-full rounded-lg border px-3 py-2"
     required
   />
 </div>

 {/* Tour End Date */}
 <div>
   <label className="block text-sm font-medium">Tour End Date</label>
   <input
     type="date"
     value={endDate}
     onChange={(e) => setEndDate(e.target.value)}
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

          {/* Vehicle Selection */}
<div>
  <label className="block text-sm font-medium">Select Vehicle (Optional)</label>
  <select
    value={selectedVehicle}
    onChange={(e) => setSelectedVehicle(e.target.value)}
    className="mt-1 w-full rounded-lg border px-3 py-2 bg-white"
  >
    <option value="">-- Select a vehicle --</option>
    {vehicleOptions.map((vehicle, index) => (
      <option key={index} value={vehicle}>
        {vehicle}
      </option>
    ))}
  </select>
  <p className="text-xs text-gray-500 mt-1">
    Choose the vehicle used for this tour (optional)
  </p>
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
              {/* Helper text */}
  <p className="text-xs text-slate-600 mt-1">
    📸 Upload pictures of <b>Bus Ticket, Hotel Bill, Food Bill</b> and any other expenses done
  </p>
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

        
{/* Money Taken for Tour Expenses */}
<div className="mt-6">
  <h3 className="font-bold text-lg mb-2">💰 Money Taken for Tour Expenses</h3>
  <table className="w-full border text-sm">
    <thead className="bg-slate-100">
      <tr>
        <th className="p-2 border">Date</th>
        <th className="p-2 border">Amount</th>
        <th className="p-2 border">Remarks</th>
        <th className="p-2 border">Action</th>
      </tr>
    </thead>
    <tbody>
      {moneyTaken.map((m, index) => (
        <tr key={index}>
          <td className="p-2 border">
            <input
              type="date"
              value={m.date}
              onChange={(e) => {
                const newData = [...moneyTaken];
                newData[index].date = e.target.value;
                setMoneyTaken(newData);
              }}
              className="w-full border rounded px-2 py-1"
              required
            />
          </td>
          <td className="p-2 border">
            <input
              type="number"
              value={m.amount}
              onChange={(e) => {
                const newData = [...moneyTaken];
                newData[index].amount = e.target.value;
                setMoneyTaken(newData);
              }}
              className="w-full border rounded px-2 py-1"
              required
            />
          </td>
          <td className="p-2 border">
            <input
              type="text"
              value={m.remarks}
              onChange={(e) => {
                const newData = [...moneyTaken];
                newData[index].remarks = e.target.value;
                setMoneyTaken(newData);
              }}
              className="w-full border rounded px-2 py-1"
            />
          </td>
          <td className="p-2 border text-center">
            {moneyTaken.length > 1 && (
              <button
                type="button"
                onClick={() => removeMoneyTaken(index)}
                className="text-red-600"
              >
                ✖
              </button>
            )}
          </td>
        </tr>
      ))}
    </tbody>
  </table>
  <button
    type="button"
    onClick={addMoneyTaken}
    className="mt-2 px-3 py-1 bg-indigo-600 text-white rounded"
  >
    ➕ Add Row
  </button>
</div>
  {/* Submit */}
          <button
            type="submit"
            disabled={loading} // prevent double submit
            className="w-full py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 disabled:opacity-50"
          >
            Submit Tour Expenses
          </button>

{/* Tour Expenses Breakup */}
<div className="mt-6">
  <h3 className="font-bold text-lg mb-2">📊 Tour Expenses Breakup</h3>
  <table className="w-full border text-sm">
    <thead className="bg-slate-100">
      <tr>
        <th className="p-2 border">Expense Description</th>
        <th className="p-2 border">Amount</th>
      </tr>
    </thead>
    <tbody>
      {expenses.map((exp, index) => (
        <tr key={index}>
          <td className="p-2 border">{exp.description || "—"}</td>
          <td className="p-2 border">₹{exp.amount || 0}</td>
        </tr>
      ))}
    </tbody>
    <tfoot>
      <tr className="font-bold">
        <td className="p-2 border">TOTAL</td>
        <td className="p-2 border">₹{total}</td>
      </tr>
    </tfoot>
  </table>
</div>

{/* Totals Summary */}
<div className="mt-6 p-4 bg-slate-100 rounded-lg">
  <div className="flex justify-between font-semibold text-lg">
    <span>Total Expenses:</span>
    <span className="text-red-600">₹{total}</span>
  </div>
  <div className="flex justify-between font-semibold text-lg">
    <span>Total Money Taken:</span>
    <span className="text-blue-600">₹{moneyTakenTotal}</span>
  </div>
  <div className={`flex justify-between font-bold text-lg mt-2 ${
    balance >= 0 ? "text-green-600" : "text-red-600"
  }`}>
    <span>Balance:</span>
    <span>
      {balance >= 0 ? `₹${balance} Remaining` : `₹${Math.abs(balance)} Over Spent`}
    </span>
  </div>
</div>

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
