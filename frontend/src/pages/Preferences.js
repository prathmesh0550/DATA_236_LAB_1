import { useEffect, useState } from "react"
import { Link } from "react-router-dom"
import Navbar from "../components/Navbar"
import API from "../api/axios"

export default function Preferences() {
  const [pref, setPref] = useState(null)

  useEffect(() => {
    API.get("/users/me/preferences").then((res) => setPref(res.data || {}))
  }, [])

  if (!pref) return null

  return (
    <div className="subpage">
      <Navbar />
      <div className="subpage-spacer"></div>
      <div className="container">
        <div className="view-card">
          <div className="view-card-header">
            <h2>Preferences</h2>
            <Link to="/preferences/edit" className="btn btn-primary">Edit Preferences</Link>
          </div>

          <div className="info-grid">
            <div><span>Cuisines</span><strong>{(pref.cuisines || []).join(", ") || "-"}</strong></div>
            <div><span>Price Range</span><strong>{pref.price_range || "-"}</strong></div>
            <div><span>Dietary Needs</span><strong>{(pref.dietary_needs || []).join(", ") || "-"}</strong></div>
            <div><span>Search Radius</span><strong>{pref.search_radius || "-"}</strong></div>
            <div><span>Ambiance</span><strong>{(pref.ambiance_preferences || []).join(", ") || "-"}</strong></div>
            <div><span>Sort Preference</span><strong>{pref.sort_preference || "-"}</strong></div>
          </div>
        </div>
      </div>
    </div>
  )
}