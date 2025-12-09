import { useEffect, useState } from "react";
import axiosInstance from "../axiosInstance";
import InternalNavbar from "../components/InternalNavbar";
import imageCompression from "browser-image-compression";
 import Swal from 'sweetalert2'; // ✅ ADD THIS IMPORT AT THE TOP

export default function TourExpenses() {
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [location, setLocation] = useState("");
  const [expenses, setExpenses] = useState([{ description: "", amount: "" }]);
  const [files, setFiles] = useState([]);
  const [loading, setLoading] = useState(false); // <-- loader state
  const [moneyTaken, setMoneyTaken] = useState([
    { date: "", amount: "", remarks: "" },
  ]);
  const [selectedVehicle, setSelectedVehicle] = useState("");
  const vehicleOptions = [
    "PB08 DQ 5360",
    "PB08 DC 2570",
    "PB08 DQ 8496",
    "PB08 CS 0496",
  ];
  const [meterReadingStart, setMeterReadingStart] = useState("");
  const [meterReadingEnd, setMeterReadingEnd] = useState("");
  const [oilQuantity, setOilQuantity] = useState("");
  const [tripLogFiles, setTripLogFiles] = useState([]);
  const [distance, setDistance] = useState(0);
  const [average, setAverage] = useState(0);
// Add this line near other state declarations (around line 21-25)
const [dieselLiters, setDieselLiters] = useState("");

  const addExpense = () =>
    setExpenses([...expenses, { description: "", amount: "" }]);
  const removeExpense = (index) =>
    setExpenses(expenses.filter((_, i) => i !== index));

 useEffect(() => {
  if (meterReadingStart && meterReadingEnd) {
    const start = parseFloat(meterReadingStart);
    const end = parseFloat(meterReadingEnd);
    if (!isNaN(start) && !isNaN(end) && end > start) {
      const calculatedDistance = end - start;
      setDistance(calculatedDistance);

      // ✅ FIX: Use dieselLiters state instead of formData.dieselLiters
      if (dieselLiters) {
        const diesel = parseFloat(dieselLiters);
        if (!isNaN(diesel) && diesel > 0) {
          const calculatedAverage = calculatedDistance / diesel;
          setAverage(parseFloat(calculatedAverage.toFixed(2)));
        }
      }
    }
  }
}, [meterReadingStart, meterReadingEnd, dieselLiters]); // ✅ FIX: Change dependency

  const handleFileChange = async (e) => {
    const newFiles = Array.from(e.target.files);
    const processedFiles = await Promise.all(
      newFiles.map(async (file) => {
        if (file.type.startsWith("image/")) {
          try {
            const options = {
              maxSizeMB: 1,
              maxWidthOrHeight: 1280,
              useWebWorker: true,
            };
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
  const total = expenses.reduce(
    (sum, exp) => sum + (parseFloat(exp.amount) || 0),
    0
  );
  const moneyTakenTotal = moneyTaken.reduce(
    (sum, m) => sum + (parseFloat(m.amount) || 0),
    0
  );
  const balance = moneyTakenTotal - total;

const handleSubmit = async (e) => {
  e.preventDefault();
  setLoading(true); // show loader
  
  try {
    const formData = new FormData();
    formData.append("vehicleNumber", selectedVehicle);
    formData.append("startDate", startDate);
    formData.append("endDate", endDate);
    formData.append("location", location);
    formData.append("expenses", JSON.stringify(expenses));
    formData.append("total", total);
    formData.append("moneyTaken", JSON.stringify(moneyTaken));
    formData.append("meterReadingStart", meterReadingStart);
    formData.append("meterReadingEnd", meterReadingEnd);
    formData.append("oilQuantity", oilQuantity);
    formData.append("distance", distance);
    formData.append("average", average);
    formData.append("dieselLiters", dieselLiters);
    
    files.forEach((file) => formData.append("files", file));
    tripLogFiles.forEach((file) => formData.append("tripLogFiles", file));

    await axiosInstance.post("/tour-expenses", formData, {
      headers: { "Content-Type": "multipart/form-data" },
    });

    // ✅ ADD SWAL SUCCESS MESSAGE INSTEAD OF TOAST
    await Swal.fire({
      title: 'Success!',
      html: `
        <div style="text-align: center;">
          <div style="font-size: 60px; color: #10B981;">✓</div>
          <h3 style="margin: 15px 0; color: #065F46;">Tour Expenses Submitted Successfully!</h3>
          <div style="background: #F3F4F6; padding: 15px; border-radius: 8px; margin: 15px 0;">
            <div style="display: flex; justify-content: space-between; margin-bottom: 8px;">
              <span>Total Expenses:</span>
              <span style="font-weight: bold; color: #DC2626;">₹${total}</span>
            </div>
            <div style="display: flex; justify-content: space-between; margin-bottom: 8px;">
              <span>Money Taken:</span>
              <span style="font-weight: bold; color: #2563EB;">₹${moneyTakenTotal}</span>
            </div>
            <div style="display: flex; justify-content: space-between; margin-bottom: 8px;">
              <span>Balance:</span>
              <span style="font-weight: bold; color: ${balance >= 0 ? '#10B981' : '#DC2626'}">
                ₹${balance >= 0 ? balance : Math.abs(balance)} ${balance >= 0 ? 'Remaining' : 'Over Spent'}
              </span>
            </div>
            ${selectedVehicle ? `
            <div style="margin-top: 10px; padding-top: 10px; border-top: 1px dashed #D1D5DB;">
              <span style="color: #4B5563;">Vehicle:</span>
              <span style="font-weight: bold; color: #1E40AF; margin-left: 5px;">${selectedVehicle}</span>
            </div>
            ` : ''}
            ${distance > 0 ? `
            <div style="margin-top: 10px; padding-top: 10px; border-top: 1px dashed #D1D5DB;">
              <div style="display: flex; justify-content: space-between;">
                <span>Distance:</span>
                <span style="font-weight: bold; color: #1D4ED8;">${distance} km</span>
              </div>
              <div style="display: flex; justify-content: space-between; margin-top: 5px;">
                <span>Fuel Efficiency:</span>
                <span style="font-weight: bold; color: #10B981;">${average} km/l</span>
              </div>
            </div>
            ` : ''}
          </div>
          <p style="color: #6B7280; font-size: 14px;">
            Your tour expenses have been recorded successfully.
          </p>
        </div>
      `,
      icon: 'success',
      confirmButtonText: 'OK',
      confirmButtonColor: '#10B981',
      width: '500px',
      customClass: {
        popup: 'rounded-2xl',
        title: '!text-2xl !font-bold',
        confirmButton: '!px-6 !py-3 !rounded-lg'
      }
    });

    // Reset form after successful submission
    setSelectedVehicle("");
    setStartDate("");
    setEndDate("");
    setLocation("");
    setExpenses([{ description: "", amount: "" }]);
    setMoneyTaken([{ date: "", amount: "", remarks: "" }]);
    setFiles([]);
    setMeterReadingStart("");
    setMeterReadingEnd("");
    setOilQuantity("");
    setTripLogFiles([]);
    setDistance(0);
    setAverage(0);
    setDieselLiters("");
    
  } catch (err) {
    console.error("Submit error:", err);
    
    // ✅ ADD SWAL ERROR MESSAGE
    await Swal.fire({
      title: 'Error!',
      html: `
        <div style="text-align: center;">
          <div style="font-size: 60px; color: #DC2626;">✗</div>
          <h3 style="margin: 15px 0; color: #7F1D1D;">Failed to Submit Expenses</h3>
          <div style="background: #FEE2E2; padding: 15px; border-radius: 8px; margin: 15px 0;">
            <p style="color: #7F1D1D; margin: 0;">
              ${err.response?.data?.error || err.message || 'Unknown error occurred'}
            </p>
          </div>
          <p style="color: #6B7280; font-size: 14px;">
            Please check your data and try again.
          </p>
        </div>
      `,
      icon: 'error',
      confirmButtonText: 'Try Again',
      confirmButtonColor: '#DC2626',
      width: '500px',
      customClass: {
        popup: 'rounded-2xl',
        title: '!text-2xl !font-bold',
        confirmButton: '!px-6 !py-3 !rounded-lg'
      }
    });
  } finally {
    setLoading(false); // hide loader
  }
};

  const addMoneyTaken = () =>
    setMoneyTaken([...moneyTaken, { date: "", amount: "", remarks: "" }]);
  const removeMoneyTaken = (index) =>
    setMoneyTaken(moneyTaken.filter((_, i) => i !== index));

  const handleTripLogFileChange = async (e) => {
    const newFiles = Array.from(e.target.files);
    const processedFiles = await Promise.all(
      newFiles.map(async (file) => {
        if (file.type.startsWith("image/")) {
          try {
            const options = {
              maxSizeMB: 1,
              maxWidthOrHeight: 1280,
              useWebWorker: true,
            };
            return await imageCompression(file, options);
          } catch (err) {
            console.error("Image compression failed:", err);
            return file;
          }
        }
        return file;
      })
    );
    setTripLogFiles((prev) => [...prev, ...processedFiles]);
  };

  const removeTripLogFile = (index) =>
    setTripLogFiles(tripLogFiles.filter((_, i) => i !== index));

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
            <label className="block text-sm font-medium">
              Select Vehicle (Optional)
            </label>
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
              📸 Upload pictures of <b>Bus Ticket, Hotel Bill, Food Bill</b> and
              any other expenses done
            </p>
            <div className="mt-2 flex flex-wrap gap-3">
              {files.map((file, index) => (
                <div
                  key={index}
                  className="relative border rounded-lg p-2 bg-slate-50"
                >
                  <span className="text-xs block w-28 truncate">
                    {file.name}
                  </span>
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
            <h3 className="font-bold text-lg mb-2">
              💰 Money Taken for Tour Expenses
            </h3>
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
            <div
              className={`flex justify-between font-bold text-lg mt-2 ${
                balance >= 0 ? "text-green-600" : "text-red-600"
              }`}
            >
              <span>Balance:</span>
              <span>
                {balance >= 0
                  ? `₹${balance} Remaining`
                  : `₹${Math.abs(balance)} Over Spent`}
              </span>
            </div>
          </div>
          {/* Vehicle Trip Log Section */}
<div className="mt-6 border-t pt-6">
  <h3 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2">
    🚗 Selected Vehicle Trip Log
  </h3>
  
<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4 mb-6">
      {/* Meter Reading Start */}
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-1">
        Meter Reading (Start) *
      </label>
      <input
        type="number"
        placeholder="e.g., 5000"
        value={meterReadingStart}
        onChange={(e) => setMeterReadingStart(e.target.value)}
        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
        required
      />
    </div>
    
    {/* Meter Reading End */}
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-1">
        Meter Reading (End) *
      </label>
      <input
        type="number"
        placeholder="e.g., 5500"
        value={meterReadingEnd}
        onChange={(e) => setMeterReadingEnd(e.target.value)}
        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
        required
      />
    </div>

    {/* Diesel Liters */}
<div>
  <label className="block text-sm font-medium text-gray-700 mb-1">
    Diesel (Liters) *
  </label>
  <input
    type="number"
    step="0.01"
    placeholder="e.g., 50"
    value={dieselLiters}
    onChange={(e) => setDieselLiters(e.target.value)}
    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
    required
  />
</div>
    
    {/* Calculated Distance */}
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-1">
        Distance (km)
      </label>
      <input
        type="number"
        value={distance}
        readOnly
        className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-gray-50"
      />
      <p className="text-xs text-gray-500 mt-1">Auto-calculated</p>
    </div>
  </div>
  
  {/* Average Calculation */}
<div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
  <div className="flex items-center justify-between">
    <div>
      <h4 className="font-medium text-blue-800">Fuel Efficiency</h4>
      <p className="text-sm text-blue-600">
        Distance: <span className="font-bold">{distance} km</span> | 
        Diesel: <span className="font-bold">{dieselLiters || 0} liters</span>
      </p>
    </div>
    <div className="text-right">
      <div className="text-2xl font-bold text-green-600">
        Average: {average} km/l
      </div>
      <p className="text-xs text-gray-600">Kilometers per liter</p>
    </div>
  </div>
</div>
  
  {/* Trip Log Files Upload */}
  <div className="mb-6">
    <label className="block text-sm font-medium text-gray-700 mb-2">
      Trip Log Files (Optional)
    </label>
    <div className="border-2 border-dashed border-gray-300 rounded-lg p-4 text-center">
      <input
        type="file"
        multiple
        onChange={handleTripLogFileChange}
        className="hidden"
        id="trip-log-files"
        accept="image/*,.pdf"
      />
      <label
        htmlFor="trip-log-files"
        className="cursor-pointer flex flex-col items-center"
      >
        <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mb-2">
          <span className="text-blue-600 text-xl">📎</span>
        </div>
        <span className="text-blue-600 font-medium">Upload Trip Log Files</span>
        <p className="text-sm text-gray-500 mt-1">
          Upload meter photos, oil bills, or other trip documents
        </p>
      </label>
      
      {/* Uploaded files preview */}
      {tripLogFiles.length > 0 && (
        <div className="mt-4">
          <p className="text-sm font-medium text-gray-700 mb-2">
            Uploaded Files ({tripLogFiles.length})
          </p>
          <div className="flex flex-wrap gap-2">
            {tripLogFiles.map((file, index) => (
              <div
                key={index}
                className="relative border rounded-lg p-2 bg-white"
              >
                <span className="text-xs block w-32 truncate">
                  {file.type?.startsWith('image/') ? '🖼️' : '📄'} {file.name}
                </span>
                <button
                  type="button"
                  onClick={() => removeTripLogFile(index)}
                  className="absolute -top-2 -right-2 bg-red-600 text-white text-xs rounded-full px-1"
                >
                  ✖
                </button>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
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
          0% {
            transform: rotate(0deg);
          }
          100% {
            transform: rotate(360deg);
          }
        }
      `}</style>
    </>
  );
}
