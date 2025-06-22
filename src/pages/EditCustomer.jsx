import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import axiosInstance from "../axiosInstance";
import InternalNavbar from "../components/InternalNavbar";
import toast from "react-hot-toast";

export default function EditCustomer() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [customer, setCustomer] = useState(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [newFiles, setNewFiles] = useState([]);
  const [removedDocs, setRemovedDocs] = useState([]);

  useEffect(() => {
    async function fetchCustomer() {
      try {
        const res = await axiosInstance.get(`/customers/${id}`);
        setCustomer(res.data);
      } catch (err) {
        if (err.response?.status === 404) {
          toast.error("Customer not found or deleted");
          navigate("/customers");
        } else {
          toast.error("Failed to load customer");
        }
      } finally {
        setLoading(false);
      }
    }

    fetchCustomer();
  }, [id, navigate]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setCustomer((prev) => ({ ...prev, [name]: value }));
  };

  const handleFileChange = (e) => {
    const files = Array.from(e.target.files);
    setNewFiles((prev) => [...prev, ...files]);
  };

  const handleRemoveExistingDoc = (url) => {
    setRemovedDocs((prev) => [...prev, url]);
    setCustomer((prev) => ({
      ...prev,
      gstDocs: prev.gstDocs?.filter((doc) => doc !== url),
    }));
  };

  const handleRemoveNewDoc = (index) => {
    setNewFiles((prev) => prev.filter((_, i) => i !== index));
  };

  const uploadToCloudinary = async (files) => {
    const uploads = files.map(async (file) => {
      const data = new FormData();
      data.append("file", file);
      data.append("upload_preset", "todo_uploads");
      data.append("cloud_name", "dcr8k5amk");

      const res = await fetch("https://api.cloudinary.com/v1_1/dcr8k5amk/upload", {
        method: "POST",
        body: data,
      });

      const result = await res.json();
      return result.secure_url;
    });

    return Promise.all(uploads);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);

    try {
      let uploadedUrls = [];
      if (newFiles.length > 0) {
        toast.loading("Uploading new documents...");
        uploadedUrls = await uploadToCloudinary(newFiles);
        toast.dismiss();
      }

      const updatedCustomer = {
        ...customer,
        gstDocs: [...(customer.gstDocs || []), ...uploadedUrls],
      };

      await axiosInstance.put(`/customers/${id}`, updatedCustomer);
      toast.success("Customer updated successfully");
      navigate("/customers");
    } catch (err) {
      console.error(err);
      toast.error("Failed to update customer");
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!window.confirm("Delete this customer?")) return;
    setDeleting(true);

    try {
      await axiosInstance.delete(`/customers/${id}`);
      toast.success("Customer deleted successfully!");
      navigate("/customers");
    } catch (err) {
      toast.error("Failed to delete customer");
    } finally {
      setDeleting(false);
    }
  };

  if (loading) return <p>Loading customer...</p>;
  if (!customer) return null;

  return (
    <>
      <InternalNavbar />
      <div className="max-w-lg mx-auto p-6">
        <h2 className="text-xl font-bold mb-4">Edit Customer</h2>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block mb-1 font-semibold">Name</label>
            <input
              type="text"
              name="name"
              value={customer.name || ""}
              onChange={handleChange}
              required
              className="w-full border p-2 rounded"
            />
          </div>

          <div>
            <label className="block mb-1 font-semibold">GST No.</label>
            <input
              type="text"
              name="company"
              value={customer.company || ""}
              onChange={handleChange}
              className="w-full border p-2 rounded"
            />
          </div>

          <div>
            <label className="block mb-1 font-semibold">Phone</label>
            <input
              type="tel"
              name="phone"
              value={customer.phone || ""}
              onChange={handleChange}
              className="w-full border p-2 rounded"
            />
          </div>

          <div>
            <label className="block mb-1 font-semibold">Email</label>
            <input
              type="email"
              name="email"
              value={customer.email || ""}
              onChange={handleChange}
              className="w-full border p-2 rounded"
            />
          </div>

          <div>
            <label className="block mb-1 font-semibold">Address</label>
            <textarea
              name="address"
              value={customer.address || ""}
              onChange={handleChange}
              rows={3}
              className="w-full border p-2 rounded"
            />
          </div>

          <div>
            <label className="block mb-1 font-semibold">Google Maps Link</label>
            <input
              name="locationLink"
              value={customer.locationLink || ""}
              onChange={handleChange}
              placeholder="https://maps.google.com/..."
              className="w-full border p-2 rounded"
            />
          </div>

          <div>
            <label className="block mb-1 font-semibold">GST Documents</label>
            <input
              type="file"
              accept="image/*,.pdf"
              multiple
              onChange={handleFileChange}
              className="w-full border p-2 rounded"
            />

            {/* Show existing */}
            {customer.gstDocs?.length > 0 && (
              <div className="mt-2 space-y-1">
                <p className="text-sm font-medium text-gray-600">Existing Files:</p>
                <div className="flex flex-wrap gap-3">
                  {customer.gstDocs.map((url, i) => (
                    <div key={i} className="relative border p-2 rounded bg-gray-100">
                      {url?.match(/\.(jpg|jpeg|png|gif)$/i) ? (
                        <img
                          src={url}
                          alt={`doc-${i}`}
                          className="w-24 h-24 object-cover rounded"
                        />
                      ) : (
                        <a
                          href={url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-blue-600 underline"
                        >
                          📄 PDF {i + 1}
                        </a>
                      )}
                      <button
                        type="button"
                        onClick={() => handleRemoveExistingDoc(url)}
                        className="absolute top-1 right-1 text-white bg-red-500 hover:bg-red-600 rounded-full w-5 h-5 text-xs"
                      >
                        ×
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Show new */}
            {newFiles.length > 0 && (
              <div className="mt-4">
                <p className="text-sm font-medium text-gray-600">New Files to Upload:</p>
                <div className="flex flex-wrap gap-3">
                  {newFiles.map((file, i) => {
                    const isImage = file.type.startsWith("image/");
                    return (
                      <div key={i} className="relative border p-2 rounded bg-gray-100">
                        {isImage ? (
                          <img
                            src={URL.createObjectURL(file)}
                            alt={`new-doc-${i}`}
                            className="w-24 h-24 object-cover rounded"
                          />
                        ) : (
                          <p className="text-xs text-center">{file.name}</p>
                        )}
                        <button
                          type="button"
                          onClick={() => handleRemoveNewDoc(i)}
                          className="absolute top-1 right-1 text-white bg-red-500 hover:bg-red-600 rounded-full w-5 h-5 text-xs"
                        >
                          ×
                        </button>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>

          <div className="flex justify-between items-center space-x-4">
            <button
              type="submit"
              disabled={submitting || deleting}
              className={`bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 ${
                submitting || deleting ? "opacity-50 cursor-not-allowed" : ""
              }`}
            >
              {submitting ? "Saving..." : "Save Changes"}
            </button>

            <button
              type="button"
              onClick={handleDelete}
              disabled={submitting || deleting}
              className={`bg-red-600 text-white px-4 py-2 rounded hover:bg-red-700 ${
                submitting || deleting ? "opacity-50 cursor-not-allowed" : ""
              }`}
            >
              {deleting ? "Deleting..." : "Delete Customer"}
            </button>
          </div>
        </form>
      </div>
    </>
  );
}
