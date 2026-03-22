import { useEffect, useState } from "react"
import { Link } from "react-router-dom"
import API from "../api/axios"

export default function Chatbot() {
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState("")
  const [restaurants, setRestaurants] = useState([])
  const [preferences, setPreferences] = useState(null)
  const [messages, setMessages] = useState([
    {
      role: "assistant",
      text: "Hi, ask me about cuisines, cities, ratings, or restaurant recommendations."
    }
  ])

  useEffect(() => {
    API.get("/restaurants")
      .then((res) => setRestaurants(res.data || []))
      .catch(() => setRestaurants([]))

    if (localStorage.getItem("role") === "user") {
      API.get("/users/me/preferences")
        .then((res) => setPreferences(res.data || {}))
        .catch(() => setPreferences(null))
    }
  }, [])

  const buildReply = (text) => {
    const q = text.toLowerCase().trim()

    const exactRestaurant = restaurants.find((r) => (r.name || "").toLowerCase().includes(q))
    if (exactRestaurant) {
      return {
        text: `${exactRestaurant.name} has an average rating of ${Number(exactRestaurant.avg_rating || 0).toFixed(1)} and ${exactRestaurant.review_count || 0} reviews.`,
        cards: [exactRestaurant]
      }
    }

    const cuisineKeywords = ["italian", "indian", "chinese", "mexican", "japanese", "american", "thai", "pizza", "burger", "coffee"]
    let cuisine = cuisineKeywords.find((item) => q.includes(item)) || ""
    let city = ""

    restaurants.forEach((r) => {
      const c = (r.city || "").toLowerCase()
      if (!city && c && q.includes(c)) {
        city = r.city
      }
    })

    let filtered = restaurants

    if (cuisine) {
      filtered = filtered.filter((r) => {
        const cuisineType = (r.cuisine_type || "").toLowerCase()
        const name = (r.name || "").toLowerCase()
        return cuisineType.includes(cuisine) || name.includes(cuisine)
      })
    }

    if (city) {
      filtered = filtered.filter((r) => (r.city || "").toLowerCase().includes(city.toLowerCase()))
    }

    if (!cuisine && preferences?.cuisines?.length) {
      const preferred = preferences.cuisines[0].toLowerCase()
      filtered = filtered.filter((r) => (r.cuisine_type || "").toLowerCase().includes(preferred))
    }

    filtered = [...filtered].sort((a, b) => (b.avg_rating || 0) - (a.avg_rating || 0)).slice(0, 3)

    if (filtered.length > 0) {
      const reason = []
      if (cuisine) reason.push(cuisine)
      if (city) reason.push(city)
      if (!cuisine && preferences?.cuisines?.length) reason.push(`your preference for ${preferences.cuisines[0]}`)
      return {
        text: `Here are some recommendations${reason.length ? ` based on ${reason.join(" and ")}` : ""}.`,
        cards: filtered
      }
    }

    return {
      text: "I could not find a strong match. Try a restaurant name, cuisine, city, or ask for best rated places.",
      cards: []
    }
  }

  const sendMessage = () => {
    if (!message.trim()) return

    const userMessage = { role: "user", text: message }
    setMessages((prev) => [...prev, userMessage])
    setLoading(true)

    setTimeout(() => {
      const reply = buildReply(message)
      setMessages((prev) => [...prev, { role: "assistant", text: reply.text, cards: reply.cards }])
      setLoading(false)
      setMessage("")
    }, 500)
  }

  const clearChat = () => {
    setMessages([
      {
        role: "assistant",
        text: "Hi, ask me about cuisines, cities, ratings, or restaurant recommendations."
      }
    ])
  }

  return (
    <div className="chatbot-shell">
      {open ? (
        <div className="chatbot-window">
          <div className="chatbot-header">
            <div>
              <h3>Restaurant Assistant</h3>
              <span>Online</span>
            </div>
            <div className="chatbot-header-actions">
              <button className="chatbot-clear" onClick={clearChat}>New</button>
              <button className="chatbot-close" onClick={() => setOpen(false)}>×</button>
            </div>
          </div>

          <div className="chatbot-body">
            {messages.map((item, index) => (
              <div key={index} className={`chatbot-bubble-wrap ${item.role === "user" ? "chatbot-bubble-user-wrap" : ""}`}>
                <div className={`chatbot-message ${item.role === "user" ? "chatbot-user" : "chatbot-assistant"}`}>
                  {item.text}
                </div>

                {item.cards && item.cards.length > 0 && (
                  <div className="chatbot-cards">
                    {item.cards.map((r) => (
                      <Link key={r.restaurant_id} to={`/restaurant/${r.restaurant_id}`} className="chatbot-card-link">
                        <div className="chatbot-card">
                          <strong>{r.name}</strong>
                          <span>{r.cuisine_type || "Restaurant"} • {r.city || "City"}</span>
                          <span>{Number(r.avg_rating || 0).toFixed(1)} ★</span>
                        </div>
                      </Link>
                    ))}
                  </div>
                )}
              </div>
            ))}

            {loading && <div className="chatbot-thinking">Thinking...</div>}
          </div>

          <div className="chatbot-footer">
            <input
              type="text"
              placeholder="Ask about restaurants..."
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && sendMessage()}
            />
            <button onClick={sendMessage}>Send</button>
          </div>
        </div>
      ) : (
        <button className="chatbot-toggle" onClick={() => setOpen(true)}>Chat</button>
      )}
    </div>
  )
}