import { useState } from "react"
import { useNavigate } from "react-router-dom"
import Navbar from "../components/Navbar"
import API from "../api/axios"

export default function AddRestaurant() {
  const navigate = useNavigate()
  const [form, setForm] = useState({
    name: "",
    cuisine_type: "",
    city: "",
    address: "",
    description: "",
    hours: "",
    contact_info: "",
    photos: ""
  })

  const submit = async (e) => {
    e.preventDefault()
    const payload = {
      ...form,
      photos: form.photos ? form.photos.split(",").map((x) => x.trim()).filter(Boolean) : []
    }
    const res = await API.post("/restaurants", payload)
    navigate(`/restaurant/${res.data.restaurant_id}`)
  }

  return (
    <div className="subpage">
      <Navbar />
      <div className="subpage-spacer"></div>
      <div className="container">
        <div className="simple-card">
          <h2>Add Restaurant</h2>
          <form className="auth-form" onSubmit={submit}>
            <input placeholder="Name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
            <input placeholder="Cuisine type" value={form.cuisine_type} onChange={(e) => setForm({ ...form, cuisine_type: e.target.value })} />
            <input placeholder="City" value={form.city} onChange={(e) => setForm({ ...form, city: e.target.value })} />
            <input placeholder="Address" value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })} />
            <input placeholder="Description" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
            <input placeholder="Hours" value={form.hours} onChange={(e) => setForm({ ...form, hours: e.target.value })} />
            <input placeholder="Contact info" value={form.contact_info} onChange={(e) => setForm({ ...form, contact_info: e.target.value })} />
            <input placeholder="Photo URLs comma separated" value={form.photos} onChange={(e) => setForm({ ...form, photos: e.target.value })} />
            <button type="submit" className="btn btn-primary full-width">Create Restaurant</button>
          </form>
        </div>
      </div>
    </div>
  )
}