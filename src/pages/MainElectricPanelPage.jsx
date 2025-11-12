// // pages/PlantMachineryPage.jsx
// import { NavLink } from "react-router-dom";
// import InternalNavbar from "../components/InternalNavbar";

// export default function PlantMachineryPage() {
//   const sections = [
//     { name: "Power Factor", path: "/plant-machinery-maintenance-power-factor", color: "bg-green-600 hover:bg-green-700" },
//     { name: "DG Set (Diesel Generator)", path: "/dg-set-log-book", color: "bg-indigo-600 hover:bg-indigo-700" },
//   ];

//   return (
//     <div>
//       <InternalNavbar />
//       <div className="p-6">
//         <h1 className="text-2xl font-bold mb-6 text-gray-800">Plant & Machinery Maintenance</h1>
//         <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
//           {sections.map((section) => (
//             <NavLink
//               key={section.name}
//               to={section.path}
//               className={`flex items-center justify-center p-10 rounded-2xl shadow-lg text-white text-xl font-semibold ${section.color}`}
//             >
//               {section.name}
//             </NavLink>
//           ))}
//         </div>
//       </div>
//     </div>
//   );
// }
