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
      setMessage(error.message)
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

  return (
    <main className="container">
      <h1>Appointment Scheduler</h1>

      <form onSubmit={handleSubmit} className="form">
        <input name="name" placeholder="Your name" value={form.name} onChange={handleChange} required />
        <input name="email" type="email" placeholder="Your email" value={form.email} onChange={handleChange} required />
        <input name="appointment_date" type="datetime-local" value={form.appointment_date} onChange={handleChange} required />
        <button type="submit">Book Appointment</button>
      </form>

      {message && <p>{message}</p>}

      <h2>Appointments</h2>

      <div className="appointments">
        {appointments.map((appointment) => (
          <div className="appointment-card" key={appointment.id}>
            <h3>{appointment.name}</h3>
            <p>{appointment.email}</p>
            <p>{new Date(appointment.appointment_date).toLocaleString()}</p>
            <p>Status: {appointment.status}</p>
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
          </div>
        ))}
      </div>
    </main>
  );
}

export default App;