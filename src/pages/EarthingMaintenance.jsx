import { useEffect, useState } from "react";
import axiosInstance from "../axiosInstance";
import InternalNavbar from "../components/InternalNavbar";
import Swal from "sweetalert2";
import { useUserContext } from "../context/UserContext";

export default function EarthingMaintenance() {
    const { user } = useUserContext(); // Add this line
  // Unit selection states
  const [activeUnit, setActiveUnit] = useState('unit1');
  const [selectedEarthings, setSelectedEarthings] = useState([]);
  const [unit1Earthings] = useState(Array.from({ length: 18 }, (_, i) => `E${i + 1}`));
  const [unit3Earthings] = useState(Array.from({ length: 3 }, (_, i) => `E${i + 1}`));
  // Add this state for showing/hiding bulk generation
const [showBulkGeneration, setShowBulkGeneration] = useState(false);
  // Table data state
  const [tableData, setTableData] = useState([]);
  const [files, setFiles] = useState([]);
  const [loading, setLoading] = useState(false);

  // Existing states for logs and pagination
  const [logs, setLogs] = useState([]);
const [unit1Pagination, setUnit1Pagination] = useState({
  page: 1,
  totalPages: 1,
  totalRecords: 0
});

const [unit3Pagination, setUnit3Pagination] = useState({
  page: 1,
  totalPages: 1,
  totalRecords: 0
});

// Helper to get current unit's pagination
const getCurrentPagination = () => {
  return activeUnit === 'unit1' ? unit1Pagination : unit3Pagination;
};

// Helper to set current unit's pagination
const setCurrentPagination = (updates) => {
  if (activeUnit === 'unit1') {
    setUnit1Pagination(prev => ({ ...prev, ...updates }));
  } else {
    setUnit3Pagination(prev => ({ ...prev, ...updates }));
  }
};
  const [filterDate, setFilterDate] = useState("");
  const [filteredLogs, setFilteredLogs] = useState([]);

  // Editing states
  const [editingId, setEditingId] = useState(null);
  const [editForm, setEditForm] = useState({});
  const [editFiles, setEditFiles] = useState([]);
  const [existingFiles, setExistingFiles] = useState([]);
  const [deletingFiles, setDeletingFiles] = useState({});

// Fetch existing logs - UNIT SPECIFIC
useEffect(() => {
  const currentPage = getCurrentPagination().page;
  fetchLogs(currentPage);
}, [activeUnit]); // Remove page from dependencies

// Reset to page 1 when unit changes
useEffect(() => {
  setCurrentPagination({ page: 1 });
}, [activeUnit]);

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

// Helper function to validate date (not future)
const isValidDate = (dateString) => {
  if (!dateString) return false;
  
  try {
    const [day, month, year] = dateString.split('/');
    const selectedDate = new Date(year, month - 1, day);
    const today = new Date();
    today.setHours(23, 59, 59, 999); // End of today
    
    return selectedDate <= today;
  } catch (error) {
    return false;
  }
};

// Helper function to get today's date in dd/mm/yyyy format
const getTodayDate = () => {
  const today = new Date();
  const day = String(today.getDate()).padStart(2, '0');
  const month = String(today.getMonth() + 1).padStart(2, '0');
  const year = today.getFullYear();
  return `${day}/${month}/${year}`;
};

// Fetch logs with pagination, date filter and unit filter
const fetchLogs = async (pageNum, dateFilter = "") => {
  try {
    setLoading(true);
    let url = `/earthing?page=${pageNum}&limit=10&unit=${activeUnit}`;
    if (dateFilter) {
      url += `&date=${encodeURIComponent(dateFilter)}`;
    }
    
    const res = await axiosInstance.get(url);
    setLogs(res.data.logs);
    
    // Update unit-specific pagination
    setCurrentPagination({
      page: res.data.currentPage,
      totalPages: res.data.totalPages,
      totalRecords: res.data.totalRecords
    });
    
    setFilteredLogs(res.data.logs);
    
  } catch (err) {
    console.error("Error fetching logs:", err);
    Swal.fire("Error", "Failed to fetch logs", "error");
  } finally {
    setLoading(false);
  }
};

  // Handle unit selection
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
    date: getTodayDate(),
    connectedTo: connectedToData[activeUnit][earthing] || "",
    location: activeUnit === 'unit3' ? 'Unit 3' : '', // AUTO-SET LOCATION FOR UNIT 3
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

      // Submit row data - ADD UNIT INFORMATION IN LOCATION
      await axiosInstance.post("/earthing", {
        earthingNo: row.earthingNo,
        date: row.date,
        waterTopUp: row.waterTop,
        earthingCurrent: row.earthingCurrent,
        sign: "",
        remarks: row.remarks,
        connectedTo: row.connectedTo,
        location: activeUnit === 'unit3' ? 'Unit 3' : (row.location || ''), // AUTO-ADD "Unit 3" for Unit 3 entries
        uploadedFiles: uploadedUrls,
      });
    }

    Swal.fire("Success!", "All earthing entries saved successfully", "success");
    setTableData([]);
    setSelectedEarthings([]);
    fetchLogs(getCurrentPagination().page, filterDate);

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
    setCurrentPagination({ page: 1 });
    fetchLogs(1, formattedDate);
  } else {
    setFilterDate("");
    setCurrentPagination({ page: 1 });
    fetchLogs(1);
  }
};

