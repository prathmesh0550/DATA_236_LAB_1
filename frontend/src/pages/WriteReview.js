import { useState } from "react"
import { useNavigate, useParams } from "react-router-dom"
import Navbar from "../components/Navbar"
import { reviewApi } from "../api/axios"

export default function WriteReview() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [rating, setRating] = useState(5)
  const [comment, setComment] = useState("")
  const [photos, setPhotos] = useState([])

  const handleFileUpload = (e) => {
    const files = Array.from(e.target.files || [])
    if (!files.length) return

    Promise.all(
      files.map(
        (file) =>
          new Promise((resolve) => {
            const reader = new FileReader()
            reader.onloadend = () => resolve(reader.result)
            reader.readAsDataURL(file)
          })
      )
    ).then((results) => setPhotos(results))
  }

  const submit = async (e) => {
    e.preventDefault()
    await reviewApi.post(`/restaurants/${id}/reviews`, {
      rating: Number(rating),
      comment,
      photos
    })
    navigate(`/restaurant/${id}`)
  }

  return (
    <div className="subpage">
      <Navbar />
      <div className="subpage-spacer"></div>
      <div className="container page-narrow">
        <div className="simple-card enhanced-form-card">
          <h2>Write Review</h2>

          <form className="auth-form" onSubmit={submit}>
            <div className="field-group">
              <label>Rating</label>
              <input type="number" min="1" max="5" value={rating} onChange={(e) => setRating(e.target.value)} />
            </div>

            <div className="field-group">
              <label>Comment</label>
              <textarea rows="4" value={comment} onChange={(e) => setComment(e.target.value)} />
            </div>

            <div className="field-group">
              <label>Review Photos</label>
              <label className="upload-box">
                <span>Choose Images</span>
                <input type="file" accept="image/*" multiple onChange={handleFileUpload} />
              </label>
            </div>

            {photos.length > 0 && (
              <div className="image-preview-grid">
                {photos.map((photo, index) => (
                  <img key={index} src={photo} alt={`Upload ${index + 1}`} className="preview-image" />
                ))}
              </div>
            )}

            <button type="submit" className="btn btn-primary full-width">Submit Review</button>
          </form>
        </div>
      </div>
    </div>
  )
}