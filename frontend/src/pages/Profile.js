import { useEffect, useState } from "react"
import { Link } from "react-router-dom"
import Navbar from "../components/Navbar"
import API from "../api/axios"

export default function Profile() {
  const [user, setUser] = useState(null)
  const [history, setHistory] = useState({ reviews: [], favorites: [] })
  const [activeTab, setActiveTab] = useState("profile")

  useEffect(() => {
    API.get("/users/me").then((res) => setUser(res.data))
    API.get("/users/me/history")
      .then((res) => setHistory(res.data || { reviews: [], favorites: [] }))
      .catch(() => setHistory({ reviews: [], favorites: [] }))
  }, [])

  if (!user) return null

  return (
    <div className="subpage">
      <Navbar />
      <div className="subpage-spacer"></div>
      <div className="container">
        <div className="tab-switcher">
          <button className={`tab-btn ${activeTab === "profile" ? "active-tab-btn" : ""}`} onClick={() => setActiveTab("profile")}>
            Profile
          </button>
          <button className={`tab-btn ${activeTab === "history" ? "active-tab-btn" : ""}`} onClick={() => setActiveTab("history")}>
            History
          </button>
        </div>

        {activeTab === "profile" && (
          <div className="view-card">
            <div className="view-card-header">
              <h2>Profile</h2>
              <Link to="/profile/edit" className="btn btn-primary">Edit Profile</Link>
            </div>

            <div className="profile-view-top">
              <img
                src={user.profile_picture || "https://placehold.co/160x160/png?text=User"}
                alt={user.name}
                className="profile-photo"
              />
              <div className="profile-main-info">
                <h3>{user.name || "User"}</h3>
                <p>{user.email || ""}</p>
              </div>
            </div>

            <div className="info-grid">
              <div><span>Name</span><strong>{user.name || "-"}</strong></div>
              <div><span>Email</span><strong>{user.email || "-"}</strong></div>
              <div><span>Phone</span><strong>{user.phone || "-"}</strong></div>
              <div><span>City</span><strong>{user.city || "-"}</strong></div>
              <div><span>State</span><strong>{user.state || "-"}</strong></div>
              <div><span>Country</span><strong>{user.country || "-"}</strong></div>
              <div><span>Gender</span><strong>{user.gender || "-"}</strong></div>
              <div><span>Languages</span><strong>{(user.languages || []).join(", ") || "-"}</strong></div>
            </div>

            <div className="about-block">
              <span>About Me</span>
              <p>{user.about_me || "-"}</p>
            </div>
          </div>
        )}

        {activeTab === "history" && (
          <div className="view-card">
            <div className="view-card-header">
              <h2>History</h2>
            </div>

            <div className="history-section">
              <h3>Your Reviews</h3>
              <div className="history-list">
                {(history.reviews || []).length === 0 && <p>No reviews yet.</p>}
                {(history.reviews || []).map((review) => (
                  <div key={review.review_id} className="history-card">
                    <strong>Restaurant #{review.restaurant_id}</strong>
                    <span>{new Date(review.review_date).toLocaleString()}</span>
                    <p>Rating: {review.rating}/5</p>
                    <p>{review.comment || "No comment"}</p>
                    <div className="history-actions">
                      <Link to={`/restaurant/${review.restaurant_id}`} className="btn btn-outline">View Restaurant</Link>
                      <Link to={`/edit-review/${review.review_id}`} className="btn btn-primary">Edit Review</Link>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="history-section">
              <h3>Your Favorites</h3>
              <div className="history-list">
                {(history.favorites || []).length === 0 && <p>No favorites yet.</p>}
                {(history.favorites || []).map((fav) => (
                  <div key={`${fav.user_id}-${fav.restaurant_id}`} className="history-card">
                    <strong>Restaurant #{fav.restaurant_id}</strong>
                    <span>{new Date(fav.created_at).toLocaleString()}</span>
                    <div className="history-actions">
                      <Link to={`/restaurant/${fav.restaurant_id}`} className="btn btn-outline">View Restaurant</Link>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}