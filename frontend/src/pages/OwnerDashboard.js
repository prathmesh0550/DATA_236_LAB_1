import { useEffect, useMemo, useState } from "react"
import Navbar from "../components/Navbar"
import { ownerApi } from "../api/axios"

export default function OwnerDashboard() {
  const [dashboard, setDashboard] = useState({
    restaurant_count: 0,
    total_reviews: 0,
    avg_rating_overall: 0,
    recent_reviews: []
  })
  const [filterText, setFilterText] = useState("")
  const [filterRating, setFilterRating] = useState("")

  useEffect(() => {
    ownerApi.get("/owners/me/dashboard")
      .then((res) => setDashboard(res.data || {
        restaurant_count: 0,
        total_reviews: 0,
        avg_rating_overall: 0,
        recent_reviews: []
      }))
      .catch(() => setDashboard({
        restaurant_count: 0,
        total_reviews: 0,
        avg_rating_overall: 0,
        recent_reviews: []
      }))
  }, [])

  const filteredReviews = useMemo(() => {
    return (dashboard.recent_reviews || []).filter((review) => {
      const textMatch =
        !filterText ||
        String(review.restaurant_id).includes(filterText) ||
        (review.comment || "").toLowerCase().includes(filterText.toLowerCase())

      const ratingMatch = !filterRating || String(review.rating) === String(filterRating)

      return textMatch && ratingMatch
    })
  }, [dashboard, filterText, filterRating])

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

        <div className="view-card">
          <div className="view-card-header">
            <h2>Recent Reviews</h2>
          </div>

          <div className="owner-filter-bar">
            <input
              type="text"
              placeholder="Filter by restaurant id or keyword"
              value={filterText}
              onChange={(e) => setFilterText(e.target.value)}
            />
            <select value={filterRating} onChange={(e) => setFilterRating(e.target.value)}>
              <option value="">All Ratings</option>
              <option value="1">1 Star</option>
              <option value="2">2 Stars</option>
              <option value="3">3 Stars</option>
              <option value="4">4 Stars</option>
              <option value="5">5 Stars</option>
            </select>
          </div>

          <div className="reviews-list">
            {filteredReviews.length === 0 && <p>No reviews found.</p>}
            {filteredReviews.map((review) => (
              <div key={review.review_id} className="review-card">
                <div className="review-card-top">
                  <div>
                    <h4>Restaurant #{review.restaurant_id}</h4>
                    <span>{new Date(review.review_date).toLocaleString()}</span>
                  </div>
                </div>
                <p>Rating: {review.rating}/5</p>
                <p>{review.comment || "No comment"}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}