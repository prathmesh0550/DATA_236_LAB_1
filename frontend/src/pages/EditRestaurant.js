import { useEffect, useState } from "react"
import { useNavigate, useParams } from "react-router-dom"
import Navbar from "../components/Navbar"
import { restaurantApi } from "../api/axios"

export default function EditRestaurant() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [form, setForm] = useState({
    name: "",
    cuisine_type: "",
    city: "",
    zip: "",
    address: "",
    description: "",
    hours: "",
    contact_info: ""
  })
  const [photos, setPhotos] = useState([])

  useEffect(() => {
    restaurantApi.get(`/restaurants/${id}`).then((res) => {
      const data = res.data || {}
      setForm({
        name: data.name || "",
        cuisine_type: data.cuisine_type || "",
        city: data.city || "",
        zip: data.zip || "",
        address: data.address || "",
        description: data.description || "",
        hours: data.hours || "",
        contact_info: data.contact_info || ""
      })
      setPhotos(data.photos || [])
    })
  }, [id])

  const handleFileUpload = (e) => {
    const files = Array.from(e.target.files || [])
    if (!files.length) return

    Promise.all(
      files.map(
        (file) =>
          new Promise((resolve) => {
            const reader = new FileReader()
            reader.onloadend = () => resolve(reader.result)
            reader.readAsDataURL(file)
          })
      )
    ).then((results) => setPhotos((prev) => [...prev, ...results]))
  }

  const submit = async (e) => {
    e.preventDefault()
    await restaurantApi.put(`/restaurants/${id}`, {
      name: form.name,
      cuisine_type: form.cuisine_type,
      city: form.city,
      zip: form.zip,
      address: form.address,
      description: form.description,
      hours: form.hours,
      contact_info: form.contact_info,
      photos
    })
    navigate(`/restaurant/${id}`)
  }

  return (
    <div className="subpage">
      <Navbar />
      <div className="subpage-spacer"></div>
      <div className="container page-narrow">
        <div className="simple-card enhanced-form-card">
          <h2>Edit Restaurant</h2>

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
              <label>Restaurant Photos</label>
              <label className="upload-box">
                <span>Add More Images</span>
                <input type="file" accept="image/*" multiple onChange={handleFileUpload} />
              </label>
            </div>

            {photos.length > 0 && (
              <div className="image-preview-grid">
                {photos.map((photo, index) => (
                  <img key={index} src={photo} alt={`Upload ${index + 1}`} className="preview-image" />
                ))}
              </div>
            )}

            <button type="submit" className="btn btn-primary full-width">Save Restaurant</button>
          </form>
        </div>
      </div>
    </div>
  )
}