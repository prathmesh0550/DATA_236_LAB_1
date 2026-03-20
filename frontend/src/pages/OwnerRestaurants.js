import { useEffect, useState } from "react"
import { Link } from "react-router-dom"
import Navbar from "../components/Navbar"
import API from "../api/axios"

export default function OwnerRestaurants() {
  const [items, setItems] = useState([])

  useEffect(() => {
    API.get("/owners/me/restaurants")
      .then((res) => setItems(res.data || []))
      .catch(() => setItems([]))
  }, [])

  return (
    <div className="subpage">
      <Navbar />
      <div className="subpage-spacer"></div>
      <div className="container">
        <div className="section-heading left-align">
          <h2>My Restaurants</h2>
          <p>Restaurants you have claimed</p>
        </div>

        <div className="restaurant-grid">
          {items.map((item) => (
            <div key={item.restaurant_id} className="restaurant-card">
              <div className="restaurant-card-body">
                <h3>{item.name}</h3>
                <p className="restaurant-meta">{item.cuisine_type} • {item.city}</p>
                <div className="restaurant-card-actions">
                  <Link to={`/restaurant/${item.restaurant_id}`} className="btn btn-outline">View</Link>
                  <Link to={`/owner/restaurants/${item.restaurant_id}/edit`} className="btn btn-primary">Edit</Link>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}