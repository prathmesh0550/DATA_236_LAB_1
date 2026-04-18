import { useEffect, useState } from "react"
import { Link } from "react-router-dom"
import Navbar from "../components/Navbar"
import RestaurantCard from "../components/RestaurantCard"
import { userApi } from "../api/axios"
import { reviewApi } from "../api/axios"


export default function History() {
  const [reviews, setReviews] = useState([])
  const [restaurantsAdded, setRestaurantsAdded] = useState([])
  const [deletingReviewId, setDeletingReviewId] = useState(null)

  useEffect(() => {
    const loadHistory = async () => {
      try {
        const res = await userApi.get("/users/me/history")
        const data = res.data || {}

        setReviews(Array.isArray(data.reviews) ? data.reviews : [])
        setRestaurantsAdded(
          Array.isArray(data.restaurants_added) ? data.restaurants_added : []
        )
      } catch {
        setReviews([])
        setRestaurantsAdded([])
      }
    }

    loadHistory()
  }, [])

  const handleDeleteReview = async (reviewId) => {
    const confirmed = window.confirm(
      "Are you sure you want to delete this review?"
    )

    if (!confirmed) return

    try {
      setDeletingReviewId(reviewId)
      await reviewApi.delete(`/reviews/${reviewId}`)
      setReviews((prev) => prev.filter((review) => review.review_id !== reviewId))
    } catch {
      alert("Failed to delete review.")
    } finally {
      setDeletingReviewId(null)
    }
  }

  return (
    <div className="subpage">
      <Navbar />
      <div className="subpage-spacer"></div>

      <div className="container page-narrow">
        <div className="view-card large-view-card">
          <div className="view-card-header">
            <h2>History</h2>
            <Link to="/profile" className="btn btn-outline">
              Back to Profile
            </Link>
          </div>

          <div className="history-section">
            <h3>Your Reviews</h3>
            <div className="history-list">
              {reviews.length === 0 && <p>No reviews yet.</p>}

              {reviews.map((review) => (
                <div key={review.review_id} className="history-card">
                  <strong>
                    {review.restaurant_name ||
                      `Restaurant #${review.restaurant_id}`}
                  </strong>

                  <span>{review.review_date ? new Date(review.review_date).toLocaleString(): ""}</span>

                  <p>Rating: {review.rating}/5</p>
                  <p>{review.comment || "No comment"}</p>

                  <div className="history-actions">
                    <Link to={`/restaurant/${review.restaurant_id}`} className="btn btn-outline"> View Restaurant</Link>
                    <Link to={`/edit-review/${review.review_id}`} className="btn btn-primary"> Edit Review</Link>

                    <button
                      type="button"
                      className="btn btn-danger"
                      onClick={() => handleDeleteReview(review.review_id)}
                      disabled={deletingReviewId === review.review_id}
                    >
                      {deletingReviewId === review.review_id
                        ? "Deleting..."
                        : "Delete Review"}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="history-section">
            <h3>Your Added Restaurants</h3>

            {restaurantsAdded.length === 0 && (
              <p>No restaurants added yet.</p>
            )}

            <div className="history-list">
              {restaurantsAdded.map((restaurant) => (
                <RestaurantCard
                  key={restaurant.restaurant_id}
                  data={restaurant}
                />
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}