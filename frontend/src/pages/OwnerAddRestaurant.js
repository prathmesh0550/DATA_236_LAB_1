import { useState } from "react"
import { useNavigate } from "react-router-dom"
import Navbar from "../components/Navbar"
import { restaurantApi } from "../api/axios"

export default function OwnerAddRestaurant() {
  const navigate = useNavigate()
  const [form, setForm] = useState({
    name: "",
    cuisine_type: "",
    city: "",
    zip: "",
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

    const res = await restaurantApi.post("/restaurants", payload)
    navigate(`/restaurant/${res.data.restaurant_id}`)
  }

  return (
    <div className="subpage">
      <Navbar />
      <div className="subpage-spacer"></div>

      <div className="container page-narrow">
        <div className="simple-card">
          <h2>Add Restaurant</h2>

          <form className="auth-form" onSubmit={submit}>
            <div className="field-group">
              <label>Name</label>
              <input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
            </div>

            <div className="field-group">
              <label>Cuisine Type</label>
              <input value={form.cuisine_type} onChange={(e) => setForm({ ...form, cuisine_type: e.target.value })} />
            </div>

            <div className="field-group">
              <label>City</label>
              <input value={form.city} onChange={(e) => setForm({ ...form, city: e.target.value })} />
            </div>

            <div className="field-group">
              <label>Zip Code</label>
              <input value={form.zip} onChange={(e) => setForm({ ...form, zip: e.target.value })} />
            </div>

            <div className="field-group">
              <label>Address</label>
              <input value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })} />
            </div>

            <div className="field-group">
              <label>Description</label>
              <textarea rows="4" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
            </div>

            <div className="field-group">
              <label>Hours</label>
              <input value={form.hours} onChange={(e) => setForm({ ...form, hours: e.target.value })} />
            </div>

            <div className="field-group">
              <label>Contact Info</label>
              <input value={form.contact_info} onChange={(e) => setForm({ ...form, contact_info: e.target.value })} />
            </div>

            <div className="field-group">
              <label>Photo URLs</label>
              <input
                value={form.photos}
                onChange={(e) => setForm({ ...form, photos: e.target.value })}
                placeholder="url1, url2"
              />
            </div>

            <button type="submit" className="btn btn-primary full-width">Create Restaurant</button>
          </form>
        </div>
      </div>
    </div>
  )
}