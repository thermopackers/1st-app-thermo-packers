// src/routes/AppRoutes.jsx
import React, { Suspense, useEffect } from "react";
import { Routes, Route, useLocation } from "react-router-dom";
import { AnimatePresence, motion } from "framer-motion";
import ScrollToTop from "../components/ScrollToTop";

import ProtectedRoute from "./ProtectedRoute";
import { useUserContext } from "../context/UserContext";
import AddProduct from "../pages/AddProduct";
import AddCustomer from "../pages/AddCustomer";
import CustomerList from "../pages/CustomerList";
import ProductList from "../pages/ProductList";
import EditProduct from "../pages/EditProduct";
import EditCustomer from "../pages/EditCustomer";
import ShapeMouldingReport from "../pages/ShapeMouldingReport";
import BlockMouldingReport from "../pages/BlockMouldingReport";
import AssignDispatchPlanForm from "../pages/AssignDispatchPlanForm";
import DriverDispatchDashboard from "../pages/DriverDispatchDashboard";

const Home = React.lazy(() => import("../pages/Home"));
const Products = React.lazy(() => import("../pages/Products"));
const ProductDetail = React.lazy(() => import("../pages/ProductDetail"));
const About = React.lazy(() => import("../pages/About"));
const Contact = React.lazy(() => import("../components/Contact"));
const FeatureDetail = React.lazy(() => import("../pages/FeatureDetail"));
const LoginPage = React.lazy(() => import("../pages/LoginPage"));
const Dashboard = React.lazy(() => import("../pages/Dashboard"));
const AddOrder = React.lazy(() => import("../pages/AddOrder"));
const OrdersList = React.lazy(() => import("../pages/OrdersList"));
const AdminPanel = React.lazy(() => import("../pages/AdminPanel"));
const DispatchDashboard = React.lazy(() => import("../pages/DispatchDashboard"));
const ProductionDashboard = React.lazy(() => import("../pages/ProductionDashboard"));
const InventoryManager = React.lazy(() => import("../pages/InventoryManager"));
const EmployeeAssets = React.lazy(() => import("../components/EmployeeAssets"));
const IssueAsset = React.lazy(() => import("../components/IssueAsset"));
const AssetManagement = React.lazy(() => import("../components/AssetManagement"));
const Unauthorized = React.lazy(() => import("../pages/Unauthorized"));
const PackagingDashboard = React.lazy(() => import("../pages/PackagingDashboard"));
const EmployeeDashboard = React.lazy(() => import("../pages/EmployeeDashboard"));
const AdminDashboard = React.lazy(() => import("../pages/AdminDashboard"));

