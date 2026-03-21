import { useState } from "react"
import { useNavigate, Link } from "react-router-dom"
import API from "../api/axios"

export default function Login() {
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const navigate = useNavigate()

  const handleSubmit = async (e) => {
    e.preventDefault()

    try {
      const formData = new URLSearchParams()
      formData.append("username", email)
      formData.append("password", password)

      const res = await API.post("/auth/login", formData, {
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
        },
      })

      localStorage.setItem("token", res.data.access_token)
      localStorage.setItem("role", "user")

      const meRes = await API.get("/auth/user/me", {
        headers: {
          Authorization: `Bearer ${res.data.access_token}`,
        },
      })

      localStorage.setItem("displayName", meRes.data?.name || "User")

      navigate("/")
      window.location.reload()
    } catch (err) {
      console.error(err)
      alert("Login failed")
    }
  }

  return (
    <div className="auth-page">
      <div className="auth-card">
        <h1>User Login</h1>
        <p>Log in to continue exploring restaurants</p>

        <form onSubmit={handleSubmit} className="auth-form">
          <input
            type="email"
            placeholder="Email address"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
          <input
            type="password"
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
          <button type="submit" className="btn btn-primary full-width">
            Log In
          </button>
        </form>

        <div className="auth-footer">
          <span>New here?</span>
          <Link to="/signup">Create account</Link>
        </div>
      </div>
    </div>
  )
}