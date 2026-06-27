import { useEffect, useState } from "react";
import "./App.css";

const API_URL = import.meta.env.VITE_API_URL;

const appointmentSlots = {
  1: "09:00–12:00",
  2: "13:00–16:00",
  3: "17:00–20:00"
};

function App() {
  const [form, setForm] = useState({
    name: "",
    email: "",
    phone: "",
    appointment_date: "",
    appointment_slot: ""
  });

  const [showLogoutConfirmation, setShowLogoutConfirmation] = useState(false);
  const [showConfirmation, setShowConfirmation] = useState(false);
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [adminDateFilter, setAdminDateFilter] = useState("");
  const [availableSlots, setAvailableSlots] = useState([]);
  const [notification, setNotification] = useState(null);
  const [appointments, setAppointments] = useState([]);
  const [bookingStep, setBookingStep] = useState(1);
  const [isAdmin, setIsAdmin] = useState(false);

  const [loginForm, setLoginForm] = useState({
    login: "",
    password: ""
  });
  const [theme, setTheme] = useState(() => {
    return localStorage.getItem("theme") || "light";
  });

  async function fetchAppointments() {
    try {
      const token = localStorage.getItem("adminToken");
      const response = await fetch(`${API_URL}/appointments`, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });

      if (response.status === 401) {
        localStorage.removeItem("adminToken");
        setIsAdmin(false);

        showNotification("Your session has expired.", "error");

        return;
      }

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
      showNotification("Failed to load appointments", "error");
    }
  }

  async function fetchAvailableSlots(date) {
    if (!date) {
      setAvailableSlots([]);
      return;
    }

    try {
      const response = await fetch(
        `${API_URL}/appointments/available-slots?date=${date}`
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
    const token = localStorage.getItem("adminToken");

    if (token) {
        setIsAdmin(true);
    }
  }, []);

  useEffect(() => {
    fetchAppointments();
  }, []);

  useEffect(() => {
    document.body.className = theme;
    localStorage.setItem("theme", theme);
  }, [theme]);

  function showNotification(text, type = "success") {
    setNotification({
      text,
      type
    });

    setTimeout(() => {
      setNotification(null);
    }, 5800);
  }

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
      if (value >= today) {
        fetchAvailableSlots(value);
      } else {
        setAvailableSlots([]);
      }
    }
  }

  function handleLoginChange(event) {
    setLoginForm({
      ...loginForm,
      [event.target.name]: event.target.value
    });
  }

  function handleSubmit(event) {
    event.preventDefault();
    setShowConfirmation(true);
  }

  function handleLogout() {
    localStorage.removeItem("adminToken");
    setIsAdmin(false);
    setShowLogoutConfirmation(false);
    showNotification("Successfully logged out.");
  }

  async function handleLogin(event) {
    event.preventDefault();

    try {
      
      const response = await fetch(`${API_URL}/login`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify(loginForm)
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.error || "Login failed");
      }

      setIsAdmin(true);
      setShowLoginModal(false);
      setLoginForm({
        login: "",
        password: ""
      });
      localStorage.setItem("adminToken", data.token);
      fetchAppointments()
      showNotification("Successfully logged in.");
    } catch (error) {
      showNotification(error.message, "error");
    }
  }

  async function confirmAppointment() {
    try {
      const token = localStorage.getItem("adminToken");

      const response = await fetch(`${API_URL}/appointments`, {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${token}`,
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

      showNotification("Successfully appointed!");

      setForm({
        name: "",
        email: "",
        phone: "",
        appointment_date: "",
        appointment_slot: ""
      });

      setAvailableSlots([]);
      setShowConfirmation(false);
      fetchAppointments();
      setBookingStep(1);
    } catch (error) {
      showNotification(error.message, "error");
      setShowConfirmation(false);
      console.error(error);
    }
  }

  async function deleteAppointment(id) {
    const token = localStorage.getItem("adminToken");
    await fetch(`${API_URL}/appointments/${id}`, {
      headers: {
        "Authorization": `Bearer ${token}`
      },
      method: "DELETE"
    });

    fetchAppointments();
  }

  async function updateStatus(id, status) {
    const token = localStorage.getItem("adminToken");
    await fetch(`${API_URL}/appointments/${id}/status`, {
      method: "PATCH",
      headers: {
        "Authorization": `Bearer ${token}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({ status })
    });

    fetchAppointments();
  }

  function toggleTheme() {
    setTheme(theme === "light" ? "dark" : "light");
  }

  const filteredAppointments = adminDateFilter
  ? appointments.filter((appointment) =>
      appointment.appointment_date === adminDateFilter
    )
  : appointments;

  function goToNextStep() {
    if (bookingStep < 3) {
      setBookingStep(bookingStep + 1);
    }
  }

  function goToPreviousStep() {
    if (bookingStep > 1) {
      setBookingStep(bookingStep - 1);
    }
  }

  const today = new Date().toISOString().split("T")[0];

  const isDateValid =
    form.appointment_date &&
    form.appointment_date >= today;

  const canGoNextFromStepOne = isDateValid;
  const canGoNextFromStepTwo = form.appointment_slot;

  const canSubmit =
    form.name.trim() &&
    form.email.trim() &&
    form.phone.trim() &&
    form.appointment_date &&
    form.appointment_slot;

  return (
    <main className="app">
      <header className="app-header">
        <h1>Appointment Scheduler</h1>

        <div className="header-controls">
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

          {isAdmin ? (
            <button
              type="button"
              className="login-button logged-in"
              onClick={() => setShowLogoutConfirmation(true)}
            >
              Log out
            </button>
          ) : (
            <button
              type="button"
              className="login-button"
              onClick={() => setShowLoginModal(true)}
            >
              Log in
            </button>
          )}
        </div>
      </header>

      <div className={isAdmin ? "layout admin" : "layout"}>
        <section className="booking-column">
          <h2>Book an appointment</h2>

          <div className="booking">
            <form onSubmit={handleSubmit} className="form">
              <div className="step-indicator">
                <span className={bookingStep === 1 ? "active" : ""}>Date</span>
                <span className={bookingStep === 2 ? "active" : ""}>Time</span>
                <span className={bookingStep === 3 ? "active" : ""}>Contact</span>
              </div>

              {bookingStep === 1 && (
                <div className="booking-step">
                  <label>
                    <span>Date</span>

                    <input
                      name="appointment_date"
                      type="date"
                      value={form.appointment_date}
                      onChange={handleChange}
                      min={today}
                      required
                    />
                  </label>

                  <button
                    type="button"
                    className="form-submit-button"
                    disabled={!canGoNextFromStepOne}
                    onClick={goToNextStep}
                  >
                    Next
                  </button>
                </div>
              )}

              {bookingStep === 2 && (
                <div className="booking-step">
                  <div className="form-field">
                    <span>Available slots</span>

                    <div className="slot-list">
                      {availableSlots.length === 0 ? (
                        <p className="empty-slots">
                          No available slots for this date
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

                  <div className="step-actions">
                    <button
                      type="button"
                      className="secondary-button"
                      onClick={goToPreviousStep}
                    >
                      Back
                    </button>

                    <button
                      type="button"
                      className="form-submit-button"
                      disabled={!canGoNextFromStepTwo}
                      onClick={goToNextStep}
                    >
                      Next
                    </button>
                  </div>
                </div>
              )}

              {bookingStep === 3 && (
                <div className="booking-step">
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

                  <div className="step-actions">
                    <button
                      type="button"
                      className="secondary-button"
                      onClick={goToPreviousStep}
                    >
                      Back
                    </button>

                    <button
                      type="submit"
                      className="form-submit-button"
                      disabled={!canSubmit}
                    >
                      Book
                    </button>
                  </div>
                </div>
              )}
            </form>
          </div>
        </section>
        
        {isAdmin && (
          <section className="appointments-column">
            <div className="appointments-title-row">
              <h2>Appointments</h2>
              <span className="counter">({filteredAppointments.length})</span>
              <input
                className="admin-date-filter"
                type="date"
                value={adminDateFilter}
                onChange={(event) => setAdminDateFilter(event.target.value)}
              />

              {adminDateFilter && (
                <button
                  type="button"
                  className="clear-filter-button"
                  onClick={() => setAdminDateFilter("")}
                >
                  Clear
                </button>
              )}
            </div>

            <div className="appointments">
              {filteredAppointments.length === 0 ? (
                <p className="empty-state">No appointments yet.</p>
              ) : (
                filteredAppointments.map((appointment) => (
                  <article className="appointment-row" key={appointment.id}>
                    <div className="appointment-main">
                      <div className="appointment-name-row">
                        <h3>{appointment.name}</h3>
                        <span className={`status-badge ${appointment.status}`}>
                          {appointment.status}
                        </span>
                      </div>

                      <p className="appointment-date">
                          {appointment.appointment_date} • {appointment.slot_text}
                      </p>

                      <div className="appointment-contact">
                          {appointment.phone && (
                              <p>{appointment.phone}</p>
                          )}
                          {appointment.email && (
                            <p>{appointment.email}</p>
                          )}
                      </div>
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
        )}
      </div>
      {showConfirmation && (
        <div className="modal-overlay">
          <div className="confirmation-modal">
            <h2>Confirm appointment</h2>

            <div className="confirmation-details">
              <p>
                <span>Name:</span> {form.name}
              </p>
              <p>
                <span>Email:</span> {form.email}
              </p>
              <p>
                <span>Phone:</span> {form.phone}
              </p>
              <p>
                <span>Date:</span> {form.appointment_date}
              </p>
              <p>
                <span>Time:</span> {appointmentSlots[form.appointment_slot]}
              </p>
            </div>

            <div className="modal-actions">
              <button
                type="button"
                className="modal-confirm-button"
                onClick={confirmAppointment}
              >
                Confirm
              </button>

              <button
                type="button"
                className="modal-cancel-button"
                onClick={() => setShowConfirmation(false)}
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
      {showLoginModal && (
        <div className="modal-overlay">
          <div className="confirmation-modal">
            <h2>Admin login</h2>

            <form onSubmit={handleLogin} className="login-form">
              <label>
                <span>Login</span>

                <input
                  name="login"
                  value={loginForm.login}
                  onChange={handleLoginChange}
                  required
                />
              </label>

              <label>
                <span>Password</span>

                <input
                  name="password"
                  type="password"
                  value={loginForm.password}
                  onChange={handleLoginChange}
                  required
                />
              </label>

              <div className="modal-actions">
                <button
                  type="submit"
                  className="modal-confirm-button"
                >
                  Log in
                </button>
                <button
                  type="button"
                  className="modal-cancel-button"
                  onClick={() => setShowLoginModal(false)}
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
      {notification && (
        <div
          className={`notification notification-${notification.type}`}
        >
          {notification.text}
        </div>
      )}
      {showLogoutConfirmation && (
        <div
          className="modal-overlay"
          onClick={() => setShowLogoutConfirmation(false)}
        >
          <div
            className="confirmation-modal"
            onClick={(event) => event.stopPropagation()}
          >
            <h2>Log out</h2>

            <p>
              Are you sure you want to log out of the administrator account?
            </p>

            <div className="modal-actions">
              <button
                className="modal-confirm-button"
                onClick={handleLogout}
              >
                Log out
              </button>
              <button
                className="modal-cancel-button"
                onClick={() => setShowLogoutConfirmation(false)}
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}

export default App;