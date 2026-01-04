import React, { useState, useEffect, useRef } from "react";
import ProfileIcon from "./ProfileIcon";
import "./ProfileMenu.css";
import { useKeycloak } from "@react-keycloak/web";
import { getUser, setToken } from "../../services/auth";

const ProfileMenu = () => {
  const [open, setOpen] = useState(false);
  const menuRef = useRef(null);
  const { keycloak, initialized } = useKeycloak();

  const toggleMenu = () => setOpen(!open);

  // Cierra el menú si se hace click fuera
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (menuRef.current && !menuRef.current.contains(event.target)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const user = getUser();
  const logged = (initialized && keycloak.authenticated) || !!user;

  // Derivar nombre y correo
  let username = null;
  let email = null;

  if (initialized && keycloak.authenticated && keycloak.tokenParsed) {
    const p = keycloak.tokenParsed;
    username =
      p.given_name ||
      p.name ||
      p.preferred_username ||
      null;
    email = p.email || null;
  } else if (user) {
    username =
      user.given_name ||
      user.name ||
      user.preferred_username ||
      user.username ||
      null;
    email = user.email || null;
  }

  // Mostrar solo el primer nombre si viene un nombre completo
  const firstName = username ? username.split(" ")[0] : null;

  return (
    <div className="profile-menu-container" ref={menuRef}>
      <button className="profile-button" onClick={toggleMenu}>
    	  <ProfileIcon />
    	  <span>{logged ? firstName || username || "Perfil" : "Perfil"}</span>
      </button>

      {/* Menú desplegable animado */}
      {!logged && (
        <div className={`profile-menu ${open ? "open" : ""}`}>
          <button className="profile-item" onClick={() => { window.history.pushState({}, '', '/login'); window.dispatchEvent(new PopStateEvent('popstate')); }}>
            Iniciar Sesión
          </button>
          <button className="profile-item" onClick={() => { window.history.pushState({}, '', '/register'); window.dispatchEvent(new PopStateEvent('popstate')); }}>
            Registrarse
          </button>
        </div>
      )}

      {logged && (
        <div className={`profile-menu ${open ? "open" : ""}`}>
          <div className="profile-item">Cuenta: {email || firstName || username}</div>
          <button
            className="profile-item"
            onClick={() => {
              window.history.pushState({}, '', '/profile');
              window.dispatchEvent(new PopStateEvent('popstate'));
              setOpen(false);
            }}
          >
            Ajustes
          </button>
          <button
            className="profile-item"
            onClick={() => {
              // clear local tokens
              setToken(null);
              localStorage.removeItem("access_token");
              localStorage.removeItem("refresh_token");
              
              if (initialized && keycloak.authenticated) {
                keycloak.logout();
              } else {
                // Navega a home y recarga para que la UI refleje el logout
                window.history.pushState({}, '', '/');
                window.dispatchEvent(new PopStateEvent('popstate'));
                window.location.reload();
              }
            }}
          >
            Cerrar sesión
          </button>
        </div>
      )}
    </div>
  );
};

export default ProfileMenu;
