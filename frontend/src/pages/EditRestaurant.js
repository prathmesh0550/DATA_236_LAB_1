import { useEffect, useState } from "react"
import { useNavigate, useParams } from "react-router-dom"
import Navbar from "../components/Navbar"
import API from "../api/axios"

export default function EditRestaurant() {
  const { id } = useParams()
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

  useEffect(() => {
    API.get(`/restaurants/${id}`).then((res) => {
      setForm({
        ...res.data,
        photos: (res.data?.photos || []).join(", ")
      })
    })
  }, [id])

  const submit = async (e) => {
    e.preventDefault()
    await API.put(`/restaurants/${id}`, {
      name: form.name,
      cuisine_type: form.cuisine_type,
      city: form.city,
      address: form.address,
      description: form.description,
      hours: form.hours,
      contact_info: form.contact_info,
      photos: form.photos ? form.photos.split(",").map((x) => x.trim()).filter(Boolean) : []
    })
    navigate(`/restaurant/${id}`)
  }

  const addPhotos = async () => {
    const photos = form.photos ? form.photos.split(",").map((x) => x.trim()).filter(Boolean) : []
    await API.post(`/restaurants/${id}/photos`, { photos })
    alert("Photos added")
  }

  return (
    <div className="subpage">
      <Navbar />
      <div className="subpage-spacer"></div>
      <div className="container">
        <div className="simple-card">
          <h2>Edit Restaurant</h2>
          <form className="auth-form" onSubmit={submit}>
            <input placeholder="Name" value={form.name || ""} onChange={(e) => setForm({ ...form, name: e.target.value })} />
            <input placeholder="Cuisine type" value={form.cuisine_type || ""} onChange={(e) => setForm({ ...form, cuisine_type: e.target.value })} />
            <input placeholder="City" value={form.city || ""} onChange={(e) => setForm({ ...form, city: e.target.value })} />
            <input placeholder="Address" value={form.address || ""} onChange={(e) => setForm({ ...form, address: e.target.value })} />
            <input placeholder="Description" value={form.description || ""} onChange={(e) => setForm({ ...form, description: e.target.value })} />
            <input placeholder="Hours" value={form.hours || ""} onChange={(e) => setForm({ ...form, hours: e.target.value })} />
            <input placeholder="Contact info" value={form.contact_info || ""} onChange={(e) => setForm({ ...form, contact_info: e.target.value })} />
            <input placeholder="Photo URLs comma separated" value={form.photos || ""} onChange={(e) => setForm({ ...form, photos: e.target.value })} />
            <button type="submit" className="btn btn-primary full-width">Save Restaurant</button>
            <button type="button" className="btn btn-outline full-width" onClick={addPhotos}>Add Photos</button>
          </form>
        </div>
      </div>
    </div>
  )
}