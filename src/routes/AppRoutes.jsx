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
import PackagingReport from "../pages/PackagingReport";
import RequisitionForm from "../components/RequisitionForm";
import RequisitionSlips from "../pages/RequisitionSlips";
import ProformaInvoiceForm from "../components/ProformaInvoiceForm";
import ProformaInvoiceDashboard from "../pages/ProformaInvoiceDashboard";
import RegisterUser from "../pages/RegisterUser";
import ProformaEditForm from "../pages/ProformaEditForm";
import CNCDashboard from "../pages/CNCDashboard";
import MileageChart from "../pages/MileageChart";
import AttendanceLogs from "../pages/AttendanceLogs";
import AttendancePage from "../pages/AttendancePage";
import AllSuppliers from "../pages/AllSuppliers";
import AddSupplier from "../pages/AddSupplier";
import AllPurchaseProducts from "../pages/AllPurchaseProducts";
import AddPurchaseProduct from "../pages/AddPurchaseProduct";
import PurchaseProductSuppliers from "../pages/PurchaseProductSuppliers";
import PurchaseOrderForm from "../pages/PurchaseOrderForm";
import PurchaseOrdersList from "../pages/PurchaseOrdersList";
import SendRFQ from "../pages/SendRFQ";
import DrawingOrdersTable from "../pages/DrawingOrdersTable";
import DrawingUploadForm from "../components/DrawingUploadForm";
import ViewRFQs from "../pages/viewRFQs";
import DanaBeadsDashboard from "../pages/DanaBeadsDashboard";
import MonthlyReports from "../pages/MonthlyReports";
import AddCategory from "../pages/AddCategory";
import CancelledOrders from "../pages/CancelledOrders";
import CompletedOrdersDashboard from "../pages/CompletedOrdersDashboard";
import StockManagement from "../pages/StockManagement";
import RegisteredVehicles from "../pages/RegisteredVehicles";
import PlantMachineryMaintenance from "../pages/PlantMachineryMaintenance";
import DGSetLogBookPage from "../pages/DGSetLogBookPage";
import PowerFactorMaintenance from "../pages/PowerFactorMaintenance";
import ProductsDetails from "../pages/ProductsDetails";
import TourExpenses from "../pages/TourExpenses";
import TourExpensesDashboard from "../pages/TourExpensesDashboard";
import ImportantNumbers from "../components/ImportantNumbers";
import AirCompressorMaintenance from "../pages/AirCompressorMaintenance";
import BoilerMaintenance from "../pages/BoilerMaintenance";
import EarthingMaintenance from "../pages/EarthingMaintenance";
import PageNotFound from "../pages/PageNotFound";
import IncomingPaymentForm from "../pages/IncomingPaymentForm";
import PaymentRecords from "../pages/PaymentRecords";
import OutgoingPayments from "../components/OutgoingPayments";
import TimestampPhotoGenerator from "../components/TimestampPhotoGenerator";
import GuardEntryForm from "../pages/GuardEntryForm";
import GuardEntriesView from "../pages/GuardEntriesView";
import GoodsInwardForm from "../components/GoodsInwardForm";
import LeaveManagement from "../components/LeaveManagement";

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
const AssistantRegistrationPage = React.lazy(() => import("../pages/AssistantRegistrationPage"));

