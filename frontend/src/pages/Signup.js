import { useState } from "react"
import { useNavigate, Link } from "react-router-dom"
import { userApi } from "../api/axios"

export default function Signup() {
  const [name, setName] = useState("")
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const navigate = useNavigate()

  const handleSubmit = async (e) => {
    e.preventDefault()
    await userApi.post("/auth/signup", { name, email, password })
    navigate("/login")
  }

  return (
    <div className="auth-page">
      <div className="auth-card">
        <h1>Create user account</h1>
        <p>Join to save favorites and write reviews</p>

        <form onSubmit={handleSubmit} className="auth-form">
          <input type="text" placeholder="Full name" value={name} onChange={(e) => setName(e.target.value)} />
          <input type="email" placeholder="Email address" value={email} onChange={(e) => setEmail(e.target.value)} />
          <input type="password" placeholder="Password" value={password} onChange={(e) => setPassword(e.target.value)} />
          <button type="submit" className="btn btn-primary full-width">Sign Up</button>
        </form>

        <div className="auth-footer">
          <span>Already have an account?</span>
          <Link to="/login">Log in</Link>
        </div>
      </div>
    </div>
  )
}