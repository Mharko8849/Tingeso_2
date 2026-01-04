import React from "react";
import "./NavBar.css";
import Logo from "./Logo";
import SearchBar from "../Common/SearchBar";
import ToolDropdown from "../Tools/ToolDropdown";
import ProfileMenu from "./ProfileMenu";
import Solicitudes from "../Loans/Solicitudes";
import AdminDropdown from "./AdminDropdown";
import { cancelOrderDraft } from "../../services/orderDraft";
import { useKeycloak } from "@react-keycloak/web";
import { getUser } from "../../services/auth";

const NavBar = () => {
  const { keycloak, initialized } = useKeycloak();
  const user = getUser();
  const logged = (initialized && keycloak.authenticated) || !!user;
  
  let roles = [];
  if (initialized && keycloak.authenticated && keycloak.tokenParsed && keycloak.tokenParsed.realm_access) {
    roles = keycloak.tokenParsed.realm_access.roles || [];
  } else if (user && user.realm_access && Array.isArray(user.realm_access.roles)) {
    roles = user.realm_access.roles;
  }
  
  roles = roles.map((r) => String(r).toUpperCase());
  const isAdminOrSuper = roles.includes("ADMIN") || roles.includes("SUPERADMIN");
  const isEmployee = roles.includes("EMPLOYEE");
  // show admin area to EMPLOYEE, ADMIN or SUPERADMIN
  const showAdmin = logged && (isEmployee || isAdminOrSuper);

  const goHome = async () => {
    await cancelOrderDraft();
    window.history.pushState({}, "", "/");
    window.dispatchEvent(new PopStateEvent("popstate"));
  };

  return (
    <nav className="navbar">
      <div className="navbar-left">
        <button
          type="button"
          onClick={goHome}
          style={{ border: "none", background: "transparent", padding: 0, cursor: "pointer" }}
        >
          <Logo />
        </button>
      </div>

      <div className="navbar-center">
        <SearchBar />
        <ToolDropdown />
        {showAdmin && <AdminDropdown isAdminOrSuper={isAdminOrSuper} />}
      </div>

      <div className="navbar-right">
        <ProfileMenu />
      </div>
    </nav>
  );
};

export default NavBar;
