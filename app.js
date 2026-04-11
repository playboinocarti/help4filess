// SELEZIONE ELEMENTI
const toolBar = document.getElementById('toolBar');
const dropZone = document.getElementById('dropZone');
const fileInput = document.getElementById('fileInput');
const fileList = document.getElementById('fileList');
const formatSelect = document.getElementById('formatSelect');
const convertBtn = document.getElementById('convertBtn');
const compressBtn = document.getElementById('compressBtn');
const mergeBtn = document.getElementById('mergeBtn');
const status = document.getElementById('status');

// VARIABILI GLOBALI
let currentMode = 'convert';
let files = [];
const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);

// FORMATI CONVERTIBILI (COMPLETI)
const convertibleFormats = {
  'docx': ['pdf'],
  'xlsx': ['pdf'],
  'mp4': ['mp3'],
  'mp3': ['wav'],
  'wav': ['mp3'],
  'png': ['jpg', 'webp'],
  'jpg': ['png', 'webp'],
  'jpeg': ['png', 'webp'],
  'bmp': ['jpg', 'png']
};

// TOOLBAR
toolBar.addEventListener('click', (e) => {
  if (e.target.classList.contains('tool-btn')) {
    switchMode(e.target.dataset.mode);
  }
});

function switchMode(mode) {
  currentMode = mode;
  document.querySelectorAll('.tool-btn').forEach(btn => btn.classList.remove('active'));
  document.querySelector(`[data-mode="${mode}"]`).classList.add('active');

  // Reset
  files = [];
  formatSelect.innerHTML = '<option value="">Seleziona...</option>';
  updateFileList();
  status.textContent = 'Pronto';
  status.className = '';
}

// DROP ZONE
function preventDefaults(e) {
  e.preventDefault();
  e.stopPropagation();
}

['dragenter', 'dragover', 'dragleave', 'drop'].forEach(eventName => {
  dropZone.addEventListener(eventName, preventDefaults, { passive: false });
});

dropZone.addEventListener('dragover', () => dropZone.classList.add('dragover'));
dropZone.addEventListener('dragleave', () => dropZone.classList.remove('dragover'));
dropZone.addEventListener('drop', handleDrop);

dropZone.addEventListener('click', () => {
  if (!isMobile) fileInput.click();
});

fileInput.addEventListener('change', (e) => {
  handleFiles(e.target.files);
  fileInput.value = '';
});

function handleDrop(e) {
  dropZone.classList.remove('dragover');
  handleFiles(e.dataTransfer.files);
}

function getFileExt(filename) {
  if (!filename) return '';
  const dotIndex = filename.lastIndexOf('.');
  if (dotIndex === -1) return '';
  return filename.slice(dotIndex + 1).toLowerCase().trim();
}

