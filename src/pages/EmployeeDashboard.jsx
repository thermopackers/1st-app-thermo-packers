import { useToDo } from "../context/ToDoContext";
import InternalNavbar from "../components/InternalNavbar";
import { useEffect, useState } from "react";
import Swal from "sweetalert2"; // Make sure you have installed sweetalert2 via npm/yarn
import { Link, useNavigate } from "react-router-dom";
import axiosInstance from "../axiosInstance";
import SalesFollowUpForm from "./SalesFollowUpForm";
import { useParams, useSearchParams } from "react-router-dom";
import { useUserContext } from "../context/UserContext";
import toast from "react-hot-toast";

const ITEMS_PER_PAGE = 5;

const EmployeeDashboard = () => {
  const { tasks, loading, markTaskDone, fetchTasks } = useToDo();
  const { user } = useUserContext();
  const [notifiedTasks, setNotifiedTasks] = useState([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [statusFilter, setStatusFilter] = useState("ALL"); // ALL | DONE | NOT_DONE
  const [requisitionSlips, setRequisitionSlips] = useState({});
  const [whatsappLoading, setWhatsappLoading] = useState(false);
  console.log("userddddd", user);

  const { taskId } = useParams();
  console.log("tasks", tasks);

  const navigate = useNavigate();
  const [notifications, setNotifications] = useState([]);
  useEffect(() => {
    if (!user?._id) return; // 💡 Prevent running if user is not loaded
    axiosInstance
      .patch(`/notifications/mark-read/${user._id}`)
      .then(() => {
        return axiosInstance.get(`/notifications/${user._id}`); // ✅ fetch again
      })
      .then((res) => setNotifications(res.data))
      .catch((err) =>
        console.error("Failed to mark notifications as read:", err)
      );
  }, [user]);
  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) return; // ✅ prevent loop on login or unauthenticated pages

    fetchTasks();
  }, []);
  useEffect(() => {
    const fetchSlip = async (task) => {
      if (
        task.origin === "requisition" &&
        task.requisitionId &&
        !requisitionSlips[task.requisitionId]
      ) {
        try {
          const res = await axiosInstance.get(
            `/requisitions/${task.requisitionId}`
          );
          setRequisitionSlips((prev) => ({
            ...prev,
            [task.requisitionId]: res.data,
          }));
        } catch (err) {
          console.error("❌ Failed to load requisition slip", err);
        }
      }
    };

    tasks.forEach(fetchSlip);
  }, [tasks]);

  useEffect(() => {
    if (taskId) {
      // Delay to ensure tasks are rendered
      setTimeout(() => {
        const taskElement = document.getElementById(`task-${taskId}`);
        if (taskElement) {
          taskElement.scrollIntoView({ behavior: "smooth", block: "center" });
          taskElement.classList.add("ring-4", "ring-yellow-400");
          setTimeout(() => {
            taskElement.classList.remove("ring-4", "ring-yellow-400");
          }, 3000); // remove highlight after 3s
        }
      }, 500);
    }
  }, [tasks, taskId]);
  useEffect(() => {
    if (taskId && tasks.length > 0) {
      const index = tasks.findIndex((t) => t._id === taskId);
      if (index !== -1) {
        const pageOfTask = Math.floor(index / ITEMS_PER_PAGE) + 1;
        setCurrentPage(pageOfTask);

        // Scroll after page has been changed
        setTimeout(() => {
          const el = document.getElementById(`task-${taskId}`);
          if (el) {
            el.scrollIntoView({ behavior: "smooth", block: "center" });
            el.classList.add("ring-4", "ring-yellow-400");
            setTimeout(() => {
              el.classList.remove("ring-4", "ring-yellow-400");
            }, 3000);
          }
        }, 800); // allow render delay
      }
    }
  }, [taskId, tasks]);

  // Only show tasks not soft-deleted by the employee
  const employeeVisibleTasks = tasks.filter(
    (task) => !task.isDeletedByEmployee
  );

  // Counters
  const totalTasks = employeeVisibleTasks.length;
  const doneCount = employeeVisibleTasks.filter(
    (task) => task.status === "DONE"
  ).length;
  const notDoneCount = totalTasks - doneCount;

  // Apply status filter
  const filteredTasks = employeeVisibleTasks.filter((task) => {
    if (statusFilter === "DONE") return task.status === "DONE";
    if (statusFilter === "NOT_DONE") return task.status !== "DONE";
    return true; // ALL
  });

  // Sort: Not Done on top
  const sortedTasks = [...filteredTasks].sort((a, b) => {
    if (a.status === "DONE" && b.status !== "DONE") return 1;
    if (a.status !== "DONE" && b.status === "DONE") return -1;
    return 0;
  });

  const totalPages = Math.ceil(sortedTasks.length / ITEMS_PER_PAGE);
  const paginatedTasks = sortedTasks.slice(
    (currentPage - 1) * ITEMS_PER_PAGE,
    currentPage * ITEMS_PER_PAGE
  );

  const goToPage = (page) => {
    if (page >= 1 && page <= totalPages) setCurrentPage(page);
  };
  const confirmEditSubmission = async (taskId) => {
    const previewContainerId = "preview-container-" + Date.now();

    const { value: formValues } = await Swal.fire({
      title: "Edit Task Submission",
      html: `
      <label for="remarks">Updated Remarks:</label>
      <textarea id="remarks" class="swal2-textarea" placeholder="Enter updated remarks..."></textarea>

      <label for="doneImages" style="margin-top: 10px;">Upload More Images:</label>
      <input type="file" id="doneImages" multiple accept="image/*,application/pdf" class="swal2-file">

      <div id="${previewContainerId}" style="display: flex; flex-wrap: wrap; gap: 10px; margin-top: 10px;"></div>
    `,
      focusConfirm: false,
      showCancelButton: true,
      confirmButtonText: "Update Task",
      cancelButtonText: "Cancel",
      didOpen: () => {
        const fileInput = document.getElementById("doneImages");
        const previewContainer = document.getElementById(previewContainerId);
        let selectedFiles = [];

        fileInput.addEventListener("change", (e) => {
          const newFiles = Array.from(e.target.files);
          newFiles.forEach((file) => {
            if (
              !selectedFiles.some(
                (f) => f.name === file.name && f.size === file.size
              )
            ) {
              selectedFiles.push(file);
            }
          });

          previewContainer.innerHTML = "";
          selectedFiles.forEach((file) => {
            const isPDF = file.type === "application/pdf";
            const img = document.createElement("img");
            img.src = isPDF ? "./images/pdf.png" : URL.createObjectURL(file);
            img.style.width = "80px";
            img.style.height = "80px";
            img.style.objectFit = "contain";
            img.style.border = "1px solid #ccc";
            previewContainer.appendChild(img);
          });

          fileInput._selectedFiles = selectedFiles;
        });
      },
      preConfirm: () => {
        const remarks = document.getElementById("remarks").value.trim();
        const fileInput = document.getElementById("doneImages");
        const files = fileInput._selectedFiles || [];

        if (!remarks) {
          Swal.showValidationMessage("Remarks are required.");
          return;
        }

        return { remarks, files };
      },
    });

    if (formValues) {
      const { remarks, files } = formValues;

      try {
        const formData = new FormData();
        formData.append("doneRemarks", remarks);
        files.forEach((file) => {
          formData.append("doneFiles", file);
        });

        Swal.fire({ title: "Updating...", allowOutsideClick: false });
        Swal.showLoading();

        await axiosInstance.patch(`/todos/employee-edit/${taskId}`, formData, {
          headers: {
            "Content-Type": "multipart/form-data",
          },
        });

        Swal.fire("Updated!", "Task updated successfully.", "success");
        fetchTasks();
      } catch (error) {
        console.error(error);
        Swal.fire("Error", "Failed to update task.", "error");
      }
    }
  };

  // New function with confirmation
  const confirmMarkDone = async (taskId) => {
    const previewContainerId = "preview-container-" + Date.now(); // Unique ID

    const { value: formValues } = await Swal.fire({
      title: "Mark Task as Done",
      html: `
      <label for="remarks">Remarks:</label>
      <textarea id="remarks" class="swal2-textarea" placeholder="Enter remarks here..."></textarea>

      <label for="doneImages" style="margin-top: 10px;">Upload Images:</label>
      <input type="file" id="doneImages" multiple accept="image/*,application/pdf" class="swal2-file">

      <div id="${previewContainerId}" style="display: flex; flex-wrap: wrap; gap: 10px; margin-top: 10px;"></div>
    `,
      focusConfirm: false,
      showCancelButton: true,
      confirmButtonText: "Mark as Done",
      cancelButtonText: "Cancel",
      didOpen: () => {
        const fileInput = document.getElementById("doneImages");
        const previewContainer = document.getElementById(previewContainerId);
        let selectedFiles = [];

        fileInput.addEventListener("change", (e) => {
          const newFiles = Array.from(e.target.files);

          newFiles.forEach((file) => {
            // Avoid duplicates
            if (
              !selectedFiles.some(
                (f) => f.name === file.name && f.size === file.size
              )
            ) {
              selectedFiles.push(file);
            }
          });

          // Clear preview container
          previewContainer.innerHTML = "";

          selectedFiles.forEach((file, index) => {
            const isPDF = file.type === "application/pdf";

            if (isPDF) {
              // Show PDF icon
              const previewDiv = document.createElement("div");
              previewDiv.style.position = "relative";

              const img = document.createElement("img");
              img.src = "./images/pdf.png";
              img.style.width = "80px";
              img.style.height = "80px";
              img.style.objectFit = "contain";
              img.style.borderRadius = "4px";
              img.style.border = "1px solid #ccc";
              img.style.cursor = "pointer";
              img.title = file.name;

              img.onclick = () => {
                const blobUrl = URL.createObjectURL(file);
                window.open(blobUrl, "_blank");
              };

              const removeBtn = document.createElement("span");
              // ... same remove button logic

              previewDiv.appendChild(img);
              previewDiv.appendChild(removeBtn);
              previewContainer.appendChild(previewDiv);
            } else {
              // Existing FileReader logic for images
              const reader = new FileReader();
              reader.onload = () => {
                const previewDiv = document.createElement("div");
                previewDiv.style.position = "relative";

                const img = document.createElement("img");
                img.src = reader.result;
                img.style.width = "80px";
                img.style.height = "80px";
                img.style.cursor = "zoom-in";
                img.setAttribute("data-full", reader.result);
                img.style.objectFit = "cover";
                img.style.borderRadius = "4px";
                img.style.border = "1px solid #ccc";

                img.onclick = () => {
                  Swal.fire({
                    imageUrl: img.getAttribute("data-full"),
                    imageAlt: "Preview",
                    showConfirmButton: false,
                    showCloseButton: true,
                    width: "auto",
                    padding: "1em",
                  });
                };

                const removeBtn = document.createElement("span");
                // ... same remove button logic

                previewDiv.appendChild(img);
                previewDiv.appendChild(removeBtn);
                previewContainer.appendChild(previewDiv);
              };
              reader.readAsDataURL(file);
            }
          });

          // Replace the input files manually since Swal does not retain custom file selections
          fileInput._selectedFiles = selectedFiles;
        });
      },
      preConfirm: () => {
        const remarks = document.getElementById("remarks").value.trim();
        const fileInput = document.getElementById("doneImages");

        const files = fileInput._selectedFiles || [];

        if (!remarks) {
          Swal.showValidationMessage(
            "Remarks are required before marking as done"
          );
          return;
        }

        return { remarks, files };
      },
    });

    if (formValues) {
      const { remarks, files } = formValues;

      try {
        const formData = new FormData();
        formData.append("doneRemarks", remarks);
        files.forEach((file) => {
          formData.append("doneFiles", file); // ✅ Matches backend
        });
        Swal.fire({
          title: "Uploading...",
          html: "Please wait while we upload the images.",
          allowOutsideClick: false,
          didOpen: () => {
            Swal.showLoading();
          },
        });

        await axiosInstance.patch(`/todos/complete/${taskId}`, formData, {
          headers: {
            "Content-Type": "multipart/form-data",
          },
        });

        Swal.fire("Done!", "Task has been marked as completed.", "success");
        fetchTasks(); // Refresh task list
      } catch (error) {
        console.error(error);
        Swal.fire("Error", "Failed to mark the task as done.", "error");
      }
    }
  };

  if (loading) return <div className="p-4">Loading tasks...</div>;

  // Add this function inside your component
  // Function to send images via WhatsApp
 // Updated function to handle WhatsApp with download fallback
