import { useState } from "react"
import { useNavigate, Link } from "react-router-dom"
import API from "../api/axios"

export default function OwnerSignup() {
  const [name, setName] = useState("")
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [restaurantLocation, setRestaurantLocation] = useState("")
  const navigate = useNavigate()

  const handleSubmit = async (e) => {
    e.preventDefault()
    await API.post("/auth/owner/signup", {
      name,
      email,
      password,
      restaurant_location: restaurantLocation
    })
    navigate("/owner/login")
  }

  return (
    <div className="auth-page">
      <div className="auth-card">
        <h1>Create owner account</h1>
        <p>Claim and manage your restaurants</p>

        <form onSubmit={handleSubmit} className="auth-form">
          <input type="text" placeholder="Full name" value={name} onChange={(e) => setName(e.target.value)} />
          <input type="email" placeholder="Email address" value={email} onChange={(e) => setEmail(e.target.value)} />
          <input type="password" placeholder="Password" value={password} onChange={(e) => setPassword(e.target.value)} />
          <input type="text" placeholder="Restaurant location" value={restaurantLocation} onChange={(e) => setRestaurantLocation(e.target.value)} />
          <button type="submit" className="btn btn-primary full-width">Sign Up</button>
        </form>

        <div className="auth-footer">
          <span>Already have an owner account?</span>
          <Link to="/owner/login">Log in</Link>
        </div>
      </div>
    </div>
  )
}