const handleDateFilter = (date) => {
  setFilterDate(date);
  setCurrentPagination({ page: 1 });
  fetchLogs(1, date);
};

const clearFilter = () => {
  setFilterDate("");
  setCurrentPagination({ page: 1 });
  fetchLogs(1);
};

  // Editing functions
const startEditing = (entry) => {
  setEditingId(entry._id);
  setEditForm({
    earthingNo: entry.earthingNo,
    date: entry.date, // Include date
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
      uploadedFiles: updatedFiles,
      // Preserve Unit 3 location when editing
      location: activeUnit === 'unit3' ? 'Unit 3' : editForm.location
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
    
    fetchLogs(getCurrentPagination().page, filterDate);
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

// Pagination handlers
const handlePageChange = (newPage) => {
  setCurrentPagination(prev => ({ ...prev, page: newPage }));
  fetchLogs(newPage, filterDate);
};

const handleFirstPage = () => {
  handlePageChange(1);
};

const handlePrevPage = () => {
  const currentPage = getCurrentPagination().page;
  if (currentPage > 1) {
    handlePageChange(currentPage - 1);
  }
};

const handleNextPage = () => {
  const currentPage = getCurrentPagination().page;
  const totalPages = getCurrentPagination().totalPages;
  if (currentPage < totalPages) {
    handlePageChange(currentPage + 1);
  }
};

const handleLastPage = () => {
  const totalPages = getCurrentPagination().totalPages;
  handlePageChange(totalPages);
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

    // Submit row data - ADD UNIT INFORMATION IN LOCATION
    await axiosInstance.post("/earthing", {
      earthingNo: row.earthingNo,
      date: row.date,
      waterTopUp: row.waterTop,
      earthingCurrent: row.earthingCurrent,
      sign: "",
      remarks: row.remarks,
      connectedTo: row.connectedTo,
      location: activeUnit === 'unit3' ? 'Unit 3' : (row.location || ''), // AUTO-ADD "Unit 3" for Unit 3 entries
      uploadedFiles: uploadedUrls,
    });

    // Remove the submitted row from table
    setTableData(prev => prev.filter(tableRow => tableRow.id !== row.id));
    
    // Also remove from selectedEarthings
    setSelectedEarthings(prev => prev.filter(earthing => earthing !== row.earthingNo));

    Swal.fire("Success!", `Earthing ${row.earthingNo} entry saved successfully`, "success");
    
    // Refresh logs if needed
    fetchLogs(getCurrentPagination().page, filterDate);

  } catch (err) {
    console.error("Error saving data:", err);
    Swal.fire("Error", `Error saving ${row.earthingNo} entry`, "error");
  } finally {
    setLoading(false);
  }
};

// Enhanced add new row function with images in modal
const addNewRow = async () => {
  const earthings = activeUnit === 'unit1' ? unit1Earthings : unit3Earthings;
  const usedEarthings = tableData.map(row => row.earthingNo);
  const availableEarthings = earthings.filter(earthing => !usedEarthings.includes(earthing));
  
  if (availableEarthings.length === 0) {
    Swal.fire({
      title: 'No Earthings Available',
      text: `All ${activeUnit === 'unit1' ? '18' : '3'} earthings for ${activeUnit === 'unit1' ? 'Unit 1' : 'Unit 3'} are already in the table.`,
      icon: 'info',
      confirmButtonText: 'OK'
    });
    return;
  }

  // Create custom modal with images
  const { value: selectedEarthing } = await Swal.fire({
    title: `<strong>Select Earthing for ${activeUnit === 'unit1' ? 'Unit 1' : 'Unit 3'}</strong>`,
    html: `
      <div class="text-left mb-4">
        <p class="text-gray-600 mb-3">Choose which earthing to add:</p>
        <div class="grid grid-cols-3 gap-2 max-h-60 overflow-y-auto">
          ${availableEarthings.map(earthing => `
            <label class="cursor-pointer border rounded-lg p-2 hover:bg-blue-50 transition-colors earthing-option">
              <input type="radio" name="earthing" value="${earthing}" class="hidden peer">
              <div class="text-center peer-checked:bg-blue-100 peer-checked:border-blue-300 rounded p-1">
                <img src="${earthingImages[activeUnit][earthing]}" 
                     alt="${earthing}" 
                     class="w-12 h-12 object-cover mx-auto rounded mb-1"
                     onerror="this.style.display='none'; this.nextElementSibling.style.display='flex';">
                <div class="hidden w-12 h-12 bg-gray-200 rounded items-center justify-center text-gray-500 text-xs mx-auto mb-1">
                  ${earthing}
                </div>
                <div class="text-sm font-medium">${earthing}</div>
              </div>
            </label>
          `).join('')}
        </div>
      </div>
    `,
    showCancelButton: true,
    confirmButtonText: 'Add Earthing',
    cancelButtonText: 'Cancel',
    width: '600px',
    didOpen: () => {
      // Add click handlers for the custom radio buttons
      const options = document.querySelectorAll('.earthing-option');
      options.forEach(option => {
        option.addEventListener('click', () => {
          // Remove previous selection
          options.forEach(opt => {
            opt.querySelector('input').checked = false;
            opt.querySelector('div').classList.remove('bg-blue-100', 'border-blue-300');
          });
          // Select current
          option.querySelector('input').checked = true;
          option.querySelector('div').classList.add('bg-blue-100', 'border-blue-300');
        });
      });
    },
    preConfirm: () => {
      const selected = document.querySelector('input[name="earthing"]:checked');
      if (!selected) {
        Swal.showValidationMessage('Please select an earthing');
        return false;
      }
      return selected.value;
    }
  });

  if (selectedEarthing) {
const newRow = {
  id: Math.random().toString(36).substr(2, 9),
  earthingNo: selectedEarthing,
  date: getTodayDate(),
  connectedTo: connectedToData[activeUnit][selectedEarthing] || "",
  location: activeUnit === 'unit3' ? 'Unit 3' : '', // AUTO-SET LOCATION FOR UNIT 3
  waterTop: "No",
  earthingCurrent: "",
  remarks: "",
  files: []
};

    setTableData(prev => [...prev, newRow]);
    
    if (!selectedEarthings.includes(selectedEarthing)) {
      setSelectedEarthings(prev => [...prev, selectedEarthing]);
    }

    // Auto-scroll to the new row
    setTimeout(() => {
      const newRowElement = document.getElementById(`row-${newRow.id}`);
      if (newRowElement) {
        newRowElement.scrollIntoView({ 
          behavior: 'smooth', 
          block: 'center' 
        });
        
        newRowElement.classList.add('bg-blue-50', 'border-2', 'border-blue-200');
        setTimeout(() => {
          newRowElement.classList.remove('bg-blue-50', 'border-2', 'border-blue-200');
        }, 3000);
      }
    }, 100);

    Swal.fire({
      title: 'Earthing Added!',
      text: `${selectedEarthing} has been added to the table.`,
      icon: 'success',
      timer: 2000,
      showConfirmButton: false
    });
  }
};

// Add connected to data for both units
const connectedToData = {
  unit1: {
    E1: 'secondary silo',
    E2: 'primary silos',
    E3: 'scrap silo & pre-expander-1',
    E4: 'boiler to pump section',
    E5: 'block machine',
    E6: 'pre-expander 2',
    E7: '120 HP compressor',
    E8: '30 HP compressor',
    E9: '60 HP compressor',
    E10: '',
    E11: '30 HP compressor',
    E12: '',
    E13: 'solar panel 1',
    E14: 'solar panel 2',
    E15: 'servo TP unit 1',
    E16: 'generators',
    E17: 'solar panel box',
    E18: 'solar panel box'
  },
  unit3: {
    E1: '',
    E2: '',
    E3: ''
  }
};

return (
  <div className="min-h-screen bg-slate-100">
    <InternalNavbar />
    <div className="max-w-7xl mx-auto p-6">
      <h1 className="text-3xl font-bold text-center text-yellow-700 mb-8">
        Earthing Maintenance System
      </h1>

      {/* Unit Tabs */}
      <div className="bg-white shadow-lg rounded-lg p-6 mb-8">
        <h2 className="text-2xl font-bold text-center mb-6">Earthing Maintenance System</h2>
        <div className="flex justify-center gap-4">
          <button
            onClick={() => setActiveUnit('unit1')}
            className={`px-8 py-3 rounded-lg transition text-lg font-semibold ${
              activeUnit === 'unit1' 
                ? 'bg-blue-600 text-white shadow-lg' 
                : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
            }`}
          >
            Unit 1
          </button>
          <button
            onClick={() => setActiveUnit('unit3')}
            className={`px-8 py-3 rounded-lg transition text-lg font-semibold ${
              activeUnit === 'unit3' 
                ? 'bg-green-600 text-white shadow-lg' 
                : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
            }`}
          >
            Unit 3
          </button>
        </div>
      </div>

      {/* Main Earthing Maintenance Form */}
      <div className="bg-white shadow-lg rounded-lg p-6 mb-8">
       

        {/* Layout Diagrams */}
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
                />
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
                  />
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
                  />
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Earthings Selection - Bulk Generation */}
        <div className="mb-6">
          <div className="flex justify-between items-center mb-3">
            <h3 className="text-lg font-semibold">Bulk Generation</h3>
            <button
              onClick={() => setShowBulkGeneration(!showBulkGeneration)}
              className="bg-gray-500 text-white px-4 py-2 rounded hover:bg-gray-600 transition text-sm"
            >
              {showBulkGeneration ? 'Hide' : 'Show'} Bulk Selection
            </button>
          </div>
          
          {showBulkGeneration && (
            <div className="border rounded-lg p-4 bg-gray-50">
              <h4 className="text-md font-semibold mb-3">Select Earthings for Bulk Generation</h4>
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-2">
                {(activeUnit === 'unit1' ? unit1Earthings : unit3Earthings).map((earthing) => (
                  <label key={earthing} className="flex items-center space-x-2 p-2 border rounded hover:bg-gray-50 bg-white">
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
              <div className="mt-3 flex justify-between items-center">
                <div className="text-sm text-gray-600">
                  Selected: {selectedEarthings.length} earthings
                  {selectedEarthings.length > 0 && ` (${selectedEarthings.join(', ')})`}
                </div>
                <button
                  onClick={generateTable}
                  disabled={selectedEarthings.length === 0}
                  className="bg-yellow-600 text-white px-4 py-2 rounded hover:bg-yellow-700 transition disabled:opacity-50 disabled:cursor-not-allowed text-sm"
                >
                  Generate Selected ({selectedEarthings.length})
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Main Table - Shows both saved data and new entries */}
        <div className="mt-6">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-semibold">
              Earthing Maintenance Data - {activeUnit === 'unit1' ? 'Unit 1' : 'Unit 3'}
           
            </h3>
            <div className="flex gap-2">
              <button
                onClick={submitAllData}
                disabled={loading || tableData.length === 0}
                className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700 transition disabled:opacity-50 text-sm"
              >
                {loading ? "Saving All..." : `Save All New (${tableData.length})`}
              </button>
            </div>
          </div>

          {/* Earthing Picture Plates - Show when new rows exist */}
          {tableData.length > 0 && (
            <div className="mb-6">
              <h4 className="text-md font-semibold mb-3 text-center">
                New Earthing Plates - {activeUnit === 'unit1' ? 'Unit 1' : 'Unit 3'} ({tableData.length})
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
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
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
          )}
 <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold">
            {activeUnit === 'unit1' ? 'Unit 1' : 'Unit 3'} - Earthing Maintenance
          </h2>
          <div className="flex gap-3">
            <button
              onClick={addNewRow}
              className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 transition flex items-center gap-2"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              Add New Row
            </button>
          </div>
        </div>
          {/* Main Combined Table */}
          <div className="overflow-x-auto">
            <table className="min-w-full border border-slate-300 text-sm">
              <thead className="bg-yellow-600 text-white">
                <tr>
                  <th className="border px-3 py-2">Status</th>
                  <th className="border px-3 py-2">Earthing No</th>
                  <th className="border px-3 py-2">Date</th>
                  <th className="border px-3 py-2">Connected To/Location</th>
                  <th className="border px-3 py-2">Water Top</th>
                  <th className="border px-3 py-2">Earthing Current</th>
                  <th className="border px-3 py-2">Photo of Water Top Up and Location</th>
                  <th className="border px-3 py-2">Remarks</th>
                      <th className="border px-3 py-2">Data Entered By</th> {/* ADD THIS COLUMN */}
                  <th className="border px-3 py-2">Actions</th>
                </tr>
              </thead>
              <tbody>
                {/* Show empty state when no data */}
           {tableData.length === 0 && filteredLogs.length === 0 ? (
  <tr>
    <td colSpan="11" className="border px-3 py-8 text-center text-gray-500">
      No earthing data found. Add new earthings using the "Add New Row" button above.
    </td>
  </tr>
) : (
                  <>
                  {/* Saved Data (from database) */}
{/* Saved Data (from database) - SMART FILTERING */}
{filteredLogs
  .filter(entry => {
    // This is now handled by the backend, but keep as fallback
    return true;
  })
  .map((entry) => {
    const isEditing = editingId === entry._id;
    
    return (
      <tr key={entry._id} className="hover:bg-gray-50 transition-colors bg-green-50">
        <td className="border px-3 py-2 text-center">
          <span className="bg-green-100 text-green-800 text-xs px-2 py-1 rounded-full font-medium">
            {isEditing ? 'Editing' : 'Saved'}
          </span>
        </td>
        <td className="border px-3 py-2 font-semibold">
          <div className="flex items-center gap-2">
            <div 
              className="cursor-pointer hover:opacity-80 transition-opacity transform hover:scale-110 duration-200"
              onClick={() => openEarthingImageModal(earthingImages[activeUnit][entry.earthingNo], entry.earthingNo)}
              title={`View ${entry.earthingNo} plate`}
            >
              <img 
                src={earthingImages[activeUnit][entry.earthingNo]}
                alt={`${entry.earthingNo} Icon`}
                className="w-8 h-8 object-cover rounded border"
                onError={(e) => {
                  e.target.style.display = 'none';
                  e.target.nextSibling.style.display = 'block';
                }}
              />
              <div className="hidden w-8 h-8 bg-gray-300 rounded text-xs flex items-center justify-center border">
                {entry.earthingNo}
              </div>
            </div>
            <span className="text-gray-800">{entry.earthingNo}</span>
          </div>
        </td>
<td className="border px-3 py-2">
  {isEditing ? (
    <input
      type="date"
      value={convertToYYYYMMDD(editForm.date || entry.date)}
      onChange={(e) => {
        const selectedDate = convertToDDMMYYYY(e.target.value);
        if (isValidDate(selectedDate)) {
          setEditForm({ ...editForm, date: selectedDate });
        } else {
          Swal.fire('Invalid Date', 'Please select a date that is not in the future.', 'warning');
        }
      }}
      max={new Date().toISOString().split('T')[0]}
      className="w-full border rounded p-1 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
    />
  ) : (
    entry.date
  )}
</td>        
      {/* Connected To - Editable when editing */}
<td className="border px-3 py-2">
  {isEditing ? (
    <input
      type="text"
      value={editForm.connectedTo || ''}
      onChange={(e) => setEditForm({ ...editForm, connectedTo: e.target.value })}
      className="w-full border rounded p-1 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
      placeholder="Connected to..."
    />
  ) : (
    entry.connectedTo || connectedToData[activeUnit][entry.earthingNo] || '-'
  )}
</td>
        
        {/* Location - Editable when editing */}
        {/* <td className="border px-3 py-2">
          {isEditing ? (
        <input
  type="text"
  value={editForm.location || ''}
  onChange={(e) => setEditForm({ ...editForm, location: e.target.value })}
  className="w-full border rounded p-1 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
  placeholder="Enter location..."
/>
          ) : (
            entry.location || '-'
          )}
        </td> */}
        
        {/* Water Top - Editable when editing */}
        <td className="border px-3 py-2">
          {isEditing ? (
            <select
              value={editForm.waterTopUp}
              onChange={(e) => setEditForm({ ...editForm, waterTopUp: e.target.value })}
              className="w-full border rounded p-1 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="No">No</option>
              <option value="Yes">Yes</option>
            </select>
          ) : (
            entry.waterTopUp
          )}
        </td>
        
        {/* Earthing Current - Editable when editing */}
        <td className="border px-3 py-2">
          {isEditing ? (
            <input
              type="text"
              value={editForm.earthingCurrent}
              onChange={(e) => setEditForm({ ...editForm, earthingCurrent: e.target.value })}
              className="w-full border rounded p-1 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              placeholder="Current status..."
            />
          ) : (
            entry.earthingCurrent || '-'
          )}
        </td>
        
        {/* Files - Editable when editing */}
        <td className="border px-3 py-2">
          {isEditing ? (
            <div className="space-y-2">
              {/* Existing files with delete option */}
              <div className="flex flex-wrap gap-1 justify-center">
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
              </div>
              
              {/* Add new files */}
              <div className="text-center">
                <label className="cursor-pointer bg-gray-100 hover:bg-gray-200 rounded p-2 text-xs transition inline-block">
                  📁 Add Files
                  <input
                    type="file"
                    multiple
                    accept="image/*,.pdf"
                    onChange={handleEditFilesChange}
                    className="hidden"
                  />
                </label>
                {editFiles.length > 0 && (
                  <div className="text-xs text-gray-500 mt-1">
                    {editFiles.length} new file(s) selected
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div className="flex flex-wrap gap-1 justify-center">
              {entry.uploadedFiles?.map((url, i) => (
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
              {(!entry.uploadedFiles || entry.uploadedFiles.length === 0) && (
                <span className="text-gray-400 text-sm">No files</span>
              )}
            </div>
          )}
        </td>
        
        {/* Remarks - Editable when editing */}
        <td className="border px-3 py-2">
          {isEditing ? (
            <textarea
              value={editForm.remarks}
              onChange={(e) => setEditForm({ ...editForm, remarks: e.target.value })}
              className="w-full border rounded p-1 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              rows={2}
              placeholder="Remarks..."
            />
          ) : (
            entry.remarks || '-'
          )}
        </td>
         <td className="border px-3 py-2 text-center">
          {isEditing ? (
            <span className="text-sm text-gray-500 italic">Current User</span>
          ) : (
            <div className="text-xs text-gray-700">
              <div className="font-semibold">{entry.createdBy?.name || 'N/A'}</div>
              <div className="text-gray-500 truncate" title={entry.createdBy?.email}>
                {entry.createdBy?.email || 'No email'}
              </div>
            </div>
          )}
        </td>
        
        {/* Actions */}
        <td className="border px-3 py-2">
          <div className="flex flex-col gap-2">
            {isEditing ? (
              <>
                <button
                  onClick={() => saveEdit(entry._id)}
                  disabled={loading}
                  className="bg-green-600 text-white px-3 py-1 rounded hover:bg-green-700 transition-colors text-sm flex items-center gap-1 justify-center disabled:opacity-50"
                  title="Save changes"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  {loading ? "Saving..." : "Save"}
                </button>
                <button
                  onClick={cancelEdit}
                  className="bg-gray-500 text-white px-3 py-1 rounded hover:bg-gray-600 transition-colors text-sm flex items-center gap-1 justify-center"
                  title="Cancel editing"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                  Cancel
                </button>
              </>
            ) : (
              <button
                onClick={() => startEditing(entry)}
                className="bg-yellow-500 text-white px-3 py-1 rounded hover:bg-yellow-600 transition-colors text-sm flex items-center gap-1 justify-center"
                title="Edit this entry"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                </svg>
                Edit
              </button>
            )}
          </div>
        </td>
      </tr>
    );
  })}

                    {/* New Unsaved Data */}
                    {tableData.map((row, index) => (
                      <tr key={row.id} id={`row-${row.id}`} className="hover:bg-gray-50 transition-colors bg-blue-50">
                        <td className="border px-3 py-2 text-center">
                          <span className="bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded-full font-medium">
                            New
                          </span>
                        </td>
                        <td className="border px-3 py-2 font-semibold">
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
    type="date"
    value={convertToYYYYMMDD(row.date || getTodayDate())}
    onChange={(e) => {
      const selectedDate = convertToDDMMYYYY(e.target.value);
      if (isValidDate(selectedDate)) {
        handleTableInputChange(row.id, 'date', selectedDate);
      } else {
        Swal.fire('Invalid Date', 'Please select a date that is not in the future.', 'warning');
      }
    }}
    max={new Date().toISOString().split('T')[0]}
    className="w-full border rounded p-1 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
  />
</td>
                      <td className="border px-3 py-2">
  <input
    type="text"
    value={row.connectedTo || connectedToData[activeUnit][row.earthingNo] || ""}
    onChange={(e) => handleTableInputChange(row.id, 'connectedTo', e.target.value)}
    className="w-full border rounded p-1 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
    placeholder="Connected to..."
  />
</td>
                        {/* <td className="border px-3 py-2">
                      <input
  type="text"
  value={row.location}
  onChange={(e) => handleTableInputChange(row.id, 'location', e.target.value)}
  className="w-full border rounded p-1 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
  placeholder="Enter location..."
/>
                        </td> */}
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
                            <td className="border px-3 py-2 text-center">
      <div className="text-xs text-gray-700">
        <div className="font-semibold">{user?.name || 'Current User'}</div>
        <div className="text-gray-500 truncate" title={user?.email}>
          {user?.email || 'Loading...'}
        </div>
      </div>
    </td>
                        <td className="border px-3 py-2">
                          <div className="flex flex-col gap-2">
                            <button
                              onClick={() => submitSingleRow(row)}
                              disabled={loading}
                              className="bg-green-600 text-white px-3 py-1 rounded hover:bg-green-700 transition-colors text-sm flex items-center gap-1 justify-center disabled:opacity-50"
                              title="Save this earthing data"
                            >
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                              </svg>
                              {loading ? "Saving..." : "Save"}
                            </button>
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
                  </>
                )}
              </tbody>
            </table>
            {/* Pagination Controls */}
{getCurrentPagination().totalPages > 1 && (
  <div className="flex justify-between items-center mt-4 px-4 py-3 bg-white border-t border-gray-200 rounded-b-lg">
    <div className="text-sm text-gray-700">
      Showing page {getCurrentPagination().page} of {getCurrentPagination().totalPages} 
      ({getCurrentPagination().totalRecords} total records)
    </div>
    
    <div className="flex items-center space-x-1">
      <button
        onClick={handleFirstPage}
        disabled={getCurrentPagination().page === 1}
        className="px-3 py-1 text-sm bg-gray-200 rounded hover:bg-gray-300 disabled:opacity-50 disabled:cursor-not-allowed"
      >
        First
      </button>
      
      <button
        onClick={handlePrevPage}
        disabled={getCurrentPagination().page === 1}
        className="px-3 py-1 text-sm bg-gray-200 rounded hover:bg-gray-300 disabled:opacity-50 disabled:cursor-not-allowed"
      >
        Previous
      </button>
      
      <span className="px-3 py-1 text-sm bg-blue-500 text-white rounded">
        {getCurrentPagination().page}
      </span>
      
      <button
        onClick={handleNextPage}
        disabled={getCurrentPagination().page === getCurrentPagination().totalPages}
        className="px-3 py-1 text-sm bg-gray-200 rounded hover:bg-gray-300 disabled:opacity-50 disabled:cursor-not-allowed"
      >
        Next
      </button>
      
      <button
        onClick={handleLastPage}
        disabled={getCurrentPagination().page === getCurrentPagination().totalPages}
        className="px-3 py-1 text-sm bg-gray-200 rounded hover:bg-gray-300 disabled:opacity-50 disabled:cursor-not-allowed"
      >
        Last
      </button>
    </div>
  </div>
)}
          </div>
        </div>
      </div>
    </div>
  </div>
);
}