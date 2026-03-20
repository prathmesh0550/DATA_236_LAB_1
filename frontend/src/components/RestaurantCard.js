import { Link } from "react-router-dom"

function Stars({ rating }) {
  const rounded = Math.round(Number(rating || 0))
  return (
    <div className="stars-row">
      {[1, 2, 3, 4, 5].map((n) => (
        <span key={n} className={n <= rounded ? "star filled" : "star"}>★</span>
      ))}
      <span className="rating-text">{Number(rating || 0).toFixed(1)}</span>
    </div>
  )
}

export default function RestaurantCard({ data }) {
  const image =
    data?.photos?.[0] ||
    "https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?auto=format&fit=crop&w=1200&q=80"

  return (
    <div className="restaurant-card">
      <div className="restaurant-card-image-wrap">
        <img src={image} alt={data?.name} className="restaurant-card-image" />
      </div>

      <div className="restaurant-card-body">
        <div className="restaurant-card-head">
          <h3>{data?.name}</h3>
          <span className="review-pill">{data?.review_count || 0} reviews</span>
        </div>

        <Stars rating={data?.avg_rating} />

        <p className="restaurant-meta">
          {data?.cuisine_type || "Restaurant"} • {data?.city || "City"}
        </p>

        <div className="restaurant-card-actions">
          <Link to={`/restaurant/${data?.restaurant_id}`} className="btn btn-outline">View Details</Link>
          {localStorage.getItem("role") === "user" && (
            <Link to={`/review/${data?.restaurant_id}`} className="btn btn-soft">Write Review</Link>
          )}
        </div>
      </div>
    </div>
  )
}