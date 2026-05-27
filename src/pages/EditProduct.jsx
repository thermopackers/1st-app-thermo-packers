import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import axiosInstance from "../axiosInstance";
import InternalNavbar from "../components/InternalNavbar";
import toast from "react-hot-toast";
import imageCompression from "browser-image-compression";
import Swal from "sweetalert2";

export default function EditProduct() {
  const { id } = useParams();
  const navigate = useNavigate();
  const BASE_URL = import.meta.env.VITE_REACT_APP_API_URL;

  const [polybagOptions, setPolybagOptions] = useState([]);

  const [formData, setFormData] = useState({
    name: "",
    unit: "",
    sizes: [],
    quantity: 0,
    hsnCode: "",
    gstPercent: "",
    description: "",
    weight: "", // Weight in grams
    pcsPerPacket: "", // Number of pieces in 1 packet
    polybagSize: "", // 🆕 Selected polybag size
  });

  const [isSubmitting, setIsSubmitting] = useState(false);

  // Product images
  const [images, setImages] = useState([]);
  const [previewUrls, setPreviewUrls] = useState([]);
  const [removedImages, setRemovedImages] = useState([]);

  // Internal images/pdfs
  const [internalImages, setInternalImages] = useState([]);
  const [internalPreviewUrls, setInternalPreviewUrls] = useState([]);
  const [removedInternalImages, setRemovedInternalImages] = useState([]);

  // 🆕 Additional images 1
  const [additionalImages1, setAdditionalImages1] = useState([]);
  const [additionalPreviewUrls1, setAdditionalPreviewUrls1] = useState([]);
  const [removedAdditionalImages1, setRemovedAdditionalImages1] = useState([]);

  // 🆕 Additional images 2
  const [additionalImages2, setAdditionalImages2] = useState([]);
  const [additionalPreviewUrls2, setAdditionalPreviewUrls2] = useState([]);
  const [removedAdditionalImages2, setRemovedAdditionalImages2] = useState([]);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

useEffect(() => {
  return () => {
    previewUrls.forEach(url => {
      if (url && url.startsWith('blob:')) URL.revokeObjectURL(url);
    });
    internalPreviewUrls.forEach(url => {
      if (url && url.startsWith('blob:')) URL.revokeObjectURL(url);
    });
    additionalPreviewUrls1.forEach(url => {
      if (url && url.startsWith('blob:')) URL.revokeObjectURL(url);
    });
    additionalPreviewUrls2.forEach(url => {
      if (url && url.startsWith('blob:')) URL.revokeObjectURL(url);
    });
  };
}, [previewUrls, internalPreviewUrls, additionalPreviewUrls1, additionalPreviewUrls2]);

  // 🆕 Fetch polybag products on component mount
  useEffect(() => {
    const fetchPolybagProducts = async () => {
      try {
        const response = await axiosInstance.get("/purchase-products/category/Lifafa Polythene bags for Packing");
        setPolybagOptions(response.data);
      } catch (error) {
        console.error("Failed to fetch polybag products:", error);
      }
    };
    fetchPolybagProducts();
  }, []);

  useEffect(() => {
    async function fetchProduct() {
      try {
        const res = await axiosInstance.get(`/products-multer/${id}`);
        
        // Convert weight from kg to grams for display
        let weightInGrams = "";
        if (res.data.weight) {
          const weightInKg = parseFloat(res.data.weight);
          weightInGrams = (weightInKg * 1000).toString();
        }
        
        setFormData({
          name: res.data.name || "",
          unit: res.data.unit || "",
          sizes: res.data.sizes || [],
          quantity: res.data.quantity || 0,
          hsnCode: res.data.hsnCode || "",
          gstPercent: res.data.gstPercent || "",
          description: res.data.description || "",
          weight: weightInGrams,
          pcsPerPacket: res.data.pcsPerPacket || "",
          polybagSize: res.data.polybagSize || "", // 🆕
        });

        // Existing product images
        if (res.data.images?.length > 0) {
          setPreviewUrls(res.data.images.map((img) => (img.startsWith("http") ? img : `${BASE_URL}${img}`)));
        }

        // Existing internal images/pdfs
        if (res.data.internalImages?.length > 0) {
          setInternalPreviewUrls(
            res.data.internalImages.map((file) => (file.startsWith("http") ? file : `${BASE_URL}${file}`))
          );
        }

        // 🆕 Existing additional images 1
        if (res.data.additionalImages1?.length > 0) {
          setAdditionalPreviewUrls1(
            res.data.additionalImages1.map((file) => (file.startsWith("http") ? file : `${BASE_URL}${file}`))
          );
        }

        // 🆕 Existing additional images 2
        if (res.data.additionalImages2?.length > 0) {
          setAdditionalPreviewUrls2(
            res.data.additionalImages2.map((file) => (file.startsWith("http") ? file : `${BASE_URL}${file}`))
          );
        }
      } catch (err) {
        setError("Failed to load product");
      } finally {
        setLoading(false);
      }
    }
    fetchProduct();
  }, [id, BASE_URL]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSizesChange = (e) => {
    const sizesArray = e.target.value.split(",").map((s) => s.trim());
    setFormData((prev) => ({ ...prev, sizes: sizesArray }));
  };

  // Normal images
  const MAX_FILE_SIZE_MB = 10;
// Normal images - FIXED
const handleImagesChange = (e) => {
  const files = Array.from(e.target.files);
  const validFiles = files.filter((file) => {
    if (file.size > MAX_FILE_SIZE_MB * 1024 * 1024) {
      toast.error(`${file.name} is larger than 10MB and was not added.`);
      return false;
    }
    return true;
  });
  if (validFiles.length === 0) return;

  // Store the actual File objects with their original names
  setImages((prev) => [...prev, ...validFiles]);
  // Create blob URLs for preview only
  setPreviewUrls((prev) => [...prev, ...validFiles.map((f) => URL.createObjectURL(f))]);
};

// Internal images/pdfs - FIXED
const handleInternalChange = async (e) => {
  const files = Array.from(e.target.files);
  const processed = [];

  for (const file of files) {
    if (file.type.startsWith("image/")) {
      const options = { maxSizeMB: 0.5, maxWidthOrHeight: 1024, useWebWorker: true };
      const compressedFile = await imageCompression(file, options);
      // Preserve original name by creating a new File object
      const renamedFile = new File([compressedFile], file.name, { type: compressedFile.type });
      processed.push(renamedFile);
    } else {
      processed.push(file);
    }
  }
  setInternalImages((prev) => [...prev, ...processed]);
  setInternalPreviewUrls((prev) => [...prev, ...processed.map((f) => URL.createObjectURL(f))]);
};

// Additional images 1 - FIXED
const handleAdditionalImages1Change = async (e) => {
  const files = Array.from(e.target.files);
  const processed = [];

  for (const file of files) {
    if (file.type.startsWith("image/")) {
      const options = { maxSizeMB: 0.5, maxWidthOrHeight: 1024, useWebWorker: true };
      const compressedFile = await imageCompression(file, options);
      const renamedFile = new File([compressedFile], file.name, { type: compressedFile.type });
      processed.push(renamedFile);
    } else {
      processed.push(file);
    }
  }
  setAdditionalImages1((prev) => [...prev, ...processed]);
  setAdditionalPreviewUrls1((prev) => [...prev, ...processed.map((f) => URL.createObjectURL(f))]);
};

// Additional images 2 - FIXED
const handleAdditionalImages2Change = async (e) => {
  const files = Array.from(e.target.files);
  const processed = [];

  for (const file of files) {
    if (file.type.startsWith("image/")) {
      const options = { maxSizeMB: 0.5, maxWidthOrHeight: 1024, useWebWorker: true };
      const compressedFile = await imageCompression(file, options);
      const renamedFile = new File([compressedFile], file.name, { type: compressedFile.type });
      processed.push(renamedFile);
    } else {
      processed.push(file);
    }
  }
  setAdditionalImages2((prev) => [...prev, ...processed]);
  setAdditionalPreviewUrls2((prev) => [...prev, ...processed.map((f) => URL.createObjectURL(f))]);
};

  const handleRemoveImage = (indexToRemove) => {
    Swal.fire({
      title: 'Are you sure?',
      text: "You want to delete this image?",
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#d33',
      cancelButtonColor: '#3085d6',
      confirmButtonText: 'Yes, delete it!',
      cancelButtonText: 'Cancel'
    }).then((result) => {
      if (result.isConfirmed) {
        const removedUrl = previewUrls[indexToRemove];
        if (!removedUrl.startsWith("blob:")) {
          const relativePath = removedUrl.replace(BASE_URL, "");
          setRemovedImages((prev) => [...prev, relativePath]);
        } else {
          setImages((prev) => prev.filter((_, i) => i !== indexToRemove));
        }
        setPreviewUrls((prev) => prev.filter((_, i) => i !== indexToRemove));
      }
    });
  };

  const handleRemoveInternal = (indexToRemove) => {
    Swal.fire({
      title: 'Are you sure?',
      text: "You want to delete this image?",
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#d33',
      cancelButtonColor: '#3085d6',
      confirmButtonText: 'Yes, delete it!',
      cancelButtonText: 'Cancel'
    }).then((result) => {
      if (result.isConfirmed) {
        const removedUrl = internalPreviewUrls[indexToRemove];
        if (!removedUrl.startsWith("blob:")) {
          const relativePath = removedUrl.replace(BASE_URL, "");
          setRemovedInternalImages((prev) => [...prev, relativePath]);
        } else {
          setInternalImages((prev) => prev.filter((_, i) => i !== indexToRemove));
        }
        setInternalPreviewUrls((prev) => prev.filter((_, i) => i !== indexToRemove));
      }
    });
  };

  // 🆕 Remove additional image 1
  const handleRemoveAdditional1 = (indexToRemove) => {
    Swal.fire({
      title: 'Are you sure?',
      text: "You want to delete this file?",
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#d33',
      cancelButtonColor: '#3085d6',
      confirmButtonText: 'Yes, delete it!',
      cancelButtonText: 'Cancel'
    }).then((result) => {
      if (result.isConfirmed) {
        const removedUrl = additionalPreviewUrls1[indexToRemove];
        if (!removedUrl.startsWith("blob:")) {
          const relativePath = removedUrl.replace(BASE_URL, "");
          setRemovedAdditionalImages1((prev) => [...prev, relativePath]);
        } else {
          setAdditionalImages1((prev) => prev.filter((_, i) => i !== indexToRemove));
        }
        setAdditionalPreviewUrls1((prev) => prev.filter((_, i) => i !== indexToRemove));
      }
    });
  };

  // 🆕 Remove additional image 2
  const handleRemoveAdditional2 = (indexToRemove) => {
    Swal.fire({
      title: 'Are you sure?',
      text: "You want to delete this file?",
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#d33',
      cancelButtonColor: '#3085d6',
      confirmButtonText: 'Yes, delete it!',
      cancelButtonText: 'Cancel'
    }).then((result) => {
      if (result.isConfirmed) {
        const removedUrl = additionalPreviewUrls2[indexToRemove];
        if (!removedUrl.startsWith("blob:")) {
          const relativePath = removedUrl.replace(BASE_URL, "");
          setRemovedAdditionalImages2((prev) => [...prev, relativePath]);
        } else {
          setAdditionalImages2((prev) => prev.filter((_, i) => i !== indexToRemove));
        }
        setAdditionalPreviewUrls2((prev) => prev.filter((_, i) => i !== indexToRemove));
      }
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setIsSubmitting(true);

    try {
      const data = new FormData();
      data.append("name", formData.name);
      data.append("unit", formData.unit);
      data.append("sizes", JSON.stringify(formData.sizes));
      data.append("quantity", formData.quantity);
      data.append("hsnCode", formData.hsnCode);
      data.append("gstPercent", formData.gstPercent);
      data.append("description", formData.description || "");
      data.append("polybagSize", formData.polybagSize || ""); // 🆕
      
      // Convert weight from grams to kg for storage
      const weightInKg = formData.weight ? parseFloat(formData.weight) / 1000 : "";
      data.append("weight", weightInKg);
      
      // Add pcsPerPacket
      data.append("pcsPerPacket", formData.pcsPerPacket ? parseInt(formData.pcsPerPacket) : 0);

      // Images
      images.forEach((imgFile) => data.append("images", imgFile));
      removedImages.forEach((imgPath) => data.append("removedImages[]", imgPath));

      // Internal
      internalImages.forEach((file) => data.append("internalImages", file));
      removedInternalImages.forEach((filePath) => data.append("removedInternalImages[]", filePath));

      // 🆕 Additional images 1
      additionalImages1.forEach((file) => data.append("additionalImages1", file));
      removedAdditionalImages1.forEach((filePath) => data.append("removedAdditionalImages1[]", filePath));

      // 🆕 Additional images 2
      additionalImages2.forEach((file) => data.append("additionalImages2", file));
      removedAdditionalImages2.forEach((filePath) => data.append("removedAdditionalImages2[]", filePath));

      await axiosInstance.put(`/products-multer/${id}`, data, {
        headers: { "Content-Type": "multipart/form-data" },
      });

      toast.success("Product updated successfully");
      navigate("/all-products");
    } catch (err) {
      console.error(err);
      setError("Failed to update product");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (loading) return <p>Loading...</p>;
  if (error) return <p className="text-red-600">{error}</p>;

  return (
    <>
      <InternalNavbar />

      <button
        className="absolute hidden top-25 md:block left-4 cursor-pointer bg-blue-500 text-white px-4 py-2 rounded-md shadow-md hover:bg-blue-600"
        onClick={() => navigate(-1)}
      >
        ↩️ Back
      </button>

      <div className="max-w-lg mx-auto p-6 relative">
        <h2 className="text-xl font-bold mb-4">Edit Sales Product</h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Basic fields with labels */}
          <div>
            <label className="block text-gray-700 font-semibold mb-2">Product Name *</label>
            <input type="text" name="name" value={formData.name} onChange={handleChange} className="w-full border p-2 rounded" required />
          </div>

          <div>
            <label className="block text-gray-700 font-semibold mb-2">Unit *</label>
            <input type="text" name="unit" value={formData.unit} onChange={handleChange} className="w-full border p-2 rounded" required />
          </div>

          <div>
            <label className="block text-gray-700 font-semibold mb-2">Sizes</label>
            <input type="text" name="sizes" value={formData.sizes.join(", ")} onChange={handleSizesChange} className="w-full border p-2 rounded" />
          </div>

          <div>
            <label className="block text-gray-700 font-semibold mb-2">HSN Code</label>
            <input type="text" name="hsnCode" value={formData.hsnCode} onChange={handleChange} className="w-full border p-2 rounded" placeholder="HSN Code" />
          </div>

          <div>
            <label className="block text-gray-700 font-semibold mb-2">GST Percentage</label>
            <input type="number" name="gstPercent" value={formData.gstPercent} onChange={handleChange} className="w-full border p-2 rounded" placeholder="GST %" min={0} max={100} />
          </div>

          {/* Product Weight - In GRAMS */}
          <div>
            <label className="block text-gray-700 font-semibold mb-2">Product Weight (grams)</label>
            <input 
              type="number"
              step="1"
              min="0"
              name="weight" 
              value={formData.weight} 
              onChange={handleChange} 
              placeholder="e.g., 500, 1000, 2500" 
              className="w-full border p-2 rounded"
            />
            <p className="text-sm text-gray-500 mt-1">Enter weight in grams (e.g., 500 for 500g)</p>
          </div>

          {/* Number of Pieces in 1 Packet */}
          <div>
            <label className="block text-gray-700 font-semibold mb-2">No. of Pieces in 1 Packet</label>
            <input 
              type="number"
              step="1"
              min="0"
              name="pcsPerPacket" 
              value={formData.pcsPerPacket} 
              onChange={handleChange} 
              placeholder="e.g., 10, 20, 50" 
              className="w-full border p-2 rounded"
            />
            <p className="text-sm text-gray-500 mt-1">Number of pieces contained in one packet</p>
          </div>

          {/* Description Field */}
          <div>
            <label className="block text-gray-700 font-semibold mb-2">Internal Description(Comments)</label>
            <textarea 
              name="description" 
              value={formData.description} 
              onChange={handleChange} 
              placeholder="Product Description"
              rows="4"
              className="w-full border p-2 rounded"
            />
          </div>

          {/* 🆕 Size of polybag/lifafa used - Dropdown */}
          <div>
            <label className="block text-gray-700 font-semibold mb-2">Size of Polybag/Lifafa Used</label>
            <select 
              name="polybagSize" 
              value={formData.polybagSize} 
              onChange={handleChange}
              className="w-full border p-2 rounded bg-white"
            >
              <option value="">Select Polybag Size</option>
              {polybagOptions.map((option) => (
                <option key={option._id} value={option._id}>
                  {option.name} {option.size ? `(${option.size})` : ''}
                </option>
              ))}
            </select>
            <p className="text-sm text-gray-500 mt-1">Select the polybag/lifafa size used for packing</p>
          </div>

          {/* Product images */}
          <label className="block font-semibold">Product Sheet Images</label>
          <div className="flex flex-wrap gap-2 mb-2">
            {previewUrls.map((url, i) => (
              <div key={i} className="relative">
                <img 
                  src={url} 
                  alt={`Preview ${i}`} 
                  className="w-32 h-32 object-cover rounded cursor-pointer"
                  onClick={() => {
                    Swal.fire({
                      html: `<div style="text-align: center;">
                               <img src="${url}" style="max-width: 100%; max-height: 70vh; border-radius: 8px;" />
                               <div style="margin-top: 10px;">
                                 <button id="closeImageBtn" style="padding: 8px 16px; background: #dc2626; color: white; border: none; border-radius: 4px; cursor: pointer;">Close</button>
                               </div>
                             </div>`,
                      showConfirmButton: false,
                      width: 'auto',
                      padding: 0,
                      didOpen: () => {
                        document.getElementById('closeImageBtn').addEventListener('click', () => {
                          Swal.close();
                        });
                      }
                    });
                  }}
                />
                <button type="button" onClick={() => handleRemoveImage(i)} className="absolute top-0 right-0 bg-red-600 text-white rounded-full w-5 h-5 text-xs">×</button>
              </div>
            ))}
          </div>
          <input type="file" accept="image/*" multiple onChange={handleImagesChange} className="w-full border p-2 rounded" />
          
          {/* Internal images/pdfs */}
          <label className="block font-semibold">Internal Product Sheet Images</label>
          <div className="flex flex-wrap gap-2 mb-2">
            {internalPreviewUrls.map((url, i) => (
              <div key={i} className="relative w-32 h-32 border rounded flex items-center justify-center overflow-hidden">
                {url.endsWith(".pdf") ? (
                  <a href={url} target="_blank" rel="noopener noreferrer" className="text-red-600 font-semibold">📄 PDF</a>
                ) : (
                  <img 
                    src={url} 
                    alt={`Internal ${i}`} 
                    className="w-full h-full object-cover cursor-pointer"
                    onClick={() => {
                      Swal.fire({
                        html: `<div style="text-align: center;">
                                 <img src="${url}" style="max-width: 100%; max-height: 70vh; border-radius: 8px;" />
                                 <div style="margin-top: 10px;">
                                   <button id="closeImageBtn" style="padding: 8px 16px; background: #dc2626; color: white; border: none; border-radius: 4px; cursor: pointer;">Close</button>
                                 </div>
                               </div>`,
                        showConfirmButton: false,
                        width: 'auto',
                        padding: 0,
                        didOpen: () => {
                          document.getElementById('closeImageBtn').addEventListener('click', () => {
                            Swal.close();
                          });
                        }
                      });
                    }}
                  />
                )}
                <button type="button" onClick={() => handleRemoveInternal(i)} className="absolute top-0 right-0 bg-red-600 text-white rounded-full w-5 h-5 text-xs">×</button>
              </div>
            ))}
          </div>
          <input type="file" accept="image/*,application/pdf" multiple onChange={handleInternalChange} className="w-full border p-2 rounded" />

          {/* 🆕 Additional File Upload Field 1 */}
          <label className="block font-semibold">Image of Weight per Piece/Set</label>
          <span className="text-sm">(Put Image of Product on Small Kanda/Weighing Scale)</span>
          <div className="flex flex-wrap gap-2 mb-2">
            {additionalPreviewUrls1.map((url, i) => (
              <div key={i} className="relative w-32 h-32 border rounded flex items-center justify-center overflow-hidden">
                {url.endsWith(".pdf") ? (
                  <a href={url} target="_blank" rel="noopener noreferrer" className="text-red-600 font-semibold">📄 PDF</a>
                ) : (
                  <img 
                    src={url} 
                    alt={`Additional1 ${i}`} 
                    className="w-full h-full object-cover cursor-pointer"
                    onClick={() => {
                      Swal.fire({
                        html: `<div style="text-align: center;">
                                 <img src="${url}" style="max-width: 100%; max-height: 70vh; border-radius: 8px;" />
                                 <div style="margin-top: 10px;">
                                   <button id="closeImageBtn" style="padding: 8px 16px; background: #dc2626; color: white; border: none; border-radius: 4px; cursor: pointer;">Close</button>
                                 </div>
                               </div>`,
                        showConfirmButton: false,
                        width: 'auto',
                        padding: 0,
                        didOpen: () => {
                          document.getElementById('closeImageBtn').addEventListener('click', () => {
                            Swal.close();
                          });
                        }
                      });
                    }}
                  />
                )}
                <button type="button" onClick={() => handleRemoveAdditional1(i)} className="absolute top-0 right-0 bg-red-600 text-white rounded-full w-5 h-5 text-xs">×</button>
              </div>
            ))}
          </div>
          <input type="file" accept="image/*,application/pdf" multiple onChange={handleAdditionalImages1Change} className="w-full border p-2 rounded" />

          {/* 🆕 Additional File Upload Field 2 */}
 <label className="block font-semibold">Product Packed Image</label>
          <span className="text-sm">(Put Image of Product Packed in Packet with Outer Dimensions of Packet mentioned on Image)</span>
                    <div className="flex flex-wrap gap-2 mb-2">
            {additionalPreviewUrls2.map((url, i) => (
              <div key={i} className="relative w-32 h-32 border rounded flex items-center justify-center overflow-hidden">
                {url.endsWith(".pdf") ? (
                  <a href={url} target="_blank" rel="noopener noreferrer" className="text-red-600 font-semibold">📄 PDF</a>
                ) : (
                  <img 
                    src={url} 
                    alt={`Additional2 ${i}`} 
                    className="w-full h-full object-cover cursor-pointer"
                    onClick={() => {
                      Swal.fire({
                        html: `<div style="text-align: center;">
                                 <img src="${url}" style="max-width: 100%; max-height: 70vh; border-radius: 8px;" />
                                 <div style="margin-top: 10px;">
                                   <button id="closeImageBtn" style="padding: 8px 16px; background: #dc2626; color: white; border: none; border-radius: 4px; cursor: pointer;">Close</button>
                                 </div>
                               </div>`,
                        showConfirmButton: false,
                        width: 'auto',
                        padding: 0,
                        didOpen: () => {
                          document.getElementById('closeImageBtn').addEventListener('click', () => {
                            Swal.close();
                          });
                        }
                      });
                    }}
                  />
                )}
                <button type="button" onClick={() => handleRemoveAdditional2(i)} className="absolute top-0 right-0 bg-red-600 text-white rounded-full w-5 h-5 text-xs">×</button>
              </div>
            ))}
          </div>
          <input type="file" accept="image/*,application/pdf" multiple onChange={handleAdditionalImages2Change} className="w-full border p-2 rounded" />

          <button type="submit" disabled={isSubmitting} className={`bg-blue-600 text-white px-4 py-2 rounded ${isSubmitting ? "opacity-50" : "hover:bg-blue-700"}`}>
            {isSubmitting ? "Updating..." : "Update Product"}
          </button>
        </form>
      </div>
    </>
  );
}