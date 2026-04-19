import { Link, useNavigate } from "react-router-dom"
import { useEffect, useState } from "react"
import API from "../api/axios"

export default function Navbar() {
  const navigate = useNavigate()
  const [role, setRole] = useState(localStorage.getItem("role") || "")
  const [displayName, setDisplayName] = useState(localStorage.getItem("displayName") || "")
  const [profilePicture, setProfilePicture] = useState(localStorage.getItem("profilePicture") || "")

  useEffect(() => {
    const token = localStorage.getItem("token")
    const savedRole = localStorage.getItem("role")

    if (!token || !savedRole) {
      setRole("")
      setDisplayName("")
      setProfilePicture("")
      return
    }

    const endpoint = savedRole === "owner" ? "/auth/owner/me" : "/auth/user/me"

    API.get(endpoint)
      .then((res) => {
        const name = res.data?.name || ""
        const photo = res.data?.profile_picture || ""
        setRole(savedRole)
        setDisplayName(name)
        setProfilePicture(photo)
        localStorage.setItem("displayName", name)
        localStorage.setItem("profilePicture", photo)
      })
      .catch(() => {
        localStorage.removeItem("token")
        localStorage.removeItem("role")
        localStorage.removeItem("displayName")
        localStorage.removeItem("profilePicture")
        setRole("")
        setDisplayName("")
        setProfilePicture("")
      })
  }, [])

  const logout = () => {
    localStorage.removeItem("token")
    localStorage.removeItem("role")
    localStorage.removeItem("displayName")
    localStorage.removeItem("profilePicture")
    setRole("")
    setDisplayName("")
    setProfilePicture("")
    navigate("/")
    window.location.reload()
  }

  return (
    <header className="topbar">
      <div className="container topbar-inner">
        <Link to="/" className="brand">yelp</Link>

        <div className="topbar-links">
          <a href="/#activity">Popular Restaurants</a>
          <a href="/#cities">Cities</a>

          {role === "user" && <Link to="/favorites">Favorites</Link>}
          {role === "user" && <Link to="/history">History</Link>}
          {role === "user" && <Link to="/preferences">Preferences</Link>}

          {role === "owner" && <Link to="/owner/dashboard">Owner Dashboard</Link>}
          {role === "owner" && <Link to="/owner/restaurants">My Restaurants</Link>}
          {role === "owner" && <Link to="/owner/add-restaurant">Add Restaurant</Link>}
        </div>

        <div className="topbar-actions">
          {role ? (
            <>
              <span className="user-badge">
                {role === "owner" ? `Owner: ${displayName || "Owner"}` : `Hi, ${displayName || "User"}`}
              </span>

              {role === "user" && (
                <Link to="/profile" className="navbar-avatar-link">
                  <img
                    src={profilePicture || "https://placehold.co/80x80/png?text=U"}
                    alt="Profile"
                    className="navbar-avatar"
                  />
                </Link>
              )}

              {role === "owner" && (
                <div className="navbar-avatar-link">
                  <div className="navbar-avatar owner-avatar-initial">
                    {(displayName || "O").charAt(0)}
                  </div>
                </div>
              )}

              {role === "user" && <Link to="/add-restaurant" className="btn btn-ghost">Add Restaurant</Link>}
              <button className="btn btn-primary" onClick={logout}>Logout</button>
            </>
          ) : (
            <>
              <Link to="/login" className="btn btn-ghost">User Login</Link>
              <Link to="/signup" className="btn btn-primary">User Sign Up</Link>
              <Link to="/owner/login" className="btn btn-ghost">Owner Login</Link>
              <Link to="/owner/signup" className="btn btn-primary">Owner Sign Up</Link>
            </>
          )}
        </div>
      </div>
    </header>
  )
}