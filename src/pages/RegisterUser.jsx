import React, { useEffect, useRef, useState } from 'react';
import { CheckCircle, XCircle, Trash2 } from 'lucide-react';
import InternalNavbar from '../components/InternalNavbar';
import axiosInstance from '../axiosInstance';
import toast from 'react-hot-toast';
import FaceRegistrationModal from '../components/FaceRegistrationModal';
import FileInput from '../components/FileInput';
import Swal from "sweetalert2";
import { useUserContext } from '../context/UserContext';
import { useNavigate } from 'react-router-dom';

const RegisterUser = () => {
   const parseUserRoles = (user) => {
    // ✅ Add null check
    if (!user || !user.role) {
      return [];
    }
    
    let userRoles = [];
    if (Array.isArray(user.role)) {
      if (user.role.length > 0 && typeof user.role[0] === 'string' && user.role[0].startsWith('[')) {
        try {
          userRoles = JSON.parse(user.role[0]);
        } catch (parseError) {
          userRoles = user.role;
        }
      } else {
        userRoles = user.role;
      }
    } else if (typeof user.role === 'string') {
      try {
        userRoles = JSON.parse(user.role);
      } catch (parseError) {
        userRoles = [user.role];
      }
    } else {
      userRoles = [user.role];
    }
    return userRoles;
  };
  const { user: currentUser } = useUserContext();
    const navigate = useNavigate();
  const [currentPage, setCurrentPage] = useState(1);
const [totalPages, setTotalPages] = useState(1);
const [totalUsers, setTotalUsers] = useState(0);
const [limit] = useState(10); // You can make this configurable if needed
  const [deletingUserId, setDeletingUserId] = useState(null);
  const [name, setName] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [email, setEmail] = useState('');
  const [gender, setGender] = useState('male');
  const [resetTrigger, setResetTrigger] = useState(0);
  const [isEditing, setIsEditing] = useState(false);
  const [existingFrontFace, setExistingFrontFace] = useState([]);
  const [drivingLicence, setDrivingLicence] = useState([]); // ✅ ADD THIS LINE
  const [existingAadharCard, setExistingAadharCard] = useState([]);
  const [existingPanCard, setExistingPanCard] = useState([]);
  const [existingPassbookCheque, setExistingPassbookCheque] = useState([]);
  const [existingEsicCopy, setExistingEsicCopy] = useState([]);
  const [existingEpfoCopy, setExistingEpfoCopy] = useState([]);
  const [existingMiscDocuments, setExistingMiscDocuments] = useState([]);
  const [editUserId, setEditUserId] = useState(null);
  const [profilePicture, setProfilePicture] = useState(null);
  const [profilePicturePreview, setProfilePicturePreview] = useState('');
const [allowAttendance, setAllowAttendance] = useState(false);
const [allowVehiclesManagement, setAllowVehiclesManagement] = useState(false);
const [allowHR, setAllowHR] = useState(false);
const [allowPlantMaintenance, setAllowPlantMaintenance] = useState(false);
const [allowTourExpenses, setAllowTourExpenses] = useState(false);  
const [allowIncomingPayments, setAllowIncomingPayments] = useState(false);
const [allowQuotation, setAllowQuotation] = useState(false);
// Add this line with other allow states
const [allowDanaBeads, setAllowDanaBeads] = useState(false);
const [role, setRole] = useState([]);
  const [visitingCard, setVisitingCard] = useState(null);
  const [visitingCardPreview, setVisitingCardPreview] = useState('');
  const [phone, setPhone] = useState('');
  const [selectedUser, setSelectedUser] = useState(null);
  const [modalVisible, setModalVisible] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [message, setMessage] = useState('');
  const [isSuccess, setIsSuccess] = useState(null);
  const [users, setUsers] = useState([]);
  const [productionSection, setProductionSection] = useState([]);
  const [dob, setDob] = useState('');
  const [address, setAddress] = useState('');
  const [emergencyNumber, setEmergencyNumber] = useState('');
  const [designation, setDesignation] = useState('');
  const [esicNo, setEsicNo] = useState('');
  const [epfoNo, setEpfoNo] = useState('');
  const [frontFacePicture, setFrontFacePicture] = useState(null);
  const [aadharCard, setAadharCard] = useState([]);
  const [panCard, setPanCard] = useState([]);
  const [passbookCheque, setPassbookCheque] = useState([]);
  const [esicCopy, setEsicCopy] = useState([]);
  const [epfoCopy, setEpfoCopy] = useState([]);
    const [loading, setLoading] = useState(true);
  const [personalPhone, setPersonalPhone] = useState('');
    const [user, setUser] = useState(null);
    const [existingDrivingLicence, setExistingDrivingLicence] = useState([]); // ✅ ADD THIS LINE
  const [miscDocuments, setMiscDocuments] = useState([]);
  const [filesToRemove, setFilesToRemove] = useState({
    aadharCard: [],
    panCard: [],
    passbookCheque: [],
    esicCopy: [],
    epfoCopy: [],
        drivingLicence: [], // ✅ ADD THIS LINE
    miscDocuments: [],
    frontFacePicture: false
  });
  const formRef = useRef(null);
  const userRoles = user ? parseUserRoles(user) : [];

    useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) {
      navigate("/login");
      return;
    }
    const fetchUser = async () => {
      try {
        const res = await axiosInstance.get("/users/me", {
          headers: { Authorization: `Bearer ${token}` },
        });
        setUser(res.data);
         // Store user ID in localStorage for notification filtering
      if (res.data._id) {
        localStorage.setItem('userId', res.data._id);
      }
      
        setLoading(false);
      } catch (err) {
        console.error(
          "Failed to fetch user",
          err?.response ? err.response.data : err.message
        );
        localStorage.removeItem("token");
        navigate("/login");
      }
    };
    fetchUser();
  }, [navigate]);

  useEffect(() => {
    if (isEditing) {
      // Reset files to remove when starting to edit
      setFilesToRemove({
        aadharCard: [],
        panCard: [],
        passbookCheque: [],
        esicCopy: [],
        epfoCopy: [],
        miscDocuments: [],
        frontFacePicture: false
      });
    }
  }, [isEditing]);

  const handleSubmit = async (e) => {
    e.preventDefault();

      // ✅ SAFETY CHECK: Ensure we have required data
  if (!name.trim()) {
    toast.error('Name is required');
    return;
  }
  
  // Additional safety checks
  if (isEditing && !editUserId) {
    toast.error('Invalid edit state');
    return;
  }

  // ✅ FIX: Check if role includes production, not if role equals production
  if (Array.isArray(role) && role.includes('production') && productionSection.length === 0) {
    toast.error('Please select at least one production section.');
    return;
  }

// ✅ FIX: Check if role includes production, not if role equals production
  if (Array.isArray(role) && role.includes('production') && productionSection.length === 0) {
    toast.error('Please select at least one production section.');
    return;
  }
    setIsSubmitting(true); // Start loading

    try {
      const formData = new FormData();
      formData.append('name', name);
            // Add unique dummy email if no email is provided
      const userEmail = email.trim() === '' ? `dummy_${Date.now()}@gmail.com` : email;
      formData.append('email', userEmail);
      formData.append('phone', phone);
formData.append('role', JSON.stringify(role));
      formData.append('productionSection', JSON.stringify(productionSection));
formData.append('allowAttendance', allowAttendance);
formData.append('allowVehiclesManagement', allowVehiclesManagement);
formData.append('allowHR', allowHR);
formData.append('allowPlantMaintenance', allowPlantMaintenance);
formData.append('allowTourExpenses', allowTourExpenses);
formData.append('allowIncomingPayments', allowIncomingPayments); // Add this line
formData.append('allowQuotation', allowQuotation); // Add this line 
formData.append('allowDanaBeads', allowDanaBeads);     
formData.append("dob", dob);
formData.append('gender', gender);
      formData.append("address", address);
formData.append("emergencyNumber", emergencyNumber);
formData.append("personalPhone", personalPhone);
      formData.append("designation", designation);
      formData.append("esicNo", esicNo);
      formData.append("epfoNo", epfoNo);
      formData.append('filesToRemove', JSON.stringify(filesToRemove));

      if (frontFacePicture) formData.append("frontFacePicture", frontFacePicture);

      const multiFileFields = [
        { field: aadharCard, name: "aadharCard" },
        { field: panCard, name: "panCard" },
        { field: passbookCheque, name: "passbookCheque" },
        { field: esicCopy, name: "esicCopy" },
        { field: epfoCopy, name: "epfoCopy" },
            { field: drivingLicence, name: "drivingLicence" }, // ✅ ADD THIS LINE
        { field: miscDocuments, name: "miscDocuments" }
      ];

      multiFileFields.forEach(({ field, name }) => {
        if (field && field.length > 0) {
          field.forEach(file => {
            formData.append(name, file);
          });
        }
      });

      if (profilePicture) {
        formData.append('profilePicture', profilePicture);
      }

      if (visitingCard) {
        formData.append('visitingCard', visitingCard);
      }

      if (isEditing) {
        await axiosInstance.put(`/users/update-user/${editUserId}`, formData, {
          headers: {
            'Content-Type': 'multipart/form-data'
          }
        });
        toast.success('User updated successfully!');
      } else {
        await axiosInstance.post('/users/register', formData, {
          headers: {
            'Content-Type': 'multipart/form-data'
          }
        });
        toast.success('User registered successfully!');
      }
  setResetTrigger(prev => prev + 1);

// Only reset if we're not in editing mode
if (!isEditing) {
  setName('');
  setEmail('');
  setPhone('');
  setRole([]);
  setProductionSection([]);
  setProfilePicture(null);
  setProfilePicturePreview('');
  setVisitingCard(null);
  setVisitingCardPreview('');
  setDob('');
  setAddress('');
  setEmergencyNumber('');
  setPersonalPhone('');
  setDesignation('');
  setEsicNo('');
  setEpfoNo('');
  setFrontFacePicture(null);
  setAadharCard([]);
  setPanCard([]);
  setPassbookCheque([]);
  setEsicCopy([]);
  setEpfoCopy([]);
  setMiscDocuments([]);
  
  // Reset existing files arrays
  setExistingFrontFace([]);
  setExistingAadharCard([]);
  setExistingPanCard([]);
  setExistingPassbookCheque([]);
  setExistingEsicCopy([]);
  setExistingEpfoCopy([]);
  setExistingMiscDocuments([]);
}

setIsEditing(false);
setEditUserId(null);
setAllowAttendance(false);
setAllowVehiclesManagement(false);
setAllowHR(false);
setAllowPlantMaintenance(false);
setAllowTourExpenses(false);
setAllowIncomingPayments(false);
setAllowQuotation(false);
setAllowDanaBeads(false);
fetchUsers();

   } catch (err) {
  const errorMessage = err.response?.data?.message || 
                      err.response?.data?.error || 
                      err.message || 
                      'Operation failed';
  toast.error(errorMessage);
  console.error('Operation error:', err.response?.data || err);
} finally {
      setIsSubmitting(false); // Stop loading regardless of success/error
    }
  };

