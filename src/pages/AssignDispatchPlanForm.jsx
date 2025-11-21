import { useEffect, useState, useRef } from "react";
import RecordRTC from "recordrtc";
import Swal from "sweetalert2";
import InternalNavbar from "../components/InternalNavbar";
import axiosInstance from "../axiosInstance";
import { useUserContext } from "../context/UserContext";
import toast from "react-hot-toast";
import VehicleDocumentManager from "../components/VehicleDocumentManager";
import MaintenanceLogBook from "../components/MaintenanceLogBook";
import jsPDF from "jspdf"; // ✅ NEW: Import jsPDF

export default function AssignDispatchPlanForm() {
    const { user, loading, token } = useUserContext();

    // ✅ Add this helper function
  const parseUserRoles = (user) => {
    if (!user || !user.role) {
      return [];
    }
    
    // If role is already an array, return it directly
    if (Array.isArray(user.role)) {
      return user.role;
    }
    
    // If it's a string (legacy format), try to parse it
    if (typeof user.role === 'string') {
      try {
        return JSON.parse(user.role);
      } catch (parseError) {
        return [user.role];
      }
    }
    
    return [user.role];
  };

  // ✅ Parse user roles
  const userRoles = user ? parseUserRoles(user) : [];

  const [submitting, setSubmitting] = useState(false);
  const [showVehicles, setShowVehicles] = useState(false);
  const [attachments, setAttachments] = useState([]);
  const [audioBlob, setAudioBlob] = useState(null);
  const [uploadingPlanId, setUploadingPlanId] = useState(null);
  const [selectedVehicle, setSelectedVehicle] = useState(null);
  const docsRef = useRef(null);
  const [selectedMaintenanceVehicle, setSelectedMaintenanceVehicle] =
    useState(null);
  const [audioUrl, setAudioUrl] = useState(null);
  const [customerDetails, setCustomerDetails] = useState([]);
  const [recording, setRecording] = useState(false);
  const [tableLoading, setTableLoading] = useState(false);
  const [recorder, setRecorder] = useState(null);
  const [customerNames, setCustomerNames] = useState([""]);
  const [customerList, setCustomerList] = useState([]);
  const [dieselImagesMap, setDieselImagesMap] = useState({});
const [salesProducts, setSalesProducts] = useState([""]); // ✅ NEW: Sales products state
const [productsList, setProductsList] = useState([]); // ✅ NEW: Products list state

const [formData, setFormData] = useState({
  vehicleNumber: "",
  remarks: "",
  driverName: "",
    location: "", // ✅ NEW: Add location field
  dateOfTrip: (() => {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    return tomorrow.toISOString().split("T")[0];
  })(),
});

  const [registeredVehicles, setRegisteredVehicles] = useState([]);
  const [drivers, setDrivers] = useState([]);
  const [plans, setPlans] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterDate, setFilterDate] = useState("");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  const [newVehicle, setNewVehicle] = useState({
    vehicleNumber: "",
    driverEmail: "",
    driverName: "",
    phone: "",
    gpsLink: "",
  });

  // Fetch customer details
  useEffect(() => {
    const fetchCustomerDetails = async () => {
      try {
        const res = await axiosInstance.get("/customers/all/dropdown", {
          headers: { Authorization: `Bearer ${token}` },
        });
        setCustomerDetails(res.data);
      } catch (err) {
        console.error("❌ Failed to fetch customer details", err);
      }
    };

    if (token) fetchCustomerDetails();
  }, [token]);

  // Fetch registered vehicles
  const fetchRegisteredVehicles = async () => {
    try {
      const res = await axiosInstance.get("/vehicles/all", {
        headers: { Authorization: `Bearer ${token}` },
      });
      setRegisteredVehicles(res.data);
    } catch (err) {
      console.error("Failed to fetch registered vehicles:", err);
      toast.error("Failed to load vehicles");
    }
  };

  useEffect(() => {
    fetchRegisteredVehicles();
  }, []);

  useEffect(() => {
    if (selectedVehicle && docsRef.current) {
      docsRef.current.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  }, [selectedVehicle]);

  // Set driver vehicle for driver role
useEffect(() => {
  const userRoles = parseUserRoles(user);
  if (userRoles.includes("driver")) {
    const driverVehicle = registeredVehicles.find(
      (v) => v.driverEmail === user.email
    );
    if (driverVehicle) {
      setFormData((prev) => ({
        ...prev,
        vehicleNumber: driverVehicle.vehicleNumber,
        driverName: user.name || driverVehicle.driverName || "",
      }));
    }
  }
}, [user, registeredVehicles]);

  // Audio recording functions
  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const newRecorder = new RecordRTC(stream, {
        type: "audio",
        mimeType: "audio/wav",
        recorderType: RecordRTC.StereoAudioRecorder,
        numberOfAudioChannels: 1,
        desiredSampRate: 16000,
      });

      newRecorder.startRecording();
      setRecorder(newRecorder);
      setRecording(true);
      toast.success("Recording started...");
    } catch (err) {
      console.error("🎤 Microphone access denied:", err);
      toast.error("Microphone access denied. Please check permissions.");
    }
  };

  const stopRecording = () => {
    if (recorder) {
      recorder.stopRecording(() => {
        const blob = recorder.getBlob();
        setAudioBlob(blob);
        setAudioUrl(URL.createObjectURL(blob));
        setRecording(false);
        toast.success("Recording completed");
      });
    }
  };

  const clearAudio = () => {
    setAudioBlob(null);
    setAudioUrl(null);
    setRecording(false);
    toast.success("Audio cleared");
  };

  // Fetch customer list
  useEffect(() => {
    if (token) {
      axiosInstance
        .get("/customers/all/dropdown", {
          headers: { Authorization: `Bearer ${token}` },
        })
        .then((res) => setCustomerList(res.data))
        .catch((err) => console.error("Error fetching customers:", err));
    }
  }, [token]);

