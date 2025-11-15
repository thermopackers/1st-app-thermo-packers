import { useEffect, useState } from "react";
import axiosInstance from "../axiosInstance";
import InternalNavbar from "../components/InternalNavbar";
import Swal from "sweetalert2";

export default function EarthingMaintenance() {
  // Unit selection states
  const [activeUnit, setActiveUnit] = useState(null);
  const [selectedEarthings, setSelectedEarthings] = useState([]);
  const [unit1Earthings] = useState(Array.from({ length: 18 }, (_, i) => `E${i + 1}`));
  const [unit3Earthings] = useState(Array.from({ length: 3 }, (_, i) => `E${i + 1}`));
  
  // Table data state
  const [tableData, setTableData] = useState([]);
  const [files, setFiles] = useState([]);
  const [loading, setLoading] = useState(false);

  // Existing states for logs and pagination
  const [logs, setLogs] = useState([]);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalRecords, setTotalRecords] = useState(0);
  const [filterDate, setFilterDate] = useState("");
  const [filteredLogs, setFilteredLogs] = useState([]);

  // Editing states
  const [editingId, setEditingId] = useState(null);
  const [editForm, setEditForm] = useState({});
  const [editFiles, setEditFiles] = useState([]);
  const [existingFiles, setExistingFiles] = useState([]);
  const [deletingFiles, setDeletingFiles] = useState({});

  // Fetch existing logs
  useEffect(() => {
    if (!activeUnit) {
      fetchLogs(page);
    }
  }, [page, activeUnit]);

  // Helper function to convert dd/mm/yyyy to yyyy-mm-dd for date input
  const convertToYYYYMMDD = (dateString) => {
    if (!dateString) return "";
    const [day, month, year] = dateString.split('/');
    return `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;
  };

  // Helper function to convert yyyy-mm-dd to dd/mm/yyyy
  const convertToDDMMYYYY = (dateString) => {
    if (!dateString) return "";
    const [year, month, day] = dateString.split('-');
    return `${day.padStart(2, '0')}/${month.padStart(2, '0')}/${year}`;
  };

  // Fetch logs with pagination and date filter
  const fetchLogs = async (pageNum, dateFilter = "") => {
    try {
      setLoading(true);
      let url = `/earthing?page=${pageNum}&limit=10`;
      if (dateFilter) {
        url += `&date=${encodeURIComponent(dateFilter)}`;
      }
      
      const res = await axiosInstance.get(url);
      setLogs(res.data.logs);
      setTotalPages(res.data.totalPages);
      setTotalRecords(res.data.totalRecords);
      setFilteredLogs(res.data.logs);
      
    } catch (err) {
      console.error("Error fetching logs:", err);
      Swal.fire("Error", "Failed to fetch logs", "error");
    } finally {
      setLoading(false);
    }
  };

  // Handle unit selection
  const handleUnitSelect = (unit) => {
    setActiveUnit(unit);
    setSelectedEarthings([]);
    setTableData([]);
  };

  // Handle earthing checkbox selection
  const handleEarthingSelect = (earthing) => {
    setSelectedEarthings(prev => {
      if (prev.includes(earthing)) {
        return prev.filter(e => e !== earthing);
      } else {
        return [...prev, earthing];
      }
    });
  };

  // Generate table for selected earthings
  const generateTable = () => {
    if (selectedEarthings.length === 0) {
      Swal.fire("Info", "Please select at least one earthing", "info");
      return;
    }

    const newTableData = selectedEarthings.map(earthing => ({
      id: Math.random().toString(36).substr(2, 9),
      earthingNo: earthing,
      connectedTo: "",
      location: `${activeUnit === 'unit1' ? 'Unit 1' : 'Unit 3'} - ${earthing}`,
      waterTop: "No",
      earthingCurrent: "",
      remarks: "",
      files: []
    }));

    setTableData(newTableData);
  };

  // Handle form input changes for table rows
  const handleTableInputChange = (id, field, value) => {
    setTableData(prev => 
      prev.map(row => 
        row.id === id ? { ...row, [field]: value } : row
      )
    );
  };

  // Handle file upload for specific row
  const handleFileUpload = (id, newFiles) => {
    setTableData(prev =>
      prev.map(row =>
        row.id === id ? { ...row, files: newFiles } : row
      )
    );
  };

  // Submit all table data
  const submitAllData = async () => {
    try {
      setLoading(true);
      
      for (const row of tableData) {
        let uploadedUrls = [];

        // Upload files if any
        if (row.files && row.files.length > 0) {
          const fd = new FormData();
          row.files.forEach((file) => fd.append("files", file));
          const uploadRes = await axiosInstance.post("/earthing/upload", fd, {
            headers: { "Content-Type": "multipart/form-data" },
          });
          uploadedUrls = uploadRes.data.urls;
        }

        // Submit row data
        await axiosInstance.post("/earthing", {
          earthingNo: row.earthingNo,
          date: new Date().toLocaleDateString('en-GB'),
          waterTopUp: row.waterTop,
          earthingCurrent: row.earthingCurrent,
          sign: "",
          remarks: row.remarks,
          connectedTo: row.connectedTo,
          location: row.location,
          uploadedFiles: uploadedUrls,
        });
      }

      Swal.fire("Success!", "All earthing entries saved successfully", "success");
      setTableData([]);
      setSelectedEarthings([]);
      fetchLogs(page);

    } catch (err) {
      console.error("Error saving data:", err);
      Swal.fire("Error", "Error saving entries", "error");
    } finally {
      setLoading(false);
    }
  };

  // Date filter handlers
  const handleDateFilterChange = (selectedDate) => {
    if (selectedDate) {
      const [year, month, day] = selectedDate.split('-');
      const formattedDate = `${day.padStart(2, '0')}/${month.padStart(2, '0')}/${year}`;
      setFilterDate(formattedDate);
      setPage(1);
      fetchLogs(1, formattedDate);
    } else {
      setFilterDate("");
      setPage(1);
      fetchLogs(1);
    }
  };

  const handleDateFilter = (date) => {
    setFilterDate(date);
    setPage(1);
    fetchLogs(1, date);
  };

  // Editing functions
  const startEditing = (entry) => {
    setEditingId(entry._id);
    setEditForm({
      earthingNo: entry.earthingNo,
      waterTopUp: entry.waterTopUp,
      earthingCurrent: entry.earthingCurrent,
      sign: entry.sign,
      remarks: entry.remarks,
      connectedTo: entry.connectedTo,
      location: entry.location,
    });
    setExistingFiles(entry.uploadedFiles || []);
    setEditFiles([]);
  };

  const saveEdit = async (id) => {
    try {
      setLoading(true);
      
      const filesToDelete = deletingFiles[id] || [];
      
      if (filesToDelete.length > 0) {
        await Promise.all(
          filesToDelete.map(fileUrl => 
            axiosInstance.delete('/earthing/file', { data: { fileUrl } })
          )
        );
      }

      const updatedFiles = existingFiles.filter(file => !filesToDelete.includes(file));

      const updatedData = { 
        ...editForm, 
        uploadedFiles: updatedFiles
      };

      if (editFiles.length > 0) {
        const fd = new FormData();
        editFiles.forEach((f) => fd.append("files", f));
        const uploadRes = await axiosInstance.post("/earthing/upload", fd, {
          headers: { "Content-Type": "multipart/form-data" },
        });
        updatedData.uploadedFiles = [...updatedFiles, ...uploadRes.data.urls];
      }

      await axiosInstance.put(`/earthing/${id}`, updatedData);
      
      setEditingId(null);
      setEditForm({});
      setEditFiles([]);
      setExistingFiles([]);
      setDeletingFiles(prev => {
        const newState = { ...prev };
        delete newState[id];
        return newState;
      });
      
      fetchLogs(page);
      Swal.fire("Updated!", "Entry updated successfully", "success");
    } catch (err) {
      console.error("Error updating log:", err);
      Swal.fire("Error", "Failed to update entry", "error");
    } finally {
      setLoading(false);
    }
  };

  const cancelEdit = () => {
    setEditingId(null);
    setEditForm({});
    setEditFiles([]);
    setExistingFiles([]);
    setDeletingFiles({});
  };

  const openFileModal = (url) => {
    const isImage = url.match(/\.(jpeg|jpg|gif|png|webp)$/i);
    const isPDF = url.match(/\.pdf$/i);
    if (isImage) {
      Swal.fire({ imageUrl: url, showCloseButton: true, showConfirmButton: false });
    } else if (isPDF) {
      Swal.fire({
        html: `<iframe src="${url}" width="100%" height="500px"></iframe>`,
        width: "80%",
        showCloseButton: true,
      });
    } else window.open(url, "_blank");
  };

  const deleteExistingFile = async (fileUrl, entryId) => {
    try {
      const result = await Swal.fire({
        title: 'Are you sure?',
        text: "This file will be deleted when you save changes!",
        icon: 'warning',
        showCancelButton: true,
        confirmButtonColor: '#d33',
        cancelButtonColor: '#3085d6',
        confirmButtonText: 'Yes, delete it!'
      });

      if (result.isConfirmed) {
        setExistingFiles(prev => prev.filter(file => file !== fileUrl));
        
        setDeletingFiles(prev => ({
          ...prev,
          [entryId]: [...(prev[entryId] || []), fileUrl]
        }));

        Swal.fire('Marked for deletion!', 'File will be removed when you save changes.', 'success');
      }
    } catch (err) {
      console.error('Error in delete process:', err);
      Swal.fire('Error', 'Failed to mark file for deletion', 'error');
    }
  };

  const removeNewFile = (index) => {
    setEditFiles(prev => prev.filter((_, i) => i !== index));
  };

  const handleEditFilesChange = (e) => {
    setEditFiles(Array.from(e.target.files));
  };

  const clearFilter = () => {
    setFilterDate("");
    setPage(1);
    fetchLogs(1);
  };

  const uniqueDates = [...new Set(logs.map(entry => entry.date))].sort((a, b) => {
    const [dayA, monthA, yearA] = a.split('/').map(Number);
    const [dayB, monthB, yearB] = b.split('/').map(Number);
    const dateA = new Date(yearA, monthA - 1, dayA);
    const dateB = new Date(yearB, monthB - 1, dayB);
    return dateB - dateA;
  });

const layoutImages = {
  unit1: '/images/unit12.jpg',  // Single image for Unit 1
  unit3: {
    image1: '/images/unit3.jpg',   // First Unit 3 layout
    image2: '/images/unit1.jpg'   // Second Unit 3 layout
  }
};

// Add this earthingImages object after your layoutImages
const earthingImages = {
  unit1: {
    E1: '/images/plate1.jpg',
    E2: '/images/plate2.jpg',
    E3: '/images/plate3.jpg',
    E4: '/images/plate4.jpg',
    E5: '/images/plate5.jpg',
    E6: '/images/plate6.jpg',
    E7: '/images/plate7a.jpg',
    E8: '/images/plate8.jpg',
    E9: '/images/plate9.jpg',
    E10: '/images/plate10.jpg',
    E11: '/images/plate11.jpg',
    E12: '/images/plate12.jpg',
    E13: '/images/plate13.jpg',
    E14: '/images/plate14.jpg',
    E15: '/images/plate15.jpg',
    E16: '/images/plate16.jpg',
    E17: '/images/plate17.jpg',
    E18: '/images/plate18.jpg'
  },
  unit3: {
    E1: '/images/earthings/unit3/E1.jpg',
    E2: '/images/earthings/unit3/E2.jpg',
    E3: '/images/earthings/unit3/E3.jpg'
  }
};

// Add this function to open earthing image in modal
const openEarthingImageModal = (imageUrl, earthingNo) => {
  Swal.fire({
    imageUrl: imageUrl,
    imageAlt: `${earthingNo} Plate`,
    showCloseButton: true,
    showConfirmButton: false,
    width: '80%',
    padding: '2rem',
    background: '#f8fafc',
    imageHeight: 'auto',
    imageWidth: '80%',
    customClass: {
      popup: 'earthing-modal',
      image: 'earthing-modal-image',
      closeButton: 'earthing-modal-close'
    }
  });
};

// Add this function to delete table rows
const deleteTableRow = (id) => {
  Swal.fire({
    title: 'Are you sure?',
    text: "This will remove this earthing from the form!",
    icon: 'warning',
    showCancelButton: true,
    confirmButtonColor: '#d33',
    cancelButtonColor: '#3085d6',
    confirmButtonText: 'Yes, delete it!',
    cancelButtonText: 'Cancel'
  }).then((result) => {
    if (result.isConfirmed) {
      setTableData(prev => prev.filter(row => row.id !== id));
      
      // Also remove from selectedEarthings if needed
      const rowToDelete = tableData.find(row => row.id === id);
      if (rowToDelete) {
        setSelectedEarthings(prev => prev.filter(earthing => earthing !== rowToDelete.earthingNo));
      }
      
      Swal.fire(
        'Deleted!',
        'Earthing has been removed from the form.',
        'success'
      );
    }
  });
};

// Add this function to submit individual rows
const submitSingleRow = async (row) => {
  try {
    setLoading(true);
    
    let uploadedUrls = [];

    // Upload files if any
    if (row.files && row.files.length > 0) {
      const fd = new FormData();
      row.files.forEach((file) => fd.append("files", file));
      const uploadRes = await axiosInstance.post("/earthing/upload", fd, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      uploadedUrls = uploadRes.data.urls;
    }

    // Submit row data
    await axiosInstance.post("/earthing", {
      earthingNo: row.earthingNo,
      date: new Date().toLocaleDateString('en-GB'),
      waterTopUp: row.waterTop,
      earthingCurrent: row.earthingCurrent,
      sign: "",
      remarks: row.remarks,
      connectedTo: row.connectedTo,
      location: row.location,
      uploadedFiles: uploadedUrls,
    });

    // Remove the submitted row from table
    setTableData(prev => prev.filter(tableRow => tableRow.id !== row.id));
    
    // Also remove from selectedEarthings
    setSelectedEarthings(prev => prev.filter(earthing => earthing !== row.earthingNo));

    Swal.fire("Success!", `Earthing ${row.earthingNo} entry saved successfully`, "success");
    
    // Refresh logs if needed
    fetchLogs(page);

  } catch (err) {
    console.error("Error saving data:", err);
    Swal.fire("Error", `Error saving ${row.earthingNo} entry`, "error");
  } finally {
    setLoading(false);
  }
};

  return (
    <div className="min-h-screen bg-slate-100">
      <InternalNavbar />
      <div className="max-w-7xl mx-auto p-6">
        <h1 className="text-3xl font-bold text-center text-yellow-700 mb-8">
          Earthing Maintenance System
        </h1>

        {/* Unit Selection */}
        {!activeUnit && (
          <div className="bg-white shadow-lg rounded-lg p-6 mb-8">
            <h2 className="text-2xl font-bold text-center mb-6">Select Unit</h2>
            <div className="flex justify-center gap-6">
              <button
                onClick={() => handleUnitSelect('unit1')}
                className="bg-blue-600 text-white px-8 py-4 rounded-lg hover:bg-blue-700 transition text-xl font-semibold"
              >
                Unit 1
              </button>
              <button
                onClick={() => handleUnitSelect('unit3')}
                className="bg-green-600 text-white px-8 py-4 rounded-lg hover:bg-green-700 transition text-xl font-semibold"
              >
                Unit 3
              </button>
            </div>
          </div>
        )}

        {/* Unit Interface */}
        {activeUnit && (
          <div className="bg-white shadow-lg rounded-lg p-6 mb-8">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-bold">
                {activeUnit === 'unit1' ? 'Unit 1' : 'Unit 3'} - Earthings
              </h2>
              <button
                onClick={() => {
                  setActiveUnit(null);
                  setSelectedEarthings([]);
                  setTableData([]);
                }}
                className="bg-gray-500 text-white px-4 py-2 rounded hover:bg-gray-600 transition"
              >
                Back to Unit Selection
              </button>
            </div>

{/* Layout Image */}
<div className="mb-6">
  <h3 className="text-lg font-semibold mb-2">
    {activeUnit === 'unit1' ? 'Unit 1' : 'Unit 3'} - Layout Diagrams
    {activeUnit === 'unit3' && ' (2 Views)'}
  </h3>
  
  {activeUnit === 'unit1' ? (
    // Unit 1 - Single Layout Image
    <div className="border-2 border-gray-300 rounded-lg overflow-hidden bg-white shadow-sm">
      <div className="bg-blue-600 text-white text-center py-2 font-medium">
        Unit 1 - Layout Diagram
      </div>
      <div className="p-4">
        <img 
          src={layoutImages.unit1}
          alt="Unit 1 Earthing Layout"
          className="w-full h-auto max-h-96 object-contain mx-auto border rounded"
          onError={(e) => {
            e.target.style.display = 'none';
            e.target.nextSibling.style.display = 'block';
          }}
        />
        <div className="hidden p-8 text-center bg-gray-50 border rounded">
          <div className="text-gray-500 mb-2">Unit 1 Layout Diagram</div>
          <div className="text-sm text-gray-400">
            Image: {layoutImages.unit1.replace('/images/', '')}
          </div>
          <div className="text-xs text-gray-400 mt-1">
            Place your image in: public{layoutImages.unit1}
          </div>
        </div>
      </div>
    </div>
  ) : (
    // Unit 3 - Two Layout Images
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      {/* Unit 3 - First Layout */}
      <div className="border-2 border-gray-300 rounded-lg overflow-hidden bg-white shadow-sm">
        <div className="bg-green-600 text-white text-center py-2 font-medium">
          Unit 3 - Layout View 1
        </div>
        <div className="p-4">
          <img 
            src={layoutImages.unit3.image1}
            alt="Unit 3 Earthing Layout - View 1"
            className="w-full h-auto max-h-80 object-contain mx-auto border rounded"
            onError={(e) => {
              e.target.style.display = 'none';
              e.target.nextSibling.style.display = 'block';
            }}
          />
          <div className="hidden p-6 text-center bg-gray-50 border rounded">
            <div className="text-gray-500 mb-2">Unit 3 Layout - View 1</div>
            <div className="text-sm text-gray-400">
              Image: {layoutImages.unit3.image1.replace('/images/', '')}
            </div>
            <div className="text-xs text-gray-400 mt-1">
              Place your image in: public{layoutImages.unit3.image1}
            </div>
          </div>
        </div>
      </div>

      {/* Unit 3 - Second Layout */}
      <div className="border-2 border-gray-300 rounded-lg overflow-hidden bg-white shadow-sm">
        <div className="bg-green-600 text-white text-center py-2 font-medium">
          Unit 3 - Layout View 2
        </div>
        <div className="p-4">
          <img 
            src={layoutImages.unit3.image2}
            alt="Unit 3 Earthing Layout - View 2"
            className="w-full h-auto max-h-80 object-contain mx-auto border rounded"
            onError={(e) => {
              e.target.style.display = 'none';
              e.target.nextSibling.style.display = 'block';
            }}
          />
          <div className="hidden p-6 text-center bg-gray-50 border rounded">
            <div className="text-gray-500 mb-2">Unit 3 Layout - View 2</div>
            <div className="text-sm text-gray-400">
              Image: {layoutImages.unit3.image2.replace('/images/', '')}
            </div>
            <div className="text-xs text-gray-400 mt-1">
              Place your image in: public{layoutImages.unit3.image2}
            </div>
          </div>
        </div>
      </div>
    </div>
  )}
</div>

            {/* Earthings Selection */}
            <div className="mb-6">
              <h3 className="text-lg font-semibold mb-3">Select Earthings</h3>
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-2">
                {(activeUnit === 'unit1' ? unit1Earthings : unit3Earthings).map((earthing) => (
                  <label key={earthing} className="flex items-center space-x-2 p-2 border rounded hover:bg-gray-50">
                    <input
                      type="checkbox"
                      checked={selectedEarthings.includes(earthing)}
                      onChange={() => handleEarthingSelect(earthing)}
                      className="rounded"
                    />
                    <span>{earthing}</span>
                  </label>
                ))}
              </div>
              <div className="mt-2 text-sm text-gray-600">
                Selected: {selectedEarthings.length} earthings
                {selectedEarthings.length > 0 && ` (${selectedEarthings.join(', ')})`}
              </div>
            </div>

            {/* Generate Table Button */}
            {selectedEarthings.length > 0 && !tableData.length && (
              <div className="mb-6">
                <button
                  onClick={generateTable}
                  className="bg-yellow-600 text-white px-6 py-2 rounded hover:bg-yellow-700 transition"
                >
                  Generate Table for Selected Earthings ({selectedEarthings.length})
                </button>
              </div>
            )}

{/* Dynamic Table */}
{tableData.length > 0 && (
  <div className="mt-6">
    <div className="flex justify-between items-center mb-3">
      <h3 className="text-lg font-semibold">Earthing Maintenance Form</h3>
      <div className="flex gap-2">
        <button
          onClick={() => {
            if (tableData.length > 0) {
              Swal.fire({
                title: 'Clear all rows?',
                text: "This will remove all earthings from the form!",
                icon: 'warning',
                showCancelButton: true,
                confirmButtonColor: '#d33',
                cancelButtonColor: '#3085d6',
                confirmButtonText: 'Yes, clear all!',
                cancelButtonText: 'Cancel'
              }).then((result) => {
                if (result.isConfirmed) {
                  setTableData([]);
                  setSelectedEarthings([]);
                  Swal.fire('Cleared!', 'All earthings removed from form.', 'success');
                }
              });
            }
          }}
          className="bg-red-600 text-white px-4 py-2 rounded hover:bg-red-700 transition text-sm"
        >
          Clear All
        </button>
        <button
          onClick={submitAllData}
          disabled={loading}
          className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700 transition disabled:opacity-50 text-sm"
        >
          {loading ? "Saving All..." : "Submit All Data"}
        </button>
      </div>
    </div>

    {/* Earthing Picture Plates */}
    <div className="mb-6">
      <h4 className="text-md font-semibold mb-3 text-center">
        Selected Earthing Plates - {activeUnit === 'unit1' ? 'Unit 1' : 'Unit 3'} ({tableData.length})
      </h4>
      <div className="flex flex-wrap justify-center gap-4 p-4 bg-gray-50 rounded-lg border">
        {tableData.map((row) => (
          <div key={row.id} className="text-center relative">
            <div 
              className="border-2 border-yellow-500 rounded-lg p-2 bg-white shadow-sm cursor-pointer hover:shadow-md hover:border-yellow-600 transition-all duration-200 transform hover:scale-105"
              onClick={() => openEarthingImageModal(earthingImages[activeUnit][row.earthingNo], row.earthingNo)}
              title={`Click to view ${row.earthingNo} plate`}
            >
              <div className="relative group">
                <img 
                  src={earthingImages[activeUnit][row.earthingNo]}
                  alt={`${row.earthingNo} Plate`}
                  className="w-24 h-24 object-cover mx-auto rounded group-hover:brightness-110 transition-all duration-200"
                  onError={(e) => {
                    e.target.style.display = 'none';
                    e.target.nextSibling.style.display = 'flex';
                  }}
                />
                <div className="hidden w-24 h-24 bg-gradient-to-br from-gray-200 to-gray-300 rounded items-center justify-center text-gray-500 text-sm">
                  No Image
                </div>
             
              </div>
              <div className="font-semibold text-sm mt-1 text-gray-700 bg-yellow-50 py-1 rounded">
                {row.earthingNo}
              </div>
            </div>
            {/* Delete button on plate */}
            <button
              onClick={(e) => {
                e.stopPropagation(); // Prevent triggering the image modal
                deleteTableRow(row.id);
              }}
              className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full w-6 h-6 text-xs flex items-center justify-center hover:bg-red-600 transition-colors shadow-lg"
              title="Remove this earthing"
            >
              ×
            </button>
          </div>
        ))}
      </div>
    </div>

    <div className="overflow-x-auto">
      <table className="min-w-full border border-slate-300 text-sm">
        <thead className="bg-yellow-600 text-white">
          <tr>
            <th className="border px-3 py-2">Earthing No</th>
            <th className="border px-3 py-2">Connected To</th>
            <th className="border px-3 py-2">Location</th>
            <th className="border px-3 py-2">Water Top</th>
            <th className="border px-3 py-2">Earthing Current</th>
            <th className="border px-3 py-2">Photo of Water Top Up</th>
            <th className="border px-3 py-2">Remarks</th>
            <th className="border px-3 py-2">Actions</th>
          </tr>
        </thead>
        <tbody>
          {tableData.map((row) => (
            <tr key={row.id} className="hover:bg-gray-50 transition-colors">
              <td className="border px-3 py-2 font-semibold bg-gray-50">
                <div className="flex items-center gap-2">
                  <div 
                    className="cursor-pointer hover:opacity-80 transition-opacity transform hover:scale-110 duration-200"
                    onClick={() => openEarthingImageModal(earthingImages[activeUnit][row.earthingNo], row.earthingNo)}
                    title={`View ${row.earthingNo} plate`}
                  >
                    <img 
                      src={earthingImages[activeUnit][row.earthingNo]}
                      alt={`${row.earthingNo} Icon`}
                      className="w-8 h-8 object-cover rounded border"
                      onError={(e) => {
                        e.target.style.display = 'none';
                        e.target.nextSibling.style.display = 'block';
                      }}
                    />
                    <div className="hidden w-8 h-8 bg-gray-300 rounded text-xs flex items-center justify-center border">
                      {row.earthingNo}
                    </div>
                  </div>
                  <span className="text-gray-800">{row.earthingNo}</span>
                </div>
              </td>
              <td className="border px-3 py-2">
                <input
                  type="text"
                  value={row.connectedTo}
                  onChange={(e) => handleTableInputChange(row.id, 'connectedTo', e.target.value)}
                  className="w-full border rounded p-1 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Connected to..."
                />
              </td>
              <td className="border px-3 py-2">
                <input
                  type="text"
                  value={row.location}
                  onChange={(e) => handleTableInputChange(row.id, 'location', e.target.value)}
                  className="w-full border rounded p-1 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </td>
              <td className="border px-3 py-2">
                <select
                  value={row.waterTop}
                  onChange={(e) => handleTableInputChange(row.id, 'waterTop', e.target.value)}
                  className="w-full border rounded p-1 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="No">No</option>
                  <option value="Yes">Yes</option>
                </select>
              </td>
              <td className="border px-3 py-2">
                <input
                  type="text"
                  value={row.earthingCurrent}
                  onChange={(e) => handleTableInputChange(row.id, 'earthingCurrent', e.target.value)}
                  className="w-full border rounded p-1 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Current status..."
                />
              </td>
              <td className="border px-3 py-2">
                <input
                  type="file"
                  accept="image/*,.pdf"
                  onChange={(e) => handleFileUpload(row.id, Array.from(e.target.files))}
                  className="w-full text-sm border rounded p-1 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  multiple
                />
                {row.files && row.files.length > 0 && (
                  <div className="text-xs text-gray-500 mt-1">
                    {row.files.length} file(s) selected
                  </div>
                )}
              </td>
              <td className="border px-3 py-2">
                <textarea
                  value={row.remarks}
                  onChange={(e) => handleTableInputChange(row.id, 'remarks', e.target.value)}
                  className="w-full border rounded p-1 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  rows={2}
                  placeholder="Remarks..."
                />
              </td>
              <td className="border px-3 py-2">
                <div className="flex flex-col gap-2">
                  {/* Submit Individual Row Button */}
                  <button
                    onClick={() => submitSingleRow(row)}
                    disabled={loading}
                    className="bg-green-600 text-white px-3 py-1 rounded hover:bg-green-700 transition-colors text-sm flex items-center gap-1 justify-center disabled:opacity-50"
                    title="Submit this earthing data"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    {loading ? "Saving..." : "Submit"}
                  </button>
                  
                  {/* Delete Row Button */}
                  <button
                    onClick={() => deleteTableRow(row.id)}
                    className="bg-red-500 text-white px-3 py-1 rounded hover:bg-red-600 transition-colors text-sm flex items-center gap-1 justify-center"
                    title="Delete this row"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                    Delete
                  </button>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>

    {/* Summary Footer */}
    <div className="mt-4 flex justify-between items-center text-sm text-gray-600">
      <div>
        Total rows: <span className="font-semibold">{tableData.length}</span>
      </div>
      <div className="flex gap-4">
        <button
          onClick={() => {
            if (tableData.length > 0) {
              Swal.fire({
                title: 'Clear all rows?',
                text: "This will remove all earthings from the form!",
                icon: 'warning',
                showCancelButton: true,
                confirmButtonColor: '#d33',
                cancelButtonColor: '#3085d6',
                confirmButtonText: 'Yes, clear all!',
                cancelButtonText: 'Cancel'
              }).then((result) => {
                if (result.isConfirmed) {
                  setTableData([]);
                  setSelectedEarthings([]);
                  Swal.fire('Cleared!', 'All earthings removed from form.', 'success');
                }
              });
            }
          }}
          className="text-red-600 hover:text-red-700 underline text-sm"
        >
          Clear All Rows
        </button>
        <button
          onClick={submitAllData}
          disabled={loading}
          className="text-green-600 hover:text-green-700 underline text-sm disabled:opacity-50"
        >
          {loading ? "Submitting All..." : "Submit All Data"}
        </button>
      </div>
    </div>
  </div>
)}
          </div>
        )}

        {/* Existing Logs Table */}
        {!activeUnit && (
          <>
            {/* Filter Section */}
            <div className="bg-white shadow-lg rounded-lg p-6 mb-8">
              <div className="flex flex-col sm:flex-row gap-4 items-center">
                <div className="flex-1">
                  <label className="block text-sm font-medium mb-1">Filter by Date</label>
                  <input
                    type="date"
                    value={convertToYYYYMMDD(filterDate)}
                    onChange={(e) => handleDateFilterChange(e.target.value)}
                    className="border rounded p-2 w-full"
                  />
                </div>
                {filterDate && (
                  <button
                    onClick={clearFilter}
                    className="bg-gray-500 text-white px-4 py-2 rounded hover:bg-gray-600 transition mt-6"
                  >
                    Clear Filter
                  </button>
                )}
              </div>
            </div>

            {/* Logs Table */}
            <div className="overflow-x-auto bg-white shadow-lg rounded-lg">
              <table className="min-w-full border border-slate-300 text-sm text-center">
                <thead className="bg-yellow-600 text-white">
                  <tr>
                    <th className="border px-3 py-2">Earthing No</th>
                    <th className="border px-3 py-2">Date</th>
                    <th className="border px-3 py-2">Connected To</th>
                    <th className="border px-3 py-2">Location</th>
                    <th className="border px-3 py-2">Water Top Up</th>
                    <th className="border px-3 py-2">Earthing Current</th>
                    <th className="border px-3 py-2">Files</th>
                    <th className="border px-3 py-2">Remarks</th>
                    <th className="border px-3 py-2">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredLogs.length === 0 ? (
                    <tr>
                      <td colSpan="10" className="border px-3 py-4 text-gray-500">
                        {filterDate ? `No entries found for ${filterDate}` : "No entries found"}
                      </td>
                    </tr>
                  ) : (
                    filteredLogs.map((entry) => {
                      const isEditing = editingId === entry._id;
                      return (
                        <tr key={entry._id}>
                          <td className="border px-3 py-2">{entry.earthingNo}</td>
                          <td className="border px-3 py-2">{entry.date}</td>
                          <td className="border px-3 py-2">
                            {isEditing ? (
                              <input
                                type="text"
                                value={editForm.connectedTo || ''}
                                onChange={(e) => setEditForm({ ...editForm, connectedTo: e.target.value })}
                                className="w-full border rounded p-1"
                              />
                            ) : (
                              entry.connectedTo || '-'
                            )}
                          </td>
                          <td className="border px-3 py-2">
                            {isEditing ? (
                              <input
                                type="text"
                                value={editForm.location || ''}
                                onChange={(e) => setEditForm({ ...editForm, location: e.target.value })}
                                className="w-full border rounded p-1"
                              />
                            ) : (
                              entry.location || '-'
                            )}
                          </td>
                          <td className="border px-3 py-2">
                            {isEditing ? (
                              <select
                                value={editForm.waterTopUp}
                                onChange={(e) => setEditForm({ ...editForm, waterTopUp: e.target.value })}
                                className="border rounded p-1 w-full"
                              >
                                <option value="No">No</option>
                                <option value="Yes">Yes</option>
                              </select>
                            ) : (
                              entry.waterTopUp
                            )}
                          </td>
                          <td className="border px-3 py-2">
                            {isEditing ? (
                              <input
                                type="text"
                                value={editForm.earthingCurrent}
                                onChange={(e) => setEditForm({ ...editForm, earthingCurrent: e.target.value })}
                                className="w-full border rounded p-1"
                              />
                            ) : (
                              entry.earthingCurrent
                            )}
                          </td>
                          {/* <td className="border px-3 py-2">
                            {isEditing ? (
                              <input
                                type="text"
                                value={editForm.sign}
                                onChange={(e) => setEditForm({ ...editForm, sign: e.target.value })}
                                className="w-full border rounded p-1"
                              />
                            ) : (
                              entry.sign
                            )}
                          </td> */}

                          <td className="border px-3 py-2">
                            <div className="flex flex-wrap gap-1 justify-center">
                              {!isEditing && entry.uploadedFiles?.map((url, i) => (
                                <div key={`view-${i}`} className="relative">
                                  <button
                                    onClick={() => openFileModal(url)}
                                    className="border rounded p-1 hover:bg-gray-100 transition"
                                  >
                                    {url.match(/\.(jpeg|jpg|gif|png|webp)$/i) ? (
                                      <img src={url} alt={`File ${i + 1}`} className="w-12 h-12 object-cover" />
                                    ) : (
                                      <span>📄</span>
                                    )}
                                  </button>
                                </div>
                              ))}
                              
                              {isEditing && (
                                <>
                                  {existingFiles.map((url, i) => (
                                    <div key={`existing-${i}`} className="relative group">
                                      <button
                                        onClick={() => openFileModal(url)}
                                        className="border rounded p-1 hover:bg-gray-100 transition"
                                      >
                                        {url.match(/\.(jpeg|jpg|gif|png|webp)$/i) ? (
                                          <img src={url} alt={`File ${i + 1}`} className="w-12 h-12 object-cover" />
                                        ) : (
                                          <span>📄</span>
                                        )}
                                      </button>
                                      <button
                                        onClick={() => deleteExistingFile(url, entry._id)}
                                        className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full w-5 h-5 text-xs flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                                        title="Delete file"
                                      >
                                        ×
                                      </button>
                                    </div>
                                  ))}
                                  
                                  {editFiles.map((file, i) => (
                                    <div key={`new-${i}`} className="relative group">
                                      <div className="border rounded p-1 bg-blue-50">
                                        {file.type.startsWith('image/') ? (
                                          <img 
                                            src={URL.createObjectURL(file)} 
                                            alt={`New file ${i + 1}`} 
                                            className="w-12 h-12 object-cover" 
                                          />
                                        ) : (
                                          <span>📄 {file.name}</span>
                                        )}
                                      </div>
                                      <button
                                        onClick={() => removeNewFile(i)}
                                        className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full w-5 h-5 text-xs flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                                        title="Remove file"
                                      >
                                        ×
                                      </button>
                                    </div>
                                  ))}
                                  
                                  <div className="flex items-center justify-center">
                                    <label className="cursor-pointer bg-gray-100 hover:bg-gray-200 rounded p-2 text-xs transition">
                                      📁 Add Files
                                      <input
                                        type="file"
                                        multiple
                                        accept="image/*,.pdf"
                                        onChange={handleEditFilesChange}
                                        className="hidden"
                                      />
                                    </label>
                                  </div>
                                </>
                              )}
                            </div>
                          </td>

                          <td className="border px-3 py-2">
                            {isEditing ? (
                              <textarea
                                value={editForm.remarks}
                                onChange={(e) => setEditForm({ ...editForm, remarks: e.target.value })}
                                className="w-full border rounded p-1"
                                rows={2}
                              />
                            ) : (
                              entry.remarks
                            )}
                          </td>

                          <td className="border px-3 py-2">
                            {isEditing ? (
                              <>
                                <button
                                  onClick={() => saveEdit(entry._id)}
                                  className="bg-green-600 text-white px-2 py-1 rounded mr-2"
                                >
                                  Save
                                </button>
                                <button
                                  onClick={cancelEdit}
                                  className="bg-gray-400 text-white px-2 py-1 rounded"
                                >
                                  Cancel
                                </button>
                              </>
                            ) : (
                              <button
                                onClick={() => startEditing(entry)}
                                className="bg-yellow-500 text-white px-2 py-1 rounded"
                              >
                                Edit
                              </button>
                            )}
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            {(!filterDate || totalPages > 1) && (
              <div className="flex justify-center items-center gap-2 mt-4">
                <button
                  disabled={page === 1}
                  onClick={() => {
                    const newPage = page - 1;
                    setPage(newPage);
                    fetchLogs(newPage, filterDate);
                  }}
                  className="px-3 py-1 bg-gray-300 rounded disabled:opacity-50"
                >
                  Prev
                </button>
                <span>
                  Page {page} of {totalPages} (Total: {totalRecords})
                </span>
                <button
                  disabled={page === totalPages}
                  onClick={() => {
                    const newPage = page + 1;
                    setPage(newPage);
                    fetchLogs(newPage, filterDate);
                  }}
                  className="px-3 py-1 bg-gray-300 rounded disabled:opacity-50"
                >
                  Next
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}