import { useEffect, useState } from "react"
import { Link } from "react-router-dom"
import Navbar from "../components/Navbar"
import API from "../api/axios"

export default function History() {
  const [history, setHistory] = useState({
    reviews: [],
    favorites: []
  })

  useEffect(() => {
    API.get("/users/me/history")
      .then((res) => setHistory(res.data || { reviews: [], favorites: [] }))
      .catch(() => setHistory({ reviews: [], favorites: [] }))
  }, [])

  return (
    <div className="subpage">
      <Navbar />
      <div className="subpage-spacer"></div>

      <div className="container">
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
      </div>
    </div>
  )
}