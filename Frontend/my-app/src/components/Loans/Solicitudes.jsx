import React from "react";
import "./Solicitudes.css";
import { useKeycloak } from "@react-keycloak/web";

const Solicitudes = () => {
  const { keycloak, initialized } = useKeycloak();
  const logged = initialized && !!keycloak?.authenticated;
  let roles = [];
  if (keycloak && keycloak.tokenParsed && keycloak.tokenParsed.realm_access) {
    roles = keycloak.tokenParsed.realm_access.roles || [];
  }
  roles = roles.map((r) => String(r).toUpperCase());

  const show = logged && roles.includes("EMPLOYEE");
  const canReceive = logged && (roles.includes("EMPLOYEE") || roles.includes("ADMIN"));

  const handleCreateDeliver = () => {
    // Aquí iría la navegación o apertura de modal para crear/entregar
    alert("Crear/Entregar Solicitud (funcionalidad por implementar)");
  };

  const handleReceive = () => {
    // Ruta o modal para recibir solicitudes (devoluciones)
    alert("Recibir Solicitud (funcionalidad por implementar)");
  };

  return (
    <div className="solicitudes-container">
      <button className="sol-button" onClick={handleCreateDeliver}>
        Crear / Entregar Solicitud
      </button>

      {canReceive && (
        <button className="sol-button secondary" onClick={handleReceive}>
          Recibir Solicitud
        </button>
      )}
    </div>
  );
};

export default Solicitudes;
