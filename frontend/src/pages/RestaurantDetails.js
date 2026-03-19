import { useEffect, useState } from "react"
import { useParams } from "react-router-dom"
import Navbar from "../components/Navbar"
import API from "../api/axios"

export default function RestaurantDetails() {
  const { id } = useParams()
  const [restaurant, setRestaurant] = useState({})

  useEffect(() => {
    API.get(`/restaurants/${id}`)
      .then((res) => setRestaurant(res.data || {}))
      .catch(() => setRestaurant({}))
  }, [id])

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
            <h1>{restaurant?.name}</h1>
            <p>{restaurant?.description || ""}</p>
            <div className="details-meta">
              <span>{restaurant?.cuisine_type || "Restaurant"}</span>
              <span>{restaurant?.city || "City"}</span>
              <span>{restaurant?.avg_rating || 0}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}