// Fetch dispatch plans with diesel entries, audio, and attachments
const fetchPlans = async () => {
  setTableLoading(true);
  try {
    const query = new URLSearchParams({
      page,
      search: searchTerm,
      date: filterDate,
    });

    // Fetch dispatch plans
    const res = await axiosInstance.get(
      `/dispatch-plans/paginated?${query}`,
      {
        headers: { Authorization: `Bearer ${token}` },
      }
    );

    // Process plans with vehicle data
    const processedPlans = res.data.plans.map((plan) => {
      const matchedVehicle = registeredVehicles.find(
        (v) => v.vehicleNumber === plan.vehicleNumber
      );

      // Ensure imageUrls is always an array and handle different formats
      let imageUrls = [];
      if (Array.isArray(plan.imageUrls)) {
        // If imageUrls contains objects with url property, extract the URLs
        imageUrls = plan.imageUrls.map(item => 
          typeof item === 'object' && item.url ? item.url : item
        );
      }
      
      // Combine all documents: images + attachments + audio
      const allDocuments = [
        ...imageUrls,
        ...(plan.attachmentUrls || [])
      ];
      
      // Add audio as a separate document if it exists
      if (plan.audioUrl) {
        allDocuments.push(plan.audioUrl);
      }

      return {
        ...plan,
        gpsLink: matchedVehicle?.gpsLink || null,
        imageUrls: allDocuments, // This now includes ALL documents
        hasAudio: !!plan.audioUrl,
      };
    });

    setPlans(processedPlans);
    setTotalPages(res.data.totalPages);
  } catch (err) {
    console.error("Error fetching plans:", err);
    toast.error("Failed to load dispatch plans");
  } finally {
    setTableLoading(false);
  }
};

  // Vehicle registration
  const handleVehicleRegister = async () => {
    if (!newVehicle.vehicleNumber || !newVehicle.driverEmail) {
      toast.error("Vehicle number and email are required");
      return;
    }

    try {
      await axiosInstance.post("/vehicles/register", newVehicle, {
        headers: { Authorization: `Bearer ${token}` },
      });
      toast.success("Vehicle registered successfully");
      setNewVehicle({
        vehicleNumber: "",
        driverEmail: "",
        driverName: "",
        phone: "",
        gpsLink: "",
      });
      fetchRegisteredVehicles();
    } catch (err) {
      toast.error(err.response?.data?.message || "Registration failed");
    }
  };

  // Fetch drivers
  useEffect(() => {
    if (!token) return;
    axiosInstance
      .get("/users/get-all-users", {
        headers: { Authorization: `Bearer ${token}` },
      })
      .then((res) => {
        setDrivers(res.data.filter((u) => u.role === "driver"));
      })
      .catch((err) => console.error("Failed to fetch drivers:", err));
  }, [token]);

  // Fetch plans when dependencies change
  useEffect(() => {
    if (token && registeredVehicles.length > 0) {
      fetchPlans();
    }
  }, [token, page, searchTerm, filterDate, registeredVehicles]);

  // Fetch products list
useEffect(() => {
  if (token) {
    axiosInstance
      .get("/products-multer/all-products", {
        headers: { Authorization: `Bearer ${token}` },
      })
      .then((res) => setProductsList(res.data))
      .catch((err) => console.error("Error fetching products:", err));
  }
}, [token]);

// Form submission for table format
const handleTableSubmit = async () => {
  const { vehicleNumber, driverName, remarks, dateOfTrip } = formData;

  if (!vehicleNumber || !driverName) {
    toast.error("Please select vehicle and driver name.");
    return;
  }

  if (customerNames.length === 0 || customerNames.some((name) => !name.trim())) {
    toast.error("Please enter valid customer name(s).");
    return;
  }

  setSubmitting(true);

  try {
    const payload = {
      vehicleNumber,
      driverName,
        location: formData.location, // ✅ NEW: Add location
      remarks,
      customerNames: customerNames.filter(name => name.trim()), // Remove empty customer names
        salesProducts: salesProducts.filter(product => product.trim()), // ✅ NEW: Add sales products
      dateOfTrip,
    };

    console.log("Submitting payload:", payload); // Debug log

    // Upload audio if exists
    if (audioBlob) {
      console.log("Uploading audio..."); // Debug log
      const audioForm = new FormData();
      audioForm.append("file", audioBlob, "recording.wav");
      audioForm.append("upload_preset", "todo_uploads");
      audioForm.append("cloud_name", "dcr8k5amk");

      const res = await fetch(
        "https://api.cloudinary.com/v1_1/dcr8k5amk/raw/upload",
        {
          method: "POST",
          body: audioForm,
        }
      );

      const data = await res.json();
      if (!res.ok)
        throw new Error(data.error?.message || "Audio upload failed");
      payload.audioUrl = data.secure_url;
      console.log("Audio uploaded:", data.secure_url); // Debug log
    }

    // Upload attachments if exist
    if (attachments.length > 0) {
      console.log("Uploading attachments:", attachments.length); // Debug log
      const uploadedFiles = [];
      for (let file of attachments) {
        const formData = new FormData();
        formData.append("file", file);
        formData.append("upload_preset", "todo_uploads");
        formData.append("cloud_name", "dcr8k5amk");

        const uploadUrl =
          file.type === "application/pdf"
            ? "https://api.cloudinary.com/v1_1/dcr8k5amk/raw/upload"
            : "https://api.cloudinary.com/v1_1/dcr8k5amk/image/upload";

        const res = await fetch(uploadUrl, {
          method: "POST",
          body: formData,
        });

        const data = await res.json();
        if (!res.ok)
          throw new Error(data.error?.message || "Attachment upload failed");
        uploadedFiles.push(data.secure_url);
      }
      payload.attachmentUrls = uploadedFiles;
      console.log("Attachments uploaded:", uploadedFiles); // Debug log
    }

    // Send final payload
    console.log("Sending final payload to API..."); // Debug log
    await axiosInstance.post("/dispatch-plans/assign", payload, {
      headers: { Authorization: `Bearer ${token}` },
    });

    toast.success("Dispatch plan assigned successfully");

    // Reset form
    setFormData({
      vehicleNumber: "",
        location: "", // ✅ NEW: Reset location
      driverName: "",
      remarks: "",
      dateOfTrip: (() => {
        const tomorrow = new Date();
        tomorrow.setDate(tomorrow.getDate() + 1);
        return tomorrow.toISOString().split("T")[0];
      })(),
    });
    setCustomerNames([""]);
    setSalesProducts([""]); // ✅ NEW: Reset sales products
    setAudioBlob(null);
    setAudioUrl(null);
    setAttachments([]);
    
    // Refresh the plans list
    fetchPlans();
  } catch (err) {
    console.error("🔥 ASSIGN ERROR:", err?.response?.data || err);
    toast.error(err.response?.data?.message || "Error assigning plan");
  } finally {
    setSubmitting(false);
  }
};

