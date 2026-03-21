import { useEffect, useState } from "react"
import { useNavigate } from "react-router-dom"
import Navbar from "../components/Navbar"
import API from "../api/axios"

export default function EditPreferences() {
  const navigate = useNavigate()
  const [form, setForm] = useState({
    cuisines: "",
    price_range: "",
    dietary_needs: "",
    search_radius: "",
    ambiance_preferences: "",
    sort_preference: ""
  })

  useEffect(() => {
    API.get("/users/me/preferences").then((res) => {
      const data = res.data || {}
      setForm({
        cuisines: (data.cuisines || []).join(", "),
        price_range: data.price_range || "",
        dietary_needs: (data.dietary_needs || []).join(", "),
        search_radius: data.search_radius || "",
        ambiance_preferences: (data.ambiance_preferences || []).join(", "),
        sort_preference: data.sort_preference || ""
      })
    })
  }, [])

  const handleChange = (e) => {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }))
  }

  const save = async (e) => {
    e.preventDefault()
    await API.put("/users/me/preferences", {
      cuisines: form.cuisines.split(",").map((x) => x.trim()).filter(Boolean),
      price_range: form.price_range,
      dietary_needs: form.dietary_needs.split(",").map((x) => x.trim()).filter(Boolean),
      search_radius: form.search_radius ? Number(form.search_radius) : null,
      ambiance_preferences: form.ambiance_preferences.split(",").map((x) => x.trim()).filter(Boolean),
      sort_preference: form.sort_preference
    })
    navigate("/preferences")
  }

  return (
    <div className="subpage">
      <Navbar />
      <div className="subpage-spacer"></div>
      <div className="container">
        <div className="simple-card">
          <h2>Edit Preferences</h2>
          <form className="auth-form" onSubmit={save}>
            <div className="field-group">
              <label>Cuisines</label>
              <input name="cuisines" value={form.cuisines} onChange={handleChange} placeholder="Italian, Indian" />
            </div>

            <div className="field-group">
              <label>Price Range</label>
              <input name="price_range" value={form.price_range} onChange={handleChange} placeholder="$$" />
            </div>

            <div className="field-group">
              <label>Dietary Needs</label>
              <input name="dietary_needs" value={form.dietary_needs} onChange={handleChange} placeholder="Vegan, Halal" />
            </div>

            <div className="field-group">
              <label>Search Radius</label>
              <input name="search_radius" value={form.search_radius} onChange={handleChange} />
            </div>

            <div className="field-group">
              <label>Ambiance Preferences</label>
              <input name="ambiance_preferences" value={form.ambiance_preferences} onChange={handleChange} placeholder="Casual, Romantic" />
            </div>

            <div className="field-group">
              <label>Sort Preference</label>
              <input name="sort_preference" value={form.sort_preference} onChange={handleChange} placeholder="rating" />
            </div>

            <button type="submit" className="btn btn-primary full-width">Save Preferences</button>
          </form>
        </div>
      </div>
    </div>
  )
}