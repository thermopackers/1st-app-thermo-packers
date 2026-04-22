import { useLocation } from "react-router-dom";
import { Helmet } from "react-helmet";
import Navbar from "./components/Navbar";
import Footer from "./components/Footer";
import SmartBot from "./components/SmartBot";
import AppRoutes from "./routes/AppRoutes";
import { Toaster } from "react-hot-toast";
import { GoogleOAuthProvider } from "@react-oauth/google";
import Swal from "sweetalert2";
import { useEffect } from "react";
import './index.css';

export default function App() {
  const location = useLocation();

  // Paths where Navbar/Footer should be hidden
  const hideLayout = [
    "/login",
    "/campaigns",
    "/factory-act",
    "/weighing-scale",
    "/pollution-department",
    "/pollution",
    "/maintenance",
    "/thermocast",
    "/customer-gifts",
    "/campaigns/new",
    "/leave-management",
    "/gate-outward",
    "/gate-outwards-view",
    "/maintenance/water-filter",
    "/maintenance/fire-safety",
    "/send-rfq",
    "/tour-expenses",
    "/timestamp-generator-pkc",
    "/tour-expenses-dashboard",
    "/important-numbers",
    "/guard-entry",
    "/guard-entries-view",
    "/gate-inward-printout",
    "/goods-inward",
    "/maintenance/air-compressors",
    "/view-rfqs",
    "/maintenance/boiler",
    "/maintenance/tds",
    "/maintenance/ph",
    "/maintenance/hardness",
    "/maintenance/alkalinity",
    "/guard-attendance",
    "/guard-attendance-history",
    "/password-manager",
    "/freight-calculator",
    "/factory-attendance-logs",
    "/factory-monthly-reports",
    "/rm-rate",
    "/maintenance/transformer",
    "/tour-planning",
    "/maintenance/earthing",
    "/edit-rfq",
    "/register/assistant",
    "/drawing-upload-form",
    "/drawing-orders-table",
    "/proforma-invoice",
    "/register-user",
    "/purchase-orders",
    "/create-purchase-order",
    "/purchase-products-suppliers",
    "/suppliers/edit",
    "/purchase-products/edit",
    "/add-purchase-product",
    "/all-purchase-products",
    "/attendance-logs",
    "/attendance",
    "/add-supplier",
    "/all-suppliers",
    "/mileage-chart",
    "/proforma-edit",
    "/proforma-dashboard",
    "/assign-dispatch",
    "/my-plans",
    "/follow-up",
    "/requisition-slips",
    "/material-requisition",
    "/asset-management",
    "/completed-orders",
    "/stock-management",
    "/registered-vehicles",
    "/my-assets",
    "/cancelled-orders",
    "/reports/packaging",
    "/issue-asset",
    "/orders",
    "/add-category",
    "/dana-beads-dashboard",
    "/monthly-reports",
    "/add-order",
    "/incoming-payment",
    "/payment-records",
    "/customers/edit",
    "/outgoing-payment",
    "/my-tasks",
    "/maintenance/main-electric-panel",
    "/plant-machinery-maintenance",
    "/dg-set-log-book",
    "/get-products",
    "/products/edit",
    "/dashboard",
    "/add-product",
    "/all-products",
    "/reports/shape-moulding",
    "/cnc-dashboard",
    "/customers",
    "/reports/block-moulding",
    "/add-customer",
    "/task-dashboard",
    "/admin",
    "/production-dashboard",
    "/packaging-dashboard",
    "/dispatch-dashboard",
    "/inventory",
    "/unauthorized",
  ].some((path) => location.pathname.startsWith(path));

  useEffect(() => {
    const handleOffline = () => {
      Swal.fire({
        icon: "warning",
        title: "You are offline",
        text: "Internet connection lost. Some features may not work.",
        toast: true,
        position: "top-end",
        showConfirmButton: false,
        timer: 4000,
      });
    };

    const handleOnline = () => {
      Swal.fire({
        icon: "success",
        title: "Back Online",
        text: "Internet connection restored.",
        toast: true,
        position: "top-end",
        showConfirmButton: false,
        timer: 3000,
      });
    };

    // ✅ Initial check on mount
    if (!navigator.onLine) {
      handleOffline(); // Show popup immediately on refresh if offline
    }

    // ✅ Event listeners for network changes
    window.addEventListener("offline", handleOffline);
    window.addEventListener("online", handleOnline);

    return () => {
      window.removeEventListener("offline", handleOffline);
      window.removeEventListener("online", handleOnline);
    };
  }, []);
  return (
    <>
      <Helmet>
        <title>Thermo Packers | Thermocol & EPS Packaging Solutions</title>
        <meta
          name="description"
          content="Leading manufacturer of thermocol packaging, insulation sheets, and EPS products for industrial and commercial use."
        />
        <link rel="canonical" href="https://www.thermopackers.com/" />
        <meta property="og:title" content="Thermo Packers" />
        <meta
          property="og:description"
          content="Premium Thermocol & EPS packaging and insulation."
        />
        <meta
          property="og:image"
          content="https://www.thermopackers.com/images/banner.jpg"
        />
        <meta property="og:url" content="https://www.thermopackers.com/" />
        <meta name="twitter:card" content="summary_large_image" />
      </Helmet>
      <Toaster position="top-center" reverseOrder={false} />

      {!hideLayout && <Navbar />}
      <GoogleOAuthProvider clientId="579824478403-ros6v2qhmr22cv51mg3ttm9q5nh1oqte.apps.googleusercontent.com">
        <main className="min-h-screen">
          <AppRoutes />
        </main>
      </GoogleOAuthProvider>

      {!hideLayout && <SmartBot />}
      {!hideLayout && <Footer />}
    </>
  );
}