// Simplified main function
const sendWhatsAppWithImages = async (task) => {
  if (!task?.customerPhone) {
    toast.error("No phone number available for this customer");
    return;
  }

  setWhatsappLoading(true);

  try {
    // Download all images - this will auto-open WhatsApp when done
    await downloadImagesForWhatsApp(task);
  } catch (error) {
    console.error("Error in WhatsApp process:", error);
    toast.error("Failed to process WhatsApp request");
  } finally {
    setWhatsappLoading(false);
  }
};

// Improved function to download all images and visiting card
// Improved function to download all images and visiting card
const downloadImagesForWhatsApp = (task) => {
  return new Promise(async (resolve, reject) => {
    try {
      toast.loading("Preparing files for download...");

      // Collect all files to download
      const filesToDownload = [];

      // 1. Add product images
      if (task.products?.length > 0) {
        for (const product of task.products) {
          if (product.images && product.images.length > 0) {
            for (const imageUrl of product.images) {
              filesToDownload.push({
                url: imageUrl,
                name: `Product_${product.name.replace(/[^a-zA-Z0-9]/g, '_')}.jpg`,
                type: 'product'
              });
            }
          }
        }
      }

      // 2. Add visiting card image from user context - check multiple possible field names
      const visitingCardUrl = user?.visitingCard || user?.visitingCardImage;
      if (visitingCardUrl) {
        filesToDownload.push({
          url: visitingCardUrl,
          name: `VisitingCard_${user.name?.replace(/[^a-zA-Z0-9]/g, '_') || 'Sales'}.jpg`,
          type: 'visitingCard'
        });
        
        console.log("📇 Visiting card found:", visitingCardUrl);
      } else {
        console.log("❌ No visiting card found in user object:", user);
      }

      if (filesToDownload.length === 0) {
        toast.dismiss();
        toast.error("No images available to download");
        resolve();
        return;
      }

      console.log("📦 Files to download:", filesToDownload);

      // Download all files sequentially
      let successCount = 0;
      let failedDownloads = [];
      
      for (let i = 0; i < filesToDownload.length; i++) {
        const file = filesToDownload[i];
        
        try {
          toast.loading(`Downloading ${i + 1} of ${filesToDownload.length}...`);
          
          // Use axiosInstance to handle authenticated requests
          const response = await axiosInstance.get(file.url, {
            responseType: 'blob',
            timeout: 30000
          });
          
          if (response.status === 200) {
            const blob = response.data;
            
            // Create download link
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = file.name;
            a.style.display = 'none';
            
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            
            // Clean up
            setTimeout(() => {
              window.URL.revokeObjectURL(url);
            }, 1000);
            
            successCount++;
            console.log(`✅ Downloaded: ${file.name}`);
            
            // Delay between downloads
            if (i < filesToDownload.length - 1) {
              await new Promise(resolve => setTimeout(resolve, 1000));
            }
          } else {
            throw new Error(`HTTP ${response.status}`);
          }
          
        } catch (error) {
          console.error(`Failed to download ${file.name}:`, error);
          failedDownloads.push(file.name);
          
          // Try alternative method for CORS issues
          try {
            await downloadImageAlternative(file);
            successCount++;
            console.log(`✅ Downloaded via fallback: ${file.name}`);
          } catch (fallbackError) {
            console.error(`Fallback also failed for ${file.name}:`, fallbackError);
          }
        }
      }

      toast.dismiss();
      
      // Show results
      if (successCount > 0) {
        if (failedDownloads.length > 0) {
          toast.success(`Downloaded ${successCount}/${filesToDownload.length} files. ${failedDownloads.length} failed.`);
        } else {
          toast.success(`Successfully downloaded ${successCount} files!`);
        }
        
        // Auto-open WhatsApp after successful downloads
        setTimeout(() => {
          openWhatsAppDirectly(task);
        }, 1500);
        
      } else {
        toast.error("Failed to download any files. Trying alternative method...");
        // Try the simple method as last resort
        try {
          await downloadImagesSimple(task);
        } catch (finalError) {
          toast.error("Could not download files. Please try manual download.");
        }
      }

      resolve({ successCount, failedDownloads });
    } catch (error) {
      console.error("Error in download process:", error);
      toast.dismiss();
      toast.error("Failed to download files");
      reject(error);
    }
  });
};

