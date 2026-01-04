import React from 'react';
import { Routes, Route, Navigate, useLocation } from 'react-router-dom';
import Home from './pages/Home';
import InventoryPage from './pages/InventoryPage';
import ToolDetail from './pages/ToolDetail';
import Login from './pages/Login';
import Register from './pages/Register';
import Orders from './pages/Orders';
import OrdersIndex from './pages/OrdersIndex';
import Loans from './pages/Loans';
import OrdersCreateClient from './pages/OrdersCreateClient';
import OrdersCreateTools from './pages/OrdersCreateTools';
import EmployeesAdministration from './pages/EmployeesAdministration';
import ClientsAdministration from './pages/ClientsAdministration';
import ResumeLoan from './pages/ResumeLoan';
import ReturnsClients from './pages/ReturnsClients';
import ReturnsClientLoans from './pages/ReturnsClientLoans';
import ReturnsLoanSummary from './pages/ReturnsLoanSummary';
import LoanSummaryReadOnly from './pages/LoanSummaryReadOnly';
import KardexPage from './pages/KardexPage';
import UsersDetails from './pages/UsersDetails';
import { AlertProvider } from './components/Alerts/AlertContext';
import { useKeycloak } from '@react-keycloak/web';
import { getUser } from './services/auth';

// lightweight placeholder for tools admin (not implemented yet)
const ToolsAdmin = () => <h2>Administración de herramientas (pendiente)</h2>;

function App() {
  // Force re-render on route change to ensure auth state is fresh
  useLocation();
  const { keycloak, initialized } = useKeycloak();

  // Combine Keycloak state with local auth fallback
  const user = getUser();
  const effectiveLoggedIn = (initialized && keycloak.authenticated) || !!user;
  
  let roles = [];
  // Prefer Keycloak roles if available
  if (initialized && keycloak.authenticated && keycloak.tokenParsed && keycloak.tokenParsed.realm_access) {
    roles = keycloak.tokenParsed.realm_access.roles || [];
  } else if (user && user.realm_access && Array.isArray(user.realm_access.roles)) {
    // Fallback to local token roles
    roles = user.realm_access.roles;
  }
  // Normalize to uppercase to avoid case-sensitivity issues
  roles = roles.map((r) => String(r).toUpperCase());

  const PrivateRoute = ({ element, rolesAllowed }) => {
    if (!effectiveLoggedIn) {
      return <Navigate to="/login" replace />;
    }
    if (rolesAllowed && !rolesAllowed.some(r => roles.includes(r))) {
      return <h2>No tienes permiso para ver esta página</h2>;
    }
    return element;
  };

  return (
    <AlertProvider>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        
        <Route path="/product/:id" element={<ToolDetailWrapper />} />
        
        <Route path="/inventory" element={<InventoryPage />} />
        <Route path="/inventory/:category" element={<InventoryPageWrapper />} />
        
        {/* User Settings Route - Accessible by any logged in user */}
        <Route path="/profile" element={<PrivateRoute element={<UsersDetails />} rolesAllowed={["CLIENT", "EMPLOYEE", "ADMIN", "SUPERADMIN"]} />} />

        {/* Admin Routes */}
        <Route path="/admin" element={<PrivateRoute element={<Orders />} rolesAllowed={["EMPLOYEE","ADMIN","SUPERADMIN"]} />} />
        <Route path="/admin/orders" element={<PrivateRoute element={<OrdersIndex />} rolesAllowed={["EMPLOYEE","ADMIN","SUPERADMIN"]} />} />
        <Route path="/loans" element={<PrivateRoute element={<Loans />} rolesAllowed={["EMPLOYEE","ADMIN","SUPERADMIN"]} />} />
        <Route path="/admin/orders/create" element={<PrivateRoute element={<OrdersCreateClient />} rolesAllowed={["EMPLOYEE","ADMIN","SUPERADMIN"]} />} />
        <Route path="/admin/orders/create/tools" element={<PrivateRoute element={<OrdersCreateTools />} rolesAllowed={["EMPLOYEE","ADMIN","SUPERADMIN"]} />} />
        <Route path="/admin/returns" element={<PrivateRoute element={<ReturnsClients />} rolesAllowed={["EMPLOYEE","ADMIN","SUPERADMIN"]} />} />
        <Route path="/admin/returns/client/:id" element={<PrivateRoute element={<ReturnsClientLoans />} rolesAllowed={["EMPLOYEE","ADMIN","SUPERADMIN"]} />} />
        <Route path="/admin/returns/loan/:id" element={<PrivateRoute element={<ReturnsLoanSummary />} rolesAllowed={["EMPLOYEE","ADMIN","SUPERADMIN"]} />} />
        <Route path="/loans/loan/:id" element={<PrivateRoute element={<LoanSummaryReadOnly />} rolesAllowed={["EMPLOYEE","ADMIN","SUPERADMIN"]} />} />
        <Route path="/admin/orders/resume" element={<PrivateRoute element={<ResumeLoan />} rolesAllowed={["EMPLOYEE","ADMIN","SUPERADMIN"]} />} />
        <Route path="/admin/tools" element={<PrivateRoute element={<ToolsAdmin />} rolesAllowed={["ADMIN","SUPERADMIN"]} />} />
        <Route path="/admin/kardex" element={<PrivateRoute element={<KardexPage />} rolesAllowed={["EMPLOYEE","ADMIN","SUPERADMIN"]} />} />
        <Route path="/employees" element={<PrivateRoute element={<EmployeesAdministration />} rolesAllowed={["ADMIN","SUPERADMIN"]} />} />
        <Route path="/clients" element={<PrivateRoute element={<ClientsAdministration />} rolesAllowed={["ADMIN","SUPERADMIN"]} />} />
      </Routes>
    </AlertProvider>
  );
}

// Wrapper components to handle params
import { useParams } from 'react-router-dom';

const ToolDetailWrapper = () => {
  const { id } = useParams();
  return <ToolDetail id={decodeURIComponent(id)} />;
};

const InventoryPageWrapper = () => {
  const { category } = useParams();
  return <InventoryPage category={category ? decodeURIComponent(category) : null} />;
};

export default App;
