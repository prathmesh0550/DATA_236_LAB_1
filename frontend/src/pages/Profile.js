import { useEffect, useState } from "react"
import { Link } from "react-router-dom"
import Navbar from "../components/Navbar"
import API from "../api/axios"

export default function Profile() {
  const [user, setUser] = useState(null)

  useEffect(() => {
    API.get("/users/me")
      .then((res) => setUser(res.data || {}))
      .catch(() => setUser({}))
  }, [])

  if (!user) return null

  return (
    <div className="subpage">
      <Navbar />
      <div className="subpage-spacer"></div>

      <div className="container page-narrow">
        <div className="view-card large-view-card">
          <div className="view-card-header">
            <h2>Profile</h2>
            <div className="view-card-actions">
              <Link to="/history" className="btn btn-outline">History</Link>
              <Link to="/profile/edit" className="btn btn-primary">Edit Profile</Link>
            </div>
          </div>

          <div className="profile-view-top spacious-profile-top">
            <img
              src={user.profile_picture || "https://placehold.co/180x180/png?text=User"}
              alt={user.name || "User"}
              className="profile-photo large-profile-photo"
            />

            <div className="profile-main-info">
              <h3>{user.name || "User"}</h3>
              <p>{user.email || "-"}</p>
            </div>
          </div>

          <div className="info-grid spacious-info-grid">
            <div>
              <span>Name</span>
              <strong>{user.name || "-"}</strong>
            </div>

            <div>
              <span>Email</span>
              <strong>{user.email || "-"}</strong>
            </div>

            <div>
              <span>Phone</span>
              <strong>{user.phone || "-"}</strong>
            </div>

            <div>
              <span>City</span>
              <strong>{user.city || "-"}</strong>
            </div>

            <div>
              <span>State</span>
              <strong>{user.state || "-"}</strong>
            </div>

            <div>
              <span>Country</span>
              <strong>{user.country || "-"}</strong>
            </div>

            <div>
              <span>Gender</span>
              <strong>{user.gender || "-"}</strong>
            </div>

            <div>
              <span>Languages</span>
              <strong>{Array.isArray(user.languages) ? user.languages.join(", ") || "-" : user.languages || "-"}</strong>
            </div>
          </div>

          <div className="about-block spacious-about-block">
            <span>About Me</span>
            <p>{user.about_me || "-"}</p>
          </div>
        </div>
      </div>
    </div>
  )
}