export default function AppRoutes() {
  const { user, loading } = useUserContext();
  const location = useLocation();

//   useEffect(() => {
//     console.log("User updated:", user);
//   }, [user]);

  if (loading) {
    return (
      <div className="flex justify-center items-center h-screen">
        Loading Please Wait...
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
<Route
  path="/timestamp-generator-pkc"
  element={
    <ProtectedRoute>
      <PageWrapper>
        {user?.email === "it.thermopackers@gmail.com" ? (
          <TimestampPhotoGenerator />
        ) : (
          <PageNotFound />
        )}
      </PageWrapper>
    </ProtectedRoute>
  }
/>
            {/* Protected Routes */}
            <Route
              path="/dashboard"
              element={
                <ProtectedRoute allowedRoles={["admin","accounts", "sales", "production", "dispatch", "packaging","driver","suppliers",'viewer', 'editor', 'manager','guard','plantMaintenance']} mustBeMainAccount={true}>
                  <PageWrapper><Dashboard /></PageWrapper>
                </ProtectedRoute>
              }
            />

            <Route
              path="/add-order"
              element={
                <ProtectedRoute allowedRoles={["admin", "sales","accounts","production"]}>
                  <PageWrapper><AddOrder /></PageWrapper>
                </ProtectedRoute>
              }
            />

<Route
  path="/guard-entry"
  element={
    <ProtectedRoute allowedRoles={["guard", "admin", "accounts"]}>
      <PageWrapper><GuardEntryForm /></PageWrapper>
    </ProtectedRoute>
  }
/>

<Route
  path="/guard-entries-view"
  element={
    <ProtectedRoute allowedRoles={["guard", "admin", "accounts"]}>
      <PageWrapper><GuardEntriesView /></PageWrapper>
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
              path="/dana-beads-dashboard"
              element={
                <ProtectedRoute allowedRoles={["production","accounts"]}>
                  <PageWrapper><DanaBeadsDashboard /></PageWrapper>
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
  path="/reports/packaging"
  element={
    <ProtectedRoute allowedRoles={["admin", "accounts", "production", "dispatch", "packaging"]}>
      <PageWrapper>
        <PackagingReport />
      </PageWrapper>
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
  path="/my-tasks/:taskId?"
  element={
    <ProtectedRoute allowedRoles={["admin", "sales", "accounts", "production", "dispatch", "packaging", "driver"]}>
      <PageWrapper><EmployeeDashboard /></PageWrapper>
    </ProtectedRoute>
  }
/>


            <Route
              path="/task-dashboard"
              element={
                <ProtectedRoute allowedRoles={["admin", "accounts","sales","production"]}>
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
                <ProtectedRoute allowedRoles={["admin", "accounts","sales"]}>
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
              path="/leave-management"
              element={
                <ProtectedRoute allowedRoles={["admin", "accounts"]}>
                  <PageWrapper><LeaveManagement /></PageWrapper>
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
    <ProtectedRoute allowedRoles={["admin", "accounts","dispatch","packaging","driver"]}>
      <PageWrapper><AssignDispatchPlanForm /></PageWrapper>
    </ProtectedRoute>
  }
/>
<Route
  path="/drawing-upload-form"
  element={
    <ProtectedRoute allowedRoles={["suppliers","accounts","viewer"]}>
      <PageWrapper><DrawingUploadForm /></PageWrapper>
    </ProtectedRoute>
  }
/>
<Route
  path="/drawing-orders-table"
  element={
    <ProtectedRoute allowedRoles={["suppliers","accounts","production","viewer"]}>
      <PageWrapper><DrawingOrdersTable /></PageWrapper>
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
<Route
  path="/material-requisition"
  element={
    <ProtectedRoute allowedRoles={["admin", "sales", "accounts", "production", "dispatch", "packaging","driver"]}>
      <PageWrapper><RequisitionForm /></PageWrapper>
    </ProtectedRoute>
  }
/>
<Route
  path="/requisition-slips"
  element={
    <ProtectedRoute allowedRoles={["admin", "sales", "accounts", "production", "dispatch", "packaging","driver"]}>
      <PageWrapper><RequisitionSlips /></PageWrapper>
    </ProtectedRoute>
  }
/>
<Route
  path="/proforma-invoice"
  element={
    <ProtectedRoute allowedRoles={["admin", "sales", "production", "dispatch", "accounts","packaging"]}>
      <PageWrapper>
        <ProformaInvoiceForm />
      </PageWrapper>
    </ProtectedRoute>
  }
/>
<Route path="/goods-inward/:guardEntryId" element={<ProtectedRoute allowedRoles={["admin","accounts"]}>
      <PageWrapper>
        <GoodsInwardForm />
      </PageWrapper>
    </ProtectedRoute>} />

<Route
  path="/proforma-dashboard"
  element={
    <ProtectedRoute allowedRoles={["admin", "sales", "production", "dispatch", "accounts","packaging"]}>
      <PageWrapper>
        <ProformaInvoiceDashboard />
      </PageWrapper>
    </ProtectedRoute>
  }
/>

<Route
  path="/register-user"
  element={
    <ProtectedRoute allowedRoles={["admin","accounts", "sales", "production", "dispatch", "packaging","driver"]}>
      <PageWrapper>
        <RegisterUser />
      </PageWrapper>
    </ProtectedRoute>
  }
/>
<Route
  path="/proforma-edit/:id"
  element={
    <ProtectedRoute allowedRoles={["admin", "sales", "production", "dispatch", "accounts","packaging"]}>
      <PageWrapper>
        <ProformaEditForm />
      </PageWrapper>
    </ProtectedRoute>
  }
/>

<Route
  path="/cnc-dashboard"
  element={
    <ProtectedRoute
      allowedRoles={["accounts","production"]}
    >
      <PageWrapper>
        <CNCDashboard />
      </PageWrapper>
    </ProtectedRoute>
  }
/>
<Route
  path="/mileage-chart"
  element={
    <ProtectedRoute allowedRoles={["admin","accounts", "sales", "production", "dispatch", "packaging","driver"]}>
      <PageWrapper>
        <MileageChart />
      </PageWrapper>
    </ProtectedRoute>
  }
/>
<Route
  path="/attendance-logs"
  element={
    <ProtectedRoute allowedRoles={["admin", "sales", "production", "dispatch", "accounts","packaging","driver"]}>
      <PageWrapper>
        <AttendanceLogs />
      </PageWrapper>
    </ProtectedRoute>
  }
/>
<Route
  path="/monthly-reports"
  element={
    <ProtectedRoute allowedRoles={["accounts","admin"]}>
      <PageWrapper>
        <MonthlyReports />
      </PageWrapper>
    </ProtectedRoute>
  }
/>
<Route
  path="/attendance"
  element={
    <ProtectedRoute allowedRoles={["admin", "sales", "production", "dispatch", "accounts","packaging","driver"]}>
      <PageWrapper>
        <AttendancePage />
      </PageWrapper>
    </ProtectedRoute>
  }
/>
<Route
  path="/add-purchase-product"
  element={
    <ProtectedRoute allowedRoles={["accounts"]}>
      <PageWrapper><AddPurchaseProduct /></PageWrapper>
    </ProtectedRoute>
  }
/>

<Route
  path="/purchase-products/edit/:id"
  element={
    <ProtectedRoute allowedRoles={["accounts"]}>
      <PageWrapper><AddPurchaseProduct /></PageWrapper>
    </ProtectedRoute>
  }
/>
<Route
  path="/all-purchase-products"
  element={
    <ProtectedRoute allowedRoles={["accounts"]}>
      <PageWrapper><AllPurchaseProducts /></PageWrapper>
    </ProtectedRoute>
  }
/>
<Route
  path="/stock-management"
  element={
    <ProtectedRoute allowedRoles={["accounts","admin"]}>
      <PageWrapper><StockManagement /></PageWrapper>
    </ProtectedRoute>
  }
/>
<Route
  path="/registered-vehicles"
  element={
    <ProtectedRoute allowedRoles={["admin","accounts", "sales", "production", "dispatch", "packaging","driver"]}>
      <PageWrapper><RegisteredVehicles /></PageWrapper>
    </ProtectedRoute>
  }
/>
{/* <Route
  path="/maintenance/main-electric-panel"
  element={
    <ProtectedRoute allowedRoles={["admin","accounts", "sales", "production", "dispatch", "packaging","driver","plantMaintenance"]}>
      <PageWrapper><MainElectricPanelPage /></PageWrapper>
    </ProtectedRoute>
  }
/> */}
<Route
  path="/plant-machinery-maintenance"
  element={
    <ProtectedRoute allowedRoles={["admin","accounts", "sales", "production", "dispatch", "packaging","driver","plantMaintenance"]}>
      <PageWrapper><PlantMachineryMaintenance /></PageWrapper>
    </ProtectedRoute>
  }
/>
<Route
  path="/plant-machinery-maintenance-power-factor"
  element={
    <ProtectedRoute allowedRoles={["admin","accounts", "sales", "production", "dispatch", "packaging","driver","plantMaintenance"]}>
      <PageWrapper><PowerFactorMaintenance /></PageWrapper>
    </ProtectedRoute>
  }
/>
<Route
  path="/dg-set-log-book"
  element={
    <ProtectedRoute allowedRoles={["accounts","admin","plantMaintenance","production"]}>
      <PageWrapper><DGSetLogBookPage /></PageWrapper>
    </ProtectedRoute>
  }
/>

<Route
  path="/maintenance/air-compressors"
  element={
    <ProtectedRoute allowedRoles={["admin","accounts","plantMaintenance", "sales", "production", "dispatch", "packaging","driver"]}>
      <PageWrapper><AirCompressorMaintenance /></PageWrapper>
    </ProtectedRoute>
  }
/>

<Route
  path="/maintenance/boiler"
  element={
    <ProtectedRoute allowedRoles={["admin","accounts","plantMaintenance", "sales", "production", "dispatch", "packaging","driver"]}>
      <PageWrapper><BoilerMaintenance /></PageWrapper>
    </ProtectedRoute>
  }
/>

<Route
  path="/maintenance/earthing"
  element={
    <ProtectedRoute allowedRoles={["admin","accounts","plantMaintenance", "sales", "production", "dispatch", "packaging","driver"]}>
      <PageWrapper><EarthingMaintenance /></PageWrapper>
    </ProtectedRoute>
  }
/>
<Route
  path="/add-supplier"
  element={
    <ProtectedRoute allowedRoles={["accounts"]}>
      <PageWrapper><AddSupplier /></PageWrapper>
    </ProtectedRoute>
  }
/>
<Route
  path="/suppliers/edit/:id"
  element={
    <ProtectedRoute allowedRoles={["accounts"]}>
      <PageWrapper><AddSupplier /></PageWrapper>
    </ProtectedRoute>
  }
/>

<Route
  path="/all-suppliers"
  element={
    <ProtectedRoute allowedRoles={["accounts"]}>
      <PageWrapper><AllSuppliers /></PageWrapper>
    </ProtectedRoute>
  }
/>
<Route
path="/purchase-products-suppliers"
element={
    <ProtectedRoute allowedRoles={["accounts"]}>
      <PageWrapper><PurchaseProductSuppliers /></PageWrapper>
    </ProtectedRoute>
  }
/>
<Route
path="/create-purchase-order"
element={
    <ProtectedRoute allowedRoles={["accounts"]}>
      <PageWrapper><PurchaseOrderForm /></PageWrapper>
    </ProtectedRoute>
  }
/>
<Route
path="/purchase-orders"
element={
    <ProtectedRoute allowedRoles={["accounts"]}>
      <PageWrapper><PurchaseOrdersList /></PageWrapper>
    </ProtectedRoute>
  }
/>
<Route
path="/purchase-orders/edit/:id"
element={
    <ProtectedRoute allowedRoles={["accounts"]}>
      <PageWrapper><PurchaseOrderForm /></PageWrapper>
    </ProtectedRoute>
  }
/>
<Route
path="/send-rfq"
element={
    <ProtectedRoute allowedRoles={["accounts","admin"]}>
      <PageWrapper><SendRFQ /></PageWrapper>
    </ProtectedRoute>
  }
/>
<Route
path="/add-category"
element={
    <ProtectedRoute allowedRoles={["accounts","admin"]}>
      <PageWrapper><AddCategory /></PageWrapper>
    </ProtectedRoute>
  }
/>

<Route
path="/view-rfqs"
element={
    <ProtectedRoute allowedRoles={["accounts"]}>
      <PageWrapper><ViewRFQs /></PageWrapper>
    </ProtectedRoute>
  }
/>

<Route
path="/cancelled-orders"
element={
    <ProtectedRoute allowedRoles={["accounts","admin","sales","production"]}>
      <PageWrapper><CancelledOrders /></PageWrapper>
    </ProtectedRoute>
  }
/>
<Route
path="/completed-orders"
element={
    <ProtectedRoute allowedRoles={["accounts","admin","sales","production"]}>
      <PageWrapper><CompletedOrdersDashboard /></PageWrapper>
    </ProtectedRoute>
  }
/>
<Route
path="/tour-expenses"
element={
    <ProtectedRoute allowedRoles={["admin","accounts", "sales", "production", "dispatch", "packaging","driver"]}>
      <PageWrapper><TourExpenses /></PageWrapper>
    </ProtectedRoute>
  }
/>

<Route path="/important-numbers" element={<ImportantNumbers />} />

<Route
path="/tour-expenses-dashboard"
element={
    <ProtectedRoute allowedRoles={["admin","accounts", "sales", "production", "dispatch", "packaging","driver"]}>
      <PageWrapper><TourExpensesDashboard /></PageWrapper>
    </ProtectedRoute>
  }
/>

<Route
path="/incoming-payment"
element={
    <ProtectedRoute allowedRoles={["admin","accounts", "sales", "production", "dispatch", "packaging","driver"]}>
      <PageWrapper><IncomingPaymentForm /></PageWrapper>
    </ProtectedRoute>
  }
/>

<Route
path="/payment-records"
element={
    <ProtectedRoute allowedRoles={["admin","accounts", "sales", "production", "dispatch", "packaging","driver"]}>
      <PageWrapper><PaymentRecords /></PageWrapper>
    </ProtectedRoute>
  }
/>

<Route
  path="/outgoing-payment"
  element={
    <ProtectedRoute allowedRoles={["admin","accounts", "sales", "production", "dispatch", "packaging","driver"]}>
      <PageWrapper><OutgoingPayments /></PageWrapper>
    </ProtectedRoute>
  }
/>

<Route
path="/edit-rfq/:id"
element={
    <ProtectedRoute allowedRoles={["accounts"]}>
      <PageWrapper><SendRFQ /></PageWrapper>
    </ProtectedRoute>
  }
/>
<Route path="/get-products/:id" 
element={
   
      <PageWrapper><ProductsDetails /></PageWrapper>

  } />

  <Route 
              path="/register/assistant" 
              element={<PageWrapper><AssistantRegistrationPage /></PageWrapper>} 
            />           

            {/* Assistant-specific Dashboard */}
            <Route
              path="/dashboard"
              element={
                <ProtectedRoute allowedRoles={["suppliers","viewer"]} isAssistantRoute={true}>
                  <PageWrapper><Dashboard /></PageWrapper>
                </ProtectedRoute>
              }
            />
             <Route 
              path="*" 
              element={
                <PageWrapper>
                  <PageNotFound />
                </PageWrapper>
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
