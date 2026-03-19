import Navbar from "../components/Navbar"

export default function AddRestaurant() {
  return (
    <div className="subpage">
      <Navbar />
      <div className="subpage-spacer"></div>
      <div className="container">
        <div className="simple-card">
          <h2>Add Restaurant</h2>
          <p>Create a new restaurant listing from this page.</p>
        </div>
      </div>
    </div>
  )
}