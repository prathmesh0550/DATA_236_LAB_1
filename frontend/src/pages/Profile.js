import { useEffect, useState } from "react"
import Navbar from "../components/Navbar"
import API from "../api/axios"

export default function Profile() {
  const [user, setUser] = useState({})

  useEffect(() => {
    API.get("/users/me")
      .then((res) => setUser(res.data || {}))
      .catch(() => setUser({}))
  }, [])

  return (
    <div className="subpage">
      <Navbar />
      <div className="subpage-spacer"></div>
      <div className="container">
        <div className="profile-card">
          <div className="profile-avatar">{(user?.name || "U").slice(0, 1).toUpperCase()}</div>
          <div>
            <h2>{user?.name || "User Profile"}</h2>
            <p>{user?.email || ""}</p>
          </div>
        </div>
      </div>
    </div>
  )
}