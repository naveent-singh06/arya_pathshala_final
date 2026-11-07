import React from "react";
import { Navigate } from "react-router-dom";

const loadingStyle = { minHeight: "100vh", display: "grid", placeItems: "center", fontWeight: 700, letterSpacing: "0.1em" };

/** Where a signed-in person goes from /login: admins to the admin dashboard, students to theirs. Waits for the claim check. */
export default function SignedInRedirect({ adminChecked, isAdmin }) {
  if (!adminChecked) return <div style={loadingStyle}>ARYA PATHSHALA</div>;
  return <Navigate to={isAdmin ? "/dashboardadmin" : "/dashboard"} replace />;
}
