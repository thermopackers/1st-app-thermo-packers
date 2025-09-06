import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import axiosInstance from "../axiosInstance";
import InternalNavbar from "../components/InternalNavbar";
import Swal from "sweetalert2";
import withReactContent from "sweetalert2-react-content";

const MySwal = withReactContent(Swal);

export default function ProductsDetails() {
  const { id } = useParams();
  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchProduct = async () => {
      try {
        const res = await axiosInstance.get(`/products-multer/${id}`);
        setProduct(res.data);
      } catch (err) {
        console.error("Failed to fetch product", err);
      } finally {
        setLoading(false);
      }
    };
    fetchProduct();
  }, [id]);

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <p className="text-gray-500">Loading...</p>
      </div>
    );
  }

  if (!product) {
    return <p className="text-center text-red-600">Product not found</p>;
  }

  return (
    <>
      <InternalNavbar />
      <div className="max-w-4xl mx-auto p-6">
        <h1 className="text-2xl font-bold text-gray-800 mb-4">{product.name}</h1>
        
       <div className="flex gap-4 mb-6">
  {product.images?.map((img, idx) => (
    <img
      key={idx}
      src={img}
      alt={product.name}
      className="w-32 h-32 object-cover rounded shadow cursor-pointer"
      onClick={() => {
        MySwal.fire({
          html: `
            <div style="display: flex; justify-content: center; align-items: center;">
              <img src="${img}" style="max-width: 100%; max-height: 80vh; border-radius: 8px;" />
            </div>
          `,
          showConfirmButton: false,
          showCloseButton: true,   // ✅ adds ❌ close button
          closeButtonHtml: "✖",   // ✅ custom cross symbol
          width: "90%",
          padding: "1rem",
        });
      }}
    />
  ))}
</div>


        <div className="space-y-2 text-gray-700">
          <p><span className="font-semibold">Unit:</span> {product.unit}</p>
          <p><span className="font-semibold">HSN:</span> {product.hsnCode || "—"}</p>
          <p><span className="font-semibold">GST %:</span> {product.gstPercent != null ? `${product.gstPercent}%` : "—"}</p>
          <p>
            <span className="font-semibold">Stock Status:</span>{" "}
            {product.quantity > 0 ? (
              <span className="text-green-600 font-semibold">In Stock</span>
            ) : (
              <span className="text-red-600 font-semibold">Out of Stock</span>
            )}
          </p>
        </div>
      </div>
    </>
  );
}
