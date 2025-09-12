import Swal from "sweetalert2";

export default function ShowInternalImagesButton({ product }) {
  if (!product) return null;

  const handleShowImages = () => {
    if (product?.internalImages?.length > 0) {
      Swal.fire({
        title: `${product.name} - Internal Images`,
        html: `
          <div style="display:flex;flex-wrap:wrap;gap:10px;justify-content:center;">
            ${product.internalImages
              .map(
                (img, i) =>
                  `<img src="${img}" alt="Internal ${i + 1}" 
                    style="width:150px;height:150px;object-fit:cover;border-radius:8px;cursor:pointer;" 
                    onclick="window.open('${img}', '_blank')" />`
              )
              .join("")}
          </div>
        `,
        width: "800px",
        showCloseButton: true,
        showConfirmButton: false,
      });
    } else {
      Swal.fire({
        icon: "info",
        title: "No Internal Images",
        text: "No internal images available for this product.",
      });
    }
  };

  return (
    <button
      type="button"
      onClick={handleShowImages}
      className="text-blue-600 underline hover:text-blue-800 text-sm mt-2"
    >
      📸 Show Internal Images
    </button>
  );
}