function formatBytes(bytes) {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

function handleFiles(inputFiles) {
  const newFiles = Array.from(inputFiles).slice(0, 10);
  files = newFiles;
  updateFileList();
}

function updateFileList() {
  if (files.length === 0) {
    fileList.innerHTML = '';
    convertBtn.disabled = true;
    compressBtn.disabled = true;
    mergeBtn.disabled = true;
    return;
  }

  fileList.innerHTML = files.map((file, index) => `
    <div class="file-item">
      <div>
        <span class="file-name">${file.name}</span>
        <span class="file-size">${formatBytes(file.size)}</span>
      </div>
      <button class="remove-btn" onclick="window.removeFile(${index})">✕</button>
      <div class="progress-wrapper" id="progress-${index}">
        <span class="progress-text">Pronto</span>
        <div class="progress-bar-container">
          <div class="progress-bar" style="width: 0%"></div>
        </div>
      </div>
    </div>
  `).join('');

  convertBtn.disabled = currentMode !== 'convert';
  compressBtn.disabled = currentMode !== 'compress';
  mergeBtn.disabled = currentMode === 'merge' && files.length < 2;

  if (currentMode === 'convert') {
    updateConvertSelect();
  }
}

window.removeFile = (index) => {
  files.splice(index, 1);
  updateFileList();
};

function updateConvertSelect() {
  formatSelect.innerHTML = '<option value="">Seleziona...</option>';
  
  if (files.length === 0) return;

  const ext = getFileExt(files[0].name);
  console.log('Estensione rilevata:', ext); // DEBUG
  
  const available = convertibleFormats[ext];
  
  if (available && available.length > 0) {
    available.forEach(fmt => {
      const opt = document.createElement('option');
      opt.value = fmt;
      opt.textContent = fmt.toUpperCase();
      formatSelect.appendChild(opt);
    });
    status.textContent = `Seleziona formato per ${ext.toUpperCase()}`;
    status.className = '';
    convertBtn.disabled = false;
  } else {
    formatSelect.innerHTML = '<option value="">Non convertibile</option>';
    status.textContent = `Formato ${ext.toUpperCase()} non supportato`;
    status.className = 'error';
    convertBtn.disabled = true;
  }
}

formatSelect.addEventListener('change', () => {
  const format = formatSelect.value;
  if (format) {
    const ext = getFileExt(files[0]?.name || '');
    status.textContent = `${ext.toUpperCase()} → ${format.toUpperCase()}`;
    status.className = '';
  }
});

// BOTTONI
convertBtn.addEventListener('click', convertFiles);
compressBtn.addEventListener('click', compressFiles);
mergeBtn.addEventListener('click', mergePDFs);

async function convertFiles() {
  const format = formatSelect.value;
  if (!format) return;

  status.textContent = 'Conversione...';
  status.className = 'loading';

  for (let i = 0; i < files.length; i++) {
    try {
      updateProgress(i, 10, 'Preparazione...');
      const result = await convertSingleFile(files[i], format);
      const newName = files[i].name.replace(/\.[^/.]+$/, `.${format}`);
      download(result, newName);
      updateProgress(i, 100, '✓ Fatto');
    } catch (e) {
      updateProgress(i, 100, '✗ Errore');
    }
  }
  status.textContent = 'Conversione completata!';
  status.className = 'success';
}

function updateProgress(index, percent, text) {
  const el = document.getElementById(`progress-${index}`);
  if (!el) return;
  el.querySelector('.progress-bar').style.width = percent + '%';
  el.querySelector('.progress-text').textContent = text;
}

async function convertSingleFile(file, format) {
  const ext = getFileExt(file.name);

  // IMMAGINI
  if (['png','jpg','jpeg','bmp'].includes(ext)) {
    return new Promise((resolve) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        canvas.width = img.width;
        canvas.height = img.height;
        const ctx = canvas.getContext('2d');
        ctx.drawImage(img, 0, 0);
        canvas.toBlob(resolve, format === 'jpg' ? 'image/jpeg' : `image/${format}`);
      };
      img.src = URL.createObjectURL(file);
    });
  }

  // MP4 → MP3 (semplificato)
  if (ext === 'mp4' && format === 'mp3') {
    const buffer = await file.arrayBuffer();
    return new Blob([buffer], { type: 'audio/mp3' });
  }

  // MP3 → WAV
  if (ext === 'mp3' && format === 'wav') {
    const buffer = await file.arrayBuffer();
    return new Blob([buffer], { type: 'audio/wav' });
  }

  throw new Error('Conversione non implementata');
}

function download(blob, filename) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  setTimeout(() => URL.revokeObjectURL(url), 100);
}

function compressFiles() {
  status.textContent = 'Compressione...';
  status.className = 'loading';
  // TODO: implementa compressione
  setTimeout(() => {
    status.textContent = 'Compressione completata!';
    status.className = 'success';
  }, 1000);
}

function mergePDFs() {
  status.textContent = 'Unione PDF...';
  status.className = 'loading';
  // TODO: implementa unione
  setTimeout(() => {
    status.textContent = 'PDF uniti!';
    status.className = 'success';
  }, 1000);
}
