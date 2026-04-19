import { Link } from "react-router-dom"
import { useEffect, useState } from "react"
import { userApi, ownerApi } from "../api/axios"

export default function Navbar() {
  const [role, setRole] = useState(localStorage.getItem("role") || "")
  const [displayName, setDisplayName] = useState(
    localStorage.getItem("displayName") || ""
  )
  const [profilePicture, setProfilePicture] = useState(
    localStorage.getItem("profile_picture") || ""
  )

  useEffect(() => {
    const token = localStorage.getItem("token")
    const savedRole = localStorage.getItem("role")

    if (!token || !savedRole) {
      setRole("")
      setDisplayName("")
      setProfilePicture("")
      return
    }

    const loadUserData = async () => {
      try {
        if (savedRole === "owner") {
          const res = await ownerApi.get("/auth/me")
          const name = res.data?.name || ""

          setRole(savedRole)
          setDisplayName(name)
          setProfilePicture("")

          localStorage.setItem("displayName", name)
          localStorage.removeItem("profile_picture")
        } else {
          const res = await userApi.get("/users/me")
          const name = res.data?.name || ""
          const picture = res.data?.profile_picture || ""

          setRole(savedRole)
          setDisplayName(name)
          setProfilePicture(picture)

          localStorage.setItem("displayName", name)
          localStorage.setItem("profile_picture", picture)
        }
      } catch {
        localStorage.removeItem("token")
        localStorage.removeItem("role")
        localStorage.removeItem("displayName")
        localStorage.removeItem("profile_picture")

        setRole("")
        setDisplayName("")
        setProfilePicture("")
      }
    }

    loadUserData()
  }, [])

  const logout = async () => {
    try {
      const apiClient = role === "owner" ? ownerApi : userApi
      await apiClient.post("/auth/logout")
    } catch {
      // ignore backend logout errors
    }

    localStorage.removeItem("token")
    localStorage.removeItem("role")
    localStorage.removeItem("displayName")
    localStorage.removeItem("profile_picture")

    setRole("")
    setDisplayName("")
    setProfilePicture("")

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
              {role === "user" ? (
                <>
                  <Link to="/profile" className="profile-avatar-link" title={displayName || "Profile"}>
                    <img
                      src={
                        profilePicture ||
                        "https://placehold.co/40x40/png?text=U"
                      }
                      alt={displayName || "Profile"}
                      className="profile-avatar"
                    />
                  </Link>

                  <Link to="/add-restaurant" className="btn btn-ghost">
                    Add Restaurant
                  </Link>
                </>
              ) : (
                <span className="user-badge">
                  Owner: {displayName || "Owner"}
                </span>
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