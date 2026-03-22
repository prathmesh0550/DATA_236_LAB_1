import { useEffect, useState } from "react"
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
  const [keywordInput, setKeywordInput] = useState("")
  const [cityInput, setCityInput] = useState("")
  const [zipInput, setZipInput] = useState("")
  const [keyword, setKeyword] = useState("")
  const [city, setCity] = useState("")
  const [zip, setZip] = useState("")

  const loadRestaurants = async (custom = {}) => {
    const params = {}

    const finalKeyword = custom.keyword ?? keyword
    const finalCity = custom.city ?? city
    const finalZip = custom.zip ?? zip

    if (finalKeyword.trim()) params.keyword = finalKeyword.trim()
    if (finalCity.trim()) params.city = finalCity.trim()
    if (finalZip.trim()) {
      params.zip = finalZip.trim()
      params.zip_code = finalZip.trim()
    }

    try {
      const res = await API.get("/restaurants", { params })
      setRestaurants(res.data || [])
    } catch {
      setRestaurants([])
    }
  }

  useEffect(() => {
    loadRestaurants()
  }, [])

  const handleSearch = () => {
    setKeyword(keywordInput)
    setCity(cityInput)
    setZip(zipInput)
    loadRestaurants({
      keyword: keywordInput,
      city: cityInput,
      zip: zipInput
    })
  }

  const handleCitySelect = (selectedCity) => {
    setCityInput(selectedCity)
    setZipInput("")
    setCity(selectedCity)
    setZip("")
    loadRestaurants({
      keyword: keywordInput,
      city: selectedCity,
      zip: ""
    })
  }

  const handleTagSearch = (value) => {
    setKeywordInput(value)
    setKeyword(value)
    loadRestaurants({
      keyword: value,
      city: cityInput,
      zip: zipInput
    })
  }

  const featured = restaurants.slice(0, 6)

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

          <div className="search-panel search-panel-zip">
            <div className="search-field-group">
              <label>Restaurant or Keyword</label>
              <input
                type="text"
                placeholder="pizza, pasta, coffee, family friendly"
                value={keywordInput}
                onChange={(e) => setKeywordInput(e.target.value)}
              />
            </div>

            <div className="search-divider"></div>

            <div className="search-field-group">
              <label>City</label>
              <input
                type="text"
                placeholder="enter city"
                value={cityInput}
                onChange={(e) => setCityInput(e.target.value)}
              />
            </div>

            <div className="search-divider"></div>

            <div className="search-field-group">
              <label>Zip Code</label>
              <input
                type="text"
                placeholder="enter zip code"
                value={zipInput}
                onChange={(e) => setZipInput(e.target.value)}
              />
            </div>

            <button className="search-button" onClick={handleSearch}>Search</button>
          </div>

          <div className="hero-tags">
            <button className="hero-tag-btn" onClick={() => handleTagSearch("Pizza")}>Pizza</button>
            <button className="hero-tag-btn" onClick={() => handleTagSearch("Indian")}>Indian</button>
            <button className="hero-tag-btn" onClick={() => handleTagSearch("Chinese")}>Chinese</button>
            <button className="hero-tag-btn" onClick={() => handleTagSearch("Mexican")}>Mexican</button>
            <button className="hero-tag-btn" onClick={() => handleTagSearch("Italian")}>Italian</button>
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
                className={`city-tag ${cityInput === item ? "active-city" : ""}`}
                onClick={() => handleCitySelect(item)}
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