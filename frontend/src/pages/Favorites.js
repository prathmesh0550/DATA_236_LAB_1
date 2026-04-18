import { useEffect, useState } from "react"
import Navbar from "../components/Navbar"
import RestaurantCard from "../components/RestaurantCard"
import { userApi } from "../api/axios"

export default function Favorites() {
  const [items, setItems] = useState([])

  const loadFavorites = () => {
    userApi.get("/users/me/favorites")
      .then((res) => setItems(res.data || []))
      .catch(() => setItems([]))
  }

  useEffect(() => {
    loadFavorites()
  }, [])

  const removeFavorite = async (restaurantId) => {
    await userApi.delete(`/favorites/${restaurantId}`)
    loadFavorites()
  }

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
            <div key={item.restaurant_id} className="favorite-card-wrap">
              <RestaurantCard data={item} />
              <button className="btn btn-primary full-width" onClick={() => removeFavorite(item.restaurant_id)}>
                Remove from Favorites
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}