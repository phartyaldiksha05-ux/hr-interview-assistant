import { useState } from "react";
import { s } from "../styles/theme";

const EMPTY = {
name: "",
email: "",
phone: "",
job_role: "",
status: "new",
};

const CANDIDATE_STATUSES = [
{ value: "new", label: "New" },
{ value: "scheduled", label: "Interview Scheduled" },
{ value: "interviewed", label: "Interviewed" },
{ value: "hired", label: "Hired" },
{ value: "rejected", label: "Rejected" },
];

export default function CandidateForm({
initialValues,
onSubmit,
onCancel,
submitting,
}) {
const [values, setValues] = useState(() => ({
...EMPTY,
...initialValues,
status: initialValues?.status ?? "new",
}));

const [error, setError] = useState(null);
const isEdit = Boolean(initialValues);

function handleChange(e) {
setValues((v) => ({
...v,
[e.target.name]: e.target.value,
}));
}


async function handleSubmit(e) {
  e.preventDefault();
  setError(null);

  if (
    !values.name?.trim() ||
    !values.email?.trim() ||
    !values.job_role?.trim()
  ) {
    setError("Name, email, and job role are required.");
    return;
  }

  const payload = {
    ...values,
    name: values.name.trim(),
    email: values.email.trim(),
    phone: values.phone?.trim() || null,
    job_role: values.job_role.trim(),
  };

  if (!isEdit) {
    delete payload.status;
  }

  console.log("Candidate payload:", payload);
  console.log("onSubmit type:", typeof onSubmit);

  if (typeof onSubmit !== "function") {
    setError("Save failed: onSubmit handler is missing.");
    return;
  }

  try {
    await onSubmit(payload);
  } catch (err) {
    console.error("Candidate save failed:", err);
    setError(err?.message || "Failed to save candidate");
  }
}

return (
<form
onSubmit={handleSubmit}
style={{ ...s.card, marginBottom: "1.5rem" }}
> <h3 style={s.sectionTitle}>
{isEdit ? "Edit candidate" : "Add candidate"} </h3>

```
  <label style={s.label}>
    Name
    <input
      name="name"
      value={values.name}
      onChange={handleChange}
      style={s.input}
    />
  </label>

  <label style={s.label}>
    Email
    <input
      name="email"
      type="email"
      value={values.email}
      onChange={handleChange}
      style={s.input}
    />
  </label>

  <label style={s.label}>
    Phone
    <input
      name="phone"
      value={values.phone ?? ""}
      onChange={handleChange}
      style={s.input}
    />
  </label>

  <label style={s.label}>
    Job role
    <input
      name="job_role"
      value={values.job_role}
      onChange={handleChange}
      style={s.input}
    />
  </label>

  {isEdit && (
    <label style={s.label}>
      Candidate status
      <select
        name="status"
        value={values.status}
        onChange={handleChange}
        style={s.input}
      >
        {CANDIDATE_STATUSES.map((item) => (
          <option key={item.value} value={item.value}>
            {item.label}
          </option>
        ))}
      </select>
    </label>
  )}

  {error && <p style={s.errorText}>{error}</p>}

  <div
    style={{
      display: "flex",
      gap: "0.5rem",
      marginTop: "0.5rem",
    }}
  >
    <button
      type="submit"
      disabled={submitting}
      style={s.buttonPrimary}
    >
      {submitting
        ? "Saving…"
        : isEdit
          ? "Save changes"
          : "Add candidate"}
    </button>

    <button
      type="button"
      onClick={onCancel}
      style={s.buttonSecondary}
    >
      Cancel
    </button>
  </div>
</form>

);
}
