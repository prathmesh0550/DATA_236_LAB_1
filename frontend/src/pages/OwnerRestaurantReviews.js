import { useEffect, useMemo, useState } from "react"
import { useParams } from "react-router-dom"
import Navbar from "../components/Navbar"
import { reviewApi } from "../api/axios"

export default function OwnerRestaurantReviews() {
  const { id } = useParams()
  const [reviews, setReviews] = useState([])
  const [filterText, setFilterText] = useState("")
  const [filterRating, setFilterRating] = useState("")

  useEffect(() => {
    reviewApi.get(`/restaurants/${id}/reviews`)
      .then((res) => setReviews(res.data || []))
      .catch(() => setReviews([]))
  }, [id])

  const filteredReviews = useMemo(() => {
    return reviews.filter((review) => {
      const textMatch =
        !filterText ||
        (review.comment || "").toLowerCase().includes(filterText.toLowerCase())

      const ratingMatch =
        !filterRating || String(review.rating) === String(filterRating)

      return textMatch && ratingMatch
    })
  }, [reviews, filterText, filterRating])

  return (
    <div className="subpage">
      <Navbar />
      <div className="subpage-spacer"></div>

      <div className="container">
        <div className="view-card">
          <div className="view-card-header">
            <h2>Restaurant Reviews</h2>
          </div>

          <div className="owner-filter-bar">
            <input
              type="text"
              placeholder="Filter by keyword"
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
                    <h4>Rating: {review.rating}/5</h4>
                    <span>{new Date(review.review_date).toLocaleString()}</span>
                  </div>
                </div>

                <p>{review.comment || "No comment"}</p>

                {review.photos && review.photos.length > 0 && (
                  <div className="review-photo-grid">
                    {review.photos.map((photo, index) => (
                      <img key={index} src={photo} alt={`Review ${index + 1}`} className="review-photo" />
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}