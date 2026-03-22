import { useEffect, useMemo, useState } from "react"
import Navbar from "../components/Navbar"
import RestaurantCard from "../components/RestaurantCard"
import API from "../api/axios"

const cities = [
  "Los Angeles",
  "New York",
  "Chicago",
  "Houston",
  "San Diego",
  "Las Vegas",
  "San Francisco",
  "Dallas",
  "San Jose",
  "Phoenix",
  "Philadelphia",
  "Atlanta"
]

const heroBackground =
  "https://images.unsplash.com/photo-1514933651103-005eec06c04b?auto=format&fit=crop&w=1600&q=80"

export default function Home() {
  const [restaurants, setRestaurants] = useState([])
  const [keyword, setKeyword] = useState("")
  const [city, setCity] = useState("")

  useEffect(() => {
    const params = {}
    if (keyword.trim()) params.keyword = keyword.trim()
    if (city.trim()) params.city = city.trim()

    API.get("/restaurants", { params })
      .then((res) => setRestaurants(res.data || []))
      .catch(() => setRestaurants([]))
  }, [keyword, city])

  const featured = useMemo(() => restaurants.slice(0, 6), [restaurants])

  return (
    <div className="page-shell">
      <section className="hero" style={{ backgroundImage: `url(${heroBackground})` }}>
        <div className="hero-overlay"></div>
        <Navbar />

        <div className="container hero-content">
          <div className="hero-copy">
            <div className="hero-kicker">Restaurant discovery platform</div>
            <h1>Find the best restaurants near you</h1>
            <p>Search top-rated restaurants, explore featured dining spots, and discover places people love.</p>
          </div>

          <div className="search-panel">
            <div className="search-field-group">
              <label>Restaurant or Keyword</label>
              <input
                type="text"
                placeholder="pizza, pasta, coffee, family friendly"
                value={keyword}
                onChange={(e) => setKeyword(e.target.value)}
              />
            </div>

            <div className="search-divider"></div>

            <div className="search-field-group">
              <label>City</label>
              <input
                type="text"
                placeholder="enter city"
                value={city}
                onChange={(e) => setCity(e.target.value)}
              />
            </div>

            <button className="search-button">Search</button>
          </div>

          <div className="hero-tags">
            <button className="hero-tag-btn" onClick={() => setKeyword("Pizza")}>Pizza</button>
            <button className="hero-tag-btn" onClick={() => setKeyword("Indian")}>Indian</button>
            <button className="hero-tag-btn" onClick={() => setKeyword("Chinese")}>Chinese</button>
            <button className="hero-tag-btn" onClick={() => setKeyword("Mexican")}>Mexican</button>
            <button className="hero-tag-btn" onClick={() => setKeyword("Italian")}>Italian</button>
          </div>
        </div>
      </section>

      <section id="activity" className="section light-section">
        <div className="container">
          <div className="section-heading center-align">
            <h2>Popular Restaurants</h2>
            <p>Top places users are exploring right now</p>
          </div>

          <div className="restaurant-grid">
            {featured.map((restaurant) => (
              <RestaurantCard key={restaurant.restaurant_id} data={restaurant} />
            ))}
          </div>
        </div>
      </section>

      <section className="section light-section">
        <div className="container">
          <div className="section-heading center-align">
            <h2>Featured Restaurants</h2>
            <p>Beautiful places to discover next</p>
          </div>

          <div className="restaurant-grid">
            {restaurants.map((restaurant) => (
              <RestaurantCard key={restaurant.restaurant_id} data={restaurant} />
            ))}
          </div>
        </div>
      </section>

      <section id="cities" className="section white-section">
        <div className="container">
          <div className="section-heading center-align">
            <h2>Explore restaurants in popular cities</h2>
            <p>Discover restaurant searches by city</p>
          </div>

          <div className="city-tags">
            {cities.map((item) => (
              <button
                key={item}
                className={`city-tag ${city === item ? "active-city" : ""}`}
                onClick={() => setCity(item)}
              >
                {item}
              </button>
            ))}
          </div>
        </div>
      </section>
    </div>
  )
}