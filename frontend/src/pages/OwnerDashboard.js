import { useEffect, useState } from "react"
import Navbar from "../components/Navbar"
import API from "../api/axios"

export default function OwnerDashboard() {
  const [dashboard, setDashboard] = useState({
    restaurant_count: 0,
    total_reviews: 0,
    avg_rating_overall: 0,
    recent_reviews: []
  })

  useEffect(() => {
    API.get("/owners/me/dashboard")
      .then((res) => setDashboard(res.data || {}))
      .catch(() => setDashboard({
        restaurant_count: 0,
        total_reviews: 0,
        avg_rating_overall: 0,
        recent_reviews: []
      }))
  }, [])

  return (
    <div className="subpage">
      <Navbar />
      <div className="subpage-spacer"></div>
      <div className="container">
        <div className="dashboard-grid">
          <div className="simple-card"><h2>{dashboard.restaurant_count}</h2><p>Claimed Restaurants</p></div>
          <div className="simple-card"><h2>{dashboard.total_reviews}</h2><p>Total Reviews</p></div>
          <div className="simple-card"><h2>{Number(dashboard.avg_rating_overall || 0).toFixed(1)}</h2><p>Average Rating</p></div>
        </div>

        <div className="simple-card">
          <h2>Recent Reviews</h2>
          <div className="reviews-list">
            {(dashboard.recent_reviews || []).map((review) => (
              <div key={review.review_id} className="review-card">
                <h4>Restaurant #{review.restaurant_id}</h4>
                <span>{new Date(review.review_date).toLocaleString()}</span>
                <p>{review.comment || "No comment"}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}