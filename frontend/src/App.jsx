import FarmerDashboard from "./pages/roles/FarmerDashboard";
import AggregatorDashboard from "./pages/roles/AggregatorDashboard";
import PackHouseDashboard from "./pages/roles/PackHouseDashboard";
import MandiDashboard from "./pages/roles/MandiDashboard";
import ColdChainDashboard from "./pages/roles/ColdChainDashboard";
import RetailerDashboard from "./pages/roles/RetailerDashboard";
import ConsumerDashboard from "./pages/roles/ConsumerDashboard";

import {
  BrowserRouter,
  Routes,
  Route,
  useNavigate,
  useParams,
} from "react-router-dom";

import {
  AppProvider,
  useAppContext,
  ROLES,
  ROLE_LABELS,
} from "./context/AppContext";

import AppShell from "./components/layout/AppShell";

import Dashboard from "./pages/Dashboard";
import InspectProduce from "./pages/InspectProduce";
import Batches from "./pages/Batches";
import BatchDetails from "./pages/BatchDetails";
import Recommendations from "./pages/Recommendations";
import Traceability from "./pages/Traceability";
import Agent from "./pages/Agent";


// =====================================================
// ROLE INFORMATION
// =====================================================

const roleInfo = {
  [ROLES.FARMER]: {
    icon: "🌾",
    title: "Farmer Dashboard",
    subtitle:
      "Manage your crops, harvests and farm produce.",
    cards: [
      "My Crops",
      "Harvest Readiness",
      "Produce Quality",
      "Dispatches",
    ],
  },

  [ROLES.AGGREGATOR]: {
    icon: "🚚",
    title: "Aggregator Dashboard",
    subtitle:
      "Coordinate collection from farmers and manage incoming produce.",
    cards: [
      "Today's Collections",
      "Farmer Network",
      "Batch Quality",
      "Pending Dispatches",
    ],
  },

  [ROLES.PACK_HOUSE]: {
    icon: "📦",
    title: "Pack House Dashboard",
    subtitle:
      "Sort, grade and prepare fresh produce for the next stage.",
    cards: [
      "Incoming Batches",
      "Quality Grading",
      "Packed Produce",
      "Ready to Dispatch",
    ],
  },

  [ROLES.MANDI]: {
    icon: "🏪",
    title: "Mandi Dashboard",
    subtitle:
      "Track market arrivals, demand and produce movement.",
    cards: [
      "Today's Arrivals",
      "Market Demand",
      "Active Batches",
      "Dispatches",
    ],
  },

  [ROLES.WAREHOUSE]: {
    icon: "🏭",
    title: "Warehouse Dashboard",
    subtitle:
      "Monitor inventory, freshness and at-risk stock.",
    cards: [
      "Total Inventory",
      "At-Risk Inventory",
      "Priority Batches",
      "Waste Avoided",
    ],
  },

  [ROLES.COLD_CHAIN]: {
    icon: "❄️",
    title: "Cold Chain Dashboard",
    subtitle:
      "Monitor temperature, humidity and cold-chain movement.",
    cards: [
      "Active Shipments",
      "Temperature Status",
      "Alerts",
      "Delivery ETA",
    ],
  },

  [ROLES.RETAILER]: {
    icon: "🛒",
    title: "Retailer Dashboard",
    subtitle:
      "Manage store inventory, demand and replenishment.",
    cards: [
      "Store Inventory",
      "Today's Demand",
      "At-Risk Produce",
      "Reorder Suggestions",
    ],
  },

  [ROLES.CONSUMER]: {
    icon: "👤",
    title: "Consumer Dashboard",
    subtitle:
      "Discover fresh produce and see its complete journey.",
    cards: [
      "Freshness Score",
      "My Products",
      "Product Journey",
      "Scan Product",
    ],
  },
};


// =====================================================
// ROLE SELECTOR
// =====================================================

function RoleSelector() {
  const navigate = useNavigate();
  const { login } = useAppContext();

  const selectRole = (role) => {
    login(role, {
      name: ROLE_LABELS[role],
    });

    navigate(`/role/${role}`);
  };

  return (
    <div style={styles.page}>

      <div style={styles.container}>

        <div style={styles.logo}>
          TAZA
        </div>

        <h1 style={styles.heading}>
          Who are you?
        </h1>

        <p style={styles.subtitle}>
          Choose your role to enter your Taza workspace.
        </p>

        <div style={styles.grid}>

          {Object.entries(roleInfo).map(
            ([role, info]) => (

              <button
                key={role}
                style={styles.roleCard}
                onClick={() => selectRole(role)}
              >

                <span style={styles.icon}>
                  {info.icon}
                </span>

                <span style={styles.roleName}>
                  {ROLE_LABELS[role]}
                </span>

                <span style={styles.arrow}>
                  →
                </span>

              </button>

            )
          )}

        </div>

      </div>

    </div>
  );
}


// =====================================================
// ROLE DASHBOARD
// =====================================================