// Alternative download method using canvas (for CORS issues)
const downloadImageAlternative = (file) => {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    
    img.onload = function() {
      try {
        const canvas = document.createElement('canvas');
        canvas.width = img.width;
        canvas.height = img.height;
        
        const ctx = canvas.getContext('2d');
        ctx.drawImage(img, 0, 0);
        
        canvas.toBlob((blob) => {
          const url = URL.createObjectURL(blob);
          const a = document.createElement('a');
          a.href = url;
          a.download = file.name;
          a.style.display = 'none';
          
          document.body.appendChild(a);
          a.click();
          document.body.removeChild(a);
          
          setTimeout(() => {
            URL.revokeObjectURL(url);
          }, 1000);
          
          resolve();
        }, 'image/jpeg', 0.9);
      } catch (error) {
        reject(error);
      }
    };
    
    img.onerror = function() {
      reject(new Error('Failed to load image'));
    };
    
    // Add cache busting
    img.src = file.url + (file.url.includes('?') ? '&' : '?') + `t=${Date.now()}`;
  });
};

// Simple method as last resort - opens images in new tabs
const downloadImagesSimple = async (task) => {
  const openedTabs = [];
  
  // Open visiting card
  const visitingCardUrl = user?.visitingCard || user?.visitingCardImage;
  if (visitingCardUrl) {
    window.open(visitingCardUrl, '_blank');
    openedTabs.push("Visiting Card");
    await new Promise(resolve => setTimeout(resolve, 500));
  }
  
  // Open product images
  if (task.products?.length > 0) {
    for (const product of task.products) {
      if (product.images && product.images.length > 0) {
        for (const imageUrl of product.images) {
          window.open(imageUrl, '_blank');
          openedTabs.push(`Product: ${product.name}`);
          await new Promise(resolve => setTimeout(resolve, 500));
        }
      }
    }
  }
  
  if (openedTabs.length > 0) {
    Swal.fire({
      title: "Manual Download Required",
      html: `
        <p>${openedTabs.length} image(s) have been opened in new tabs.</p>
        <p class="text-sm mt-2">Please manually save each image:</p>
        <ol class="text-left pl-4 mt-1 text-sm">
          <li>Long press on each image (mobile)</li>
          <li>Or right-click → Save Image (desktop)</li>
          <li>Save all images to your device</li>
          <li>Then share via WhatsApp</li>
        </ol>
        <p class="mt-3 text-xs text-gray-600">Files opened: ${openedTabs.join(', ')}</p>
      `,
      icon: "info",
      confirmButtonText: "OK"
    });
  } else {
    toast.error("No images available to download");
  }
};