const fetchUsers = async (page = 1, query = "") => {
  try {
    
    const res = await axiosInstance.get(
      `/users/all-user-pagination?page=${page}&limit=${limit}&search=${query}`
    );
    
    setUsers(res.data.users);
    setCurrentPage(res.data.pagination.currentPage);
    setTotalPages(res.data.pagination.totalPages);
    setTotalUsers(res.data.pagination.totalUsers);
  } catch (err) {
    console.error('❌ Failed to fetch users:', {
      error: err,
      response: err.response,
      status: err.response?.status,
      data: err.response?.data
    });
    toast.error("Failed to fetch users");
  }
};


  const formatDateForInput = (isoDate) => {
    if (!isoDate) return "";
    const date = new Date(isoDate);
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
  };

  // Add handler for removing existing files
 const handleRemoveExistingFile = (field, fileUrl) => {
  setFilesToRemove(prev => ({
    ...prev,
    [field]: field === 'frontFacePicture' 
      ? true // Special handling for single file field
      : [...(prev[field] || []), fileUrl]
  }));

  // Update UI immediately
  switch (field) {
    case 'frontFacePicture':
      setExistingFrontFace([]);
      break;
    case 'aadharCard':
      setExistingAadharCard(prev => prev.filter(file => file !== fileUrl));
      break;
    case 'panCard':
      setExistingPanCard(prev => prev.filter(file => file !== fileUrl));
      break;
    case 'passbookCheque':
      setExistingPassbookCheque(prev => prev.filter(file => file !== fileUrl));
      break;
    case 'esicCopy':
      setExistingEsicCopy(prev => prev.filter(file => file !== fileUrl));
      break;
    case 'epfoCopy':
      setExistingEpfoCopy(prev => prev.filter(file => file !== fileUrl));
      break;
    case 'miscDocuments':
      setExistingMiscDocuments(prev => prev.filter(file => file !== fileUrl));
      break;
    default:
      break;
  }
};

  const handleEdit = (user) => {
    setIsEditing(true);
    setEditUserId(user._id);

    // Set existing file URLs for edit mode
    setExistingFrontFace(user.frontFacePicture ? [user.frontFacePicture] : []);
    setExistingAadharCard(user.aadharCard || []);
    setExistingPanCard(user.panCard || []);
    setExistingPassbookCheque(user.passbookCheque || []);
    setExistingEsicCopy(user.esicCopy || []);
    setExistingEpfoCopy(user.epfoCopy || []);
    setExistingDrivingLicence(user.drivingLicence || []); // ✅ ADD THIS LINE
    setExistingMiscDocuments(user.miscDocuments || []);

    setName(user.name || "");
    setEmail(user.email || "");
    setPhone(user.phone?.replace('+91', '') || "");
setRole(Array.isArray(user.role) ? user.role : [user.role || "sales"]);    
setProductionSection(user.productionSection || []);
setAllowAttendance(user.allowAttendance || false);
setAllowVehiclesManagement(user.allowVehiclesManagement || false);
setAllowHR(user.allowHR || false);
setAllowPlantMaintenance(user.allowPlantMaintenance || false);
setAllowTourExpenses(user.allowTourExpenses || false);
setAllowIncomingPayments(user.allowIncomingPayments || false); // Add this line
setAllowQuotation(user.allowQuotation || false); // Add this line    
setAllowDanaBeads(user.allowDanaBeads || false);
setDob(user.dob ? formatDateForInput(user.dob) : "");
setGender(user.gender || 'male');
    setAddress(user.address || "");
    setEmergencyNumber(user.emergencyNumber || "");
    setPersonalPhone(user.personalPhone || "");
    setDesignation(user.designation || "");
    setEsicNo(user.esicNo || "");
    setEpfoNo(user.epfoNo || "");

    // Previews for files (Cloudinary URLs are already saved in DB)
    setProfilePicturePreview(user.profilePicture || "");
    setVisitingCardPreview(user.visitingCard || "");

    // reset files (you only preview, not re-upload until user changes)
    setProfilePicture(null);
    setVisitingCard(null);
    setFrontFacePicture(null);
    setAadharCard([]);
    setPanCard([]);
    setPassbookCheque([]);
    setEsicCopy([]);
    setEpfoCopy([]);
    setMiscDocuments([]);

    // scroll form into view
    setTimeout(() => {
      formRef.current?.scrollIntoView({ behavior: "smooth" });
    }, 100);
  };

  const handleCancelEdit = () => {
    setIsEditing(false);
    setEditUserId(null);

    setName("");
    setEmail("");
    setPhone("");
setRole(["sales"]);
    setProductionSection([]);
setAllowAttendance(false);
setAllowVehiclesManagement(false);
setAllowHR(false);
setAllowPlantMaintenance(false);
setAllowTourExpenses(false);
setAllowIncomingPayments(false); // Add this line
setAllowQuotation(false); // Add this line
    // Reset existing files
    setExistingFrontFace([]);
    setExistingAadharCard([]);
    setExistingPanCard([]);
    setExistingPassbookCheque([]);
    setExistingEsicCopy([]);
    setExistingEpfoCopy([]);
    setExistingDrivingLicence([]); // ✅ ADD THIS LINE
    setExistingMiscDocuments([]);

    // Reset files to remove
    setFilesToRemove({
      aadharCard: [],
      panCard: [],
      passbookCheque: [],
      esicCopy: [],
      epfoCopy: [],
      miscDocuments: [],
      frontFacePicture: false
    });

    setResetTrigger(prev => prev + 1);

    setDob("");
    setGender('male');
    setAddress("");
    setEmergencyNumber("");
    setPersonalPhone("");
    setDesignation("");
    setEsicNo("");
    setEpfoNo("");

    setProfilePicture(null);
    setProfilePicturePreview("");
    setVisitingCard(null);
    setVisitingCardPreview("");

    setFrontFacePicture(null);
    setAadharCard([]);
    setPanCard([]);
    setPassbookCheque([]);
    setEsicCopy([]);
    setEpfoCopy([]);
    setMiscDocuments([]);
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this user?')) return;

    setDeletingUserId(id); // Set the user ID being deleted

    try {
      await axiosInstance.delete(`/users/delete-user/${id}`);
      toast.success('User deleted');
      fetchUsers();
    } catch (err) {
      toast.error('Failed to delete user');
    } finally {
      setDeletingUserId(null); // Reset after operation completes
    }
  };

  useEffect(() => {
    fetchUsers(currentPage);
  }, []);

  const showDocument = (url, title) => {
    Swal.fire({
      title: title,
      html: `<div style="text-align:center;">
             <img src="${url}" alt="${title}" style="max-width:100%; max-height:70vh; border-radius:8px;" />
           </div>`,
      showCloseButton: true,
      showConfirmButton: false,
      width: "80%",
      background: "#fff",
    });
  };

    const handlePreprocessFaces = async () => {
    // First check current status
    try {
      const statusRes = await axiosInstance.get("/users/preprocess-status");
      const { total, processed, remaining, unprocessed } = statusRes.data;
      
      let timeEstimate = "";
      if (remaining > 0) {
        const estimatedSeconds = remaining * 3; // 3 seconds per face
        if (estimatedSeconds < 60) {
          timeEstimate = `⏱️ Estimated time: ~${estimatedSeconds} seconds`;
        } else {
          const minutes = Math.ceil(estimatedSeconds / 60);
          timeEstimate = `⏱️ Estimated time: ~${minutes} minute${minutes > 1 ? 's' : ''}`;
        }
      }

      const result = await Swal.fire({
        title: "⚡ Pre-process Faces",
        html: `
          <div class="text-left">
            <div class="mb-4 p-3 bg-blue-50 rounded-lg">
              <p class="font-semibold text-blue-800">Current Status:</p>
              <div class="flex justify-between mt-2">
                <span>Total Employees:</span>
                <span class="font-bold">${total}</span>
              </div>
              <div class="flex justify-between text-green-600">
                <span>✅ Already Processed:</span>
                <span class="font-bold">${processed}</span>
              </div>
              <div class="flex justify-between text-amber-600">
                <span>⏳ Remaining:</span>
                <span class="font-bold">${remaining}</span>
              </div>
            </div>
            
            ${remaining > 0 ? `
              <p class="mb-3">This will process the remaining ${remaining} employee${remaining > 1 ? 's' : ''}.</p>
              <p class="text-sm text-amber-600 font-semibold">${timeEstimate}</p>
              
              ${unprocessed && unprocessed.length > 0 ? `
                <div class="mt-3 p-2 bg-gray-50 rounded-lg max-h-32 overflow-y-auto">
                  <p class="text-xs font-semibold text-gray-600 mb-1">Pending employees:</p>
                  ${unprocessed.map(u => `
                    <div class="text-xs text-gray-600 flex justify-between">
                      <span>${u.name}</span>
                      <span class="text-gray-400">${u.designation}</span>
                    </div>
                  `).join('')}
                </div>
              ` : ''}
            ` : `
              <p class="text-green-600 font-semibold">✅ All faces are already processed!</p>
            `}
            
            <p class="text-xs text-gray-500 mt-4">New faces will be processed automatically when registered.</p>
          </div>
        `,
        icon: remaining > 0 ? "info" : "success",
        showCancelButton: remaining > 0,
        confirmButtonColor: "#8b5cf6",
        cancelButtonColor: "#6b7280",
        confirmButtonText: remaining > 0 ? "Yes, process now!" : "OK",
        cancelButtonText: "Later",
      });

      if (result.isConfirmed && remaining > 0) {
        // Show detailed progress modal
        Swal.fire({
          title: "Processing Faces...",
          html: `
            <div class="text-center">
              <div class="mb-4">
                <div class="w-full bg-gray-200 rounded-full h-6">
                  <div id="progress-bar" class="bg-purple-600 h-6 rounded-full text-xs text-white flex items-center justify-center" style="width: 0%">0%</div>
                </div>
              </div>
              <p id="progress-status" class="text-gray-700 font-semibold mb-2">Initializing...</p>
              <p id="progress-detail" class="text-sm text-gray-500 mb-2">Please wait</p>
              <div id="current-file" class="text-xs text-gray-400"></div>
            </div>
          `,
          allowOutsideClick: false,
          showConfirmButton: false,
        });

        // Start processing
        try {
          const response = await axiosInstance.post("/users/preprocess-all-faces");
          
          // Processing started successfully
          console.log("Processing started:", response.data);
          
          // Start polling for status
          let processingComplete = false;
          let pollCount = 0;
          const maxPolls = 60; // 2 minutes max (2 second intervals)
          
          const pollInterval = setInterval(async () => {
            try {
              pollCount++;
              const statusRes = await axiosInstance.get("/users/preprocess-status");
              const { processed, total, remaining, unprocessed } = statusRes.data;
              
              // Calculate percentage
              const percent = Math.round((processed / total) * 100);
              
              // Update progress bar
              const progressBar = document.getElementById('progress-bar');
              const progressStatus = document.getElementById('progress-status');
              const progressDetail = document.getElementById('progress-detail');
              const currentFile = document.getElementById('current-file');
              
              if (progressBar) {
                progressBar.style.width = percent + '%';
                progressBar.textContent = percent + '%';
              }
              
              if (progressStatus) {
                progressStatus.textContent = `Processed ${processed} of ${total} faces`;
              }
              
              if (progressDetail) {
                progressDetail.textContent = `${remaining} remaining`;
              }
              
              if (currentFile && unprocessed && unprocessed.length > 0) {
                currentFile.textContent = `Currently processing: ${unprocessed[0]?.name || '...'}`;
              }
              
              if (remaining === 0) {
                processingComplete = true;
                clearInterval(pollInterval);
                
                Swal.fire({
                  icon: "success",
                  title: "✅ Processing Complete!",
                  html: `
                    <div class="text-left space-y-2">
                      <div class="flex justify-between border-b pb-2">
                        <span class="font-semibold">Total Employees:</span>
                        <span>${total}</span>
                      </div>
                      <div class="flex justify-between text-green-600">
                        <span class="font-semibold">✅ Successfully Processed:</span>
                        <span>${processed}</span>
                      </div>
                      <div class="flex justify-between text-red-500">
                        <span class="font-semibold">❌ Failed:</span>
                        <span>0</span>
                      </div>
                    </div>
                  `,
                  confirmButtonColor: "#8b5cf6",
                });
              }
              
              // Stop polling after max attempts
              if (pollCount >= maxPolls && !processingComplete) {
                clearInterval(pollInterval);
                Swal.fire({
                  icon: "warning",
                  title: "Processing",
                  html: `
                    <p>The process is still running in the background.</p>
                    <p class="text-sm text-gray-500 mt-2">You can check status later by clicking the button again.</p>
                  `,
                  confirmButtonColor: "#8b5cf6",
                });
              }
              
            } catch (pollErr) {
              console.error("Polling error:", pollErr);
            }
          }, 2000); // Poll every 2 seconds
          
        } catch (err) {
          console.error("Processing error:", err);
          Swal.fire({
            icon: "error",
            title: "❌ Processing Failed",
            text: err.response?.data?.error || "Something went wrong",
            confirmButtonColor: "#ef4444",
          });
        }
      }
    } catch (err) {
      console.error("Status check error:", err);
      Swal.fire({
        icon: "error",
        title: "Error",
        text: "Failed to check preprocessing status",
        confirmButtonColor: "#ef4444",
      });
    }
  };

  return (
    <>
      <InternalNavbar />
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-white px-4 py-10">
         {/* Responsive Pre-process Button */}
         <div className='mb-4'>
          <span className="text-sm font-bold">Click This button whenever adding/updating faces for worker designations other than 'staff'</span>
   {userRoles.includes("accounts") && (
  <button
    onClick={handlePreprocessFaces}  // 👈 Change this from the inline function
    className={`
      w-full sm:w-auto
      bg-gradient-to-r from-purple-600 to-purple-700
      hover:from-purple-700 hover:to-purple-800
      text-white 
      px-4 sm:px-6 
      py-3 sm:py-2.5 
      rounded-xl 
      font-semibold 
      text-sm sm:text-base
      shadow-lg 
      hover:shadow-xl 
      transform hover:scale-[1.02] active:scale-[0.98]
      transition-all duration-200
      flex items-center justify-center gap-2
      border border-purple-400
    `}
  >
    <span className="text-lg sm:text-base">⚡</span>
    <span className="sm:flex-none text-center">Pre-process Faces</span>
    <span className="sm:inline text-purple-200">|</span>
    <span className="sm:inline text-xs text-purple-200">One-time setup</span>
  </button>
)}
    </div> 
<div className="w-full max-w-6xl mx-auto bg-white rounded-2xl shadow-lg p-4 sm:p-6 lg:p-8 mb-10">      
      <h2 className="text-2xl sm:text-3xl font-bold text-blue-700 mb-6 flex items-center gap-2">
            Add New Employee/User
          </h2>


       <form ref={formRef} onSubmit={handleSubmit} className="space-y-6">
  {isEditing && (
    <div className="mb-4 text-blue-700 font-semibold text-sm">
      ✏️ Editing user. Make changes and click "Update User" or cancel.
    </div>
  )}
  
  {/* Personal Information Section */}
  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
    {/* Left Column */}
    <div className="space-y-6">
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Full Name (As per Aadhar Card)</label>
        <input
          type="text"
          required
          placeholder="John Doe"
          value={name}
          onChange={e => setName(e.target.value)}
          className="w-full border border-gray-300 rounded-lg p-2 focus:ring-2 focus:ring-blue-400 outline-none"
        />
      </div>

   

      <div>
        <label className="block text-sm">Date of Birth (As per Aadhar Card)</label>
        <input type="date" lang="en-GB" value={dob} onChange={e => setDob(e.target.value)} className="w-full border p-2 rounded" />
      </div>

      <div>
  <label className="block text-sm font-medium text-gray-700 mb-2">Gender</label>
  <div className="flex gap-6">
    <label className="flex items-center gap-2">
      <input
        type="radio"
        value="male"
        checked={gender === 'male'}
        onChange={(e) => setGender(e.target.value)}
        className="w-4 h-4 text-blue-600"
      />
      <span className="text-sm">Male</span>
    </label>
    <label className="flex items-center gap-2">
      <input
        type="radio"
        value="female"
        checked={gender === 'female'}
        onChange={(e) => setGender(e.target.value)}
        className="w-4 h-4 text-blue-600"
      />
      <span className="text-sm">Female</span>
    </label>
    <label className="flex items-center gap-2">
      <input
        type="radio"
        value="other"
        checked={gender === 'other'}
        onChange={(e) => setGender(e.target.value)}
        className="w-4 h-4 text-blue-600"
      />
      <span className="text-sm">Other</span>
    </label>
  </div>
</div>

     <div>
  <label className="block text-sm">Designation <span className="text-red-500">*</span></label>
  <select 
    value={designation} 
    onChange={e => setDesignation(e.target.value)} 
    className="w-full border p-2 rounded"
    required
  >
    <option value="">Select</option>
    <option value="operator">Operator</option>
    <option value="helper">Helper</option>
    <option value="driver">Driver</option>
    <option value="staff">Staff</option>
  </select>
</div>

      {(designation === 'staff' || designation === 'driver') && (
  <div>
    <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
    <input
      type="email"
      placeholder="example@domain.com"
      value={email}
      onChange={e => setEmail(e.target.value)}
      className="w-full border border-gray-300 rounded-lg p-2 focus:ring-2 focus:ring-blue-400 outline-none"
    />
  </div>
)}

      <div>
        <label className="block text-sm">ESIC No</label>
        <input type="text" value={esicNo} onChange={e => setEsicNo(e.target.value)} className="w-full border p-2 rounded" />
      </div>

      <div>
        <label className="block text-sm">EPFO No</label>
        <input type="text" value={epfoNo} onChange={e => setEpfoNo(e.target.value)} className="w-full border p-2 rounded" />
      </div>
    </div>

    {/* Right Column */}
    <div className="space-y-6">
      <div>
        <label className="block text-sm">Address (As per Aadhar Card)</label>
        <textarea 
          value={address} 
          onChange={e => setAddress(e.target.value)} 
          className="w-full border p-2 rounded" 
          rows="3"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">Phone Numbers</label>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-1 xl:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs text-gray-600 mb-1">Company Phone</label>
            <input
              type="tel"
              placeholder="e.g. 9876543210"
              value={phone}
              onChange={(e) => setPhone(e.target.value.replace(/\D/g, ''))}
              className="w-full border border-gray-300 rounded-lg p-2 focus:ring-2 focus:ring-blue-400 outline-none"
            />
          </div>

          <div>
            <label className="block text-xs text-gray-600 mb-1">Personal Phone</label>
            <input
              type="tel"
              placeholder="e.g. 9876543210"
              value={personalPhone}
              onChange={(e) => setPersonalPhone(e.target.value.replace(/\D/g, ''))}
              className="w-full border border-gray-300 rounded-lg p-2 focus:ring-2 focus:ring-blue-400 outline-none"
            />
          </div>

          <div className="sm:col-span-2 lg:col-span-1 xl:col-span-2">
            <label className="block text-xs text-gray-600 mb-1">Emergency/Guardian's Phone</label>
            <input
              type="tel"
              placeholder="e.g. 9876543210"
              value={emergencyNumber}
              onChange={(e) => setEmergencyNumber(e.target.value.replace(/\D/g, ''))}
              className="w-full border border-gray-300 rounded-lg p-2 focus:ring-2 focus:ring-blue-400 outline-none"
            />
          </div>
        </div>
      </div>

      {/* Profile Pictures */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Profile Picture (optional)</label>
          <input
            type="file"
            accept="image/*"
            onChange={(e) => {
              if (e.target.files[0]) {
                setProfilePicture(e.target.files[0]);
                setProfilePicturePreview(URL.createObjectURL(e.target.files[0]));
              }
            }}
            className="w-full border border-gray-300 rounded-lg p-2 focus:ring-2 focus:ring-blue-400 outline-none text-xs"
          />
          {profilePicturePreview && (
            <div className="mt-2">
              <img
                src={profilePicturePreview}
                alt="Preview"
                className="h-16 w-16 rounded-full object-cover"
              />
            </div>
          )}
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Visiting Card (optional)</label>
          <input
            type="file"
            accept="image/*"
            onChange={(e) => {
              if (e.target.files[0]) {
                setVisitingCard(e.target.files[0]);
                setVisitingCardPreview(URL.createObjectURL(e.target.files[0]));
              }
            }}
            className="w-full border border-gray-300 rounded-lg p-2 focus:ring-2 focus:ring-blue-400 outline-none text-xs"
          />
          {visitingCardPreview && (
            <div className="mt-2">
              <img
                src={visitingCardPreview}
                alt="Visiting Card Preview"
                className="h-16 w-16 rounded-md object-cover border"
              />
            </div>
          )}
        </div>
      </div>
    </div>
  </div>

  {/* File Uploads Section - Full Width */}
  <div className="border-t pt-6">
    <h3 className="text-lg font-semibold text-gray-800 mb-4">Document Uploads</h3>
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      <FileInput
        label="Front Face Picture"
        name="frontFacePicture"
        onChange={setFrontFacePicture}
        multiple={false}
        resetTrigger={resetTrigger}
        initialFiles={existingFrontFace}
        onRemoveExisting={(fileUrl) => handleRemoveExistingFile('frontFacePicture', fileUrl)}
      />

      <FileInput
        label="Aadhar Card (Front & Back)"
        name="aadharCard"
        onChange={setAadharCard}
        multiple
        resetTrigger={resetTrigger}
        initialFiles={existingAadharCard}
        onRemoveExisting={(fileUrl) => handleRemoveExistingFile('aadharCard', fileUrl)}
      />

      <FileInput
        label="PAN Card"
        name="panCard"
        onChange={setPanCard}
        multiple
        resetTrigger={resetTrigger}
        initialFiles={existingPanCard}
        onRemoveExisting={(fileUrl) => handleRemoveExistingFile('panCard', fileUrl)}
      />

      <FileInput
        label="Passbook / Cheque Book"
        name="passbookCheque"
        onChange={setPassbookCheque}
        multiple
        resetTrigger={resetTrigger}
        initialFiles={existingPassbookCheque}
        onRemoveExisting={(fileUrl) => handleRemoveExistingFile('passbookCheque', fileUrl)}
      />

      <FileInput
        label="ESIC Copy"
        name="esicCopy"
        onChange={setEsicCopy}
        multiple
        resetTrigger={resetTrigger}
        initialFiles={existingEsicCopy}
        onRemoveExisting={(fileUrl) => handleRemoveExistingFile('esicCopy', fileUrl)}
      />

      <FileInput
        label="EPFO Copy"
        name="epfoCopy"
        onChange={setEpfoCopy}
        multiple
        resetTrigger={resetTrigger}
        initialFiles={existingEpfoCopy}
        onRemoveExisting={(fileUrl) => handleRemoveExistingFile('epfoCopy', fileUrl)}
      />

      <FileInput
    label="Driving Licence"
    name="drivingLicence"
    onChange={setDrivingLicence}
    multiple
    resetTrigger={resetTrigger}
    initialFiles={existingDrivingLicence}
    onRemoveExisting={(fileUrl) => handleRemoveExistingFile('drivingLicence', fileUrl)}
/>

      <FileInput
        label="Misc Documents"
        name="miscDocuments"
        onChange={setMiscDocuments}
        multiple
        resetTrigger={resetTrigger}
        initialFiles={existingMiscDocuments}
        onRemoveExisting={(fileUrl) => handleRemoveExistingFile('miscDocuments', fileUrl)}
      />
    </div>
  </div>

  {/* Roles and Permissions Section - Full Width */}
  {(designation === 'staff' || designation === 'driver') && (
    <div className="border-t pt-6">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Roles Selection */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Select Roles</label>
          <div className="grid grid-cols-1 gap-2 border border-gray-300 rounded-lg p-3 bg-white max-h-60 overflow-y-auto">
            {[
              { value: "sales", label: "Sales" },
              { value: "accounts", label: "Accounts" },
              { value: "dispatch", label: "EPS/Thermocol Sheet Cutting, Packaging and Dispatch Section" },
              { value: "production", label: "Production" },
              { value: "packaging", label: "EPS/Thermocol Shape Molding, Packaging and Dispatch Section" },
              { value: "suppliers", label: "Vendors/Suppliers" },
              { value: "driver", label: "Driver" },
              { value: "guard", label: "Guard" },
              { value: "plantMaintenance", label: "Plant & Machinery Maintenance" }
            ].map((roleOption) => (
              <label key={roleOption.value} className="flex items-center space-x-2 p-1 hover:bg-gray-50 rounded cursor-pointer">
                <input
                  type="checkbox"
                  value={roleOption.value}
                  checked={role.includes(roleOption.value)}
                  onChange={(e) => {
                    if (e.target.checked) {
                      setRole([...role, roleOption.value]);
                    } else {
                      setRole(role.filter(r => r !== roleOption.value));
                    }
                  }}
                  className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
                />
                <span className="text-sm text-gray-700">{roleOption.label}</span>
              </label>
            ))}
          </div>
          {role.length > 0 && (
            <div className="mt-2 text-xs text-blue-600">
              Selected: {role.map(r => 
                ({
                  sales: 'Sales',
                  accounts: 'Accounts', 
                  dispatch: 'Dispatch',
                  production: 'Production',
                  packaging: 'Packaging',
                  suppliers: 'Suppliers',
                  driver: 'Driver'
                }[r] || r)
              ).join(', ')}
            </div>
          )}
        </div>

        {/* Production Sections and Permissions */}
        <div className="space-y-4">
          {role.includes('production') && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Production Sections</label>
              <div className="flex flex-col gap-2">
                {['blockMoulding', 'shapeMoulding', 'cnc'].map((section) => (
                  <label key={section} className="inline-flex items-center">
                    <input
                      type="checkbox"
                      value={section}
                      checked={productionSection.includes(section)}
                      onChange={(e) => {
                        if (e.target.checked) {
                          setProductionSection([...productionSection, section]);
                        } else {
                          setProductionSection(productionSection.filter(s => s !== section));
                        }
                      }}
                      className="mr-2"
                    />
                    {section}
                  </label>
                ))}
              </div>
            </div>
          )}

          {!role.includes('suppliers') && (
            <div className="space-y-2">
              <div className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  id="attendance"
                  checked={allowAttendance}
                  onChange={() => setAllowAttendance(!allowAttendance)}
                  className="w-4 h-4"
                />
                <label htmlFor="attendance" className="text-sm text-gray-700">
                  Allow for Attendance
                </label>
              </div>
              
              {(currentUser?.email === "thermopackers@gmail.com" || currentUser?.email === "it.thermopackers@gmail.com") && (
                <>
                  <div className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      id="vehiclesManagement"
                      checked={allowVehiclesManagement}
                      onChange={() => setAllowVehiclesManagement(!allowVehiclesManagement)}
                      className="w-4 h-4"
                    />
                    <label htmlFor="vehiclesManagement" className="text-sm text-gray-700">
                      Allow Vehicles Management
                    </label>
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      id="hr"
                      checked={allowHR}
                      onChange={() => setAllowHR(!allowHR)}
                      className="w-4 h-4"
                    />
                    <label htmlFor="hr" className="text-sm text-gray-700">
                      Allow HR (Human Resource)
                    </label>
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      id="plantMaintenance"
                      checked={allowPlantMaintenance}
                      onChange={() => setAllowPlantMaintenance(!allowPlantMaintenance)}
                      className="w-4 h-4"
                    />
                    <label htmlFor="plantMaintenance" className="text-sm text-gray-700">
                      Allow Plant & Machinery Maintenance
                    </label>
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      id="tourExpenses"
                      checked={allowTourExpenses}
                      onChange={() => setAllowTourExpenses(!allowTourExpenses)}
                      className="w-4 h-4"
                    />
                    <label htmlFor="tourExpenses" className="text-sm text-gray-700">
                      Allow Tour Expenses
                    </label>
                  </div>

                  <div className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      id="incomingPayments"
                      checked={allowIncomingPayments}
                      onChange={() => setAllowIncomingPayments(!allowIncomingPayments)}
                      className="w-4 h-4"
                    />
                    <label htmlFor="incomingPayments" className="text-sm text-gray-700">
                      Allow for Incoming Payments
                    </label>
                  </div>

                  <div className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      id="allowQuotation"
                      checked={allowQuotation}
                      onChange={() => setAllowQuotation(!allowQuotation)}
                      className="w-4 h-4"
                    />
                    <label htmlFor="allowQuotation" className="text-sm text-gray-700">
                      Allow for Quotation / Proforma Invoice
                    </label>
                  </div>
                  {/* ✅ Add this after the allowQuotation checkbox */}
  <div className="flex items-center space-x-2">
    <input
      type="checkbox"
      id="allowDanaBeads"
      checked={allowDanaBeads}
      onChange={() => setAllowDanaBeads(!allowDanaBeads)}
      className="w-4 h-4"
    />
    <label htmlFor="allowDanaBeads" className="text-sm text-gray-700">
      Allow for Dana / Beads Production Section
    </label>
  </div>
                </>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  )}

  {/* Submit Buttons */}
  <div className="border-t pt-6">
    <button
      type="submit"
      disabled={isSubmitting}
      className={`w-full bg-blue-600 text-white py-3 rounded-lg hover:bg-blue-700 transition ${
        isSubmitting ? 'opacity-50 cursor-not-allowed' : ''
      }`}
    >
      {isEditing ? 'Update User' : 'Register User'}
    </button>
    {isEditing && (
      <button
        type="button"
        onClick={handleCancelEdit}
        disabled={isSubmitting}
        className={`w-full bg-gray-300 text-gray-800 py-3 rounded-lg hover:bg-gray-400 transition mt-3 ${
          isSubmitting ? 'opacity-50 cursor-not-allowed' : ''
        }`}
      >
        Cancel Editing
      </button>
    )}
  </div>
</form>

          {message && (
            <div
              className={`mt-6 flex items-center gap-2 px-4 py-2 rounded-md ${
                isSuccess ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
              }`}
            >
              {isSuccess ? <CheckCircle size={20} /> : <XCircle size={20} />}
              <span className="text-sm font-medium">{message}</span>
            </div>
          )}
        </div>

        <div className="max-w-5xl mx-auto bg-white shadow-md rounded-xl p-4 sm:p-6 overflow-x-auto">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-4 gap-2">
  <h3 className="text-xl font-bold text-gray-800">
    All Registered Users and Employees
  </h3>
  <input
    type="text"
    placeholder="🔍 Search by name..."
    value={searchQuery}
  onChange={(e) => {
    const value = e.target.value;
    setSearchQuery(value);
    fetchUsers(1, value); // always reset to page 1 when searching
  }}
  className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-400 outline-none"
  />
</div>

          <table className="w-full text-sm text-left text-gray-600">
            <thead className="bg-gray-100 text-gray-700 uppercase text-xs">
              <tr>
                <th className="px-4 py-2">#</th>
                <th className="px-4 py-2">WhatsApp/Gmail Profile Photo</th>
                <th className="px-4 py-2">Front Face Picture</th>  {/* NEW COLUMN */}
                <th className="px-4 py-2">Visiting Card</th>
                <th className="px-4 py-2">Name</th>
                <th className="px-4 py-2">Email</th>
                <th className="px-4 py-2">Role</th>
                <th className="px-4 py-2">Prod. Section</th>
                <th className="px-4 py-2">Phone</th>
                <th className="px-4 py-2">Attendance</th>
                <th className="px-4 py-2">DOB</th>
                <th className="px-4 py-2">Gender</th>
                <th className="px-4 py-2">Address</th>
                <th className="px-4 py-2">Emergency No.</th>
                <th className="px-4 py-2">Designation</th>
                <th className="px-4 py-2">ESIC No</th>
                <th className="px-4 py-2">EPFO No</th>
                <th className="px-4 py-2">Documents</th>
                <th className="px-4 py-2">Actions</th>
              </tr>
            </thead>

            <tbody>
           {users.map((u, i) => (
                <tr key={u._id} className="border-b hover:bg-gray-50">
                  <td className="px-4 py-2">{i + 1}</td>
                  <td className="px-4 py-2">
                    {u.profilePicture ? (
                      <img
                        src={u.profilePicture}
                        alt="Profile"
                        className="h-10 w-10 rounded-full object-cover"
                        loading="lazy"
                      />
                    ) : (
                      <div className="h-10 w-10 rounded-full bg-gray-200 flex items-center justify-center">
                        <span className="text-gray-500 text-xs">No photo</span>
                      </div>
                    )}
                  </td>
                  <td className="px-4 py-2">
  {u.frontFacePicture ? (
    <img
      src={u.frontFacePicture}
      alt="Front Face"
      className="h-10 w-10 rounded-full object-cover cursor-pointer"
      loading="lazy"
      onClick={() => showDocument(u.frontFacePicture, "Front Face")}
    />
  ) : (
    <div className="h-10 w-10 rounded-full bg-gray-200 flex items-center justify-center">
      <span className="text-gray-500 text-xs">No photo</span>
    </div>
  )}
</td>
                  <td className="px-4 py-2">
                    {u.visitingCard ? (
                      <a href={u.visitingCard} target="_blank" rel="noopener noreferrer">
                        <img src={u.visitingCard} alt="Visiting Card" className="h-12 w-20 object-cover rounded" />
                      </a>
                    ) : (
                      <span className="text-gray-400 italic">None</span>
                    )}
                  </td>
                  <td className="px-4 py-2">{u.name}</td>
                  <td className="px-4 py-2">{u.email}</td>
                 <td className="px-4 py-2">
  {Array.isArray(u.role) && u.role.length > 0 
    ? u.role.map(r => ({
        sales: 'Sales',
        accounts: 'Accounts',
        dispatch: 'Dispatch',
        production: 'Production',
        packaging: 'Packaging',
        suppliers: 'Suppliers',
      }[r] || r)).join(', ')
    : '-'}
</td>
                  <td className="px-4 py-2 capitalize">
                    {Array.isArray(u.productionSection) && u.productionSection.length > 0
                      ? u.productionSection.join(', ')
                      : '-'}
                  </td>
                 <td className="px-4 py-2">
  <div className="flex flex-col text-xs">
    <span>
      📞 Company: {u.phone || "-"}
    </span>
    <span>
      📱 Personal: {u.personalPhone || "-"}
    </span>
    <span>
      🚨 Emergency: {u.emergencyNumber || "-"}
    </span>
  </div>
</td>

                  <td className="px-4 py-2">
                    {u.allowAttendance ? 'Yes' : 'No'}
                  </td>

                  <td className="px-4 py-2">{u.dob ? new Date(u.dob).toLocaleDateString() : "-"}</td>
                  <td className="px-4 py-2 capitalize">{u.gender || 'male'}</td>
                  <td className="px-4 py-2">{u.address || "-"}</td>
                  <td className="px-4 py-2">{u.emergencyNumber || "-"}</td>
                  <td className="px-4 py-2 capitalize">{u.designation || "-"}</td>
                  <td className="px-4 py-2">{u.esicNo || "-"}</td>
                  <td className="px-4 py-2">{u.epfoNo || "-"}</td>
                  <td className="px-4 py-2">
                    <div className="flex flex-col gap-2 text-xs">
                      

                      {u.aadharCard?.map((url, idx) => (
                        <button
                          key={idx}
                          onClick={() => showDocument(url, `Aadhar ${idx + 1}`)}
                          className="px-3 py-1 bg-green-600 text-white rounded hover:bg-green-700 transition"
                        >
                          Aadhar {idx + 1}
                        </button>
                      ))}

                      {u.panCard?.map((url, idx) => (
                        <button
                          key={idx}
                          onClick={() => showDocument(url, `PAN ${idx + 1}`)}
                          className="px-3 py-1 bg-purple-600 text-white rounded hover:bg-purple-700 transition"
                        >
                          PAN {idx + 1}
                        </button>
                      ))}

                      {u.passbookCheque?.map((url, idx) => (
                        <button
                          key={idx}
                          onClick={() => showDocument(url, `Passbook / Cheque ${idx + 1}`)}
                          className="px-3 py-1 bg-pink-600 text-white rounded hover:bg-pink-700 transition"
                        >
                          Passbook {idx + 1}
                        </button>
                      ))}

                      {u.esicCopy?.map((url, idx) => (
                        <button
                          key={idx}
                          onClick={() => showDocument(url, `ESIC ${idx + 1}`)}
                          className="px-3 py-1 bg-orange-600 text-white rounded hover:bg-orange-700 transition"
                        >
                          ESIC {idx + 1}
                        </button>
                      ))}

                      {u.epfoCopy?.map((url, idx) => (
                        <button
                          key={idx}
                          onClick={() => showDocument(url, `EPFO ${idx + 1}`)}
                          className="px-3 py-1 bg-yellow-600 text-white rounded hover:bg-yellow-700 transition"
                        >
                          EPFO {idx + 1}
                        </button>
                      ))}

                      {u.drivingLicence?.map((url, idx) => (
    <button
        key={idx}
        onClick={() => showDocument(url, `Driving Licence ${idx + 1}`)}
        className="px-3 py-1 bg-blue-600 text-white rounded hover:bg-blue-700 transition"
    >
        Driving Licence {idx + 1}
    </button>
))}

                      {u.miscDocuments?.map((url, idx) => (
                        <button
                          key={idx}
                          onClick={() => showDocument(url, `Misc Document ${idx + 1}`)}
                          className="px-3 py-1 bg-gray-600 text-white rounded hover:bg-gray-700 transition"
                        >
                          Misc {idx + 1}
                        </button>
                      ))}
                    </div>
                  </td>

                  <td className="px-4 py-2">
                    <div className="flex flex-col sm:flex-row flex-wrap gap-2">
                      <button
                        onClick={() => handleEdit(u)}
                        className="text-sm text-white bg-blue-600 hover:bg-blue-700 px-3 py-1 rounded shadow transition"
                      >
                        ✏️ Edit
                      </button>
                      <button
                        onClick={() => handleDelete(u._id)}
                        className="text-sm text-white bg-red-600 hover:bg-red-700 px-3 py-1 rounded shadow transition"
                      >
                        🗑️ Delete
                      </button>
                      {u.role !== "suppliers" && (
                        <>
                          <button
                            onClick={() => {
                              setSelectedUser(u);
                              setModalVisible(true);
                            }}
                            className="text-sm text-white bg-indigo-600 hover:bg-indigo-700 px-3 py-1 rounded shadow transition"
                          >
                            👤 Register Face
                          </button>
                          {u.faceUrl && (
                            <button
                              onClick={async () => {
                                try {
                                  const confirm = window.confirm("Are you sure you want to delete the registered face?");
                                  if (!confirm) return;
                                  await axiosInstance.post("/users/delete-face-url", { userId: u._id });
                                  toast.success("Face deleted successfully");
                                  fetchUsers();
                                } catch (err) {
                                  toast.error(err.response?.data?.error || "Failed to delete face");
                                }
                              }}
                              className="text-sm text-white bg-red-500 hover:bg-red-600 px-3 py-1 rounded shadow transition"
                            >
                              ❌ Delete Face
                            </button>
                          )}
                        </>
                      )}

                    </div>
                    {u.role !== "suppliers" && (

                      <div className="mt-2 text-sm text-gray-700">
                        {u.faceUrl ? (
                          <span className="text-green-600">✅ Face Registered</span>
                        ) : (
                          <span className="text-red-600">❌ Face Not Registered</span>
                        )}
                      </div>)}
                  </td>
                </tr>
              ))}
             
{users.length === 0 && (
  <tr>
    <td colSpan="17" className="text-center py-4 text-gray-400">
      No users found.
    </td>
  </tr>
)}
</tbody>
</table>

{/* Pagination Controls */}
<div className="flex justify-between items-center mt-4">
  <div className="text-sm text-gray-600">
    Showing {((currentPage - 1) * limit) + 1} to {Math.min(currentPage * limit, totalUsers)} of {totalUsers} users
  </div>
  
 <div className="flex space-x-2">
  {/* First */}
  <button
    onClick={() => fetchUsers(1, searchQuery)}
    disabled={currentPage === 1}
    className={`px-3 py-1 rounded border ${
      currentPage === 1 
        ? 'bg-gray-200 text-gray-400 cursor-not-allowed' 
        : 'bg-white text-gray-700 hover:bg-gray-100'
    }`}
  >
    First
  </button>

  {/* Previous */}
  <button
    onClick={() => fetchUsers(currentPage - 1, searchQuery)}
    disabled={currentPage === 1}
    className={`px-3 py-1 rounded border ${
      currentPage === 1 
        ? 'bg-gray-200 text-gray-400 cursor-not-allowed' 
        : 'bg-white text-gray-700 hover:bg-gray-100'
    }`}
  >
    Previous
  </button>

  {/* Page Numbers */}
  {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
    const pageNum = Math.max(1, Math.min(totalPages - 4, currentPage - 2)) + i;
    if (pageNum > totalPages) return null;

    return (
      <button
        key={pageNum}
        onClick={() => fetchUsers(pageNum, searchQuery)} 
        className={`px-3 py-1 rounded border ${
          currentPage === pageNum
            ? 'bg-blue-600 text-white'
            : 'bg-white text-gray-700 hover:bg-gray-100'
        }`}
      >
        {pageNum}
      </button>
    );
  })}

  {/* Next */}
  <button
    onClick={() => fetchUsers(currentPage + 1, searchQuery)} 
    disabled={currentPage === totalPages}
    className={`px-3 py-1 rounded border ${
      currentPage === totalPages 
        ? 'bg-gray-200 text-gray-400 cursor-not-allowed' 
        : 'bg-white text-gray-700 hover:bg-gray-100'
    }`}
  >
    Next
  </button>

  {/* Last */}
  <button
    onClick={() => fetchUsers(totalPages, searchQuery)} 
    disabled={currentPage === totalPages}
    className={`px-3 py-1 rounded border ${
      currentPage === totalPages 
        ? 'bg-gray-200 text-gray-400 cursor-not-allowed' 
        : 'bg-white text-gray-700 hover:bg-gray-100'
    }`}
  >
    Last
  </button>
</div>

</div>
        </div>
      </div>
      <FaceRegistrationModal
        visible={modalVisible}
        onClose={() => setModalVisible(false)}
        user={selectedUser}
      />
      {isSubmitting && (
        <div className="fixed inset-0 bg-[#000000d0] bg-opacity-50 flex items-center justify-center z-50">
          <div className="p-6 rounded-lg shadow-xl flex flex-col items-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mb-4"></div>
            <p className="text-white">
              {isEditing ? 'Updating user...' : 'Registering user...'}
            </p>
          </div>
        </div>
      )}
      {deletingUserId && (
        <div className="fixed inset-0 bg-[#000000d0] bg-opacity-50 flex items-center justify-center z-50">
          <div className="p-6 rounded-lg shadow-xl flex flex-col items-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white mb-4"></div>
            <p className="text-white">Deleting user...</p>
          </div>
        </div>
      )}
    </>
  );
};

export default RegisterUser;