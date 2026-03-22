import { useEffect, useState } from "react"
import { Link } from "react-router-dom"
import Navbar from "../components/Navbar"
import API from "../api/axios"

export default function History() {
  const [reviews, setReviews] = useState([])
  const [favorites, setFavorites] = useState([])

  useEffect(() => {
    API.get("/users/me/history")
      .then((res) => {
        const data = res.data || {}

        if (Array.isArray(data)) {
          setReviews(data)
          setFavorites([])
          return
        }

        setReviews(Array.isArray(data.reviews) ? data.reviews : [])
        setFavorites(Array.isArray(data.favorites) ? data.favorites : [])
      })
      .catch(() => {
        setReviews([])
        setFavorites([])
      })
  }, [])

  return (
    <div className="subpage">
      <Navbar />
      <div className="subpage-spacer"></div>

      <div className="container page-narrow">
        <div className="view-card large-view-card">
          <div className="view-card-header">
            <h2>History</h2>
            <Link to="/profile" className="btn btn-outline">Back to Profile</Link>
          </div>

          <div className="history-section">
            <h3>Your Reviews</h3>
            <div className="history-list">
              {reviews.length === 0 && <p>No reviews yet.</p>}

              {reviews.map((review) => (
                <div key={review.review_id} className="history-card">
                  <strong>Restaurant #{review.restaurant_id}</strong>
                  <span>{review.review_date ? new Date(review.review_date).toLocaleString() : ""}</span>
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
              {favorites.length === 0 && <p>No favorites yet.</p>}

              {favorites.map((fav, index) => (
                <div key={fav.restaurant_id || index} className="history-card">
                  <strong>Restaurant #{fav.restaurant_id}</strong>
                  <span>{fav.created_at ? new Date(fav.created_at).toLocaleString() : ""}</span>
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