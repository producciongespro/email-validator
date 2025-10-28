// ====== Helpers DOM ======
const $ = (q) => document.querySelector(q);

// Elementos UI
const drop = $('#dropzone');
const input = $('#file');
const btnValidate = $('#btnValidate');
const btnClear = $('#btnClear');
const btnDownload = $('#btnDownload');       // CSV de erróneos
const btnDownloadOk = $('#btnDownloadOk');   // CSV de correctos
const fileInfo = $('#fileInfo');
const statTotal = $('#statTotal');
const statWrongs = $('#statWrongs');
const statStatus = $('#statStatus');
const emptyState = $('#emptyState');
const results = $('#results');
const tbody = $('#tbody');

// Estado
let currentFile = null;
let lastWrongList = [];   // [{ index, email }]
let lastCorrectList = []; // [{ index, email }]

// ====== Utilitarios ======

const setStatus = (text) => (statStatus.textContent = text);

function clearTable() {
  tbody.innerHTML = '';
  emptyState.classList.remove('hide');
  results.classList.add('hide');
  statTotal.textContent = '0';
  statWrongs.textContent = '0';
}

function attachFile(file) {
  if (!file.name.toLowerCase().endsWith('.csv')) {
    alert('Solo se permite CSV');
    return;
  }
  currentFile = file;
  fileInfo.textContent = `Archivo: ${file.name} — ${(file.size / 1024).toFixed(1)} KB`;
  setStatus('Listo para validar');
  btnDownload.classList.add('hide');
  btnDownloadOk.classList.add('hide');
  lastWrongList = [];
  lastCorrectList = [];
  clearTable();
}

// ====== Función para generar CSV simple ======
function downloadSimpleList(emails, filename) {
  if (!emails?.length) return;

  // 👉 Encabezado personalizado:
  const header = "Email Address,First Name,Last Name\n";

  // Cada correo va en la primera columna, las demás quedan vacías
  const rows = emails.map((e) => `${e.email.trim()},,`).join('\n') + '\n';

  // Concatenamos encabezado + filas
  const content = header + rows;

  const blob = new Blob([content], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);

  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();

  setTimeout(() => {
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }, 0);
}


// ====== Drag & Drop ======
['dragenter', 'dragover'].forEach((evt) => {
  drop?.addEventListener(evt, (e) => {
    e.preventDefault();
    e.stopPropagation();
    drop.classList.add('dragover');
  });
});

['dragleave', 'drop'].forEach((evt) => {
  drop?.addEventListener(evt, (e) => {
    e.preventDefault();
    e.stopPropagation();
    drop.classList.remove('dragover');
  });
});

drop?.addEventListener('drop', (e) => {
  const file = e.dataTransfer.files?.[0];
  if (file) attachFile(file);
});

// ====== Input file ======
input?.addEventListener('change', (e) => {
  const file = e.target.files?.[0];
  if (file) attachFile(file);
});

// ====== Botones ======
btnClear?.addEventListener('click', () => {
  input.value = '';
  currentFile = null;
  fileInfo.textContent = '';
  btnDownload.classList.add('hide');
  btnDownloadOk.classList.add('hide');
  lastWrongList = [];
  lastCorrectList = [];
  clearTable();
  setStatus('Listo');
});

btnValidate?.addEventListener('click', async () => {
  if (!currentFile) {
    alert('Selecciona un CSV primero.');
    return;
  }
  setStatus('Validando...');

  const fd = new FormData();
  fd.append('file', currentFile);

  try {
    const resp = await fetch('/validator', { method: 'POST', body: fd });
    const data = await resp.json();

    if (!data.ok) {
      setStatus('Error');
      alert(data.message || 'Ocurrió un error procesando el CSV.');
      return;
    }

    // Mostrar resultados
    emptyState.classList.add('hide');
    results.classList.remove('hide');

    statTotal.textContent = String(data.totalRows || 0);
    statWrongs.textContent = String(data.wrongCount || 0);
    setStatus(data.wrongCount > 0 ? 'Con hallazgos' : 'Todo OK');

    // Tabla: mostramos erróneos (como antes)
    tbody.innerHTML = '';
    (data.wrongEmails || []).forEach(({ index, email }) => {
      const tr = document.createElement('tr');
      const tdI = document.createElement('td');
      const tdE = document.createElement('td');
      tdI.textContent = index;
      tdE.textContent = email;
      tr.appendChild(tdI);
      tr.appendChild(tdE);
      tbody.appendChild(tr);
    });

    // Guardar listas
    lastWrongList = data.wrongEmails || [];
    lastCorrectList = data.correctEmails || [];

    // Mostrar/ocultar botones
    if (lastWrongList.length) btnDownload.classList.remove('hide');
    else btnDownload.classList.add('hide');

    if (lastCorrectList.length) btnDownloadOk.classList.remove('hide');
    else btnDownloadOk.classList.add('hide');

  } catch (err) {
    console.error(err);
    setStatus('Error');
    alert('No se pudo contactar al servidor.');
  }
});

// Descargar CSV de erróneos
btnDownload?.addEventListener('click', () => {
  if (!lastWrongList.length) return;
  const header = 'index,email\n';
  const rows = lastWrongList.map(x => `${x.index},${x.email}`).join('\n');
  const blob = new Blob([header + rows + '\n'], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = 'correos_erroneos.csv';
  document.body.appendChild(a);
  a.click();
  setTimeout(() => {
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }, 0);
});

// ====== NUEVO: Descargar CSV simple de correctos ======
btnDownloadOk?.addEventListener('click', () => {
  if (!lastCorrectList.length) return;
  downloadSimpleList(lastCorrectList, 'correos_correctos.csv');
});
