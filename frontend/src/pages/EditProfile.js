import { useEffect, useState } from "react"
import { useNavigate } from "react-router-dom"
import Navbar from "../components/Navbar"
import API from "../api/axios"

export default function EditProfile() {
  const navigate = useNavigate()
  const [form, setForm] = useState({
    name: "",
    phone: "",
    city: "",
    state: "",
    country: "",
    about_me: "",
    languages: "",
    gender: "",
    profile_picture: ""
  })

  useEffect(() => {
    API.get("/users/me").then((res) => {
      const data = res.data || {}
      setForm({
        name: data.name || "",
        phone: data.phone || "",
        city: data.city || "",
        state: data.state || "",
        country: data.country || "",
        about_me: data.about_me || "",
        languages: (data.languages || []).join(", "),
        gender: data.gender || "",
        profile_picture: data.profile_picture || ""
      })
    })
  }, [])

  const handleChange = (e) => {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }))
  }

  const save = async (e) => {
    e.preventDefault()

    await API.put("/users/me", {
      name: form.name,
      phone: form.phone,
      city: form.city,
      state: form.state,
      country: form.country,
      about_me: form.about_me,
      languages: form.languages.split(",").map((x) => x.trim()).filter(Boolean),
      gender: form.gender
    })

    if (form.profile_picture) {
      await API.post("/users/me/profile-picture", {
        profile_picture: form.profile_picture
      })
    }

    navigate("/profile")
  }

  return (
    <div className="subpage">
      <Navbar />
      <div className="subpage-spacer"></div>
      <div className="container">
        <div className="simple-card">
          <h2>Edit Profile</h2>
          <form className="auth-form" onSubmit={save}>
            <div className="field-group">
              <label>Name</label>
              <input name="name" value={form.name} onChange={handleChange} />
            </div>

            <div className="field-group">
              <label>Phone</label>
              <input name="phone" value={form.phone} onChange={handleChange} />
            </div>

            <div className="field-group">
              <label>City</label>
              <input name="city" value={form.city} onChange={handleChange} />
            </div>

            <div className="field-group">
              <label>State</label>
              <input name="state" value={form.state} onChange={handleChange} />
            </div>

            <div className="field-group">
              <label>Country</label>
              <select name="country" value={form.country} onChange={handleChange}>
                <option value="">Select country</option>
                <option value="United States">United States</option>
                <option value="India">India</option>
                <option value="Canada">Canada</option>
                <option value="United Kingdom">United Kingdom</option>
              </select>
            </div>

            <div className="field-group">
              <label>Gender</label>
              <input name="gender" value={form.gender} onChange={handleChange} />
            </div>

            <div className="field-group">
              <label>Languages</label>
              <input name="languages" value={form.languages} onChange={handleChange} placeholder="English, Spanish" />
            </div>

            <div className="field-group">
              <label>About Me</label>
              <textarea name="about_me" value={form.about_me} onChange={handleChange} rows="4" />
            </div>

            <div className="field-group">
              <label>Profile Picture URL</label>
              <input name="profile_picture" value={form.profile_picture} onChange={handleChange} />
            </div>

            <button type="submit" className="btn btn-primary full-width">Save Profile</button>
          </form>
        </div>
      </div>
    </div>
  )
}