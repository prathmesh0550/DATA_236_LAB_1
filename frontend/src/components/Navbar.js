import { Link, useNavigate } from "react-router-dom"
import { useEffect } from "react"
import { useDispatch, useSelector } from "react-redux"
import { userApi, ownerApi } from "../api/axios"
import { clearCredentials, setCredentials } from "../store/slices/authSlice"

export default function Navbar() {
  const dispatch = useDispatch()
  const navigate = useNavigate()
  const { token, role, displayName, profilePicture } = useSelector((s) => s.auth)

  useEffect(() => {
    if (!token || !role) return

    const apiClient = role === "owner" ? ownerApi : userApi
    const endpoint = role === "owner" ? "/auth/me" : "/users/me"

    apiClient.get(endpoint)
      .then((res) => {
        dispatch(
          setCredentials({
            token,
            role,
            displayName: res.data?.name || (role === "owner" ? "Owner" : "User"),
            profilePicture: role === "owner" ? "" : res.data?.profile_picture || ""
          })
        )
      })
      .catch(() => {
        dispatch(clearCredentials())
      })
  }, [token, role, dispatch])

  const logout = async () => {
    try {
      const apiClient = role === "owner" ? ownerApi : userApi
      await apiClient.post("/auth/logout")
    } catch {}

    dispatch(clearCredentials())
    navigate("/")
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
          {role === "owner" && <Link to="/owner/add-restaurant">Add Restaurant</Link>}
        </div>

        <div className="topbar-actions">
          {role ? (
            <>
              {role === "user" ? (
                <>
                  <Link to="/profile" className="profile-avatar-link" title={displayName || "Profile"}>
                    <img
                      src={profilePicture || "https://placehold.co/40x40/png?text=U"}
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