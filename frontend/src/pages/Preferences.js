import Navbar from "../components/Navbar"

export default function Preferences() {
  return (
    <div className="subpage">
      <Navbar />
      <div className="subpage-spacer"></div>
      <div className="container">
        <div className="simple-card">
          <h2>Preferences</h2>
          <p>Update cuisine, city and dining choices here.</p>
        </div>
      </div>
    </div>
  )
}