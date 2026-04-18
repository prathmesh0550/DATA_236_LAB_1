import { useState } from "react"
import { useNavigate, useParams } from "react-router-dom"
import Navbar from "../components/Navbar"
import { reviewApi } from "../api/axios"

export default function WriteReview() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [rating, setRating] = useState(5)
  const [comment, setComment] = useState("")
  const [photos, setPhotos] = useState("")

  const submit = async (e) => {
    e.preventDefault()
    await reviewApi.post(`/restaurants/${id}/reviews`, {
      rating: Number(rating),
      comment,
      photos: photos ? photos.split(",").map((x) => x.trim()).filter(Boolean) : []
    })
    navigate(`/restaurant/${id}`)
  }

  return (
    <div className="subpage">
      <Navbar />
      <div className="subpage-spacer"></div>
      <div className="container">
        <div className="simple-card">
          <h2>Write Review</h2>
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

            <button type="submit" className="btn btn-primary full-width">Submit Review</button>
          </form>
        </div>
      </div>
    </div>
  )
}