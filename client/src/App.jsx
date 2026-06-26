import { useEffect, useState } from "react";
import "./App.css";

function App() {
  const [form, setForm] = useState({
    name: "",
    email: "",
    appointment_date: ""
  });

  const [appointments, setAppointments] = useState([]);
  const [message, setMessage] = useState("");
  const [theme, setTheme] = useState(() => {
    return localStorage.getItem("theme") || "light";
  });

  async function fetchAppointments() {
    try {
      const response = await fetch("http://localhost:5000/appointments");

      if (!response.ok) {
        throw new Error("Failed to fetch appointments");
      }

      const data = await response.json();

      if (Array.isArray(data)) {
        setAppointments(data);
      } else {
        setAppointments([]);
        console.error("Expected array, got:", data);
      }
    } catch (error) {
      console.error(error);
      setAppointments([]);
      setMessage("Failed to load appointments");
    }
  }

  useEffect(() => {
    fetchAppointments();
  }, []);

  useEffect(() => {
    document.body.className = theme;
    localStorage.setItem("theme", theme);
  }, [theme]);

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
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to create appointment");
      }

      setMessage("Appointment created successfully!");
      setForm({ name: "", email: "", appointment_date: "" });
      fetchAppointments();
    } catch (error) {
      setMessage(error.message);
      console.error(error);
    }
  }

  async function deleteAppointment(id) {
    await fetch(`http://localhost:5000/appointments/${id}`, {
      method: "DELETE"
    });

    fetchAppointments();
  }

  async function updateStatus(id, status) {
    await fetch(`http://localhost:5000/appointments/${id}/status`, {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({ status })
    });

    fetchAppointments();
  }

  function toggleTheme() {
    setTheme(theme === "light" ? "dark" : "light");
  }

  return (
    <main className="app">
      <header className="app-header">
        <h1>Appointment Scheduler</h1>

        <div className="theme-control">
          <span>Dark Theme</span>

          <label className="switch">
            <input
              type="checkbox"
              checked={theme === "dark"}
              onChange={toggleTheme}
            />
            <span className="slider"></span>
          </label>
        </div>
      </header>

      <div className="layout">
        <section className="booking-column">
          <h2>Book an appointment</h2>

          <div className="booking">
            <form onSubmit={handleSubmit} className="form">
              <label>
                <span>Name</span>
                <input
                  name="name"
                  placeholder="John Doe"
                  value={form.name}
                  onChange={handleChange}
                  required
                />
              </label>

              <label>
                <span>Email</span>
                <input
                  name="email"
                  type="email"
                  placeholder="john@mail.com"
                  value={form.email}
                  onChange={handleChange}
                  required
                />
              </label>

              <label>
                <span>Date</span>
                <input
                  name="appointment_date"
                  type="datetime-local"
                  value={form.appointment_date}
                  onChange={handleChange}
                  required
                />
              </label>

              <button type="submit">Book</button>
            </form>
          </div>

          {message && <p className="message">{message}</p>}
        </section>

        <section className="appointments-column">
          <div className="appointments-title-row">
            <h2>Appointments</h2>
            <span className="counter">({appointments.length})</span>
          </div>

          <div className="appointments">
            {appointments.length === 0 ? (
              <p className="empty-state">No appointments yet.</p>
            ) : (
              appointments.map((appointment) => (
                <article className="appointment-row" key={appointment.id}>
                  <div className="appointment-main">
                    <div className="appointment-name-row">
                      <h3>{appointment.name}</h3>
                      <span className={`status-badge ${appointment.status}`}>
                        {appointment.status}
                      </span>
                    </div>

                    <p>{appointment.email}</p>
                    <p>{new Date(appointment.appointment_date).toLocaleString()}</p>
                  </div>

                  <div className="card-actions">
                    <button onClick={() => updateStatus(appointment.id, "confirmed")}>
                      Confirm
                    </button>

                    <button onClick={() => updateStatus(appointment.id, "cancelled")}>
                      Cancel
                    </button>

                    <button onClick={() => deleteAppointment(appointment.id)}>
                      Delete
                    </button>
                  </div>
                </article>
              ))
            )}
          </div>
        </section>
      </div>
    </main>
  );
}

export default App;