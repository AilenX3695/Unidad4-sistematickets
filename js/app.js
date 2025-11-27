// js/app.js

// ------------ Clase Message --------------
class Message {
  constructor(name, email, text, priority) {
    this.id = 'm' + Date.now();
    this.name = name;
    this.email = email;
    this.text = text;
    this.priority = priority; // 'baja' | 'normal' | 'alta'
    this.date = new Date().toISOString();
    this.read = false;
  }

  // Método para devolver HTML del ticket (string)
  toHTML() {
    const readClass = this.read ? 'read' : '';
    const urgenteClass = this.priority === 'alta' ? 'urgente' : '';
    return `
      <div class="list-group-item ${urgenteClass} ${readClass}" data-id="${this.id}">
        <div class="d-flex w-100 justify-content-between">
          <h5 class="mb-1">${escapeHtml(this.name)} <small class="text-muted">(${escapeHtml(this.email)})</small></h5>
          <small class="ticket-meta">${new Date(this.date).toLocaleString()}</small>
        </div>
        <p class="mb-1">${escapeHtml(this.text)}</p>
        <div class="d-flex gap-2">
          <button class="btn btn-sm btn-outline-primary btn-mark">Marcar leído</button>
          <button class="btn btn-sm btn-outline-danger btn-delete">Eliminar</button>
        </div>
      </div>
    `;
  }

  summary() {
    return `${this.name} - ${this.priority} - ${this.text.slice(0, 40)}...`;
  }
}

// ------------- Helpers -------------------
function escapeHtml(unsafe) {
  return unsafe.replace(/[&<>"']/g, function(m) {
    return ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#039;'})[m];
  });
}

// ------------- App State -----------------
let tickets = [];

// Load from localStorage si existe
function loadState() {
  const raw = localStorage.getItem('tickets_v1');
  if (raw) {
    try {
      const arr = JSON.parse(raw);
      tickets = arr.map(o => Object.assign(new Message(), o));
      // restore methods and ensure booleans
      tickets.forEach(t => { t.read = !!t.read; });
    } catch (e) {
      console.error('Error parsing storage', e);
    }
  }
}
function saveState() {
  localStorage.setItem('tickets_v1', JSON.stringify(tickets));
}

// ------------- Render ---------------------
const listEl = document.getElementById('ticketsList');
const urgentCountEl = document.getElementById('urgentCount');

function renderList(filterPriority = 'all', searchText = '') {
  // filtro + búsqueda
  const text = searchText.trim().toLowerCase();
  let filtered = tickets.filter(t => {
    const matchPriority = (filterPriority === 'all') || (t.priority === filterPriority);
    const matchText = !text || (t.text.toLowerCase().includes(text) || t.name.toLowerCase().includes(text) || t.email.toLowerCase().includes(text));
    return matchPriority && matchText;
  });

  // ordenar por fecha descendente (más reciente arriba)
  filtered.sort((a,b) => new Date(b.date) - new Date(a.date));

  listEl.innerHTML = filtered.map(t => t.toHTML()).join('');
  // actualizar contador de urgentes
  const urgentes = tickets.filter(t => t.priority === 'alta').length;
  urgentCountEl.textContent = urgentes;

  attachListEventHandlers();
}

// ------------- Eventos en lista (delegación) -------------
function attachListEventHandlers() {
  listEl.querySelectorAll('.btn-delete').forEach(btn => {
    btn.onclick = (ev) => {
      const id = ev.target.closest('[data-id]').dataset.id;
      tickets = tickets.filter(t => t.id !== id);
      saveState();
      renderList(document.getElementById('filterPriority').value, document.getElementById('searchText').value);
    };
  });

  listEl.querySelectorAll('.btn-mark').forEach(btn => {
    btn.onclick = (ev) => {
      const id = ev.target.closest('[data-id]').dataset.id;
      const ticket = tickets.find(t => t.id === id);
      if (ticket) {
        ticket.read = !ticket.read;
        saveState();
        renderList(document.getElementById('filterPriority').value, document.getElementById('searchText').value);
      }
    };
  });
}

// ------------- Validación y envío -------------
const form = document.getElementById('ticketForm');
form.addEventListener('submit', function(e){
  e.preventDefault();
  // obtener valores
  const name = document.getElementById('name').value.trim();
  const email = document.getElementById('email').value.trim();
  const priority = document.getElementById('priority').value;
  const text = document.getElementById('message').value.trim();

  // Validaciones con mensajes en UI (no alert)
  let ok = true;
  document.getElementById('nameError').textContent = '';
  document.getElementById('emailError').textContent = '';
  document.getElementById('messageError').textContent = '';

  if (name.length < 3) {
    ok = false;
    document.getElementById('nameError').textContent = 'Nombre debe tener al menos 3 caracteres.';
    document.getElementById('name').classList.add('is-invalid');
  } else {
    document.getElementById('name').classList.remove('is-invalid');
  }

  // Email regex básico
  if (!/^\S+@\S+\.\S+$/.test(email)) {
    ok = false;
    document.getElementById('emailError').textContent = 'Email no válido.';
    document.getElementById('email').classList.add('is-invalid');
  } else {
    document.getElementById('email').classList.remove('is-invalid');
  }

  if (text.length < 10) {
    ok = false;
    document.getElementById('messageError').textContent = 'Mensaje debe tener al menos 10 caracteres.';
    document.getElementById('message').classList.add('is-invalid');
  } else {
    document.getElementById('message').classList.remove('is-invalid');
  }

  if (!ok) return;

  // Crear objeto Message
  const msg = new Message(name, email, text, priority);

  // ejemplo de control de flujo: switch para asignar clase o contador
  switch (msg.priority) {
    case 'Alta':
      // aquí podrías disparar una animación o notificación
      break;
    case 'Normal':
      break;
    case 'Baja':
      break;
    default:
      break;
  }

  // ejemplo: recorrer texto para contar palabras (demostración forEach/for)
  const words = text.split(/\s+/).filter(Boolean);
  let wordCount = 0;
  for (let i=0; i<words.length; i++) {
    wordCount++;
  }
  // puedes usar wordCount para alguna estadística si lo deseas

  tickets.push(msg);
  saveState();

  // limpiar form
  form.reset();
  renderList(document.getElementById('filterPriority').value, document.getElementById('searchText').value);
});

// ------------- Filtros y búsqueda -------------
document.getElementById('filterPriority').addEventListener('change', ()=> {
  renderList(document.getElementById('filterPriority').value, document.getElementById('searchText').value);
});
document.getElementById('searchText').addEventListener('input', ()=> {
  renderList(document.getElementById('filterPriority').value, document.getElementById('searchText').value);
});
document.getElementById('btnClear').addEventListener('click', ()=>{
  document.getElementById('filterPriority').value = 'all';
  document.getElementById('searchText').value = '';
  renderList();
});

// -------------- Inicio -----------------
loadState();
renderList();
