import { useEffect, useState } from "react";
import "./App.css";

function App() {
  const [form, setForm] = useState({
    name: "",
    email: "",
    phone: "",
    appointment_date: "",
    appointment_slot: ""
  });

  const [availableSlots, setAvailableSlots] = useState([]);
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

  async function fetchAvailableSlots(date) {
    if (!date) {
      setAvailableSlots([]);
      return;
    }

    try {
      const response = await fetch(
        `http://localhost:5000/appointments/available-slots?date=${date}`
      );

      if (!response.ok) {
        throw new Error();
      }

      const data = await response.json();

      setAvailableSlots(data.availableSlots);
    } catch (error) {
      console.error(error);
      setAvailableSlots([]);
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
    const { name, value } = event.target;

    setForm((prev) => ({
      ...prev,
      [name]: value,
      ...(name === "appointment_date"
        ? { appointment_slot: "" }
        : {})
    }));

    if (name === "appointment_date") {
      fetchAvailableSlots(value);
    }
  }

  async function handleSubmit(event) {
    event.preventDefault();

    try {
      const response = await fetch("http://localhost:5000/appointments", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          ...form,
          appointment_slot: Number(form.appointment_slot)
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to create appointment");
      }

      setMessage("Appointment created successfully!");
      setForm({
        name: "",
        email: "",
        phone: "",
        appointment_date: "",
        appointment_slot: ""
      });

      setAvailableSlots([]);
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

  const canSubmit =
    form.name.trim() &&
    form.phone.trim() &&
    form.email.trim() &&
    form.appointment_date &&
    form.appointment_slot;

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
                <span>Phone</span>

                <input
                  name="phone"
                  type="tel"
                  placeholder="+1 234 567 890"
                  value={form.phone}
                  onChange={handleChange}
                  pattern="^\+?[0-9\s\-()]{7,20}$"
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
                  type="date"
                  value={form.appointment_date}
                  onChange={handleChange}
                  required
                />
              </label>

              <div className="form-field">
                <span>Available slots</span>

                <div className="slot-list">
                  {availableSlots.length === 0 ? (
                    <p className="empty-slots">
                      Select a date
                    </p>
                  ) : (
                    availableSlots.map((slot) => (
                      <button
                        key={slot.id}
                        type="button"
                        className={
                          form.appointment_slot === String(slot.id)
                            ? "slot-button selected"
                            : "slot-button"
                        }
                        onClick={() =>
                          setForm({
                            ...form,
                            appointment_slot: String(slot.id)
                          })
                        }
                      >
                        {slot.text}
                      </button>
                    ))
                  )}
                </div>
              </div>

              <button type="submit" className="form-submit-button" disabled={!canSubmit}>
                Book{/* {canSubmit ? "Book" : "Complete the form"} */}
              </button>
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

                    <p>
                      {appointment.appointment_date} • {appointment.slot_text}
                    </p>

                    <p>{appointment.email}</p>

                    {appointment.phone && (
                      <p>{appointment.phone}</p>
                    )}
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