import { useEffect } from "react"
import { useDispatch, useSelector } from "react-redux"
import Navbar from "../components/Navbar"
import RestaurantCard from "../components/RestaurantCard"
import { userApi } from "../api/axios"
import { fetchFavorites, removeFavoriteLocal } from "../store/slices/favoritesSlice"

export default function Favorites() {
  const dispatch = useDispatch()
  const { items, loading, error } = useSelector((s) => s.favorites)

  useEffect(() => {
    dispatch(fetchFavorites())
  }, [dispatch])

  const removeFavorite = async (restaurantId) => {
    await userApi.delete(`/favorites/${restaurantId}`)
    dispatch(removeFavoriteLocal(restaurantId))
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

        {loading && <p>Loading favorites...</p>}
        {error && <p>{error}</p>}

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