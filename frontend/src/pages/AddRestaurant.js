import { useState } from "react"
import { useNavigate } from "react-router-dom"
import Navbar from "../components/Navbar"
import { restaurantApi } from "../api/axios"

export default function AddRestaurant() {
  const navigate = useNavigate()
  const [form, setForm] = useState({
    name: "",
    cuisine_type: "",
    city: "",
    zip_code: "",
    address: "",
    description: "",
    hours: "",
    contact_info: ""
  })
  const [photos, setPhotos] = useState([])
  const [error, setError] = useState("")
  const [loading, setLoading] = useState(false)

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value })
  }

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
    ).then((results) => setPhotos(results))
  }

  const submit = async (e) => {
    e.preventDefault()
    setError("")
    setLoading(true)

    try {
      const payload = {
        name: form.name,
        cuisine_type: form.cuisine_type,
        city: form.city,
        zip_code: form.zip_code,
        address: form.address,
        description: form.description,
        hours: form.hours,
        contact_info: form.contact_info,
        photos
      }

      await restaurantApi.post("/restaurants", payload)
      navigate("/")
    } catch (err) {
      console.error("Failed to create restaurant:", err)
      setError(err.response?.data?.detail || "Failed to create restaurant. Please try again.")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="subpage">
      <Navbar />
      <div className="subpage-spacer"></div>
      <div className="container page-narrow">
        <div className="simple-card enhanced-form-card">
          <h2>Add Restaurant</h2>

          {error && (
            <div className="error-message" style={{ color: "red", marginBottom: "1rem" }}>
              {error}
            </div>
          )}

          <form className="auth-form" onSubmit={submit}>
            <div className="field-group">
              <label>Name</label>
              <input name="name" value={form.name} onChange={handleChange} required />
            </div>

            <div className="field-group">
              <label>Cuisine Type</label>
              <input name="cuisine_type" value={form.cuisine_type} onChange={handleChange} required />
            </div>

            <div className="field-group">
              <label>City</label>
              <input name="city" value={form.city} onChange={handleChange} required />
            </div>

            <div className="field-group">
              <label>Zip Code</label>
              <input name="zip_code" value={form.zip_code} onChange={handleChange} required />
            </div>

            <div className="field-group">
              <label>Address</label>
              <input name="address" value={form.address} onChange={handleChange} required />
            </div>

            <div className="field-group">
              <label>Description</label>
              <textarea name="description" rows="4" value={form.description} onChange={handleChange} />
            </div>

            <div className="field-group">
              <label>Hours</label>
              <input name="hours" value={form.hours} onChange={handleChange} />
            </div>

            <div className="field-group">
              <label>Contact Info</label>
              <input name="contact_info" value={form.contact_info} onChange={handleChange} />
            </div>

            <div className="field-group">
              <label>Restaurant Photos</label>
              <label className="upload-box">
                <span>Choose Images</span>
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

            <button type="submit" className="btn btn-primary full-width" disabled={loading}>
              {loading ? "Creating..." : "Create Restaurant"}
            </button>
          </form>
        </div>
      </div>
    </div>
  )
}