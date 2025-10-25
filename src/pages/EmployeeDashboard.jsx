import { useToDo } from "../context/ToDoContext";
import InternalNavbar from "../components/InternalNavbar";
import { useEffect, useState } from "react";
import Swal from "sweetalert2";
import { Link, useNavigate } from "react-router-dom";
import axiosInstance from "../axiosInstance";
import SalesFollowUpForm from "./SalesFollowUpForm";
import { useParams } from "react-router-dom";
import { useUserContext } from "../context/UserContext";
import toast from "react-hot-toast";

const ITEMS_PER_PAGE = 5;

const EmployeeDashboard = () => {
  const { tasks, loading, markTaskDone, fetchTasks } = useToDo();
  const { user } = useUserContext();
  const [notifiedTasks, setNotifiedTasks] = useState([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [requisitionSlips, setRequisitionSlips] = useState({});
  const [whatsappLoading, setWhatsappLoading] = useState(false);
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);
  const [isTablet, setIsTablet] = useState(window.innerWidth >= 768 && window.innerWidth < 1024);

  const { taskId } = useParams();
  const navigate = useNavigate();
  const [notifications, setNotifications] = useState([]);

  // Responsive detection
  useEffect(() => {
    const handleResize = () => {
      const width = window.innerWidth;
      setIsMobile(width < 768);
      setIsTablet(width >= 768 && width < 1024);
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Notifications
  useEffect(() => {
    if (!user?._id) return;
    axiosInstance
      .patch(`/notifications/mark-read/${user._id}`)
      .then(() => axiosInstance.get(`/notifications/${user._id}`))
      .then((res) => setNotifications(res.data))
      .catch((err) => console.error("Failed to mark notifications as read:", err));
  }, [user]);

  // Fetch tasks
  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) return;
    fetchTasks();
  }, []);

  // Fetch requisition slips
  useEffect(() => {
    const fetchSlip = async (task) => {
      if (task.origin === "requisition" && task.requisitionId && !requisitionSlips[task.requisitionId]) {
        try {
          const res = await axiosInstance.get(`/requisitions/${task.requisitionId}`);
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

  // Task highlighting
  useEffect(() => {
    if (taskId && tasks.length > 0) {
      const index = tasks.findIndex((t) => t._id === taskId);
      if (index !== -1) {
        const pageOfTask = Math.floor(index / ITEMS_PER_PAGE) + 1;
        setCurrentPage(pageOfTask);

        setTimeout(() => {
          const el = document.getElementById(`task-${taskId}`);
          if (el) {
            el.scrollIntoView({ behavior: "smooth", block: "center" });
            el.classList.add("highlight-task");
            setTimeout(() => {
              el.classList.remove("highlight-task");
            }, 3000);
          }
        }, 800);
      }
    }
  }, [taskId, tasks]);

  // Filter and pagination logic
  const employeeVisibleTasks = tasks.filter((task) => !task.isDeletedByEmployee);
  const totalTasks = employeeVisibleTasks.length;
  const doneCount = employeeVisibleTasks.filter((task) => task.status === "DONE").length;
  const notDoneCount = totalTasks - doneCount;

  const filteredTasks = employeeVisibleTasks.filter((task) => {
    if (statusFilter === "DONE") return task.status === "DONE";
    if (statusFilter === "NOT_DONE") return task.status !== "DONE";
    return true;
  });

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

  // Task submission functions
  const confirmEditSubmission = async (taskId) => {
    const previewContainerId = "preview-container-" + Date.now();

    const { value: formValues } = await Swal.fire({
      title: "Edit Task Submission",
      html: `
        <div class="swal2-form-responsive">
          <label for="remarks">Updated Remarks:</label>
          <textarea id="remarks" class="swal2-textarea" placeholder="Enter updated remarks..."></textarea>

          <label for="doneImages" class="mt-3">Upload More Images:</label>
          <input type="file" id="doneImages" multiple accept="image/*,application/pdf" class="swal2-file">

          <div id="${previewContainerId}" class="preview-grid"></div>
        </div>
      `,
      focusConfirm: false,
      showCancelButton: true,
      confirmButtonText: "Update Task",
      cancelButtonText: "Cancel",
      customClass: {
        popup: 'swal2-popup-responsive',
        htmlContainer: 'swal2-html-responsive'
      },
      didOpen: () => {
        const fileInput = document.getElementById("doneImages");
        const previewContainer = document.getElementById(previewContainerId);
        let selectedFiles = [];

        fileInput.addEventListener("change", (e) => {
          const newFiles = Array.from(e.target.files);
          newFiles.forEach((file) => {
            if (!selectedFiles.some((f) => f.name === file.name && f.size === file.size)) {
              selectedFiles.push(file);
            }
          });

          previewContainer.innerHTML = "";
          selectedFiles.forEach((file) => {
            const isPDF = file.type === "application/pdf";
            const previewItem = document.createElement("div");
            previewItem.className = "preview-item";
            
            const img = document.createElement("img");
            img.src = isPDF ? "/images/pdf.png" : URL.createObjectURL(file);
            img.alt = file.name;
            img.className = "preview-image";
            
            previewItem.appendChild(img);
            previewContainer.appendChild(previewItem);
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
        files.forEach((file) => formData.append("doneFiles", file));

        Swal.fire({ title: "Updating...", allowOutsideClick: false });
        Swal.showLoading();

        await axiosInstance.patch(`/todos/employee-edit/${taskId}`, formData, {
          headers: { "Content-Type": "multipart/form-data" },
        });

        Swal.fire("Updated!", "Task updated successfully.", "success");
        fetchTasks();
      } catch (error) {
        console.error(error);
        Swal.fire("Error", "Failed to update task.", "error");
      }
    }
  };

  const confirmMarkDone = async (taskId) => {
    const previewContainerId = "preview-container-" + Date.now();

    const { value: formValues } = await Swal.fire({
      title: "Mark Task as Done",
      html: `
        <div class="swal2-form-responsive">
          <label for="remarks">Remarks:</label>
          <textarea id="remarks" class="swal2-textarea" placeholder="Enter remarks here..."></textarea>

          <label for="doneImages" class="mt-3">Upload Images:</label>
          <input type="file" id="doneImages" multiple accept="image/*,application/pdf" class="swal2-file">

          <div id="${previewContainerId}" class="preview-grid"></div>
        </div>
      `,
      focusConfirm: false,
      showCancelButton: true,
      confirmButtonText: "Mark as Done",
      cancelButtonText: "Cancel",
      customClass: {
        popup: 'swal2-popup-responsive',
        htmlContainer: 'swal2-html-responsive'
      },
      didOpen: () => {
        const fileInput = document.getElementById("doneImages");
        const previewContainer = document.getElementById(previewContainerId);
        let selectedFiles = [];

        fileInput.addEventListener("change", (e) => {
          const newFiles = Array.from(e.target.files);
          newFiles.forEach((file) => {
            if (!selectedFiles.some((f) => f.name === file.name && f.size === file.size)) {
              selectedFiles.push(file);
            }
          });

          previewContainer.innerHTML = "";
          selectedFiles.forEach((file) => {
            const isPDF = file.type === "application/pdf";
            const previewItem = document.createElement("div");
            previewItem.className = "preview-item";

            if (isPDF) {
              const img = document.createElement("img");
              img.src = "/images/pdf.png";
              img.className = "preview-image";
              img.style.cursor = "pointer";
              img.title = file.name;
              img.onclick = () => {
                const blobUrl = URL.createObjectURL(file);
                window.open(blobUrl, "_blank");
              };
              previewItem.appendChild(img);
            } else {
              const reader = new FileReader();
              reader.onload = () => {
                const img = document.createElement("img");
                img.src = reader.result;
                img.className = "preview-image";
                img.style.cursor = "zoom-in";
                img.setAttribute("data-full", reader.result);
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
                previewItem.appendChild(img);
              };
              reader.readAsDataURL(file);
            }
            previewContainer.appendChild(previewItem);
          });
          fileInput._selectedFiles = selectedFiles;
        });
      },
      preConfirm: () => {
        const remarks = document.getElementById("remarks").value.trim();
        const fileInput = document.getElementById("doneImages");
        const files = fileInput._selectedFiles || [];

        if (!remarks) {
          Swal.showValidationMessage("Remarks are required before marking as done");
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
        files.forEach((file) => formData.append("doneFiles", file));
        
        Swal.fire({
          title: "Uploading...",
          html: "Please wait while we upload the images.",
          allowOutsideClick: false,
          didOpen: () => Swal.showLoading(),
        });

        await axiosInstance.patch(`/todos/complete/${taskId}`, formData, {
          headers: { "Content-Type": "multipart/form-data" },
        });

        Swal.fire("Done!", "Task has been marked as completed.", "success");
        fetchTasks();
      } catch (error) {
        console.error(error);
        Swal.fire("Error", "Failed to mark the task as done.", "error");
      }
    }
  };

  // WhatsApp functions
  const sendWhatsAppWithImages = async (task) => {
    if (!task?.customerPhone) {
      toast.error("No phone number available for this customer");
      return;
    }

    setWhatsappLoading(true);
    try {
      await downloadImagesForWhatsApp(task);
    } catch (error) {
      console.error("Error in WhatsApp process:", error);
      toast.error("Failed to process WhatsApp request");
    } finally {
      setWhatsappLoading(false);
    }
  };

  const downloadImagesForWhatsApp = (task) => {
    return new Promise(async (resolve, reject) => {
      try {
        toast.loading("Preparing files for download...");
        const filesToDownload = [];

        // Product images
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

        // Visiting card
        const visitingCardUrl = user?.visitingCard || user?.visitingCardImage;
        if (visitingCardUrl) {
          filesToDownload.push({
            url: visitingCardUrl,
            name: `VisitingCard_${user.name?.replace(/[^a-zA-Z0-9]/g, '_') || 'Sales'}.jpg`,
            type: 'visitingCard'
          });
        }

        if (filesToDownload.length === 0) {
          toast.dismiss();
          toast.error("No images available to download");
          resolve();
          return;
        }

        let successCount = 0;
        let failedDownloads = [];
        
        for (let i = 0; i < filesToDownload.length; i++) {
          const file = filesToDownload[i];
          try {
            toast.loading(`Downloading ${i + 1} of ${filesToDownload.length}...`);
            const response = await axiosInstance.get(file.url, {
              responseType: 'blob',
              timeout: 30000
            });
            
            if (response.status === 200) {
              const blob = response.data;
              const url = window.URL.createObjectURL(blob);
              const a = document.createElement('a');
              a.href = url;
              a.download = file.name;
              a.style.display = 'none';
              
              document.body.appendChild(a);
              a.click();
              document.body.removeChild(a);
              
              setTimeout(() => window.URL.revokeObjectURL(url), 1000);
              successCount++;
              
              if (i < filesToDownload.length - 1) {
                await new Promise(resolve => setTimeout(resolve, 1000));
              }
            }
          } catch (error) {
            console.error(`Failed to download ${file.name}:`, error);
            failedDownloads.push(file.name);
          }
        }

        toast.dismiss();
        if (successCount > 0) {
          if (failedDownloads.length > 0) {
            toast.success(`Downloaded ${successCount}/${filesToDownload.length} files. ${failedDownloads.length} failed.`);
          } else {
            toast.success(`Successfully downloaded ${successCount} files!`);
          }
          setTimeout(() => openWhatsAppDirectly(task), 1500);
        } else {
          toast.error("Failed to download any files");
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

  const openWhatsAppDirectly = (task) => {
    if (!task?.customerPhone) return;

    let phone = task.customerPhone.replace(/\D/g, "");
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
    
    if (user?.phone) message += `${user.phone}`;

    window.open(`https://wa.me/${phone}?text=${message}`, "_blank");
  };

  const handleWhatsAppWithAutoDownload = async (task) => {
    setWhatsappLoading(true);
    try {
      await downloadImagesForWhatsApp(task);
      await sendWhatsAppWithImages(task);
    } catch (error) {
      console.error("Error in WhatsApp process:", error);
      toast.error("Failed to process WhatsApp request");
    } finally {
      setWhatsappLoading(false);
    }
  };

  const saveContactToPhone = (task) => {
    if (!task?.customerPhone) {
      toast.error("No phone number available for this customer");
      return;
    }
    const cleanPhone = task.customerPhone.replace(/\D/g, '');
    window.open(`tel:${cleanPhone}`, '_self');
    toast.success("Opening dialer with customer number. You can save it from there.");
  };

  if (loading) return <div className="p-4 text-center">Loading tasks...</div>;

  return (
    <>
      <InternalNavbar />
      <div className="dashboard-container">
        {/* Back Button */}
        <button
          className="back-button"
          onClick={() => navigate(-1)}
        >
          ↩️ {isMobile ? "" : "Back"}
        </button>

        {/* Header Section */}
        <div className="dashboard-header">
          <h1 className="dashboard-title">My Assigned Tasks</h1>
          
          <div className="filter-container">
            <span className="filter-label">Filter:</span>
            <div className="filter-buttons">
              <button
                className={`filter-btn ${statusFilter === "ALL" ? "filter-btn-active" : ""}`}
                onClick={() => setStatusFilter("ALL")}
              >
                All ({totalTasks})
              </button>
              <button
                className={`filter-btn ${statusFilter === "NOT_DONE" ? "filter-btn-active" : ""}`}
                onClick={() => setStatusFilter("NOT_DONE")}
              >
                Not Done ({notDoneCount})
              </button>
              <button
                className={`filter-btn ${statusFilter === "DONE" ? "filter-btn-active" : ""}`}
                onClick={() => setStatusFilter("DONE")}
              >
                Done ({doneCount})
              </button>
            </div>
          </div>
        </div>

        {/* Tasks List */}
        {tasks.length === 0 ? (
          <p className="no-tasks-message">No tasks assigned.</p>
        ) : (
          <>
            <div className="tasks-grid">
              {paginatedTasks.map((task) => (
                <div
                  key={task._id}
                  id={`task-${task._id}`}
                  className={`task-card ${task.isOrderFollowUp ? "follow-up-task" : ""}`}
                >
                  {/* Task Status Indicator */}
                  <div className={`task-indicator ${task.isOrderFollowUp ? "follow-up-indicator" : ""}`} />

                  <div className="task-content">
                    {/* Task Header */}
                    <div className="task-header">
                      <h2 className="task-title">
                        {task.title}
                        {task.origin === "requisition" && (
                          <span className="task-badge requisition-badge">From Requisition</span>
                        )}
                        {!task.isOrderFollowUp && task.repeat !== "ONE_TIME" && (
                          <span className="task-badge repeat-badge">
                            ⟳ {task.repeat === "DAILY" ? "Daily" : task.repeat === "MONTHLY" ? "Monthly" : "Yearly"}
                          </span>
                        )}
                      </h2>
                      {task.isOrderFollowUp && (
                        <span className="follow-up-tag">Follow-up Task</span>
                      )}
                    </div>

                    {/* Task Description */}
                    <p className="task-description">{task.description}</p>

                    {/* Products List */}
                    {task.products?.length > 0 && (
                      <div className="products-section">
                        <p className="products-title">🛒 Products to sell:</p>
                        <ul className="products-list">
                          {task.products.map((p) => (
                            <li key={p._id}>
                              <Link to={`/get-products/${p._id}`} className="product-link">
                                {p.name} {p.unit && <span className="product-unit">({p.unit})</span>}
                              </Link>
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}

                    {/* Requisition Info */}
                    {task.origin === "requisition" && requisitionSlips[task.requisitionId] && (
                      <div className="requisition-info">
                        <p><strong>🧾 Items:</strong> {requisitionSlips[task.requisitionId].items?.length || 0}</p>
                        {requisitionSlips[task.requisitionId].attachments?.some(
                          (url) => url.endsWith(".webm") || url.endsWith(".mp3")
                        ) && (
                          <div className="audio-section">
                            <p className="audio-title">🎧 Audio Notes:</p>
                            {requisitionSlips[task.requisitionId].attachments
                              .filter((url) => url.endsWith(".webm") || url.endsWith(".mp3"))
                              .map((url, i) => (
                                <audio key={i} controls className="audio-player">
                                  <source src={url} type="audio/webm" />
                                </audio>
                              ))}
                          </div>
                        )}
                      </div>
                    )}

                    {/* Task Metadata */}
                    <div className="task-metadata">
                      <p>Assigned by: {task.assignedBy?.name || "N/A"}</p>
                      {task.customerPhone && <p>Customer Phone: {task.customerPhone}</p>}
                      <p>Assigned on: {task.assignedOn ? new Date(task.assignedOn).toLocaleDateString() : "N/A"}</p>
                      
                      {!task.isOrderFollowUp && (
                        <>
                          <p>Due: {task.dueDate?.slice(0, 10) || "N/A"}</p>
                          <p>Repeat: {task.repeat === "ONE_TIME" ? "One time" : task.repeat === "DAILY" ? "Daily" : task.repeat === "MONTHLY" ? "Monthly" : "Yearly"}</p>
                          {task.repeat !== "ONE_TIME" && task.nextRepeatDate && (
                            <p>Next Repeat On: {new Date(task.nextRepeatDate).toLocaleDateString()}</p>
                          )}
                          <p className="task-status">
                            Status: <span className={task.status === "DONE" ? "status-done" : "status-pending"}>{task.status}</span>
                          </p>
                        </>
                      )}
                    </div>

                    {/* WhatsApp & Contact Actions */}
                    {task.customerPhone && (
                      <div className="action-section">
                        <div className="action-buttons">
                          <button
                            onClick={() => handleWhatsAppWithAutoDownload(task)}
                            disabled={whatsappLoading}
                            className="whatsapp-btn"
                          >
                            {whatsappLoading ? (
                              <>
                                <span className="btn-icon">⏳</span>
                                Preparing...
                              </>
                            ) : (
                              <>
                                <span className="btn-icon">📱</span>
                                Send to WhatsApp
                              </>
                            )}
                          </button>
                          
                          <button
                            onClick={() => saveContactToPhone(task)}
                            className="contact-btn"
                            title="Call and save contact"
                          >
                            <span className="btn-icon">📞</span>
                            {isMobile ? "Call" : "Save Contact"}
                          </button>
                        </div>
                        <p className="action-note">
                          Send product catalogue via WhatsApp or call/save customer contact.
                        </p>
                      </div>
                    )}

                    {/* Follow-up Form */}
                    {task.isOrderFollowUp && task.assignedBy?.role === "accounts" && (() => {
                      const followUps = task.followUps || [];
                      const today = new Date().toISOString().slice(0, 10);
                      const todayFollowUp = followUps.find(
                        (entry) => new Date(entry.date).toISOString().slice(0, 10) === today
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
                        (lastResponse === "Other (Mention comments in Box)" && lastSource !== "close");

                      if (task.isOrderFollowUp && shouldShowFollowUpForm && !notifiedTasks.includes(task._id)) {
                        toast.success("🔁 This follow-up task was updated. Please submit again.");
                        setNotifiedTasks((prev) => [...prev, task._id]);
                      }

                      return shouldShowFollowUpForm ? (
                        <SalesFollowUpForm
                          taskId={task._id}
                          onFollowUpSubmitted={fetchTasks}
                          task={task}
                        />
                      ) : (
                        <p className="follow-up-complete">
                          ✅ This order follow-up was completed based on the last response.
                        </p>
                      );
                    })()}

                    {/* Done Remarks */}
                    {task.status === "DONE" && task.doneRemarks && (
                      <p className="done-remarks">
                        <strong>Remarks:</strong> {task.doneRemarks}
                      </p>
                    )}

                    {task.status === "DONE" && task.doneOn && (
                      <p className="done-date">
                        Done on: {new Date(task.doneOn).toLocaleDateString()}
                      </p>
                    )}

                    {/* Action Buttons */}
                    <div className="task-actions">
                      {!task.isOrderFollowUp && task.status !== "DONE" && (
                        <button
                          onClick={() => confirmMarkDone(task._id)}
                          className="action-btn done-btn"
                        >
                          Mark as Done
                        </button>
                      )}

                      {!task.isOrderFollowUp && task.status === "DONE" && (
                        <button
                          onClick={() => confirmEditSubmission(task._id)}
                          className="action-btn edit-btn"
                        >
                          Edit Submission
                        </button>
                      )}
                    </div>

                    {/* Assigned Media */}
                    {task.origin !== "requisition" && task.images?.length > 0 && (
                      <div className="media-section">
                        <h4 className="media-title">📎 Assigned Media</h4>
                        <div className="media-grid">
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
                                  className="media-item"
                                >
                                  <img
                                    src="/images/pdf.png"
                                    alt="PDF"
                                    className="media-image"
                                  />
                                </a>
                              ) : (
                                <img
                                  key={idx}
                                  src={url}
                                  alt={`Image ${idx + 1}`}
                                  className="media-image"
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
                          <div className="voice-section">
                            <p className="voice-title">🎧 Voice Note</p>
                            {task.images
                              .filter((url) => url.endsWith(".webm"))
                              .map((url, i) => (
                                <audio key={i} controls className="audio-player">
                                  <source src={url} type="audio/webm" />
                                </audio>
                              ))}
                          </div>
                        )}
                      </div>
                    )}

                    {/* Done Files */}
                    {task.doneFiles?.length > 0 && (
                      <div className="media-section">
                        <h4 className="media-title">✅ Uploaded Media</h4>
                        <div className="media-grid">
                          {task.doneFiles
                            .filter((url) => !url.endsWith(".webm"))
                            .map((url, i) => {
                              const isPDF = url.toLowerCase().endsWith(".pdf");
                              return isPDF ? (
                                <a
                                  key={i}
                                  href={url}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="media-item"
                                >
                                  <img
                                    src="/images/pdf.png"
                                    alt={`PDF ${i + 1}`}
                                    className="media-image"
                                  />
                                </a>
                              ) : (
                                <img
                                  key={i}
                                  src={url}
                                  alt={`Done Image ${i + 1}`}
                                  className="media-image"
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

                        {/* Uploaded Voice Notes */}
                        {task.doneFiles.some((url) => url.endsWith(".webm")) && (
                          <div className="voice-section">
                            <p className="voice-title">🎤 Uploaded Voice Note</p>
                            {task.doneFiles
                              .filter((url) => url.endsWith(".webm"))
                              .map((url, i) => (
                                <audio key={i} controls className="audio-player">
                                  <source src={url} type="audio/webm" />
                                </audio>
                              ))}
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="pagination">
                <button
                  onClick={() => goToPage(currentPage - 1)}
                  disabled={currentPage === 1}
                  className={`pagination-btn ${currentPage === 1 ? "pagination-disabled" : ""}`}
                >
                  Prev
                </button>

                {[...Array(totalPages).keys()].map((_, i) => {
                  const pageNum = i + 1;
                  return (
                    <button
                      key={pageNum}
                      onClick={() => goToPage(pageNum)}
                      className={`pagination-btn ${pageNum === currentPage ? "pagination-active" : ""}`}
                    >
                      {pageNum}
                    </button>
                  );
                })}

                <button
                  onClick={() => goToPage(currentPage + 1)}
                  disabled={currentPage === totalPages}
                  className={`pagination-btn ${currentPage === totalPages ? "pagination-disabled" : ""}`}
                >
                  Next
                </button>
              </div>
            )}
          </>
        )}
      </div>

      <style jsx>{`
        /* Base Styles */
        .dashboard-container {
          padding: 1rem;
          max-width: 1200px;
          margin: 0 auto;
        }

        .back-button {
          position: fixed;
          top: 80px;
          left: 1rem;
          background: #3b82f6;
          color: white;
          padding: 0.75rem 1rem;
          border-radius: 0.5rem;
          box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
          border: none;
          cursor: pointer;
          z-index: 100;
          transition: all 0.3s ease;
        }

        .back-button:hover {
          background: #2563eb;
          transform: translateY(-1px);
        }

        /* Header Styles */
        .dashboard-header {
          display: flex;
          flex-direction: column;
          gap: 1rem;
          margin-bottom: 2rem;
          padding: 0 1rem;
        }

        .dashboard-title {
          font-size: 1.875rem;
          font-weight: 600;
          text-align: center;
          color: #1f2937;
        }

        .filter-container {
          display: flex;
          flex-direction: column;
          gap: 0.5rem;
          align-items: center;
        }

        .filter-label {
          color: #374151;
          font-weight: 500;
        }

        .filter-buttons {
          display: flex;
          gap: 0.5rem;
          flex-wrap: wrap;
          justify-content: center;
        }

        .filter-btn {
          padding: 0.5rem 1rem;
          border-radius: 0.375rem;
          border: 1px solid #d1d5db;
          background: #f9fafb;
          color: #374151;
          cursor: pointer;
          transition: all 0.2s ease;
          font-size: 0.875rem;
        }

        .filter-btn-active {
          background: #3b82f6;
          color: white;
          border-color: #3b82f6;
        }

        .filter-btn:hover:not(.filter-btn-active) {
          background: #e5e7eb;
        }

        /* Task Card Styles */
        .tasks-grid {
          display: flex;
          flex-direction: column;
          gap: 1.5rem;
          padding: 0 1rem;
        }

        .task-card {
          position: relative;
          border-radius: 1rem;
          padding: 1.5rem;
          background: rgba(59, 130, 246, 0.05);
          backdrop-filter: blur(16px);
          box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
          border: 1px solid rgba(255, 255, 255, 0.1);
          transition: all 0.3s ease;
        }

        .task-card:hover {
          transform: scale(1.01);
          box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1);
        }

        .task-card.follow-up-task {
          background: rgba(249, 115, 22, 0.05);
        }

        .task-indicator {
          position: absolute;
          top: 0;
          left: 0;
          height: 100%;
          width: 4px;
          border-radius: 1rem 0 0 1rem;
          background: #3b82f6;
          filter: blur(1.5px);
        }

        .follow-up-indicator {
          background: #f97316;
        }

        .task-content {
          margin-left: 0.5rem;
        }

        .task-header {
          display: flex;
          flex-direction: column;
          gap: 0.5rem;
          margin-bottom: 1rem;
        }

        .task-title {
          font-size: 1.25rem;
          font-weight: bold;
          color: #1e40af;
          display: flex;
          align-items: center;
          flex-wrap: wrap;
          gap: 0.5rem;
        }

        .task-card.follow-up-task .task-title {
          color: #c2410c;
        }

        .task-badge {
          padding: 0.25rem 0.5rem;
          border-radius: 0.25rem;
          font-size: 0.75rem;
          font-weight: 500;
        }

        .requisition-badge {
          background: #e5e7eb;
          color: #374151;
        }

        .repeat-badge {
          background: #fef3c7;
          color: #92400e;
        }

        .follow-up-tag {
          align-self: flex-start;
          background: #fed7aa;
          color: #c2410c;
          padding: 0.25rem 0.5rem;
          border-radius: 0.25rem;
          font-size: 0.75rem;
          font-weight: 600;
        }

        .task-description {
          color: #374151;
          margin-bottom: 1rem;
          line-height: 1.5;
        }

        /* Products Section */
        .products-section {
          margin-bottom: 1rem;
        }

        .products-title {
          font-weight: 600;
          color: #374151;
          margin-bottom: 0.5rem;
        }

        .products-list {
          list-style: disc;
          margin-left: 1rem;
        }

        .product-link {
          color: #2563eb;
          text-decoration: none;
        }

        .product-link:hover {
          text-decoration: underline;
        }

        .product-unit {
          color: #6b7280;
        }

        /* Requisition Info */
        .requisition-info {
          margin-bottom: 1rem;
          color: #374151;
        }

        .audio-section {
          margin-top: 0.5rem;
        }

        .audio-title {
          font-weight: 600;
          color: #4f46e5;
          margin-bottom: 0.5rem;
        }

        .audio-player {
          width: 100%;
          border-radius: 0.375rem;
          margin-bottom: 0.5rem;
        }

        /* Task Metadata */
        .task-metadata {
          color: #6b7280;
          font-size: 0.875rem;
          margin-bottom: 1rem;
        }

        .task-metadata p {
          margin-bottom: 0.25rem;
        }

        .task-status {
          font-weight: 500;
        }

        .status-done {
          color: #059669;
        }

        .status-pending {
          color: #dc2626;
        }

        /* Action Section */
        .action-section {
          margin-bottom: 1rem;
        }

        .action-buttons {
          display: flex;
          gap: 0.5rem;
          margin-bottom: 0.5rem;
        }

        .whatsapp-btn, .contact-btn {
          flex: 1;
          padding: 0.75rem 1rem;
          border: none;
          border-radius: 0.375rem;
          color: white;
          cursor: pointer;
          transition: all 0.2s ease;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 0.5rem;
          font-weight: 500;
        }

        .whatsapp-btn {
          background: #22c55e;
        }

        .whatsapp-btn:hover:not(:disabled) {
          background: #16a34a;
        }

        .whatsapp-btn:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }

        .contact-btn {
          background: #3b82f6;
        }

        .contact-btn:hover {
          background: #2563eb;
        }

        .btn-icon {
          font-size: 1rem;
        }

        .action-note {
          font-size: 0.75rem;
          color: #6b7280;
          font-style: italic;
        }

        /* Follow-up Styles */
        .follow-up-complete {
          color: #059669;
          font-size: 0.875rem;
          font-style: italic;
          margin-bottom: 1rem;
        }

        .done-remarks {
          color: #374151;
          font-style: italic;
          margin-bottom: 0.5rem;
        }

        .done-date {
          color: #6b7280;
          font-size: 0.875rem;
          margin-bottom: 1rem;
        }

        /* Task Actions */
        .task-actions {
          margin-bottom: 1rem;
        }

        .action-btn {
          padding: 0.75rem 1.5rem;
          border: none;
          border-radius: 0.375rem;
          color: white;
          cursor: pointer;
          transition: all 0.2s ease;
          font-weight: 500;
        }

        .done-btn {
          background: #059669;
        }

        .done-btn:hover {
          background: #047857;
        }

        .edit-btn {
          background: #d97706;
        }

        .edit-btn:hover {
          background: #b45309;
        }

        /* Media Sections */
        .media-section {
          margin-bottom: 1.5rem;
        }

        .media-title {
          font-size: 0.875rem;
          font-weight: 600;
          color: #374151;
          margin-bottom: 0.5rem;
        }

        .media-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(80px, 1fr));
          gap: 0.75rem;
          margin-bottom: 1rem;
        }

        .media-item, .media-image {
          width: 100%;
          height: 80px;
          object-fit: cover;
          border-radius: 0.375rem;
          border: 1px solid #d1d5db;
          box-shadow: 0 1px 3px 0 rgba(0, 0, 0, 0.1);
          cursor: pointer;
          transition: transform 0.2s ease;
        }

        .media-image:hover {
          transform: scale(1.05);
        }

        .voice-section {
          background: #f3f4f6;
          padding: 0.75rem;
          border-radius: 0.375rem;
          box-shadow: 0 1px 3px 0 rgba(0, 0, 0, 0.1);
        }

        .voice-title {
          font-size: 0.875rem;
          font-weight: 600;
          color: #059669;
          margin-bottom: 0.5rem;
        }

        /* Pagination */
        .pagination {
          display: flex;
          justify-content: center;
          gap: 0.5rem;
          margin-top: 2rem;
          flex-wrap: wrap;
        }

        .pagination-btn {
          padding: 0.5rem 1rem;
          border: 1px solid #d1d5db;
          border-radius: 0.375rem;
          background: white;
          color: #2563eb;
          cursor: pointer;
          transition: all 0.2s ease;
        }

        .pagination-btn:hover:not(.pagination-disabled) {
          background: #dbeafe;
        }

        .pagination-active {
          background: #2563eb;
          color: white;
          border-color: #2563eb;
        }

        .pagination-disabled {
          color: #9ca3af;
          border-color: #d1d5db;
          cursor: not-allowed;
        }

        .pagination-disabled:hover {
          background: white;
        }

        /* No Tasks Message */
        .no-tasks-message {
          text-align: center;
          color: #6b7280;
          padding: 2rem;
        }

        /* Highlight Animation */
        .highlight-task {
          animation: highlight-pulse 3s ease-in-out;
        }

        @keyframes highlight-pulse {
          0%, 100% { box-shadow: 0 0 0 0 rgba(250, 204, 21, 0.7); }
          50% { box-shadow: 0 0 0 8px rgba(250, 204, 21, 0); }
        }

        /* SweetAlert2 Responsive Styles */
        :global(.swal2-popup-responsive) {
          width: 90% !important;
          max-width: 500px !important;
        }

        :global(.swal2-form-responsive) {
          display: flex;
          flex-direction: column;
          gap: 1rem;
        }

        :global(.preview-grid) {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(60px, 1fr));
          gap: 0.5rem;
          margin-top: 0.5rem;
        }

        :global(.preview-item) {
          position: relative;
        }

        :global(.preview-image) {
          width: 60px;
          height: 60px;
          object-fit: contain;
          border: 1px solid #ccc;
          border-radius: 4px;
        }

        /* Responsive Design */
        @media (min-width: 640px) {
          .dashboard-container {
            padding: 1.5rem;
          }

          .dashboard-header {
            flex-direction: row;
            justify-content: space-between;
            align-items: center;
          }

          .dashboard-title {
            text-align: left;
          }

          .filter-container {
            flex-direction: row;
            align-items: center;
          }

          .task-header {
            flex-direction: row;
            justify-content: space-between;
            align-items: flex-start;
          }

          .action-buttons {
            flex-direction: row;
          }

          .media-grid {
            grid-template-columns: repeat(auto-fill, minmax(100px, 1fr));
          }

          :global(.preview-grid) {
            grid-template-columns: repeat(auto-fill, minmax(80px, 1fr));
          }

          :global(.preview-image) {
            width: 80px;
            height: 80px;
          }
        }

        @media (min-width: 768px) {
          .dashboard-container {
            padding: 2rem;
          }

          .back-button {
            position: static;
            margin-bottom: 1rem;
          }

          .tasks-grid {
            padding: 0;
          }

          .task-card {
            padding: 2rem;
          }

          .media-grid {
            grid-template-columns: repeat(auto-fill, minmax(120px, 1fr));
          }
        }

        @media (min-width: 1024px) {
          .dashboard-header {
            margin-bottom: 3rem;
          }

          .tasks-grid {
            gap: 2rem;
          }

          .action-buttons {
            gap: 1rem;
          }

          .whatsapp-btn, .contact-btn {
            flex: none;
            min-width: 200px;
          }
        }

        @media (max-width: 767px) {
          .back-button {
            top: 70px;
            left: 0.5rem;
            padding: 0.5rem 0.75rem;
            font-size: 0.875rem;
          }

          .dashboard-title {
            font-size: 1.5rem;
          }

          .task-card {
            padding: 1rem;
          }

          .task-title {
            font-size: 1.125rem;
          }

          .action-buttons {
            flex-direction: column;
          }

          .pagination {
            gap: 0.25rem;
          }

          .pagination-btn {
            padding: 0.375rem 0.75rem;
            font-size: 0.875rem;
          }
        }

        /* Print Styles */
        @media print {
          .back-button,
          .action-buttons,
          .task-actions {
            display: none;
          }

          .task-card {
            break-inside: avoid;
            box-shadow: none;
            border: 1px solid #000;
          }
        }
      `}</style>
    </>
  );
};

export default EmployeeDashboard;