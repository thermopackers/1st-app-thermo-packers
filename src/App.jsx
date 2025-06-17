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

export default function App() {
  const location = useLocation();

  // Paths where Navbar/Footer should be hidden
  const hideLayout = [
    "/login",
    "/assign-dispatch",
    "/my-plans",
    "/asset-management",
    "/my-assets",
    "/reports/packaging",
    "/issue-asset",
    "/orders",
    "/add-order",
    "/customers/edit",
    "/my-tasks",
    "/products/edit",
    "/dashboard",
    "/add-product",
    "/all-products",
    "/reports/shape-moulding",
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
