


// Convert product name to slug
export const slugifyProduct = (str) =>
   str
    .toLowerCase()  // Convert to lowercase
    .replace(/epsthermocol/gi, "eps-thermocol")  // Custom replacement for "epsthermocol" with case insensitivity
    .replace(/\//g, "-")           // Replace slashes with dashes
    .replace(/&/g, "and")          // Replace '&' with "and"
    .replace(/[^\w\s-]/g, "")      // Remove all non-word characters except spaces and dashes
    .replace(/\s+/g, "-")          // Replace spaces with dashes
    .replace(/-+/g, "-")           // Replace multiple dashes with one
    .replace(/^-+|-+$/g, "")       // Trim starting and ending dashes
    .trim();  // Remove leading/trailing spaces
    
// Optional: Convert slug back to readable format
export const deslugifyProduct = (slug) =>
  slug
    .replace(/-/g, " ")
    .replace(/\band\b/g, "&")       // Convert 'and' back to '&'
    .trim();
