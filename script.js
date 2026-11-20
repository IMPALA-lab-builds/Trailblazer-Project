// ===== Icons =====
const CHECK_ICON =
  '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M5 12.5 10 17 19 7"/></svg>';
const CROSS_ICON =
  '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" aria-hidden="true"><path d="M6 6l12 12M18 6 6 18"/></svg>';

// ===== Data =====
let students = ["John Doe", "Jill Doe", "Shem", "Juidas", "John"].map(function (name, i) {
  return { id: i + 1, name: name, status: null }; // status: "present" | "absent" | null
});
let nextId = students.length + 1;

// ===== Elements =====
function $(id) {
  return document.getElementById(id);
}

const listEl = $("list");
const searchEl = $("search");
const noteEl = $("note");
const summaryEl = $("summary");
const copyBtn = $("copy");

$("date").valueAsDate = new Date();

// ===== Helpers =====
function initials(name) {
  return name
    .split(/\s+/)
    .map(function (part) { return part[0]; })
    .join("")
    .slice(0, 2)
    .toUpperCase();
}

function escapeHtml(text) {
  const map = { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" };
  return text.replace(/[&<>"']/g, function (c) { return map[c]; });
}

function countBy(status) {
  return students.filter(function (s) { return s.status === status; }).length;
}

// ===== Render =====
function studentRow(s) {
  const name = escapeHtml(s.name);
  return (
    "<li>" +
      '<div class="name">' +
        '<div class="avatar" aria-hidden="true">' + escapeHtml(initials(s.name)) + "</div>" +
        "<span>" + name + "</span>" +
        '<button class="remove" type="button" data-remove="' + s.id + '" aria-label="Remove ' + name + '">&times;</button>' +
      "</div>" +
      '<button class="mark yes" type="button" data-id="' + s.id + '" data-status="present" aria-pressed="' + (s.status === "present") + '" aria-label="Mark ' + name + ' present">' + CHECK_ICON + "</button>" +
      '<button class="mark no" type="button" data-id="' + s.id + '" data-status="absent" aria-pressed="' + (s.status === "absent") + '" aria-label="Mark ' + name + ' absent">' + CROSS_ICON + "</button>" +
    "</li>"
  );
}

function render() {
  const query = searchEl.value.trim().toLowerCase();
  const visible = students.filter(function (s) {
    return s.name.toLowerCase().includes(query);
  });

  listEl.innerHTML = visible.length
    ? visible.map(studentRow).join("")
    : '<li class="empty">No students match "' + escapeHtml(searchEl.value) + '"</li>';

  const present = countBy("present");
  const absent = countBy("absent");
  $("statTotal").textContent = students.length + " students";
  $("statPresent").textContent = present + " present";
  $("statAbsent").textContent = absent + " absent";
  $("statUnmarked").textContent = students.length - present - absent + " unmarked";
}

// ===== Events =====
listEl.addEventListener("click", function (e) {
  const markBtn = e.target.closest(".mark");
  const removeBtn = e.target.closest("[data-remove]");

  if (markBtn) {
    const student = students.find(function (s) { return s.id === Number(markBtn.dataset.id); });
    const chosen = markBtn.dataset.status;
    student.status = student.status === chosen ? null : chosen; // click again to untick
    render();
  } else if (removeBtn) {
    const id = Number(removeBtn.dataset.remove);
    students = students.filter(function (s) { return s.id !== id; });
    render();
  }
});

searchEl.addEventListener("input", render);

$("addForm").addEventListener("submit", function (e) {
  e.preventDefault();
  const input = $("newName");
  const name = input.value.trim();
  if (!name) return;
  students.push({ id: nextId++, name: name, status: null });
  input.value = "";
  render();
});

$("allPresent").addEventListener("click", function () {
  students.forEach(function (s) { s.status = "present"; });
  render();
});

$("reset").addEventListener("click", function () {
  students.forEach(function (s) { s.status = null; });
  noteEl.value = "";
  summaryEl.classList.remove("show");
  render();
});

$("submit").addEventListener("click", function () {
  const unmarked = students.filter(function (s) { return !s.status; });
  if (
    unmarked.length &&
    !confirm(unmarked.length + " student(s) are unmarked. They will be recorded as absent. Continue?")
  ) {
    return;
  }
  unmarked.forEach(function (s) { s.status = "absent"; });
  render();

  const namesWith = function (status) {
    return students.filter(function (s) { return s.status === status; }).map(function (s) { return s.name; });
  };
  const present = namesWith("present");
  const absent = namesWith("absent");
  const note = noteEl.value.trim();
  const percent = students.length ? Math.round((present.length / students.length) * 100) : 0;

  const report = [
    "Class: " + $("className").value,
    "Date: " + $("date").value,
    "Prefect: " + ($("prefect").value || "-"),
    "",
    "Present (" + present.length + "): " + (present.join(", ") || "-"),
    "Absent (" + absent.length + "): " + (absent.join(", ") || "-"),
    "",
    "Prefect's note: " + (note || "-"),
  ].join("\n");

  $("summaryText").textContent =
    present.length + " of " + students.length + " students present (" + percent + "%).";
  $("summaryPre").textContent = report;
  summaryEl.classList.add("show");
  summaryEl.scrollIntoView({ behavior: "smooth" });
});

copyBtn.addEventListener("click", async function () {
  try {
    await navigator.clipboard.writeText($("summaryPre").textContent);
    copyBtn.textContent = "Copied!";
  } catch (err) {
    copyBtn.textContent = "Copy failed - select text manually";
  }
  setTimeout(function () { copyBtn.textContent = "Copy report"; }, 1800);
});

// ===== Start =====
render();
