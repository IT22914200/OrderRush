import { useState } from "react";
import axios from "axios";
import "./ContactUs.css"; // Create a separate CSS file for styling

const ContactUs = () => {
  const [message, setMessage] = useState("");
  const [email, setEmail] = useState("");
  const [responseMessage, setResponseMessage] = useState("");

  const userId = localStorage.getItem("uid");

  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      const response = await axios.post(
        "http://localhost:4000/api/customer-message/add",
        {
          message,
          userId,
          email,
        }
      );

      if (response.data.success) {
        setResponseMessage("Message sent successfully!");
      } else {
        setResponseMessage("Error sending message.");
      }
    } catch (error) {
      console.error("Error sending message:", error);
      setResponseMessage("Error sending message.");
    }
  };

  return (
    <div className="contact-us">
      <h2>Contact Us</h2>
      <form onSubmit={handleSubmit}>
        <div>
          <label htmlFor="message">Message:</label>
          <textarea
            id="message"
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            required
          ></textarea>
        </div>
        <div>
          <label htmlFor="email">Email:</label>
          <input
            type="email"
            id="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
        </div>
        <button type="submit">Send Message</button>
      </form>
      {responseMessage && <p>{responseMessage}</p>}
    </div>
  );
};

export default ContactUs;