export default function AppRoutes() {
  const { user, loading } = useUserContext();
  const location = useLocation();

  useEffect(() => {
    console.log("User updated:", user);
  }, [user]);

  if (loading) {
    return (
      <div className="flex justify-center items-center h-screen">
        Loading user...
      </div>
    );
  }

  return (
    <>
      <ScrollToTop />
      <AnimatePresence mode="wait">
        <Suspense
          fallback={
            <div className="flex justify-center items-center h-screen">
              Loading page...
            </div>
          }
        >
          <Routes location={location} key={location.pathname}>

            {/* Public Routes */}
            <Route path="/" element={<PageWrapper><Home /></PageWrapper>} />
            <Route path="/products" element={<PageWrapper><Products /></PageWrapper>} />
            <Route path="/products/:category" element={<PageWrapper><Products /></PageWrapper>} />
            <Route path="/product/:name" element={<PageWrapper><ProductDetail /></PageWrapper>} />
            <Route path="/product/:slug" element={<PageWrapper><ProductDetail /></PageWrapper>} />
            <Route path="/about" element={<PageWrapper><About /></PageWrapper>} />
            <Route path="/contact" element={<PageWrapper><Contact /></PageWrapper>} />
            <Route path="/features/:slug" element={<PageWrapper><FeatureDetail /></PageWrapper>} />
            <Route path="/login" element={<PageWrapper><LoginPage /></PageWrapper>} />

            {/* Protected Routes */}
            <Route
              path="/dashboard"
              element={
                <ProtectedRoute allowedRoles={["admin","accounts", "sales", "production", "dispatch", "packaging","driver"]}>
                  <PageWrapper><Dashboard /></PageWrapper>
                </ProtectedRoute>
              }
            />

            <Route
              path="/add-order"
              element={
                <ProtectedRoute allowedRoles={["admin", "sales","accounts"]}>
                  <PageWrapper><AddOrder /></PageWrapper>
                </ProtectedRoute>
              }
            />

            <Route
              path="/orders"
              element={
                <ProtectedRoute allowedRoles={["admin", "sales","accounts", "production", "dispatch","packaging"]}>
                  <PageWrapper><OrdersList /></PageWrapper>
                </ProtectedRoute>
              }
            />

            <Route
              path="/admin-dashboard"
              element={
                <ProtectedRoute allowedRoles={["admin"]}>
                  <PageWrapper><AdminPanel /></PageWrapper>
                </ProtectedRoute>
              }
            />

            <Route
              path="/dispatch-dashboard"
              element={
                <ProtectedRoute allowedRoles={["dispatch","accounts"]}>
                  <PageWrapper><DispatchDashboard /></PageWrapper>
                </ProtectedRoute>
              }
            />

            <Route
              path="/packaging-dashboard"
              element={
                <ProtectedRoute allowedRoles={["accounts","packaging"]}>
                  <PageWrapper><PackagingDashboard /></PageWrapper>
                </ProtectedRoute>
              }
            />

            <Route
              path="/inventory"
              element={
                <ProtectedRoute allowedRoles={["dispatch","admin","accounts"]}>
                  <PageWrapper><InventoryManager /></PageWrapper>
                </ProtectedRoute>
              }
            />

            <Route
              path="/production-dashboard"
              element={
                <ProtectedRoute allowedRoles={["production","accounts"]}>
                  <PageWrapper><ProductionDashboard /></PageWrapper>
                </ProtectedRoute>
              }
            />
            <Route
              path="/reports/shape-moulding"
              element={
                <ProtectedRoute allowedRoles={["production","accounts"]}>
                  <PageWrapper><ShapeMouldingReport /></PageWrapper>
                </ProtectedRoute>
              }
            />
            <Route
              path="/reports/block-moulding"
              element={
                <ProtectedRoute allowedRoles={["production","accounts"]}>
                  <PageWrapper><BlockMouldingReport /></PageWrapper>
                </ProtectedRoute>
              }
            />

            <Route
              path="/asset-management"
              element={
                <ProtectedRoute allowedRoles={['admin', 'accounts']}>
                  <AssetManagement />
                </ProtectedRoute>
              }
            />

            {/* Redirect Unauthorized Users */}
            <Route path="/unauthorized" element={<Unauthorized />} />

            <Route
              path="/my-assets"
              element={
                <ProtectedRoute allowedRoles={["admin", "sales", "production", "dispatch", "accounts","packaging","driver"]}>
                  <PageWrapper><EmployeeAssets /></PageWrapper>
                </ProtectedRoute>
              }
            />

            <Route
              path="/issue-asset"
              element={
                <ProtectedRoute allowedRoles={["accounts"]}>
                  <PageWrapper><IssueAsset /></PageWrapper>
                </ProtectedRoute>
              }
            />

            <Route
              path="/my-tasks"
              element={
                <ProtectedRoute allowedRoles={["admin", "sales", "accounts", "production", "dispatch", "packaging","driver"]}>
                  <PageWrapper><EmployeeDashboard /></PageWrapper>
                </ProtectedRoute>
              }
            />

            <Route
              path="/task-dashboard"
              element={
                <ProtectedRoute allowedRoles={["admin", "accounts"]}>
                  <PageWrapper><AdminDashboard /></PageWrapper>
                </ProtectedRoute>
              }
            />
            <Route
              path="/add-product"
              element={
                <ProtectedRoute allowedRoles={["admin","sales", "accounts"]}>
                  <PageWrapper><AddProduct /></PageWrapper>
                </ProtectedRoute>
              }
            />
            <Route
              path="/add-customer"
              element={
                <ProtectedRoute allowedRoles={["admin","sales", "accounts"]}>
                  <PageWrapper><AddCustomer /></PageWrapper>
                </ProtectedRoute>
              }
            />
            <Route
              path="/customers"
              element={
                <ProtectedRoute allowedRoles={["admin", "accounts"]}>
                  <PageWrapper><CustomerList /></PageWrapper>
                </ProtectedRoute>
              }
            />
            <Route
              path="/customers/edit/:id"
              element={
                <ProtectedRoute allowedRoles={["admin","sales", "accounts"]}>
                  <PageWrapper><EditCustomer /></PageWrapper>
                </ProtectedRoute>
              }
            />
            <Route
              path="/products/edit/:id"
              element={
                <ProtectedRoute allowedRoles={["admin","sales", "accounts"]}>
                  <PageWrapper><EditProduct /></PageWrapper>
                </ProtectedRoute>
              }
            />
            <Route
              path="/all-products"
              element={
                <ProtectedRoute allowedRoles={["admin","sales", "accounts"]}>
                  <PageWrapper><ProductList /></PageWrapper>
                </ProtectedRoute>
              }
            />
<Route
  path="/assign-dispatch"
  element={
    <ProtectedRoute allowedRoles={["admin", "accounts","dispatch","packaging"]}>
      <PageWrapper><AssignDispatchPlanForm /></PageWrapper>
    </ProtectedRoute>
  }
/>

<Route
  path="/my-plans"
  element={
    <ProtectedRoute allowedRoles={["driver","accounts"]}>
      <PageWrapper><DriverDispatchDashboard /></PageWrapper>
    </ProtectedRoute>
  }
/>


          </Routes>
        </Suspense>
      </AnimatePresence>
    </>
  );
}

function PageWrapper({ children }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 30 }}
      transition={{ duration: 0.5 }}
      className="min-h-screen"
    >
      {children}
    </motion.div>
  );
}