// Export formatted data as PDF
const exportFormattedPDF = () => {
  if (plans.length === 0) {
    toast.error("No data to export");
    return;
  }

  try {
    toast.loading("Generating PDF...", { id: "pdf-export" });
    
    const pdf = new jsPDF({
      orientation: 'landscape',
      unit: 'mm',
      format: 'a4'
    });

    // Add company header
    pdf.setFillColor(59, 130, 246); // Blue background
    pdf.rect(0, 0, 297, 20, 'F');
    
    pdf.setFontSize(16);
    pdf.setTextColor(255, 255, 255);
    pdf.text('Dispatch Plans Report', 148, 12, { align: 'center' });
    
    // Add generation date
    pdf.setFontSize(10);
    pdf.setTextColor(255, 255, 255);
    pdf.text(`Generated on: ${new Date().toLocaleDateString()} ${new Date().toLocaleTimeString()}`, 148, 18, { align: 'center' });

    // Table headers (Status column removed)
    const headers = ['Sr No', 'Date', 'Vehicle', 'Driver', 'Location', 'Customers', 'Sales Products/Material', 'Remarks'];
    const columnWidths = [15, 20, 30, 35, 35, 45, 45, 40]; // Adjusted widths for remaining columns
    
    let yPosition = 30;
    
    // Add table headers with background
    pdf.setFillColor(243, 244, 246); // Gray background
    pdf.rect(10, yPosition - 5, 277, 8, 'F');
    
    pdf.setFontSize(9);
    pdf.setTextColor(0, 0, 0);
    pdf.setFont(undefined, 'bold');
    
    let xPosition = 10;
    headers.forEach((header, index) => {
      pdf.text(header, xPosition + 2, yPosition);
      xPosition += columnWidths[index];
    });

    yPosition += 12; // Increased gap after headers

    // Add table rows
    pdf.setFont(undefined, 'normal');
    pdf.setFontSize(8);
    
    plans.forEach((plan, index) => {
      // Add new page if needed (with more buffer space)
      if (yPosition > 170) {
        pdf.addPage();
        yPosition = 20;
        
        // Add header on new page
        pdf.setFillColor(59, 130, 246);
        pdf.rect(0, 0, 297, 20, 'F');
        pdf.setFontSize(10);
        pdf.setTextColor(255, 255, 255);
        pdf.text('Dispatch Plans Report - Continued', 148, 12, { align: 'center' });
        
        yPosition = 30;
        
        // Add table headers again
        pdf.setFillColor(243, 244, 246);
        pdf.rect(10, yPosition - 5, 277, 8, 'F');
        pdf.setFontSize(9);
        pdf.setTextColor(0, 0, 0);
        pdf.setFont(undefined, 'bold');
        
        xPosition = 10;
        headers.forEach((header, idx) => {
          pdf.text(header, xPosition + 2, yPosition);
          xPosition += columnWidths[idx];
        });
        
        yPosition += 12; // Increased gap after headers on new page
        pdf.setFont(undefined, 'normal');
        pdf.setFontSize(8);
      }

      // Alternate row background for better readability (extended height)
      const rowBackgroundHeight = 8; // Base height for background
      if (index % 2 === 0) {
        pdf.setFillColor(249, 250, 251);
        pdf.rect(10, yPosition - 3, 277, rowBackgroundHeight, 'F');
      }

      // Process customers with bullet points
      const customersContent = Array.isArray(plan.customerNames) && plan.customerNames.length > 0 
        ? plan.customerNames.map((name, i) => `${i + 1}. ${name}`).join('\n')
        : "-";

      // Process products with bullet points
      const productsContent = Array.isArray(plan.salesProducts) && plan.salesProducts.length > 0 
        ? plan.salesProducts.map((product, i) => `${i + 1}. ${product}`).join('\n')
        : "-";

      // Row data without status column
      const rowData = [
        ((page - 1) * 10 + index + 1).toString(),
        plan.dateOfTrip ? new Date(plan.dateOfTrip).toLocaleDateString("en-GB") : "-",
        plan.vehicleNumber || "-",
        plan.driverName || plan.assignedTo?.name || "-",
        plan.location || "-",
        customersContent,
        productsContent,
        plan.remarks ? (plan.remarks.length > 30 ? plan.remarks.substring(0, 30) + '...' : plan.remarks) : "-" // Increased remarks length
      ];

      let xPosition = 10;
      let maxLinesInRow = 1;

      rowData.forEach((cell, cellIndex) => {
        const lines = pdf.splitTextToSize(cell, columnWidths[cellIndex] - 4);
        pdf.setTextColor(0, 0, 0);
        
        // Draw each line separately with better line spacing
        lines.forEach((line, lineIndex) => {
          pdf.text(line, xPosition + 2, yPosition + (lineIndex * 4));
        });
        
        // Track the maximum number of lines in this row
        if (lines.length > maxLinesInRow) {
          maxLinesInRow = lines.length;
        }
        
        xPosition += columnWidths[cellIndex];
      });

      // Calculate row height with minimum gap
      const rowHeight = Math.max(12, maxLinesInRow * 4);
      
      // Add row border for better separation
      pdf.setDrawColor(226, 232, 240); // Light gray border
      pdf.setLineWidth(0.2);
      pdf.rect(10, yPosition - 3, 277, rowHeight + 2); // Border around the row
      
      // Move to next row with proper gap
      yPosition += rowHeight + 4; // Added 4mm gap between rows
    });

    // Add footer with page numbers (moved up to accommodate more content)
    const pageCount = pdf.internal.getNumberOfPages();
    for (let i = 1; i <= pageCount; i++) {
      pdf.setPage(i);
      pdf.setFontSize(8);
      pdf.setTextColor(128, 128, 128);
      pdf.text(`Page ${i} of ${pageCount}`, 280, 200, { align: 'right' });
      pdf.text(`Total Plans: ${plans.length}`, 15, 200);
    }

    pdf.save(`dispatch-plans-${new Date().toISOString().split('T')[0]}.pdf`);
    toast.success("PDF exported successfully!", { id: "pdf-export" });
  } catch (error) {
    console.error("Error generating formatted PDF:", error);
    toast.error("Failed to export PDF", { id: "pdf-export" });
  }
};

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading your dashboard...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="text-red-500 text-6xl mb-4">🔒</div>
          <h2 className="text-2xl font-bold text-gray-800 mb-2">
            Access Denied
          </h2>
          <p className="text-gray-600">User not found. Please log in again.</p>
        </div>
      </div>
    );
  }

  // Delete dispatch plan
