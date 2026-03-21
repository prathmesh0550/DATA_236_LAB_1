import { useEffect, useState } from "react"
import { Link, useParams } from "react-router-dom"
import Navbar from "../components/Navbar"
import ReviewCard from "../components/ReviewCard"
import API from "../api/axios"

export default function RestaurantDetails() {
  const { id } = useParams()
  const role = localStorage.getItem("role")
  const [restaurant, setRestaurant] = useState(null)
  const [reviews, setReviews] = useState([])
  const [history, setHistory] = useState({ reviews: [] })
  const [activePhoto, setActivePhoto] = useState(0)

  const loadData = async () => {
    const restaurantRes = await API.get(`/restaurants/${id}`)
    setRestaurant(restaurantRes.data)

    const reviewRes = await API.get(`/restaurants/${id}/reviews`)
    setReviews(reviewRes.data || [])

    if (role === "user") {
      try {
        const historyRes = await API.get("/users/me/history")
        setHistory(historyRes.data || { reviews: [] })
      } catch {
        setHistory({ reviews: [] })
      }
    }
  }

  useEffect(() => {
    loadData()
  }, [id])

  const deleteOwnReview = async (reviewId) => {
    const confirmed = window.confirm("Are you sure you want to delete review?")
    if (!confirmed) return
    await API.delete(`/reviews/${reviewId}`)
    loadData()
  }

  const addFavorite = async () => {
    await API.post(`/favorites/${id}`)
    alert("Added to favorites")
  }

  const claimRestaurant = async () => {
    await API.post(`/owners/restaurants/${id}/claim`)
    alert("Restaurant claimed")
    loadData()
  }

  const myReviewIds = new Set((history.reviews || []).map((r) => r.review_id))

  if (!restaurant) return null

  const gallery = restaurant.photos || []
  const mainPhoto =
    gallery[activePhoto] ||
    "https://images.unsplash.com/photo-1552566626-52f8b828add9?auto=format&fit=crop&w=1200&q=80"

  return (
    <div className="subpage">
      <Navbar />
      <div className="subpage-spacer"></div>

      <div className="container">
        <div className="details-card">
          <img src={mainPhoto} alt={restaurant.name} className="details-hero" />

          {gallery.length > 1 && (
            <div className="restaurant-photo-grid">
              {gallery.map((photo, index) => (
                <img
                  key={index}
                  src={photo}
                  alt={`${restaurant.name} ${index + 1}`}
                  className={`restaurant-thumb ${index === activePhoto ? "active-thumb" : ""}`}
                  onClick={() => setActivePhoto(index)}
                />
              ))}
            </div>
          )}

          <div className="details-body">
            <h1>{restaurant.name}</h1>
            <p>{restaurant.description || ""}</p>

            <div className="details-meta">
              <span>{restaurant.cuisine_type || "Restaurant"}</span>
              <span>{restaurant.city || "City"}</span>
              <span>{restaurant.address || "No address"}</span>
              <span>{restaurant.hours || "Hours unavailable"}</span>
              <span>{restaurant.contact_info || "No contact info"}</span>
              <span>{restaurant.avg_rating || 0}</span>
              <span>{restaurant.review_count || 0} reviews</span>
            </div>

            <div className="details-actions">
              {role === "user" && (
                <>
                  <button className="btn btn-primary" onClick={addFavorite}>Add to Favorites</button>
                  <Link to={`/review/${restaurant.restaurant_id}`} className="btn btn-soft">Write Review</Link>
                </>
              )}

              {role === "owner" && !restaurant.claimed_by_owner_id && (
                <button className="btn btn-primary" onClick={claimRestaurant}>Claim Restaurant</button>
              )}

              {role === "owner" && restaurant.claimed_by_owner_id && (
                <Link to={`/owner/restaurants/${restaurant.restaurant_id}/edit`} className="btn btn-outline">Edit Restaurant</Link>
              )}
            </div>
          </div>
        </div>

        <div className="section-heading left-align review-section-heading">
          <h2>Reviews</h2>
        </div>

        <div className="reviews-list">
          {reviews.map((review) => (
            <ReviewCard
              key={review.review_id}
              review={review}
              isOwner={myReviewIds.has(review.review_id)}
              onDelete={deleteOwnReview}
            />
          ))}
        </div>
      </div>
    </div>
  )
}