import { useEffect, useState } from "react"
import { Link } from "react-router-dom"
import Navbar from "../components/Navbar"
import { userApi } from "../api/axios"

export default function Preferences() {
  const [pref, setPref] = useState(null)

  useEffect(() => {
    userApi.get("/users/me/preferences")
      .then((res) => setPref(res.data || {}))
      .catch(() => setPref({}))
  }, [])

  if (!pref) return null

  return (
    <div className="subpage">
      <Navbar />
      <div className="subpage-spacer"></div>

      <div className="container page-narrow">
        <div className="view-card large-view-card">
          <div className="view-card-header">
            <h2>Preferences</h2>
            <Link to="/preferences/edit" className="btn btn-primary">Edit Preferences</Link>
          </div>

          <div className="info-grid spacious-info-grid">
            <div>
              <span>Cuisines</span>
              <strong>{Array.isArray(pref.cuisines) ? pref.cuisines.join(", ") || "-" : pref.cuisines || "-"}</strong>
            </div>

            <div>
              <span>Price Range</span>
              <strong>{pref.price_range || "-"}</strong>
            </div>

            <div>
              <span>Dietary Needs</span>
              <strong>{Array.isArray(pref.dietary_needs) ? pref.dietary_needs.join(", ") || "-" : pref.dietary_needs || "-"}</strong>
            </div>

            <div>
              <span>Search Radius</span>
              <strong>{pref.search_radius || "-"}</strong>
            </div>

            <div>
              <span>Ambiance Preferences</span>
              <strong>{Array.isArray(pref.ambiance_preferences) ? pref.ambiance_preferences.join(", ") || "-" : pref.ambiance_preferences || "-"}</strong>
            </div>

            <div>
              <span>Sort Preference</span>
              <strong>{pref.sort_preference || "-"}</strong>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}