// ViewProduct.jsx
import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import axiosInstance from "../axiosInstance";
import InternalNavbar from "../components/InternalNavbar";
import Swal from "sweetalert2";

export default function ViewProduct() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const BASE_URL = import.meta.env.VITE_REACT_APP_API_URL;

  useEffect(() => {
    async function fetchProduct() {
      try {
        const res = await axiosInstance.get(`/caremax-products/${id}`);
        console.log("API Response:", res.data); // Debug: Check the response structure
        
        // ✅ FIX: Extract product from response.data.product
        if (res.data && res.data.success && res.data.product) {
          setProduct(res.data.product);
        } else if (res.data && res.data._id) {
          // If product is directly in response
          setProduct(res.data);
        } else {
          console.error("Unexpected response structure:", res.data);
          setProduct(null);
        }
      } catch (error) {
        console.error("Error fetching product:", error);
        Swal.fire({
          title: "Error",
          text: "Failed to load product details",
          icon: "error",
          confirmButtonColor: "#dc2626"
        });
      } finally {
        setLoading(false);
      }
    }
    fetchProduct();
  }, [id]);

  const handleImageClick = (imageUrl) => {
    Swal.fire({
      html: `<div style="text-align: center;">
               <img src="${imageUrl}" style="max-width: 100%; max-height: 70vh; border-radius: 8px;" />
               <div style="margin-top: 10px;">
                 <button id="closeImageBtn" style="padding: 8px 16px; background: #dc2626; color: white; border: none; border-radius: 4px; cursor: pointer;">Close</button>
               </div>
             </div>`,
      showConfirmButton: false,
      width: 'auto',
      padding: 0,
      didOpen: () => {
        const closeBtn = document.getElementById('closeImageBtn');
        if (closeBtn) {
          closeBtn.addEventListener('click', () => {
            Swal.close();
          });
        }
      }
    });
  };

  if (loading) {
    return (
      <>
        <InternalNavbar />
        <div className="text-center py-12">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-600"></div>
          <p className="mt-2 text-gray-600">Loading product details...</p>
        </div>
      </>
    );
  }

  if (!product) {
    return (
      <>
        <InternalNavbar />
        <div className="text-center py-12">
          <p className="text-red-600 text-lg">Product not found</p>
          <button
            onClick={() => navigate("/caremax-impex/all-products")}
            className="mt-4 bg-emerald-600 text-white px-4 py-2 rounded-lg hover:bg-emerald-700"
          >
            Back to Products
          </button>
        </div>
      </>
    );
  }

  return (
    <>
      <InternalNavbar />
      <div className="max-w-4xl mx-auto mt-8 p-6 bg-white rounded-lg shadow-lg">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-3xl font-bold text-gray-800">Product Details</h2>
          <button
            onClick={() => navigate(-1)}
            className="bg-gray-500 hover:bg-gray-600 text-white px-4 py-2 rounded-lg transition-colors"
          >
            ← Back
          </button>
        </div>

        {/* Product Code Badge */}
        {product.productCode && (
          <div className="mb-4 inline-block bg-emerald-100 text-emerald-800 px-3 py-1 rounded-full text-sm font-semibold">
            Code: {product.productCode}
          </div>
        )}

        <div className="grid md:grid-cols-2 gap-6">
          {/* Images Section */}
          <div>
            <h3 className="text-lg font-semibold mb-2 text-gray-700">Product Images</h3>
            <div className="flex flex-wrap gap-2">
              {product.images && product.images.length > 0 ? (
                product.images.map((img, idx) => (
                  <img
                    key={idx}
                    src={img}
                    alt={`Product ${idx + 1}`}
                    className="w-32 h-32 object-cover rounded cursor-pointer border hover:opacity-80 transition-opacity"
                    onClick={() => handleImageClick(img)}
                  />
                ))
              ) : (
                <p className="text-gray-500">No images uploaded</p>
              )}
            </div>

            <h3 className="text-lg font-semibold mt-4 mb-2 text-gray-700">Documents</h3>
            <div className="flex flex-wrap gap-2">
              {product.documents && product.documents.length > 0 ? (
                product.documents.map((file, idx) => (
                  file.endsWith(".pdf") ? (
                    <a
                      key={idx}
                      href={file}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-red-600 font-semibold underline flex items-center gap-1"
                    >
                      📄 PDF Document {idx + 1}
                    </a>
                  ) : (
                    <img
                      key={idx}
                      src={file}
                      alt={`Document ${idx + 1}`}
                      className="w-32 h-32 object-cover rounded cursor-pointer border"
                      onClick={() => handleImageClick(file)}
                    />
                  )
                ))
              ) : (
                <p className="text-gray-500">No documents uploaded</p>
              )}
            </div>
          </div>

          {/* Details Section */}
          <div className="space-y-3">
            <div className="border-b pb-2">
              <label className="font-semibold text-gray-700 block">Product Name:</label>
              <p className="text-gray-900 text-lg">{product.name}</p>
            </div>
            
            <div className="border-b pb-2">
              <label className="font-semibold text-gray-700 block">Category:</label>
              <p className="text-gray-900">{product.category || "-"}</p>
            </div>
            
            {product.subCategory && (
              <div className="border-b pb-2">
                <label className="font-semibold text-gray-700 block">Sub Category:</label>
                <p className="text-gray-900">{product.subCategory}</p>
              </div>
            )}
            
            <div className="border-b pb-2">
              <label className="font-semibold text-gray-700 block">Unit:</label>
              <p className="text-gray-900">{product.unit || "-"}</p>
            </div>
            
            {product.sizes && product.sizes.length > 0 && (
              <div className="border-b pb-2">
                <label className="font-semibold text-gray-700 block">Sizes:</label>
                <p className="text-gray-900">{product.sizes.join(", ")}</p>
              </div>
            )}
            
            {product.colors && product.colors.length > 0 && (
              <div className="border-b pb-2">
                <label className="font-semibold text-gray-700 block">Colors:</label>
                <div className="flex gap-2 mt-1">
                  {product.colors.map((color, idx) => (
                    <span key={idx} className="inline-flex items-center gap-1">
                      <span 
                        className="w-4 h-4 rounded-full border" 
                        style={{ backgroundColor: color.toLowerCase() }}
                      ></span>
                      {color}
                    </span>
                  ))}
                </div>
              </div>
            )}

{/* Tags Section - Add this where you want tags to appear */}
{product.tags && product.tags.length > 0 && (
  <div className="border-b pb-2">
    <label className="font-semibold text-gray-700 block mb-2">Tags:</label>
    <div className="flex flex-wrap gap-2">
      {product.tags.map((tag, idx) => {
        // ✅ Check if tag is a string that might be split into characters
        let displayTag = tag;
        
        // If tag is a single character and there are multiple tags that look like a word
        if (tag.length === 1 && product.tags.length > 1) {
          // Try to combine consecutive single-character tags
          const combinedTags = [];
          let currentWord = '';
          
          for (let i = 0; i < product.tags.length; i++) {
            if (product.tags[i].length === 1) {
              currentWord += product.tags[i];
            } else {
              if (currentWord) {
                combinedTags.push(currentWord);
                currentWord = '';
              }
              combinedTags.push(product.tags[i]);
            }
          }
          if (currentWord) {
            combinedTags.push(currentWord);
          }
          
          // Use combined tags if available
          if (combinedTags.length > 0 && combinedTags[idx]) {
            displayTag = combinedTags[idx];
          }
        }
        
        return (
          <span
            key={idx}
            className="inline-block bg-blue-100 text-blue-800 px-2 py-1 rounded-full text-xs font-semibold"
          >
            #{displayTag}
          </span>
        );
      })}
    </div>
  </div>
)}
            
            {product.material && (
              <div className="border-b pb-2">
                <label className="font-semibold text-gray-700 block">Material:</label>
                <p className="text-gray-900">{product.material}</p>
              </div>
            )}
            
            {product.brand && (
              <div className="border-b pb-2">
                <label className="font-semibold text-gray-700 block">Brand:</label>
                <p className="text-gray-900">{product.brand}</p>
              </div>
            )}
            
            {product.weight > 0 && (
              <div className="border-b pb-2">
                <label className="font-semibold text-gray-700 block">Weight:</label>
                <p className="text-gray-900">{product.weight}g</p>
              </div>
            )}
            
            {product.dimensions && (product.dimensions.length > 0 || product.dimensions.width > 0 || product.dimensions.height > 0) && (
              <div className="border-b pb-2">
                <label className="font-semibold text-gray-700 block">Dimensions:</label>
                <p className="text-gray-900">
                  {product.dimensions.length} × {product.dimensions.width} × {product.dimensions.height} {product.dimensions.unit || 'cm'}
                </p>
              </div>
            )}
            
            {product.pcsPerPacket > 0 && (
              <div className="border-b pb-2">
                <label className="font-semibold text-gray-700 block">Pieces per Packet:</label>
                <p className="text-gray-900">{product.pcsPerPacket} pcs</p>
              </div>
            )}
            
            {/* Pricing Section */}
            <div className="bg-gray-50 p-3 rounded-lg mt-2">
              <h4 className="font-semibold text-gray-700 mb-2">Pricing</h4>
              <div className="grid grid-cols-2 gap-2 text-sm">
                {product.mrp > 0 && (
                  <>
                    <span className="text-gray-600">MRP:</span>
                    <span className="text-gray-900 line-through">₹{product.mrp.toFixed(2)}</span>
                  </>
                )}
                <span className="text-gray-600 font-semibold">Selling Price:</span>
                <span className="text-emerald-600 font-bold">₹{product.sellingPrice?.toFixed(2) || "0.00"}</span>
                {product.purchasePrice > 0 && (
                  <>
                    <span className="text-gray-600">Purchase Price:</span>
                    <span className="text-gray-900">₹{product.purchasePrice.toFixed(2)}</span>
                  </>
                )}
                {product.gstPercent > 0 && (
                  <>
                    <span className="text-gray-600">GST:</span>
                    <span className="text-gray-900">{product.gstPercent}%</span>
                  </>
                )}
                {product.hsnCode && (
                  <>
                    <span className="text-gray-600">HSN Code:</span>
                    <span className="text-gray-900">{product.hsnCode}</span>
                  </>
                )}
              </div>
            </div>
            
            {/* Inventory Section */}
            <div className="bg-gray-50 p-3 rounded-lg">
              <h4 className="font-semibold text-gray-700 mb-2">Inventory</h4>
              <div className="grid grid-cols-2 gap-2 text-sm">
                <span className="text-gray-600">Stock Quantity:</span>
                <span className={`font-semibold ${product.stockQuantity <= product.minStockLevel ? 'text-red-600' : 'text-green-600'}`}>
                  {product.stockQuantity || 0} units
                </span>
                <span className="text-gray-600">Min Stock Level:</span>
                <span className="text-gray-900">{product.minStockLevel || 0}</span>
                <span className="text-gray-600">Max Stock Level:</span>
                <span className="text-gray-900">{product.maxStockLevel || 0}</span>
                {product.location && (
                  <>
                    <span className="text-gray-600">Location:</span>
                    <span className="text-gray-900">{product.location}</span>
                  </>
                )}
              </div>
            </div>
            
            {product.description && (
              <div className="border-b pb-2">
                <label className="font-semibold text-gray-700 block">Description:</label>
                <p className="text-gray-900 whitespace-pre-wrap">{product.description}</p>
              </div>
            )}
            
            {product.technicalSpecs && (
              <div className="border-b pb-2">
                <label className="font-semibold text-gray-700 block">Technical Specifications:</label>
                <p className="text-gray-900 whitespace-pre-wrap">{product.technicalSpecs}</p>
              </div>
            )}
            
            {/* Status Badges */}
            <div className="flex gap-2 mt-2">
              {product.isActive ? (
                <span className="bg-green-100 text-green-800 px-2 py-1 rounded-full text-xs font-semibold">Active</span>
              ) : (
                <span className="bg-red-100 text-red-800 px-2 py-1 rounded-full text-xs font-semibold">Inactive</span>
              )}
              {product.isFeatured && (
                <span className="bg-yellow-100 text-yellow-800 px-2 py-1 rounded-full text-xs font-semibold">Featured</span>
              )}
            </div>
          </div>
        </div>

        <div className="mt-6 flex justify-end space-x-3">
          <button
            onClick={() => navigate(`/caremax-impex/edit-product/${product._id}`)}
            className="bg-emerald-600 hover:bg-emerald-700 text-white px-6 py-2 rounded-lg transition-colors"
          >
            Edit Product
          </button>
        </div>
      </div>
    </>
  );
}