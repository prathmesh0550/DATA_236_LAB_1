import { useEffect, useState } from "react"
import Navbar from "../components/Navbar"
import API from "../api/axios"

export default function Preferences() {
  const [form, setForm] = useState({
    cuisines: [],
    price_range: "",
    dietary_needs: [],
    search_radius: "",
    ambiance_preferences: [],
    sort_preference: ""
  })

  useEffect(() => {
    API.get("/users/me/preferences").then((res) => setForm(res.data || {}))
  }, [])

  const save = async (e) => {
    e.preventDefault()
    await API.put("/users/me/preferences", {
      ...form,
      cuisines: typeof form.cuisines === "string" ? form.cuisines.split(",").map((x) => x.trim()).filter(Boolean) : form.cuisines,
      dietary_needs: typeof form.dietary_needs === "string" ? form.dietary_needs.split(",").map((x) => x.trim()).filter(Boolean) : form.dietary_needs,
      ambiance_preferences: typeof form.ambiance_preferences === "string" ? form.ambiance_preferences.split(",").map((x) => x.trim()).filter(Boolean) : form.ambiance_preferences,
      search_radius: form.search_radius ? Number(form.search_radius) : null
    })
    alert("Preferences updated")
  }

  return (
    <div className="subpage">
      <Navbar />
      <div className="subpage-spacer"></div>
      <div className="container">
        <div className="simple-card">
          <h2>Preferences</h2>
          <form className="auth-form" onSubmit={save}>
            <input
              placeholder="Cuisines comma separated"
              value={Array.isArray(form.cuisines) ? form.cuisines.join(", ") : form.cuisines || ""}
              onChange={(e) => setForm((prev) => ({ ...prev, cuisines: e.target.value }))}
            />
            <input
              placeholder="Price range"
              value={form.price_range || ""}
              onChange={(e) => setForm((prev) => ({ ...prev, price_range: e.target.value }))}
            />
            <input
              placeholder="Dietary needs comma separated"
              value={Array.isArray(form.dietary_needs) ? form.dietary_needs.join(", ") : form.dietary_needs || ""}
              onChange={(e) => setForm((prev) => ({ ...prev, dietary_needs: e.target.value }))}
            />
            <input
              placeholder="Search radius"
              value={form.search_radius || ""}
              onChange={(e) => setForm((prev) => ({ ...prev, search_radius: e.target.value }))}
            />
            <input
              placeholder="Ambiance comma separated"
              value={Array.isArray(form.ambiance_preferences) ? form.ambiance_preferences.join(", ") : form.ambiance_preferences || ""}
              onChange={(e) => setForm((prev) => ({ ...prev, ambiance_preferences: e.target.value }))}
            />
            <input
              placeholder="Sort preference"
              value={form.sort_preference || ""}
              onChange={(e) => setForm((prev) => ({ ...prev, sort_preference: e.target.value }))}
            />
            <button type="submit" className="btn btn-primary full-width">Save Preferences</button>
          </form>
        </div>
      </div>
    </div>
  )
}