const handleDelete = async (planId) => {
  const result = await Swal.fire({
    title: 'Are you sure?',
    text: "You won't be able to revert this!",
    icon: 'warning',
    showCancelButton: true,
    confirmButtonColor: '#d33',
    cancelButtonColor: '#3085d6',
    confirmButtonText: 'Yes, delete it!'
  });

  if (result.isConfirmed) {
    try {
      await axiosInstance.delete(`/dispatch-plans/${planId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      toast.success('Dispatch plan deleted successfully');
      fetchPlans();
    } catch (err) {
      toast.error('Failed to delete dispatch plan');
      console.error('Delete error:', err);
    }
  }
};

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Loading Overlay */}
      {submitting && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 flex flex-col items-center shadow-2xl">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mb-4"></div>
            <p className="text-gray-700 font-medium">
              Assigning dispatch plan...
            </p>
          </div>
        </div>
      )}

      <InternalNavbar />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header Section */}
        <div className="mb-8 text-center">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Dispatch Management
          </h1>
          <p className="text-gray-600">
            Assign and manage vehicle dispatch plans efficiently
          </p>
        </div>

 {/* Combined Dispatch Plans Table - For all roles except driver */}
{!userRoles.includes("driver") && (
  <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
 <div className="p-6 border-b border-gray-200">
  <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
    <div>
  <h2 className="text-xl font-semibold text-gray-900 mb-1">
    Dispatch Plans Management
  </h2>
  <p className="text-gray-600 mb-2">Manage and assign dispatch plans in table format</p>
  <p className="text-sm text-blue-600 bg-blue-50 p-2 rounded border border-blue-200">
    💡 <strong>Tip:</strong> To get a specific date plan, just filter that date and click export
  </p>
</div>

    <div className="flex flex-col sm:flex-row gap-3 w-full lg:w-auto">
      {/* Export PDF Button - NEW */}
      <button
        onClick={exportFormattedPDF}
        disabled={plans.length === 0}
        className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors duration-200 flex items-center gap-2"
      >
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
        </svg>
        Export PDF
      </button>

      <div className="relative w-full sm:w-64">
        <input
          type="text"
          placeholder="Search by customer or driver..."
          value={searchTerm}
          onChange={(e) => {
            setPage(1);
            setSearchTerm(e.target.value);
          }}
          className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition duration-200"
        />
        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
          <svg
            className="h-5 w-5 text-gray-400"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
            />
          </svg>
        </div>
      </div>

      <input
        type="date"
        value={filterDate}
        onChange={(e) => {
          setPage(1);
          setFilterDate(e.target.value);
        }}
        className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition duration-200"
      />

      <button
        onClick={() => {
          setSearchTerm("");
          setFilterDate("");
          setPage(1);
        }}
        className="px-4 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600 transition-colors duration-200"
      >
        Clear Filters
      </button>
    </div>
  </div>
</div>

    {tableLoading ? (
      <div className="text-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
        <p className="text-gray-600">Loading dispatch plans...</p>
      </div>
    ) : (
      <div className="overflow-x-auto">
  <table className="min-w-full border border-gray-200">
    <thead className="bg-gray-50">
      <tr>
        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider border border-gray-200">
          Sr No
        </th>
        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider border border-gray-200">
          Date
        </th>
        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider border border-gray-200">
          Vehicle
        </th>
        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider border border-gray-200">
          Driver
        </th>
            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider border border-gray-200">
      Location {/* ✅ NEW: Location column */}
    </th>
        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider border border-gray-200">
          Customers
        </th>
        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider border border-gray-200">
          Sales Products / Material Name
        </th>
        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider border border-gray-200">
          Remarks
        </th>
        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider border border-gray-200">
          Status
        </th>
        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider border border-gray-200">
          Documents
        </th>
        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider border border-gray-200">
          Actions
        </th>
      </tr>
    </thead>
    <tbody className="bg-white">
      {/* Add New Plan Row */}
      {!userRoles.includes("dispatch") && !userRoles.includes("packaging") && (
        <tr className="bg-blue-50 hover:bg-blue-100 transition-colors duration-150">
          <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-500 border border-gray-200">
            New
          </td>
          <td className="px-4 py-4 whitespace-nowrap border border-gray-200">
            <input
              type="date"
              value={formData.dateOfTrip}
              onChange={(e) => setFormData(prev => ({ ...prev, dateOfTrip: e.target.value }))}
              className="w-full px-2 py-1 border border-gray-300 rounded text-sm focus:ring-1 focus:ring-blue-500"
              required
            />
          </td>
          <td className="px-4 py-4 whitespace-nowrap border border-gray-200">
            <select
              value={formData.vehicleNumber}
              onChange={(e) => setFormData(prev => ({ ...prev, vehicleNumber: e.target.value }))}
              className="w-full px-2 py-1 border border-gray-300 rounded text-sm focus:ring-1 focus:ring-blue-500"
              disabled={user.role === "driver"}
              required
            >
              <option value="">Select Vehicle</option>
              {registeredVehicles
                .filter((v) => user.role === "driver" ? v.driverEmail === user.email : true)
                .map((v) => (
                  <option key={v._id} value={v.vehicleNumber}>
                    {v.vehicleNumber}
                  </option>
                ))}
            </select>
          </td>
          <td className="px-4 py-4 whitespace-nowrap border border-gray-200">
            <input
              type="text"
              value={formData.driverName}
              onChange={(e) => setFormData(prev => ({ ...prev, driverName: e.target.value }))}
              placeholder="Driver name"
              className="w-full px-2 py-1 border border-gray-300 rounded text-sm focus:ring-1 focus:ring-blue-500"
              required
            />
          </td>
           <td className="px-4 py-4 whitespace-nowrap border border-gray-200">
      <input
        type="text"
        value={formData.location}
        onChange={(e) => setFormData(prev => ({ ...prev, location: e.target.value }))}
        placeholder="Location"
        className="w-full px-2 py-1 border border-gray-300 rounded text-sm focus:ring-1 focus:ring-blue-500"
      />
    </td>
          <td className="px-4 py-4 border border-gray-200">
            <div className="space-y-1 min-w-[200px]">
              {/* Add customer count badge */}
              {customerNames.filter(name => name.trim()).length > 0 && (
                <div className="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded inline-flex items-center gap-1">
                  <span>👥 {customerNames.filter(name => name.trim()).length} customer(s)</span>
                </div>
              )}
              
              {customerNames.map((name, index) => (
                <div key={index} className="flex gap-1">
                  <input
                    type="text"
                    placeholder="Customer name"
                    value={name}
                    onChange={(e) => {
                      const updated = [...customerNames];
                      updated[index] = e.target.value;
                      setCustomerNames(updated);
                    }}
                    list={`customer-options-${index}`}
                    className="flex-1 px-2 py-1 border border-gray-300 rounded text-sm focus:ring-1 focus:ring-blue-500"
                  />
                  <datalist id={`customer-options-${index}`}>
                    {customerList
                      .filter((c) => c.name.toLowerCase().includes(name.toLowerCase()))
                      .map((c) => (
                        <option key={c._id} value={c.name} />
                      ))}
                  </datalist>
                  {index > 0 && (
                    <button
                      type="button"
                      onClick={() => {
                        const updated = [...customerNames];
                        updated.splice(index, 1);
                        setCustomerNames(updated);
                      }}
                      className="px-2 py-1 bg-red-500 text-white rounded text-xs hover:bg-red-600"
                    >
                      ×
                    </button>
                  )}
                </div>
              ))}
              <button
                type="button"
                onClick={() => setCustomerNames([...customerNames, ""])}
                className="text-xs text-blue-600 hover:text-blue-700 flex items-center gap-1"
              >
                <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
                Add Customer
              </button>
            </div>
          </td>
          <td className="px-4 py-4 border border-gray-200">
            <div className="space-y-1 min-w-[200px]">
              {/* Add product count badge */}
              {salesProducts.filter(product => product.trim()).length > 0 && (
                <div className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded inline-flex items-center gap-1">
                  <span>📦 {salesProducts.filter(product => product.trim()).length} product(s)</span>
                </div>
              )}
              
              {salesProducts.map((product, index) => (
                <div key={index} className="flex gap-1">
                  <input
                    type="text"
                    placeholder="Sales product"
                    value={product}
                    onChange={(e) => {
                      const updated = [...salesProducts];
                      updated[index] = e.target.value;
                      setSalesProducts(updated);
                    }}
                    list={`product-options-${index}`}
                    className="flex-1 px-2 py-1 border border-gray-300 rounded text-sm focus:ring-1 focus:ring-blue-500"
                  />
                  <datalist id={`product-options-${index}`}>
                    {productsList
                      .filter((p) => p.name?.toLowerCase().includes(product.toLowerCase()))
                      .map((p) => (
                        <option key={p._id} value={p.name} />
                      ))}
                  </datalist>
                  {index > 0 && (
                    <button
                      type="button"
                      onClick={() => {
                        const updated = [...salesProducts];
                        updated.splice(index, 1);
                        setSalesProducts(updated);
                      }}
                      className="px-2 py-1 bg-red-500 text-white rounded text-xs hover:bg-red-600"
                    >
                      ×
                    </button>
                  )}
                </div>
              ))}
              <button
                type="button"
                onClick={() => setSalesProducts([...salesProducts, ""])}
                className="text-xs text-green-600 hover:text-green-700 flex items-center gap-1"
              >
                <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
                Add Product
              </button>
            </div>
          </td>
          <td className="px-4 py-4 border border-gray-200">
            <input
              type="text"
              value={formData.remarks}
              onChange={(e) => setFormData(prev => ({ ...prev, remarks: e.target.value }))}
              placeholder="Remarks"
              className="w-full px-2 py-1 border border-gray-300 rounded text-sm focus:ring-1 focus:ring-blue-500"
            />
          </td>
          <td className="px-4 py-4 whitespace-nowrap border border-gray-200">
            <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-gray-100 text-gray-800">
              New
            </span>
          </td>
         <td className="px-4 py-4 border border-gray-200">
  <div className="flex flex-col gap-2">
    {/* Audio Recording */}
    <div className="flex items-center gap-2">
      {audioUrl ? (
        <div className="flex items-center gap-1">
          <span className="text-xs text-green-600 flex items-center gap-1">
            <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
            </svg>
            Audio Ready
          </span>
          <button
            type="button"
            onClick={clearAudio}
            className="text-red-500 hover:text-red-700 text-xs"
            title="Remove audio"
          >
            ×
          </button>
        </div>
      ) : recording ? (
        <button
          type="button"
          onClick={stopRecording}
          className="text-red-500 hover:text-red-700 text-xs flex items-center gap-1 p-1 border border-red-200 rounded"
        >
          <span className="w-2 h-2 bg-red-500 rounded-full animate-pulse"></span>
          Stop
        </button>
      ) : (
        <button
          type="button"
          onClick={startRecording}
          className="text-blue-500 hover:text-blue-700 text-xs flex items-center gap-1 p-1 border border-blue-200 rounded"
          title="Record audio message"
        >
          <span className="w-2 h-2 bg-blue-500 rounded-full"></span>
          Record
        </button>
      )}
    </div>

    {/* File Attachments */}
    <div className="flex flex-col gap-1">
      <input
        type="file"
        multiple
        accept="image/*,.pdf"
        onChange={(e) => {
          const files = Array.from(e.target.files);
          if (files.length > 0) {
            setAttachments(prev => [...prev, ...files]);
          }
          e.target.value = '';
        }}
        className="hidden"
        id="file-input"
      />
      <label
        htmlFor="file-input"
        className="text-blue-500 hover:text-blue-700 text-xs cursor-pointer flex items-center gap-1 p-1 border border-blue-200 rounded w-fit"
      >
        📎 Attach Files
      </label>
      
      {/* Show attached files preview */}
      {attachments.length > 0 && (
        <div className="text-xs text-gray-600">
          <div className="font-medium mb-1">Files ({attachments.length}):</div>
          {attachments.map((file, index) => (
            <div key={index} className="flex items-center gap-1 mb-1">
              <span className="truncate max-w-[80px]" title={file.name}>
                {file.type.startsWith('image/') ? '🖼️' : '📄'} {file.name}
              </span>
              <button
                type="button"
                onClick={() => {
                  const updated = [...attachments];
                  updated.splice(index, 1);
                  setAttachments(updated);
                }}
                className="text-red-500 hover:text-red-700 text-xs"
              >
                ×
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  </div>
</td>
          <td className="px-4 py-4 whitespace-nowrap border border-gray-200">
            <button
              onClick={handleTableSubmit}
              disabled={submitting}
              className="bg-blue-600 text-white px-4 py-2 rounded-lg font-medium hover:bg-blue-700 disabled:bg-gray-400 transition-colors duration-200 flex items-center gap-2 text-sm"
            >
              {submitting ? (
                <>
                  <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-white"></div>
                  Adding...
                </>
              ) : (
                <>
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                  </svg>
                  Add Plan
                </>
              )}
            </button>
          </td>
        </tr>
      )}

      {/* Existing Plans */}
      {plans.map((plan, index) => (
        <tr key={plan._id} className="hover:bg-gray-50 transition-colors duration-150">
          <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-900 border border-gray-200">
            {(page - 1) * 10 + index + 1}
          </td>
          <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-900 border border-gray-200">
            {plan.dateOfTrip ? new Date(plan.dateOfTrip).toLocaleDateString("en-GB") : "—"}
          </td>
          <td className="px-4 py-4 whitespace-nowrap text-sm font-medium text-gray-900 border border-gray-200">
            <div className="flex items-center gap-2">
              {plan.vehicleNumber}
              {plan.gpsLink && (
                <a
                  href={plan.gpsLink}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-blue-600 hover:text-blue-700"
                  title="Track Vehicle"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                </a>
              )}
            </div>
          </td>
          <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-900 border border-gray-200">
            {plan.driverName || plan.assignedTo?.name || "-"}
          </td>
            <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-900 border border-gray-200">
      {plan.location || "-"}
    </td>
          <td className="px-4 py-4 text-sm text-gray-900 max-w-xs border border-gray-200">
            {Array.isArray(plan.customerNames) && plan.customerNames.length > 0 ? (
              <div className="space-y-1">
                {plan.customerNames.map((name, i) => (
                  <div key={i} className={`text-xs px-2 py-1 rounded ${
                    plan.customerNames.length > 1 
                      ? 'bg-blue-50 border border-blue-200 text-blue-700' 
                      : 'bg-gray-50 text-gray-700'
                  }`}>
                    <span className="font-medium">{name}</span>
                   
                  </div>
                ))}
                {plan.customerNames.length > 1 && (
                  <div className="text-xs text-blue-600 font-medium mt-1">
                    📋 {plan.customerNames.length} customers selected
                  </div>
                )}
              </div>
            ) : (
              <span className="text-gray-400">-</span>
            )}
          </td>
          <td className="px-4 py-4 text-sm text-gray-900 max-w-xs border border-gray-200">
            {Array.isArray(plan.salesProducts) && plan.salesProducts.length > 0 ? (
              <div className="space-y-1">
                {plan.salesProducts.map((product, i) => (
                  <div key={i} className={`text-xs px-2 py-1 rounded ${
                    plan.salesProducts.length > 1 
                      ? 'bg-green-50 border border-green-200 text-green-700' 
                      : 'bg-gray-50 text-gray-700'
                  }`}>
                    <span className="font-medium">{product}</span>
                   
                  </div>
                ))}
                {plan.salesProducts.length > 1 && (
                  <div className="text-xs text-green-600 font-medium mt-1">
                    🏷️ {plan.salesProducts.length} products selected
                  </div>
                )}
              </div>
            ) : (
              <span className="text-gray-400">-</span>
            )}
          </td>
          <td className="px-4 py-4 text-sm text-gray-900 border border-gray-200">
            {plan.remarks || "-"}
          </td>
          <td className="px-4 py-4 whitespace-nowrap border border-gray-200">
            <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
              plan.status === "Completed" ? "bg-green-100 text-green-800" : "bg-yellow-100 text-yellow-800"
            }`}>
              {plan.status || "Pending"}
            </span>
          </td>
         <td className="px-4 py-4 border border-gray-200">
  <div className="flex gap-1 flex-wrap">
    {(plan.imageUrls || []).map((url, i) => {
      // Check file type
      const isAudio = url.includes('audio') || url === plan.audioUrl || url.endsWith('.wav') || url.endsWith('.mp3');
      const isPDF = url.includes('.pdf') || url.includes('/raw/upload') || url.endsWith('.pdf');
      
      return (
        <button
          key={i}
          onClick={() => {
            if (isAudio) {
              // Show audio player for audio files
              Swal.fire({
                title: 'Audio Recording',
                html: `
                  <audio controls autoplay style="width: 100%; margin: 10px 0;">
                    <source src="${url}" type="audio/wav">
                    Your browser does not support the audio element.
                  </audio>
                `,
                showCloseButton: true,
                showConfirmButton: false,
                width: "80%",
                background: "#f9fafb",
                customClass: { popup: "rounded-xl" },
              });
            } else if (isPDF) {
              // Open PDF in new tab
              window.open(url, '_blank');
            } else {
              // Show image for image files
              Swal.fire({
                imageUrl: url,
                imageAlt: `Document ${i + 1}`,
                showCloseButton: true,
                showConfirmButton: false,
                width: "90%",
                background: "#f9fafb",
                customClass: { popup: "rounded-xl" },
              });
            }
          }}
          className={`inline-flex items-center gap-1 px-2 py-1 text-xs rounded-lg hover:opacity-80 transition-colors duration-200 border ${
            isAudio 
              ? 'bg-green-50 text-green-700 border-green-200' 
              : isPDF
              ? 'bg-orange-50 text-orange-700 border-orange-200'
              : 'bg-blue-50 text-blue-700 border-blue-200'
          }`}
          title={isAudio ? 'Play Audio' : isPDF ? 'Open PDF' : 'View Image'}
        >
          {isAudio ? (
            <>
              <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.536 8.464a5 5 0 010 7.072m2.828-9.9a9 9 0 010 12.728M5.586 15.536a5 5 0 001.414 1.414m-2.828-9.9a9 9 0 012.728-2.728" />
              </svg>
              Audio
            </>
          ) : isPDF ? (
            <>
              <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              PDF
            </>
          ) : (
            <>
              <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
              </svg>
              Image
            </>
          )}
        </button>
      );
    })}
    
    {/* Show message if no documents */}
    {(plan.imageUrls || []).length === 0 && (
      <span className="text-xs text-gray-400">No documents</span>
    )}
  </div>
</td>
          <td className="px-4 py-4 whitespace-nowrap border border-gray-200">
            <button
              onClick={() => handleDelete(plan._id)}
              className="text-red-600 hover:text-red-800 text-sm flex items-center gap-1"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
              </svg>
              Delete
            </button>
          </td>
        </tr>
      ))}
    </tbody>
  </table>
