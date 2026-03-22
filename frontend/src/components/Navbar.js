import { Link, useNavigate } from "react-router-dom"
import { useEffect, useState } from "react"
import API from "../api/axios"

export default function Navbar() {
  const navigate = useNavigate()
  const [role, setRole] = useState(localStorage.getItem("role") || "")
  const [displayName, setDisplayName] = useState(
    localStorage.getItem("displayName") || ""
  )

  useEffect(() => {
    const token = localStorage.getItem("token")
    const savedRole = localStorage.getItem("role")

    if (!token || !savedRole) {
      setRole("")
      setDisplayName("")
      return
    }

    const endpoint = savedRole === "owner" ? "/auth/owner/me" : "/auth/user/me"

    API.get(endpoint)
      .then((res) => {
        const name = res.data?.name || ""
        setRole(savedRole)
        setDisplayName(name)
        localStorage.setItem("displayName", name)
      })
      .catch(() => {
        localStorage.removeItem("token")
        localStorage.removeItem("role")
        localStorage.removeItem("displayName")
        setRole("")
        setDisplayName("")
      })
  }, [])

  const logout = async () => {
    try {
      const endpoint =
        role === "owner" ? "/auth/owner/logout" : "/auth/user/logout"

      await API.post(endpoint)
    } catch {
      // Ignore backend logout errors and still clear client auth
    }

    localStorage.removeItem("token")
    localStorage.removeItem("role")
    localStorage.removeItem("displayName")
    setRole("")
    setDisplayName("")
    window.location.href = "/"
  }

  return (
    <header className="topbar">
      <div className="container topbar-inner">
        <Link to="/" className="brand">
          yelp
        </Link>

        <div className="topbar-links">
          <a href="/#activity">Popular Restaurants</a>
          <a href="/#cities">Cities</a>

          {role === "user" && <Link to="/favorites">Favorites</Link>}
          {role === "user" && <Link to="/history">History</Link>}
          {role === "user" && <Link to="/preferences">Preferences</Link>}

          {role === "owner" && <Link to="/owner/dashboard">Owner Dashboard</Link>}
          {role === "owner" && <Link to="/owner/restaurants">My Restaurants</Link>}
          {role === "owner" && (
            <Link to="/owner/add-restaurant">Add Restaurant</Link>
          )}
        </div>

        <div className="topbar-actions">
          {role ? (
            <>
              <span className="user-badge">
                {role === "owner"
                  ? `Owner: ${displayName || "Owner"}`
                  : `Hi, ${displayName || "User"}`}
              </span>

              {role === "user" && (
                <Link to="/profile" className="btn btn-ghost">
                  Profile
                </Link>
              )}
              {role === "user" && (
                <Link to="/add-restaurant" className="btn btn-ghost">
                  Add Restaurant
                </Link>
              )}

              <button className="btn btn-primary" onClick={logout}>
                Logout
              </button>
            </>
          ) : (
            <>
              <Link to="/login" className="btn btn-ghost">
                User Login
              </Link>
              <Link to="/signup" className="btn btn-primary">
                User Sign Up
              </Link>
              <Link to="/owner/login" className="btn btn-ghost">
                Owner Login
              </Link>
              <Link to="/owner/signup" className="btn btn-primary">
                Owner Sign Up
              </Link>
            </>
          )}
        </div>
      </div>
    </header>
  )
}