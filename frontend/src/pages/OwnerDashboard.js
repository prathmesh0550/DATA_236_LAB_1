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
      .then((res) =>
        setDashboard(
          res.data || {
            restaurant_count: 0,
            total_reviews: 0,
            avg_rating_overall: 0,
            recent_reviews: []
          }
        )
      )
      .catch(() =>
        setDashboard({
          restaurant_count: 0,
          total_reviews: 0,
          avg_rating_overall: 0,
          recent_reviews: []
        })
      )
  }, [])

  const filteredReviews = useMemo(() => {
    return (dashboard.recent_reviews || []).filter((review) => {
      const textMatch =
        !filterText ||
        (review.restaurant_name || "").toLowerCase().includes(filterText.toLowerCase()) ||
        (review.comment || "").toLowerCase().includes(filterText.toLowerCase())

      const ratingMatch = !filterRating || String(review.rating) === String(filterRating)

      return textMatch && ratingMatch
    })
  }, [dashboard, filterText, filterRating])

  const formatDate = (val) => {
    if (!val) return "No date"
    const d = new Date(val)
    return isNaN(d.getTime()) ? "No date" : d.toLocaleString()
  }

  return (
    <div className="subpage">
      <Navbar />
      <div className="subpage-spacer"></div>

      <div className="container">
        <div className="owner-dashboard-hero">
          <div>
            <h1>Owner Analytics Dashboard</h1>
            <p>Track restaurants, ratings, and recent customer feedback.</p>
          </div>
        </div>

        <div className="analytics-grid">
          <div className="analytics-card">
            <span>Claimed Restaurants</span>
            <strong>{dashboard.restaurant_count}</strong>
          </div>

          <div className="analytics-card">
            <span>Total Reviews</span>
            <strong>{dashboard.total_reviews}</strong>
          </div>

          <div className="analytics-card">
            <span>Average Rating</span>
            <strong>{Number(dashboard.avg_rating_overall || 0).toFixed(1)}</strong>
          </div>
        </div>

        <div className="view-card">
          <div className="view-card-header">
            <h2>Recent Reviews</h2>
          </div>

          <div className="owner-filter-bar">
            <input
              type="text"
              placeholder="Filter by restaurant name or keyword"
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
              <div key={review.review_id} className="review-card analytics-review-card">
                <div className="review-card-top">
                  <div>
                    <h4>{review.restaurant_name || "Unknown Restaurant"}</h4>
                    <span>{formatDate(review.review_date)}</span>
                  </div>
                  <div className="analytics-rating-pill">{review.rating}/5</div>
                </div>
                <p>{review.comment || "No comment"}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}