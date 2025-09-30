import React, { useEffect, useRef, useState } from 'react';
import { CheckCircle, XCircle, Trash2 } from 'lucide-react';
import InternalNavbar from '../components/InternalNavbar';
import axiosInstance from '../axiosInstance';
import toast from 'react-hot-toast';
import FaceRegistrationModal from '../components/FaceRegistrationModal';
import FileInput from '../components/FileInput';
import Swal from "sweetalert2";

const RegisterUser = () => {
  const [currentPage, setCurrentPage] = useState(1);
const [totalPages, setTotalPages] = useState(1);
const [totalUsers, setTotalUsers] = useState(0);
const [limit] = useState(10); // You can make this configurable if needed
  const [deletingUserId, setDeletingUserId] = useState(null);
  const [name, setName] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [email, setEmail] = useState('');
  const [resetTrigger, setResetTrigger] = useState(0);
  const [isEditing, setIsEditing] = useState(false);
  const [existingFrontFace, setExistingFrontFace] = useState([]);
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
  const [role, setRole] = useState('');
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
  const [personalPhone, setPersonalPhone] = useState('');
  const [miscDocuments, setMiscDocuments] = useState([]);
  const [filesToRemove, setFilesToRemove] = useState({
    aadharCard: [],
    panCard: [],
    passbookCheque: [],
    esicCopy: [],
    epfoCopy: [],
    miscDocuments: [],
    frontFacePicture: false
  });
  const formRef = useRef(null);

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
    if (role === 'production' && productionSection.length === 0) {
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
      formData.append('role', role);
      formData.append('productionSection', JSON.stringify(productionSection));
      formData.append('allowAttendance', allowAttendance);
      formData.append("dob", dob);
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

      // Reset form
      setName('');
      setEmail('');
      setPhone('');
      setRole('');
      setProductionSection([]);
      setProfilePicture(null);
      setProfilePicturePreview('');
      setVisitingCard(null);
      setVisitingCardPreview('');
      setIsEditing(false);
      setEditUserId(null);
      setAllowAttendance(false);

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
      [field]: [...(prev[field] || []), fileUrl]
    }));

    // Also remove from existing files state immediately
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
    setExistingMiscDocuments(user.miscDocuments || []);

    setName(user.name || "");
    setEmail(user.email || "");
    setPhone(user.phone?.replace('+91', '') || "");
    setRole(user.role || "sales");
    setProductionSection(user.productionSection || []);
    setAllowAttendance(user.allowAttendance || false);

    setDob(user.dob ? formatDateForInput(user.dob) : "");
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
    setRole("sales");
    setProductionSection([]);
    setAllowAttendance(false);

    // Reset existing files
    setExistingFrontFace([]);
    setExistingAadharCard([]);
    setExistingPanCard([]);
    setExistingPassbookCheque([]);
    setExistingEsicCopy([]);
    setExistingEpfoCopy([]);
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

  return (
    <>
      <InternalNavbar />
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-white px-4 py-10">
        <div className="w-full max-w-lg mx-auto bg-white rounded-2xl shadow-lg p-6 sm:p-10 mb-10">
          <h2 className="text-2xl sm:text-3xl font-bold text-blue-700 mb-6 flex items-center gap-2">
            Add New Employee/User
          </h2>

          <form ref={formRef} onSubmit={handleSubmit} className="space-y-5">
            {isEditing && (
              <div className="mb-4 text-blue-700 font-semibold text-sm">
                ✏️ Editing user. Make changes and click "Update User" or cancel.
              </div>
            )}
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

          

            {/* All details are now always visible */}
            <div className="space-y-4">
              <div>
                <label className="block text-sm">Date of Birth (As per Aadhar Card)</label>
                <input type="date" lang="en-GB" value={dob} onChange={e => setDob(e.target.value)} className="w-full border p-2 rounded" />
              </div>

              <div>
                <label className="block text-sm">Address (As per Aadhar Card)</label>
                <textarea value={address} onChange={e => setAddress(e.target.value)} className="w-full border p-2 rounded" />
              </div>

             <div>
  <label className="block text-sm font-medium text-gray-700 mb-2">
    Phone Numbers
  </label>
  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
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

    <div>
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



              <div>
                <label className="block text-sm">Designation</label>
                <select value={designation} onChange={e => setDesignation(e.target.value)} className="w-full border p-2 rounded">
                  <option value="">Select</option>
                  <option value="operator">Operator</option>
                  <option value="helper">Helper</option>
                </select>
              </div>

              <div>
                <label className="block text-sm">ESIC No</label>
                <input type="text" value={esicNo} onChange={e => setEsicNo(e.target.value)} className="w-full border p-2 rounded" />
              </div>

              <div>
                <label className="block text-sm">EPFO No</label>
                <input type="text" value={epfoNo} onChange={e => setEpfoNo(e.target.value)} className="w-full border p-2 rounded" />
              </div>

              {/* File uploads */}
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
                label="Misc Documents"
                name="miscDocuments"
                onChange={setMiscDocuments}
                multiple
                resetTrigger={resetTrigger}
                initialFiles={existingMiscDocuments}
                onRemoveExisting={(fileUrl) => handleRemoveExistingFile('miscDocuments', fileUrl)}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Email (optional)</label>
             <input
  type="email"
  placeholder="example@domain.com"
  value={email}
  onChange={e => setEmail(e.target.value)}
  className="w-full border border-gray-300 rounded-lg p-2 focus:ring-2 focus:ring-blue-400 outline-none"
/>

            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Profile Picture for Whatsapp, Gmail, etc. (optional)</label>
              <input
                type="file"
                accept="image/*"
                onChange={(e) => {
                  if (e.target.files[0]) {
                    setProfilePicture(e.target.files[0]);
                    setProfilePicturePreview(URL.createObjectURL(e.target.files[0]));
                  }
                }}
                className="w-full border border-gray-300 rounded-lg p-2 focus:ring-2 focus:ring-blue-400 outline-none"
              />
              {profilePicturePreview && (
                <div className="mt-2">
                  <img
                    src={profilePicturePreview}
                    alt="Preview"
                    className="h-20 w-20 rounded-full object-cover"
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
                className="w-full border border-gray-300 rounded-lg p-2 focus:ring-2 focus:ring-blue-400 outline-none"
              />
              {visitingCardPreview && (
                <div className="mt-2">
                  <img
                    src={visitingCardPreview}
                    alt="Visiting Card Preview"
                    className="h-24 rounded-md object-cover border"
                  />
                </div>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Select Role</label>
              <select
                value={role}
                onChange={e => setRole(e.target.value)}
                className="w-full border border-gray-300 rounded-lg p-2 bg-white focus:ring-2 focus:ring-blue-400 outline-none"
              >
                <option value="">No Role</option>
                <option value="sales">Sales</option>
                <option value="accounts">Accounts</option>
                <option value="dispatch">EPS/Thermocol Sheet Cutting, Packaging and Dispatch Section</option>
                <option value="production">Production</option>
                <option value="packaging">EPS/Thermocol Shape Molding, Packaging and Dispatch Section</option>
                <option value="suppliers">Vendors/Suppliers</option> {/* ✅ NEW */}
              </select>
            </div>
            {role === 'production' && (
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

            {role !== 'suppliers' && (
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
            )}

            <button
              type="submit"
              disabled={isSubmitting}
              className={`w-full bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-700 transition ${
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
                className={`w-full bg-gray-300 text-gray-800 py-2 rounded-lg hover:bg-gray-400 transition ${
                  isSubmitting ? 'opacity-50 cursor-not-allowed' : ''
                }`}
              >
                Cancel Editing
              </button>
            )}

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
                <th className="px-4 py-2">Photo</th>
                <th className="px-4 py-2">Visiting Card</th>
                <th className="px-4 py-2">Name</th>
                <th className="px-4 py-2">Email</th>
                <th className="px-4 py-2">Role</th>
                <th className="px-4 py-2">Prod. Section</th>
                <th className="px-4 py-2">Phone</th>
                <th className="px-4 py-2">Attendance</th>
                <th className="px-4 py-2">DOB</th>
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
                    {{
                      sales: 'Sales',
                      accounts: 'Accounts',
                      dispatch: 'EPS/Thermocol Sheet Cutting, Packaging and Dispatch Section',
                      production: 'Production',
                      packaging: 'EPS/Thermocol Shape Molding, Packaging and Dispatch Section',
                      suppliers: 'Vendors/Suppliers', // ✅ ADD THIS
                    }[u.role] || u.role}
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
                  <td className="px-4 py-2">{u.address || "-"}</td>
                  <td className="px-4 py-2">{u.emergencyNumber || "-"}</td>
                  <td className="px-4 py-2 capitalize">{u.designation || "-"}</td>
                  <td className="px-4 py-2">{u.esicNo || "-"}</td>
                  <td className="px-4 py-2">{u.epfoNo || "-"}</td>
                  <td className="px-4 py-2">
                    <div className="flex flex-col gap-2 text-xs">
                      {u.frontFacePicture && (
                        <button
                          onClick={() => showDocument(u.frontFacePicture, "Front Face")}
                          className="px-3 py-1 bg-blue-600 text-white rounded hover:bg-blue-700 transition"
                        >
                          Front Face
                        </button>
                      )}

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