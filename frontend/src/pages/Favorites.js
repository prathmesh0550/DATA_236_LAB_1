import { useEffect, useState } from "react"
import Navbar from "../components/Navbar"
import RestaurantCard from "../components/RestaurantCard"
import API from "../api/axios"

export default function Favorites() {
  const [items, setItems] = useState([])

  useEffect(() => {
    API.get("/users/me/favorites")
      .then((res) => setItems(res.data || []))
      .catch(() => setItems([]))
  }, [])

  return (
    <div className="subpage">
      <Navbar />
      <div className="subpage-spacer"></div>
      <div className="container">
        <div className="section-heading left-align">
          <h2>Your Favorites</h2>
          <p>Places you saved for later</p>
        </div>

        <div className="restaurant-grid">
          {items.map((item) => (
            <RestaurantCard key={item.restaurant_id} data={item} />
          ))}
        </div>
      </div>
    </div>
  )
}