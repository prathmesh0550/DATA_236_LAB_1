import { useEffect, useMemo, useState } from "react"
import { Link, useParams } from "react-router-dom"
import { useDispatch, useSelector } from "react-redux"
import Navbar from "../components/Navbar"
import ReviewCard from "../components/ReviewCard"
import { ownerApi, restaurantApi, reviewApi, userApi } from "../api/axios"
import { fetchReviewsForRestaurant, setReviewPendingStatus } from "../store/slices/reviewsSlice"

export default function RestaurantDetails() {
  const { id } = useParams()
  const dispatch = useDispatch()
  const role = localStorage.getItem("role")
  const [restaurant, setRestaurant] = useState(null)
  const [history, setHistory] = useState({ reviews: [] })
  const [activePhoto, setActivePhoto] = useState(0)

  const reviews = useSelector((s) => s.reviews.byRestaurantId[id] || [])

  const loadData = async () => {
    try {
      const restaurantRes = await restaurantApi.get(`/restaurants/${id}`)
      setRestaurant(restaurantRes.data)
    } catch (err) {
      console.error("Failed to load restaurant:", err?.response?.data || err.message)
      setRestaurant(null)
    }

    dispatch(fetchReviewsForRestaurant(id))

    if (role === "user") {
      try {
        const historyRes = await userApi.get("/users/me/history")
        setHistory(historyRes.data || { reviews: [] })
      } catch (err) {
        console.error("Failed to load history:", err?.response?.data || err.message)
        setHistory({ reviews: [] })
      }
    }
  }

  useEffect(() => {
    loadData()
  }, [id, dispatch])

  const myReviewIds = useMemo(() => {
    return new Set((history.reviews || []).map((r) => r.review_id))
  }, [history])

  const deleteOwnReview = async (reviewId) => {
    const confirmed = window.confirm("Are you sure you want to delete review?")
    if (!confirmed) return
    await reviewApi.delete(`/reviews/${reviewId}`)
    dispatch(setReviewPendingStatus({ reviewId, status: "queued", message: "Delete queued" }))
    dispatch(fetchReviewsForRestaurant(id))
  }

  const addFavorite = async () => {
    await userApi.post(`/favorites/${id}`)
    alert("Added to favorites")
  }

  const claimRestaurant = async () => {
    await ownerApi.post(`/owners/restaurants/${id}/claim`)
    alert("Restaurant claimed")
    loadData()
  }

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
              <span>{restaurant.zip_code || "No zip code"}</span>
              <span>{restaurant.address || "No address"}</span>
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
              canEdit={role === "user" && myReviewIds.has(review.review_id)}
              onDelete={deleteOwnReview}
            />
          ))}
        </div>
      </div>
    </div>
  )
}