import { useState } from "react"

export default function Chatbot() {
  const [open, setOpen] = useState(false)
  const [message, setMessage] = useState("")
  const [messages, setMessages] = useState([
    {
      role: "assistant",
      text: "Hi, I can help you find restaurants, reviews, favorites, and owner tools."
    }
  ])

  const getReply = (text) => {
    const value = text.toLowerCase()
    if (value.includes("favorite")) return "Use the Add to Favorites button on a restaurant page after logging in as a user."
    if (value.includes("review")) return "Users can write, edit, and delete their own reviews from the restaurant and review pages."
    if (value.includes("claim")) return "Owners can claim a restaurant from the restaurant details page."
    if (value.includes("edit restaurant")) return "Owners can edit restaurants they have claimed from the owner restaurant pages."
    if (value.includes("city")) return "Use the city field or city buttons on the home page."
    return "Try asking about favorites, reviews, claiming restaurants, or editing restaurants."
  }

  const sendMessage = () => {
    if (!message.trim()) return
    const userMessage = { role: "user", text: message }
    const botMessage = { role: "assistant", text: getReply(message) }
    setMessages((prev) => [...prev, userMessage, botMessage])
    setMessage("")
  }

  return (
    <div className="chatbot-shell">
      {open && (
        <div className="chatbot-window">
          <div className="chatbot-header">
            <div>
              <h3>Restaurant Assistant</h3>
              <span>Online</span>
            </div>
            <button className="chatbot-close" onClick={() => setOpen(false)}>×</button>
          </div>

          <div className="chatbot-body">
            {messages.map((item, index) => (
              <div key={index} className={`chatbot-message ${item.role === "user" ? "chatbot-user" : "chatbot-assistant"}`}>
                {item.text}
              </div>
            ))}
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
      )}

      {!open && (
        <button className="chatbot-toggle" onClick={() => setOpen(true)}>Chat</button>
      )}
    </div>
  )
}