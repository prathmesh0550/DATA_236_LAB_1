import { useEffect, useMemo, useState } from "react"
import { useNavigate, useParams, Link } from "react-router-dom"
import Navbar from "../components/Navbar"
import ReviewCard from "../components/ReviewCard"
import API from "../api/axios"

export default function RestaurantDetails() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [restaurant, setRestaurant] = useState(null)
  const [reviews, setReviews] = useState([])
  const role = localStorage.getItem("role")

  const loadData = async () => {
    const restaurantRes = await API.get(`/restaurants/${id}`)
    setRestaurant(restaurantRes.data)
    const reviewsRes = await API.get(`/restaurants/${id}/reviews`)
    setReviews(reviewsRes.data || [])
  }

  useEffect(() => {
    loadData()
  }, [id])

  const userReviewIds = useMemo(() => {
    return reviews.map((r) => r.review_id)
  }, [reviews])

  const deleteOwnReview = async (reviewId) => {
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

  if (!restaurant) return null

  return (
    <div className="subpage">
      <Navbar />
      <div className="subpage-spacer"></div>

      <div className="container">
        <div className="details-card">
          <img
            src={restaurant?.photos?.[0] || "https://images.unsplash.com/photo-1552566626-52f8b828add9?auto=format&fit=crop&w=1200&q=80"}
            alt={restaurant?.name}
            className="details-hero"
          />
          <div className="details-body">
            <h1>{restaurant.name}</h1>
            <p>{restaurant.description || ""}</p>
            <div className="details-meta">
              <span>{restaurant.cuisine_type || "Restaurant"}</span>
              <span>{restaurant.city || "City"}</span>
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
              isOwner={role === "user"}
              onDelete={deleteOwnReview}
            />
          ))}
        </div>
      </div>
    </div>
  )
}