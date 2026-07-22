const form = document.getElementById('studentForm');
const studentIdInput = document.getElementById('studentId');
const submitBtn = document.getElementById('submitBtn');
const cancelBtn = document.getElementById('cancelEdit');
const closePageBtn = document.getElementById('closePageBtn');
const messageBox = document.getElementById('message');
const tableBody = document.getElementById('studentTableBody');

let students = [];

function showMessage(text, type = 'success') {
  messageBox.textContent = text;
  messageBox.className = `message ${type}`;
}

function resetForm() {
  form.reset();
  studentIdInput.value = '';
  submitBtn.textContent = 'Add Student';
  cancelBtn.classList.add('hidden');
  document.getElementById('consentGiven').checked = false;
}

async function loadStudents() {
  const response = await fetch('/api/students');
  students = await response.json();
  renderStudents();
}

function renderStudents() {
  if (!students.length) {
    tableBody.innerHTML = '<tr><td colspan="8" class="empty">No students added yet.</td></tr>';
    return;
  }

  tableBody.innerHTML = students.map((student) => `
    <tr>
      <td>${student.id}</td>
      <td>${student.name}</td>
      <td>${student.class_name}</td>
      <td>${student.roll_number}</td>
      <td>${student.age}</td>
      <td>${student.phone}</td>
      <td>${student.email}</td>
      <td>
        <button class="edit-btn" data-id="${student.id}">Edit</button>
        <button class="delete-btn" data-id="${student.id}">Delete</button>
      </td>
    </tr>
  `).join('');
}

form.addEventListener('submit', async (event) => {
  event.preventDefault();

  const payload = {
    name: document.getElementById('name').value.trim(),
    className: document.getElementById('className').value.trim(),
    rollNumber: document.getElementById('rollNumber').value.trim(),
    age: document.getElementById('age').value,
    phone: document.getElementById('phone').value.trim(),
    email: document.getElementById('email').value.trim(),
    address: document.getElementById('address').value.trim(),
    consentGiven: document.getElementById('consentGiven').checked,
  };

  const id = studentIdInput.value;
  const url = id ? `/api/students/${id}` : '/api/students';
  const method = id ? 'PUT' : 'POST';

  const response = await fetch(url, {
    method,
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });

  const result = await response.json();
  if (!response.ok) {
    showMessage(result.error || 'Something went wrong.', 'error');
    return;
  }

  showMessage(id ? 'Student updated.' : 'Student added.');
  resetForm();
  await loadStudents();
});

cancelBtn.addEventListener('click', resetForm);

closePageBtn.addEventListener('click', () => {
  try {
    window.close();
  } catch (error) {
    window.location.href = 'about:blank';
  }
});

document.addEventListener('click', async (event) => {
  const editButton = event.target.closest('.edit-btn');
  const deleteButton = event.target.closest('.delete-btn');

  if (editButton) {
    const student = students.find((item) => item.id === Number(editButton.dataset.id));
    if (!student) return;

    studentIdInput.value = student.id;
    document.getElementById('name').value = student.name;
    document.getElementById('className').value = student.class_name;
    document.getElementById('rollNumber').value = student.roll_number;
    document.getElementById('age').value = student.age;
    document.getElementById('phone').value = student.phone;
    document.getElementById('email').value = student.email;
    document.getElementById('address').value = student.address;
    submitBtn.textContent = 'Update Student';
    cancelBtn.classList.remove('hidden');
    showMessage('Editing student.');
  }

  if (deleteButton) {
    const id = deleteButton.dataset.id;
    const confirmed = window.confirm('Delete this student record?');
    if (!confirmed) return;

    const response = await fetch(`/api/students/${id}`, { method: 'DELETE' });
    if (!response.ok) {
      showMessage('Unable to delete student.', 'error');
      return;
    }

    showMessage('Student deleted.');
    await loadStudents();
  }
});

loadStudents();