function RoleDashboard() {

  const { role } = useAppContext();

  const { role: routeRole } = useParams();

  const activeRole =
    role || routeRole;

  // ---------------------------------------------
  // If no role is selected
  // ---------------------------------------------

  if (!activeRole) {
    return <RoleSelector />;
  }

  // ---------------------------------------------
  // FARMER
  // ---------------------------------------------

  if (activeRole === ROLES.FARMER) {
    return <FarmerDashboard />;
  }

  // ---------------------------------------------
  // AGGREGATOR
  // ---------------------------------------------

  if (activeRole === ROLES.AGGREGATOR) {
    return <AggregatorDashboard />;
  }

  // ---------------------------------------------
  // PACK HOUSE
  // ---------------------------------------------

  if (activeRole === ROLES.PACK_HOUSE) {
    return <PackHouseDashboard />;
  }

  // ---------------------------------------------
  // MANDI
  // ---------------------------------------------

  if (activeRole === ROLES.MANDI) {
    return <MandiDashboard />;
  }

  // ---------------------------------------------
  // WAREHOUSE
  // ---------------------------------------------

  if (activeRole === ROLES.WAREHOUSE) {
    return <Dashboard />;
  }

  // ---------------------------------------------
  // COLD CHAIN
  // ---------------------------------------------

  if (activeRole === ROLES.COLD_CHAIN) {
    return <ColdChainDashboard />;
  }

  // ---------------------------------------------
  // RETAILER
  // ---------------------------------------------

  if (activeRole === ROLES.RETAILER) {
    return <RetailerDashboard />;
  }

  // ---------------------------------------------
  // CONSUMER
  // ---------------------------------------------

  if (activeRole === ROLES.CONSUMER) {
    return <ConsumerDashboard />;
  }

  // Unknown role
  return <RoleSelector />;
}


// =====================================================
// APP
// =====================================================

export default function App() {

  return (

    <AppProvider>

      <BrowserRouter>

        <Routes>

          {/* =========================================
              ROLE SELECTION
          ========================================= */}

          <Route
            path="/"
            element={<RoleSelector />}
          />


          {/* =========================================
              APPLICATION
          ========================================= */}

          <Route
            element={<AppShell />}
          >

            {/* =====================================
                ROLE DASHBOARDS
            ===================================== */}

            <Route
              path="/role/:role"
              element={<RoleDashboard />}
            />


            {/* =====================================
                EXISTING PAGES
            ===================================== */}

            <Route
              path="/inspect"
              element={<InspectProduce />}
            />

            <Route
              path="/batches"
              element={<Batches />}
            />

            <Route
              path="/batches/:id"
              element={<BatchDetails />}
            />

            <Route
              path="/recommendations"
              element={<Recommendations />}
            />

            <Route
              path="/traceability"
              element={<Traceability />}
            />

            <Route
              path="/agent"
              element={<Agent />}
            />

          </Route>

        </Routes>

      </BrowserRouter>

    </AppProvider>
  );
}


// =====================================================
// STYLES
// =====================================================

const styles = {

  page: {
    minHeight: "100vh",
    background: "#f5f8f6",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    padding: "40px 24px",
    fontFamily:
      "Inter, system-ui, sans-serif",
  },

  container: {
    width: "100%",
    maxWidth: "900px",
    textAlign: "center",
  },

  logo: {
    fontSize: "34px",
    fontWeight: 800,
    letterSpacing: "5px",
    color: "#176b3a",
    marginBottom: "20px",
  },

  heading: {
    fontSize: "38px",
    margin: "0 0 8px",
    color: "#17231c",
  },

  subtitle: {
    color: "#647168",
    marginBottom: "32px",
    fontSize: "16px",
  },

  grid: {
    display: "grid",
    gridTemplateColumns:
      "repeat(auto-fit, minmax(190px, 1fr))",
    gap: "16px",
  },

  roleCard: {
    border: "1px solid #dce6df",
    borderRadius: "18px",
    background: "white",
    padding: "24px 18px",
    cursor: "pointer",
    textAlign: "left",
    boxShadow:
      "0 8px 24px rgba(20, 50, 30, 0.06)",
    display: "flex",
    alignItems: "center",
    gap: "12px",
  },

  icon: {
    fontSize: "28px",
  },

  roleName: {
    fontWeight: 700,
    flex: 1,
    color: "#203027",
  },

  arrow: {
    color: "#176b3a",
    fontSize: "22px",
  },

  dashboardPage: {
    padding: "32px",
    minHeight: "100vh",
    background: "#f5f8f6",
    fontFamily:
      "Inter, system-ui, sans-serif",
  },

  dashboardHeader: {
    marginBottom: "28px",
  },

  roleBadge: {
    display: "inline-block",
    background: "#e3f3e9",
    color: "#176b3a",
    padding: "7px 12px",
    borderRadius: "999px",
    fontWeight: 700,
    fontSize: "13px",
    marginBottom: "10px",
  },

  dashboardTitle: {
    margin: 0,
    fontSize: "34px",
    color: "#17231c",
  },

  dashboardSubtitle: {
    color: "#647168",
    marginTop: "8px",
  },

  statGrid: {
    display: "grid",
    gridTemplateColumns:
      "repeat(auto-fit, minmax(190px, 1fr))",
    gap: "16px",
  },

  statCard: {
    background: "white",
    border: "1px solid #dce6df",
    borderRadius: "16px",
    padding: "24px",
    boxShadow:
      "0 8px 24px rgba(20, 50, 30, 0.05)",
  },

  cardNumber: {
    fontSize: "30px",
    fontWeight: 800,
    color: "#176b3a",
  },

  cardLabel: {
    color: "#657269",
    marginTop: "7px",
  },

  panel: {
    background: "white",
    border: "1px solid #dce6df",
    borderRadius: "16px",
    padding: "26px",
    marginTop: "22px",
  },

  panelTitle: {
    margin: "0 0 8px",
    color: "#17231c",
  },

  panelText: {
    color: "#657269",
    lineHeight: 1.6,
  },

};