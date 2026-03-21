import { Link } from "react-router-dom"

export default function ReviewCard({ review, isOwner, onDelete }) {
  return (
    <div className="review-card">
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

      {isOwner && (
        <div className="review-card-actions">
          <Link to={`/edit-review/${review.review_id}`} className="btn btn-outline">Edit</Link>
          <button className="btn btn-primary" onClick={() => onDelete(review.review_id)}>Delete</button>
        </div>
      )}
    </div>
  )
}