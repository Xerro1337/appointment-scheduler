import { useState } from "react";
import "./App.css";

function App() {
  const [form, setForm] = useState({
    name: "",
    email: "",
    appointment_date: ""
  });

  const [message, setMessage] = useState("");

  function handleChange(event) {
    setForm({
      ...form,
      [event.target.name]: event.target.value
    });
  }

  async function handleSubmit(event) {
    event.preventDefault();

    try {
      const response = await fetch("http://localhost:5000/appointments", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify(form)
      });

      if (!response.ok) {
        throw new Error("Failed to create appointment");
      }

      setMessage("Appointment created successfully!");

      setForm({
        name: "",
        email: "",
        appointment_date: ""
      });
    } catch (error) {
      setMessage("Something went wrong");
      console.error(error);
    }
  }

  return (
    <main className="container">
      <h1>Appointment Scheduler</h1>

      <form onSubmit={handleSubmit} className="form">
        <input
          name="name"
          placeholder="Your name"
          value={form.name}
          onChange={handleChange}
          required
        />

        <input
          name="email"
          type="email"
          placeholder="Your email"
          value={form.email}
          onChange={handleChange}
          required
        />

        <input
          name="appointment_date"
          type="datetime-local"
          value={form.appointment_date}
          onChange={handleChange}
          required
        />

        <button type="submit">Book Appointment</button>
      </form>

      {message && <p>{message}</p>}
    </main>
  );
}

export default App;