</div>
    )}

    {/* Show empty state when no plans exist */}
    {plans.length === 0 && !tableLoading && (
      <div className="text-center py-12">
        <div className="text-gray-400 text-6xl mb-4">📋</div>
        <h3 className="text-lg font-semibold text-gray-600 mb-2">
          {searchTerm || filterDate ? "No plans found" : "No dispatch plans yet"}
        </h3>
        <p className="text-gray-500">
          {searchTerm || filterDate ? "Try adjusting your search criteria" : "Start by adding your first dispatch plan above"}
        </p>
      </div>
    )}

    {/* Pagination */}
    {plans.length > 0 && (
      <div className="px-6 py-4 border-t border-gray-200 bg-gray-50">
        <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
          <div className="text-sm text-gray-600">
            Page {page} of {totalPages}
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => setPage((p) => p - 1)}
              disabled={page === 1}
              className="px-4 py-2 bg-white border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-200 flex items-center gap-2"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
              Previous
            </button>
            <button
              onClick={() => setPage((p) => p + 1)}
              disabled={page === totalPages}
              className="px-4 py-2 bg-white border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-200 flex items-center gap-2"
            >
              Next
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </button>
          </div>
        </div>
      </div>
    )}
  </div>
)}

        {/* Vehicle Management Section */}
        <div className="mt-8 space-y-6">
          {/* Register New Vehicle */}
           {!userRoles.includes("driver") && (
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <h3 className="text-xl font-semibold text-gray-900 mb-4 flex items-center gap-3">
                <svg
                  className="w-6 h-6 text-blue-600"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M8 14v3m4-3v3m4-3v3M3 21h18M3 10h18M3 7l9-4 9 4M4 10h16v11H4V10z"
                  />
                </svg>
                Register New Vehicle
              </h3>

              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
                <div className="flex items-start gap-3">
                  <div className="bg-blue-100 p-2 rounded-lg">
                    <svg
                      className="w-5 h-5 text-blue-600"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                      />
                    </svg>
                  </div>
                  <div>
                    <h4 className="font-medium text-blue-900 mb-1">
                      Format Example
                    </h4>
                    <p className="text-blue-800 text-sm">
                      <code className="bg-blue-100 px-2 py-1 rounded text-blue-700 font-mono">
                        PB08 EL 9364 : pb08el9364@thermopackers.com
                      </code>
                    </p>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Vehicle Number *
                  </label>
                  <input
                    type="text"
                    placeholder="e.g., PB08 EL 9364"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition duration-200"
                    value={newVehicle.vehicleNumber.toUpperCase()}
                    onChange={(e) =>
                      setNewVehicle((v) => ({
                        ...v,
                        vehicleNumber: e.target.value,
                      }))
                    }
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Vehicle Email *
                  </label>
                  <input
                    type="email"
                    placeholder="e.g., vehicle@company.com"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition duration-200"
                    value={newVehicle.driverEmail}
                    onChange={(e) =>
                      setNewVehicle((v) => ({
                        ...v,
                        driverEmail: e.target.value,
                      }))
                    }
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Driver Phone
                  </label>
                  <input
                    type="tel"
                    placeholder="e.g., 9876543210"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition duration-200"
                    value={newVehicle.phone}
                    onChange={(e) =>
                      setNewVehicle((v) => ({
                        ...v,
                        phone: e.target.value.replace(/\D/g, ""),
                      }))
                    }
                  />
                </div>

                <div className="md:col-span-2 lg:col-span-3">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    GPS Tracking Link
                  </label>
                  <input
                    type="url"
                    placeholder="https://gps-tracker.com/your-vehicle"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition duration-200"
                    value={newVehicle.gpsLink}
                    onChange={(e) =>
                      setNewVehicle((v) => ({ ...v, gpsLink: e.target.value }))
                    }
                  />
                </div>
              </div>

              <button
                className="bg-blue-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-blue-700 transition-colors duration-200 flex items-center gap-2"
                onClick={handleVehicleRegister}
              >
                <svg
                  className="w-5 h-5"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 4v16m8-8H4"
                  />
                </svg>
                Register Vehicle
              </button>
            </div>
          )}

          {/* Registered Vehicles Toggle */}
          <div className="text-center">
            <button
              onClick={() => setShowVehicles((prev) => !prev)}
              className="bg-blue-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-blue-700 transition-colors duration-200 flex items-center gap-2 mx-auto"
            >
              <svg
                className="w-5 h-5"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M19 9l-7 7-7-7"
                />
              </svg>
              {showVehicles
                ? "Hide Registered Vehicles"
                : "Show Registered Vehicles"}
            </button>
          </div>

          {/* Registered Vehicles List */}
          {showVehicles && (
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden transition-all duration-500">
              <div className="p-6 border-b border-gray-200">
                <h3 className="text-xl font-semibold text-gray-900 flex items-center gap-3">
                  <svg
                    className="w-6 h-6 text-green-600"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"
                    />
                  </svg>
                  Registered Vehicles ({registeredVehicles.length})
                </h3>
              </div>

              <div className="p-6">
                {registeredVehicles.length === 0 ? (
                  <div className="text-center py-8">
                    <div className="text-gray-400 text-6xl mb-4">🚗</div>
                    <h3 className="text-lg font-semibold text-gray-600 mb-2">
                      No vehicles registered yet
                    </h3>
                    <p className="text-gray-500">
                      Start by registering your first vehicle above
                    </p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {registeredVehicles.map((vehicle) => (
                      <div
                        key={vehicle._id}
                        className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow duration-200"
                      >
                        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                          <div className="flex items-start gap-4">
                            <div className="bg-blue-100 p-3 rounded-lg">
                              <svg
                                className="w-6 h-6 text-blue-600"
                                fill="none"
                                stroke="currentColor"
                                viewBox="0 0 24 24"
                              >
                                <path
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                  strokeWidth={2}
                                  d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"
                                />
                              </svg>
                            </div>
                            <div>
                              <h4 className="font-semibold text-gray-900 text-lg">
                                {vehicle.vehicleNumber}
                              </h4>
                              <p className="text-gray-600">
                                {vehicle.driverEmail}
                              </p>
                              <div className="flex flex-wrap gap-4 mt-2">
                                {vehicle.phone && (
                                  <span className="inline-flex items-center gap-1 text-sm text-gray-500">
                                    <svg
                                      className="w-4 h-4"
                                      fill="none"
                                      stroke="currentColor"
                                      viewBox="0 0 24 24"
                                    >
                                      <path
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                        strokeWidth={2}
                                        d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z"
                                      />
                                    </svg>
                                    {vehicle.phone}
                                  </span>
                                )}
                                {vehicle.gpsLink && (
                                  <a
                                    href={vehicle.gpsLink}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="inline-flex items-center gap-1 text-sm text-blue-600 hover:text-blue-700 transition-colors duration-200"
                                  >
                                    <svg
                                      className="w-4 h-4"
                                      fill="none"
                                      stroke="currentColor"
                                      viewBox="0 0 24 24"
                                    >
                                      <path
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                        strokeWidth={2}
                                        d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"
                                      />
                                      <path
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                        strokeWidth={2}
                                        d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"
                                      />
                                    </svg>
                                    Track Vehicle
                                  </a>
                                )}
                              </div>
                            </div>
                          </div>

                          <div className="flex flex-col sm:flex-row gap-2">
                            <button
                              onClick={() => handleEditVehicle(vehicle)}
                              className="inline-flex items-center gap-2 bg-yellow-50 text-yellow-700 px-4 py-2 rounded-lg font-medium hover:bg-yellow-100 transition-colors duration-200 text-sm"
                            >
                              <svg
                                className="w-4 h-4"
                                fill="none"
                                stroke="currentColor"
                                viewBox="0 0 24 24"
                              >
                                <path
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                  strokeWidth={2}
                                  d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
                                />
                              </svg>
                              Edit
                            </button>

                            <button
                              onClick={() => setSelectedVehicle(vehicle)}
                              className="inline-flex items-center gap-2 bg-blue-50 text-blue-700 px-4 py-2 rounded-lg font-medium hover:bg-blue-100 transition-colors duration-200 text-sm"
                            >
                              <svg
                                className="w-4 h-4"
                                fill="none"
                                stroke="currentColor"
                                viewBox="0 0 24 24"
                              >
                                <path
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                  strokeWidth={2}
                                  d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                                />
                              </svg>
                              Manage Docs
                            </button>

                           {userRoles.includes("accounts") && (
                              <button
                                onClick={() =>
                                  setSelectedMaintenanceVehicle(vehicle)
                                }
                                className="inline-flex items-center gap-2 bg-purple-50 text-purple-700 px-4 py-2 rounded-lg font-medium hover:bg-purple-100 transition-colors duration-200 text-sm"
                              >
                                <svg
                                  className="w-4 h-4"
                                  fill="none"
                                  stroke="currentColor"
                                  viewBox="0 0 24 24"
                                >
                                  <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth={2}
                                    d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"
                                  />
                                </svg>
                                Maintenance
                              </button>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Document Manager Section */}
 {selectedVehicle && userRoles.includes("accounts") && (
            <div
            ref={docsRef}
            className="mt-8 bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden"
          >
            <div className="p-6 border-b border-gray-200 bg-gradient-to-r from-blue-50 to-indigo-50">
              <h3 className="text-xl font-semibold text-gray-900">
                Managing Documents for:{" "}
                <span className="text-blue-600">
                  {selectedVehicle.vehicleNumber}
                </span>
              </h3>
              <p className="text-gray-600 mt-1">
                Upload and manage vehicle documents and certificates
              </p>
            </div>
            <div className="p-6">
              <VehicleDocumentManager
                vehicleNumber={selectedVehicle.vehicleNumber}
              />
            </div>
          </div>
        )}
      </main>

      {/* Maintenance Log Book Modal */}
      {selectedMaintenanceVehicle && (
        <MaintenanceLogBook
          vehicleNumber={selectedMaintenanceVehicle.vehicleNumber}
          onClose={() => setSelectedMaintenanceVehicle(null)}
        />
      )}
    </div>
  );
}
