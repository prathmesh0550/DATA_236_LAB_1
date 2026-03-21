import { useEffect, useState } from "react"
import { useNavigate, useParams } from "react-router-dom"
import Navbar from "../components/Navbar"
import API from "../api/axios"

export default function EditReview() {
  const { reviewId } = useParams()
  const navigate = useNavigate()
  const [rating, setRating] = useState(5)
  const [comment, setComment] = useState("")
  const [photos, setPhotos] = useState("")
  const [restaurantId, setRestaurantId] = useState("")

  useEffect(() => {
    API.get("/users/me/history").then((res) => {
      const review = (res.data?.reviews || []).find((r) => String(r.review_id) === String(reviewId))
      if (review) {
        setRating(review.rating || 5)
        setComment(review.comment || "")
        setRestaurantId(review.restaurant_id)
      }
    })
  }, [reviewId])

  const submit = async (e) => {
    e.preventDefault()
    await API.put(`/reviews/${reviewId}`, {
      rating: Number(rating),
      comment,
      photos: photos ? photos.split(",").map((x) => x.trim()).filter(Boolean) : []
    })
    navigate(`/restaurant/${restaurantId}`)
  }

  return (
    <div className="subpage">
      <Navbar />
      <div className="subpage-spacer"></div>
      <div className="container">
        <div className="simple-card">
          <h2>Edit Review</h2>
          <form className="auth-form" onSubmit={submit}>
            <div className="field-group">
              <label>Rating</label>
              <input type="number" min="1" max="5" value={rating} onChange={(e) => setRating(e.target.value)} />
            </div>

            <div className="field-group">
              <label>Comment</label>
              <textarea value={comment} onChange={(e) => setComment(e.target.value)} rows="4" />
            </div>

            <div className="field-group">
              <label>Review Photo URLs</label>
              <input value={photos} onChange={(e) => setPhotos(e.target.value)} placeholder="url1, url2" />
            </div>

            <button type="submit" className="btn btn-primary full-width">Update Review</button>
          </form>
        </div>
      </div>
    </div>
  )
}