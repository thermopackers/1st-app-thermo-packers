// utils/slugify.js

// Slugify the product name (for URL)
// export const slugifyProduct = (str) =>
//   str
//     .toLowerCase()
//     .replace(/\//g, "-")          // Replace slashes with dash
//     .replace(/&/g, "and")          // Replace & with 'and'
//     .replace(/[^\w\s-]/g, "")      // Remove unwanted characters except words, spaces, and dashes
//     .replace(/\s+/g, "-")          // Replace spaces with dash
//     .replace(/-+/g, "-")           // Replace multiple dashes with single dash
//     .trim();

// // If you need to reverse slug (optional, in product detail page)
// export const deslugifyProduct = (slug) =>
//   slug
//     .replace(/-/g, " ")
//     .replace(/\band\b/g, "&")       // Convert 'and' back to '&' if needed
//     .trim();
// utils/slugify.js


// export const slugifyProduct = (productName) => {
//   // Replace "EPS/Thermocol" with "eps-thermocol" before slugifying
//   const cleanName = productName.replace(/EPS\/Thermocol/gi, "eps-thermocol");
  
//   // Then slugify the cleaned product name
//   return cleanName.replace(/\s+/g, "-").toLowerCase();
// };


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