// Helper function to open WhatsApp directly
const openWhatsAppDirectly = (task) => {
  if (!task?.customerPhone) return;

  let phone = task.customerPhone.replace(/\D/g, "");
  
  // Format phone number for WhatsApp
  if (phone.startsWith("91") && phone.length === 12) {
    phone = "+" + phone;
  } else if (phone.length === 10) {
    phone = "+91" + phone;
  } else if (phone.startsWith("91") && !phone.startsWith("+")) {
    phone = "+" + phone;
  }

  const salesPersonName = user?.name || "Sales Representative";
  let message = `Dear Sir/Ma'am,%0A%0A`;
  message += `This is regarding your requirement of packaging requirement in EPS/Pulp. %0A%0A`;
  
  if (task.products?.length > 0) {
    message += `🛒 *Products*:%0A`;
    task.products.forEach((p, i) => {
      message += `${i + 1}. ${p.name} ${p.unit ? `(${p.unit})` : ""}%0A`;
    });
    message += `%0A`;
  }
  
  message += `I've shared our product catalogue and visiting card through downloaded files.%0A%0A`;
  message += `Thanks,%0A${salesPersonName}%0A`;
  
  if (user?.phone) {
    message += `${user.phone}`;
  }

  // Open WhatsApp
  window.open(`https://wa.me/${phone}?text=${message}`, "_blank");
};

  // Combined function to download images and open WhatsApp
  const handleWhatsAppWithAutoDownload = async (task) => {
    setWhatsappLoading(true);

    try {
      // First download all images
      await downloadImagesForWhatsApp(task);

      // Then open WhatsApp
      await sendWhatsAppWithImages(task);
    } catch (error) {
      console.error("Error in WhatsApp process:", error);
      toast.error("Failed to process WhatsApp request");
    } finally {
      setWhatsappLoading(false);
    }
  };

