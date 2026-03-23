import { useEffect, useRef, useState } from "react"
import { Link } from "react-router-dom"
import API from "../api/axios"

export default function Chatbot() {
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState("")
  const [sessionId, setSessionId] = useState(() => crypto.randomUUID())
  const [messages, setMessages] = useState([
    {
      role: "assistant",
      text: "Hi! Ask me about cuisines, cities, ratings, or restaurant recommendations.",
      cards: []
    }
  ])
  const bodyRef = useRef(null)

  useEffect(() => {
    if (bodyRef.current) {
      bodyRef.current.scrollTop = bodyRef.current.scrollHeight
    }
  }, [messages, loading])

  const sendMessage = async () => {
    if (!message.trim() || loading) return

    const userText = message.trim()
    setMessage("")
    setMessages((prev) => [...prev, { role: "user", text: userText, cards: [] }])
    setLoading(true)

    const history = messages
      .filter((m) => m.text !== "Hi! Ask me about cuisines, cities, ratings, or restaurant recommendations.")
      .map((m) => ({ role: m.role, content: m.text }))

    try {
      const res = await API.post("/ai-assistant/chat", {
        message: userText,
        conversation_history: history,
        session_id: sessionId
      })
      const data = res.data || {}
      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          text: data.reply || "I couldn't find any matches.",
          cards: data.restaurants || []
        }
      ])
    } catch {
      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          text: "Something went wrong. Please try again.",
          cards: []
        }
      ])
    } finally {
      setLoading(false)
    }
  }

  const clearChat = () => {
    setSessionId(crypto.randomUUID())
    setMessages([
      {
        role: "assistant",
        text: "Hi! Ask me about cuisines, cities, ratings, or restaurant recommendations.",
        cards: []
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

          <div className="chatbot-body" ref={bodyRef}>
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
                          <span>{Number(r.avg_rating || 0).toFixed(1)} ★{r.price_tier ? ` • ${r.price_tier}` : ""}</span>
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