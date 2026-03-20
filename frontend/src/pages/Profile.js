import { useEffect, useState } from "react"
import Navbar from "../components/Navbar"
import API from "../api/axios"

export default function Profile() {
  const [form, setForm] = useState({
    name: "",
    phone: "",
    city: "",
    state: "",
    country: "",
    about_me: "",
    gender: ""
  })

  useEffect(() => {
    API.get("/users/me").then((res) => setForm({ ...form, ...res.data }))
  }, [])

  const handleChange = (e) => {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }))
  }

  const save = async (e) => {
    e.preventDefault()
    await API.put("/users/me", form)
    alert("Profile updated")
  }

  return (
    <div className="subpage">
      <Navbar />
      <div className="subpage-spacer"></div>
      <div className="container">
        <div className="simple-card">
          <h2>Profile</h2>
          <form className="auth-form" onSubmit={save}>
            <input name="name" value={form.name || ""} onChange={handleChange} placeholder="Name" />
            <input name="phone" value={form.phone || ""} onChange={handleChange} placeholder="Phone" />
            <input name="city" value={form.city || ""} onChange={handleChange} placeholder="City" />
            <input name="state" value={form.state || ""} onChange={handleChange} placeholder="State" />
            <input name="country" value={form.country || ""} onChange={handleChange} placeholder="Country" />
            <input name="gender" value={form.gender || ""} onChange={handleChange} placeholder="Gender" />
            <input name="about_me" value={form.about_me || ""} onChange={handleChange} placeholder="About me" />
            <button type="submit" className="btn btn-primary full-width">Save Profile</button>
          </form>
        </div>
      </div>
    </div>
  )
}