// Function to open dialer with customer number
const saveContactToPhone = (task) => {
  if (!task?.customerPhone) {
    toast.error("No phone number available for this customer");
    return;
  }

  // Clean the phone number (remove any non-digit characters)
  const cleanPhone = task.customerPhone.replace(/\D/g, '');
  
  // Open tel: link to trigger phone dialer
  window.open(`tel:${cleanPhone}`, '_self');
  
  toast.success("Opening dialer with customer number. You can save it from there.");
};

  return (
    <>
      <InternalNavbar />
      <div className="p-4 max-w-5xl mx-auto">
        <button
          className="absolute cursor-pointer left-4 hidden md:block bg-blue-500 text-white px-4 py-2 rounded-md shadow-md hover:bg-blue-600 back-button"
          onClick={() => navigate(-1)}
        >
          ↩️ Back
        </button>
        <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-6 gap-4">
          <h1 className="text-2xl font-semibold text-center md:text-left">
            My ToDos
          </h1>

          <div className="flex flex-wrap gap-3 items-center justify-center md:justify-end">
            <span className="text-gray-700">Filter:</span>
            <button
              className={`px-3 py-1 rounded ${
                statusFilter === "ALL"
                  ? "bg-blue-600 text-white"
                  : "bg-gray-200"
              }`}
              onClick={() => setStatusFilter("ALL")}
            >
              All ({totalTasks})
            </button>
            <button
              className={`px-3 py-1 rounded ${
                statusFilter === "NOT_DONE"
                  ? "bg-yellow-500 text-white"
                  : "bg-gray-200"
              }`}
              onClick={() => setStatusFilter("NOT_DONE")}
            >
              Not Done ({notDoneCount})
            </button>
            <button
              className={`px-3 py-1 rounded ${
                statusFilter === "DONE"
                  ? "bg-green-600 text-white"
                  : "bg-gray-200"
              }`}
              onClick={() => setStatusFilter("DONE")}
            >
              Done ({doneCount})
            </button>
          </div>
        </div>

        {tasks.length === 0 ? (
          <p className="text-center text-gray-600">No tasks assigned.</p>
        ) : (
          <>
            <div className="space-y-6">
              {paginatedTasks.map((task) => (
                <div
                  key={task._id}
                  id={`task-${task._id}`}
                  className={`
    relative rounded-2xl p-5 sm:flex sm:justify-between sm:items-center sm:space-x-4
    transition-all duration-300 backdrop-blur-lg
    shadow-lg ring-1 ring-white/10 border border-white/10
    ${task.isOrderFollowUp ? "bg-orange-300/10" : "bg-blue-300/10"}
    hover:scale-[1.01] hover:shadow-2xl
  `}
                >
                  {/* Glowing Left Border */}
                  <div
                    className={`
      absolute top-0 left-0 h-full w-1.5 rounded-l-xl 
      ${task.isOrderFollowUp ? "bg-orange-500" : "bg-blue-500"}
      blur-[1.5px] drop-shadow-yellow-400
    `}
                  />
                  <div className="flex-1">
                    {task.isOrderFollowUp && (
                      <span className="text-orange-600 font-semibold p-1 bg-orange-200 text-sm ml-1">
                        Follow-up Task
                      </span>
                    )}
                    <h2
                      className={`text-lg font-bold flex items-center ${
                        task.isOrderFollowUp
                          ? "text-orange-700"
                          : "text-blue-700"
                      }`}
                    >
                      {task.title}
                      {/* ✅ Show badge if it's from requisition */}
                      {task.origin === "requisition" && (
                        <span className="ml-2 px-2 py-0.5 bg-gray-200 text-gray-600 text-xs rounded">
                          From Requisition
                        </span>
                      )}
                      {!task.isOrderFollowUp && task.repeat !== "ONE_TIME" && (
                        <span className="ml-2 px-2 py-0.5 text-xs bg-yellow-200 text-yellow-800 rounded">
                          ⟳{" "}
                          {task.repeat === "DAILY"
                            ? "Daily"
                            : task.repeat === "MONTHLY"
                            ? "Monthly"
                            : "Yearly"}
                        </span>
                      )}
                    </h2>
                    <p className="text-gray-700 mt-1">{task.description}</p>
                    {task.products?.length > 0 && (
                      <div className="mt-2 text-sm text-gray-800">
                        <p className="font-semibold text-gray-700">
                          🛒 Products to sell:
                        </p>
                        <ul className="list-disc list-inside">
                          {task.products.map((p) => (
                            <li key={p._id}>
                              <Link
                                to={`/get-products/${p._id}`}
                                className="text-blue-600 hover:underline"
                              >
                                {p.name}{" "}
                                {p.unit && (
                                  <span className="text-gray-500">
                                    ({p.unit})
                                  </span>
                                )}
                              </Link>
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}

                    {/* ✅ Show requisition info if available */}
                    {task.origin === "requisition" &&
                      requisitionSlips[task.requisitionId] && (
                        <div className="mt-2 space-y-1 text-sm text-gray-700">
                          <p>
                            <strong>🧾 Items:</strong>{" "}
                            {requisitionSlips[task.requisitionId].items
                              ?.length || 0}
                          </p>

                          {requisitionSlips[
                            task.requisitionId
                          ].attachments?.some(
                            (url) =>
                              url.endsWith(".webm") || url.endsWith(".mp3")
                          ) && (
                            <div className="space-y-1">
                              <p className="font-medium text-indigo-700">
                                🎧 Audio Notes:
                              </p>
                              {requisitionSlips[task.requisitionId].attachments
                                .filter(
                                  (url) =>
                                    url.endsWith(".webm") ||
                                    url.endsWith(".mp3")
                                )
                                .map((url, i) => (
                                  <audio
                                    key={i}
                                    controls
                                    className="w-full rounded"
                                  >
                                    <source src={url} type="audio/webm" />
                                  </audio>
                                ))}
                            </div>
                          )}
                        </div>
                      )}

                    <p className="text-sm text-gray-500 mt-2">
                      Assigned by: {task.assignedBy?.name || "N/A"}
                    </p>

                    {/* Add this line to show the customer phone number */}
                    {task.customerPhone && (
                      <p className="text-sm text-gray-500">
                        Customer Phone: {task.customerPhone}
                      </p>
                    )}
                    <p className="text-sm text-gray-500">
                      Assigned on:{" "}
                      {task.assignedOn
                        ? new Date(task.assignedOn).toLocaleDateString()
                        : "N/A"}
                    </p>
{/* WhatsApp Button - Show for tasks with customer phone number */}
{task.customerPhone && (
  <div className="mt-4 space-y-2">
    <div className="flex gap-2">
      <button
        onClick={() => handleWhatsAppWithAutoDownload(task)}
        disabled={whatsappLoading}
        className="px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600 transition-colors duration-200 flex items-center disabled:opacity-50 flex-1"
      >
        {whatsappLoading ? (
          <>
            <span className="mr-2">⏳</span>
            Preparing...
          </>
        ) : (
          <>
            <span className="mr-2">📱</span>
            Send to WhatsApp
          </>
        )}
      </button>
      
      <button
        onClick={() => saveContactToPhone(task)}
        className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors duration-200 flex items-center"
        title="Call and save contact"
      >
        <span className="mr-2">📞</span>
        Save Contact
      </button>
    </div>
    
    {/* 📌 Added note below buttons */}
    <p className="text-xs text-gray-600 italic">
      Send product catalogue via WhatsApp or call/save customer contact.
    </p>
  </div>
)}

                    {!task.isOrderFollowUp && (
                      <>
                        <p className="text-sm text-gray-500">
                          Due: {task.dueDate?.slice(0, 10) || "N/A"}
                        </p>
                        <p className="text-sm text-gray-500">
                          Repeat:{" "}
                          {task.repeat === "ONE_TIME"
                            ? "One time"
                            : task.repeat === "DAILY"
                            ? "Daily"
                            : task.repeat === "MONTHLY"
                            ? "Monthly"
                            : "Yearly"}
                        </p>
                        {task.repeat !== "ONE_TIME" && task.nextRepeatDate && (
                          <p className="text-sm text-gray-500">
                            Next Repeat On:{" "}
                            {new Date(task.nextRepeatDate).toLocaleDateString()}
                          </p>
                        )}
                      </>
                    )}

                    {!task.isOrderFollowUp && (
                      <p className="mt-2 font-medium">
                        Status:{" "}
                        <span
                          className={
                            task.status === "DONE"
                              ? "text-green-600"
                              : "text-red-600"
                          }
                        >
                          {task.status}
                        </span>
                      </p>
                    )}

                    {task.isOrderFollowUp &&
                      task.assignedBy?.role === "accounts" &&
                      (() => {
                        const followUps = task.followUps || [];
                        const today = new Date().toISOString().slice(0, 10);
                        const todayFollowUp = followUps.find(
                          (entry) =>
                            new Date(entry.date).toISOString().slice(0, 10) ===
                            today
                        );
                        const lastFollowUp = followUps[followUps.length - 1];

                        const continueResponses = [
                          "No Response / Call Not Answered",
                          "Number Unreachable / Switched Off",
                          "Follow-up Requested – Call Scheduled for Later",
                        ];

                        const lastResponse = lastFollowUp?.response?.trim();
                        const lastSource = lastFollowUp?.source?.trim();

                        const shouldShowFollowUpForm =
                          !todayFollowUp ||
                          continueResponses.includes(lastResponse) ||
                          (lastResponse === "Other (Mention comments in Box)" &&
                            lastSource !== "close");

                        if (
                          task.isOrderFollowUp &&
                          shouldShowFollowUpForm &&
                          !notifiedTasks.includes(task._id)
                        ) {
                          toast.success(
                            "🔁 This follow-up task was updated. Please submit again."
                          );
                          setNotifiedTasks((prev) => [...prev, task._id]);
                        }

                        if (shouldShowFollowUpForm) {
                          return (
                            <SalesFollowUpForm
                              taskId={task._id}
                              onFollowUpSubmitted={fetchTasks}
                              task={task} // Pass the entire task object
                            />
                          );
                        }

                        return (
                          <p className="text-sm text-green-700 mt-2 italic">
                            ✅ This order follow-up was completed based on the
                            last response.
                          </p>
                        );
                      })()}

                    {/* Show done remarks if task is DONE and remarks exist */}
                    {task.status === "DONE" && task.doneRemarks && (
                      <p className="mt-2 text-gray-700 italic">
                        <strong>Remarks:</strong> {task.doneRemarks}
                      </p>
                    )}

                    {/* Optionally show doneOn date */}
                    {task.status === "DONE" && task.doneOn && (
                      <p className="text-sm text-gray-500 mt-1">
                        Done on: {new Date(task.doneOn).toLocaleDateString()}
                      </p>
                    )}
                  </div>

                  {/* Show Mark as Done button if status is NOT DONE OR if edited after done */}
                  {!task.isOrderFollowUp && task.status !== "DONE" && (
                    <button
                      onClick={() => confirmMarkDone(task._id)}
                      className="mt-4 sm:mt-0 px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 transition-colors duration-200"
                    >
                      Mark as Done
                    </button>
                  )}

                  {!task.isOrderFollowUp && task.status === "DONE" && (
                    <button
                      onClick={() => confirmEditSubmission(task._id)}
                      className="mt-4 sm:mt-0 px-4 py-2 bg-yellow-500 text-white rounded hover:bg-yellow-600 transition-colors duration-200"
                    >
                      Edit Submission
                    </button>
                  )}

                  {/* Show assigned images */}
                  {/* Assigned Media Section */}
                  {task.origin !== "requisition" && task.images?.length > 0 && (
                    <div className="mt-4">
                      <h4 className="text-sm font-semibold text-gray-700 mb-2">
                        📎 Assigned Media
                      </h4>
                      <div className="flex flex-wrap gap-3">
                        {task.images
                          .filter((url) => !url.endsWith(".webm"))
                          .map((url, idx) => {
                            const isPDF = url.toLowerCase().endsWith(".pdf");
                            return isPDF ? (
                              <a
                                key={idx}
                                href={url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="inline-block w-24 h-24"
                              >
                                <img
                                  src="/images/pdf.png"
                                  alt="PDF"
                                  className="w-full h-full object-contain border rounded shadow"
                                />
                              </a>
                            ) : (
                              <img
                                key={idx}
                                src={url}
                                alt={`Image ${idx + 1}`}
                                className="w-24 h-24 object-cover border rounded shadow cursor-pointer"
                                onClick={() =>
                                  Swal.fire({
                                    imageUrl: url,
                                    imageAlt: "Assigned Image",
                                    showConfirmButton: false,
                                    showCloseButton: true,
                                    width: "auto",
                                  })
                                }
                              />
                            );
                          })}
                      </div>

                      {/* Voice Notes */}
                      {task.images.some((url) => url.endsWith(".webm")) && (
                        <div className="mt-4 bg-gray-100 p-3 rounded shadow">
                          <p className="text-sm font-semibold text-indigo-700 mb-2">
                            🎧 Voice Note
                          </p>
                          {task.images
                            .filter((url) => url.endsWith(".webm"))
                            .map((url, i) => (
                              <audio
                                key={i}
                                controls
                                className="w-full rounded"
                              >
                                <source src={url} type="audio/webm" />
                              </audio>
                            ))}
                        </div>
                      )}
                    </div>
                  )}

                  {task.doneFiles?.length > 0 && (
                    <div>
                      <h4 className="font-semibold text-gray-700 mb-2">
                        Uploaded Files:
                      </h4>
                      <div
                        style={{
                          display: "flex",
                          flexWrap: "wrap",
                          gap: "10px",
                        }}
                      >
                        {/* Uploaded Media Section */}
                        {task.doneFiles?.length > 0 && (
                          <div className="mt-6">
                            <h4 className="text-sm font-semibold text-gray-700 mb-2">
                              ✅ Uploaded Media
                            </h4>
                            <div className="flex flex-wrap gap-3">
                              {task.doneFiles
                                .filter((url) => !url.endsWith(".webm"))
                                .map((url, i) => {
                                  const isPDF = url
                                    .toLowerCase()
                                    .endsWith(".pdf");
                                  return isPDF ? (
                                    <a
                                      key={i}
                                      href={url}
                                      target="_blank"
                                      rel="noopener noreferrer"
                                      className="inline-block w-24 h-24"
                                    >
                                      <img
                                        src="/images/pdf.png"
                                        alt={`PDF ${i + 1}`}
                                        className="w-full h-full object-contain border rounded shadow"
                                      />
                                    </a>
                                  ) : (
                                    <img
                                      key={i}
                                      src={url}
                                      alt={`Done Image ${i + 1}`}
                                      className="w-24 h-24 object-cover border rounded shadow cursor-pointer"
                                      onClick={() =>
                                        Swal.fire({
                                          imageUrl: url,
                                          imageAlt: "Done Image",
                                          showConfirmButton: false,
                                          showCloseButton: true,
                                          width: "50vw",
                                        })
                                      }
                                    />
                                  );
                                })}
                            </div>

                            {/* Uploaded Voice Note */}
                            {task.doneFiles.some((url) =>
                              url.endsWith(".webm")
                            ) && (
                              <div className="mt-4 bg-gray-100 p-3 rounded shadow">
                                <p className="text-sm font-semibold text-green-700 mb-2">
                                  🎤 Uploaded Voice Note
                                </p>
                                {task.doneFiles
                                  .filter((url) => url.endsWith(".webm"))
                                  .map((url, i) => (
                                    <audio
                                      key={i}
                                      controls
                                      className="w-full rounded"
                                    >
                                      <source src={url} type="audio/webm" />
                                    </audio>
                                  ))}
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>

            {/* Pagination controls */}
            <div className="flex justify-center mt-8 space-x-3 flex-wrap">
              <button
                onClick={() => goToPage(currentPage - 1)}
                disabled={currentPage === 1}
                className={`px-3 py-1 rounded border ${
                  currentPage === 1
                    ? "text-gray-400 border-gray-300 cursor-not-allowed"
                    : "text-blue-600 border-blue-600 hover:bg-blue-100"
                }`}
              >
                Prev
              </button>

              {[...Array(totalPages).keys()].map((_, i) => {
                const pageNum = i + 1;
                return (
                  <button
                    key={pageNum}
                    onClick={() => goToPage(pageNum)}
                    className={`px-3 py-1 rounded border ${
                      pageNum === currentPage
                        ? "bg-blue-600 text-white border-blue-600"
                        : "text-blue-600 border-blue-600 hover:bg-blue-100"
                    }`}
                  >
                    {pageNum}
                  </button>
                );
              })}

              <button
                onClick={() => goToPage(currentPage + 1)}
                disabled={currentPage === totalPages}
                className={`px-3 py-1 rounded border ${
                  currentPage === totalPages
                    ? "text-gray-400 border-gray-300 cursor-not-allowed"
                    : "text-blue-600 border-blue-600 hover:bg-blue-100"
                }`}
              >
                Next
              </button>
            </div>
          </>
        )}
      </div>
    </>
  );
};

export default EmployeeDashboard;
