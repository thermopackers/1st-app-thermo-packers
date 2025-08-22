import { useState, useEffect } from "react";
import axiosInstance from "../axiosInstance";
import toast from "react-hot-toast";
import InternalNavbar from "../components/InternalNavbar";

export default function AddCategory() {
  const [inputs, setInputs] = useState([{ name: "" }]); // multiple category inputs
  const [categories, setCategories] = useState([]);

  const fetchCategories = async () => {
    try {
      const res = await axiosInstance.get("/categories");
      setCategories(res.data);
    } catch (err) {
      toast.error("Failed to load categories");
    }
  };

  useEffect(() => {
    fetchCategories();
  }, []);

  // handle input change
  const handleInputChange = (index, value) => {
    const newInputs = [...inputs];
    newInputs[index].name = value;
    setInputs(newInputs);
  };

  // add new input row
  const addInput = () => {
    setInputs([...inputs, { name: "" }]);
  };

  // remove input row
  const removeInput = (index) => {
    setInputs(inputs.filter((_, i) => i !== index));
  };

  // submit all categories
  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const promises = inputs
        .filter((i) => i.name.trim() !== "")
        .map((i) => axiosInstance.post("/categories", { name: i.name }));

      await Promise.all(promises);

      toast.success("Categories added");
      setInputs([{ name: "" }]); // reset form
      fetchCategories();
    } catch (err) {
      toast.error(err.response?.data?.error || "Failed to add categories");
    }
  };

  return (
    <>
      <InternalNavbar />
      <div className="max-w-md mx-auto p-6 bg-white rounded shadow">
        <h2 className="text-xl font-bold mb-4">➕ Add Categories</h2>
        
        <form onSubmit={handleSubmit} className="space-y-3">
          {inputs.map((input, index) => (
            <div key={index} className="flex gap-2">
              <input
                value={input.name}
                onChange={(e) => handleInputChange(index, e.target.value)}
                placeholder="Enter category name"
                className="flex-1 border p-2 rounded"
                required
              />
              {inputs.length > 1 && (
                <button
                  type="button"
                  onClick={() => removeInput(index)}
                  className="bg-red-600 text-white px-2 rounded"
                >
                  ✕
                </button>
              )}
            </div>
          ))}

          <div className="flex gap-2">
            <button
              type="button"
              onClick={addInput}
              className="bg-blue-600 text-white px-3 py-1 rounded"
            >
              ➕ Add Another
            </button>
            <button
              type="submit"
              className="bg-green-600 text-white px-4 py-1 rounded flex-1"
            >
              Save All
            </button>
          </div>
        </form>

        <h3 className="mt-6 font-semibold">📂 Categories</h3>
        <ul className="list-disc pl-5">
          {categories.map((c) => (
            <li key={c._id}>{c.name}</li>
          ))}
        </ul>
      </div>
    </>
  );
}
