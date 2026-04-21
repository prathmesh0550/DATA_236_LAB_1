import { Navigate } from "react-router-dom"

export default function ProtectedRoute({ children, role }) {
  const userRole = localStorage.getItem("role")
  const token = role === "owner"
    ? localStorage.getItem("ownerToken")
    : localStorage.getItem("token")

  if (!token) {
    return <Navigate to={role === "owner" ? "/owner/login" : "/login"} replace />
  }

  if (role && userRole !== role) {
    return <Navigate to="/" replace />
  }

  return children
}