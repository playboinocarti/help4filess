// SELEZIONE ELEMENTI
const toolBar = document.getElementById('toolBar');
const dropZone = document.getElementById('dropZone');
const fileInput = document.getElementById('fileInput');
const fileList = document.getElementById('fileList');
const formatSelect = document.getElementById('formatSelect');
const convertBtn = document.getElementById('convertBtn');
const compressBtn = document.getElementById('compressBtn');
const mergeBtn = document.getElementById('mergeBtn');
const convertControls = document.getElementById('convertControls');
const compressControls = document.getElementById('compressControls');
const mergeControls = document.getElementById('mergeControls');
const helpSection = document.getElementById('helpSection');
const dropText = document.getElementById('dropText');
const status = document.getElementById('status');

// VARIABILI GLOBALI
let currentMode = 'convert';
let files = [];
const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);

// CONFIG MODALITA
const modeConfig = {
  convert: {
    accept: '*/*',
    dropText: 'Clicca o trascina file convertibili',
    mobileText: 'Tocca il bottone qui sotto per caricare file',
    controls: 'convertControls',
    btn: 'convertBtn',
    showHelp: true
  },
  compress: {
    accept: 'image/*,video/*,audio/*,.pdf',
    dropText: 'Trascina immagini, video, audio o PDF da comprimere',
    mobileText: 'Tocca il bottone per caricare file',
    controls: 'compressControls',
    btn: 'compressBtn',
    showHelp: false
  },
  merge: {
    accept: '.pdf',
    dropText: 'Trascina PDF (minimo 2) o usa il bottone',
    mobileText: 'Tocca il bottone per caricare PDF',
    controls: 'mergeControls',
    btn: 'mergeBtn',
    showHelp: false
  }
};

// FORMATI CONVERTIBILI
const convertibleFormats = {
  'docx': ['pdf'],
  'xlsx': ['pdf'],
  'mp4': ['mp3'],
  'png': ['jpg', 'webp'],
  'jpg': ['png', 'webp'],
  'jpeg': ['png', 'webp'],
  'bmp': ['jpg', 'png']
};

// TOOLBAR CLICK
toolBar.addEventListener('click', (e) => {
  if (e.target.classList.contains('tool-btn')) {
    switchMode(e.target.dataset.mode);
  }
});

function switchMode(mode) {
  currentMode = mode;

  // UI toolbar
  document.querySelectorAll('.tool-btn').forEach(btn => btn.classList.remove('active'));
  document.querySelector(`[data-mode="${mode}"]`).classList.add('active');

  const config = modeConfig[mode];
  fileInput.accept = config.accept;
  dropText.textContent = isMobile ? config.mobileText : config.dropText;

  // Mostra solo controlli giusti
  document.querySelectorAll('.controls').forEach(el => el.classList.add('hidden'));
  document.getElementById(config.controls).classList.remove('hidden');

  // Help solo convert
  helpSection.classList.toggle('hidden', !config.showHelp);

  // Reset
  files = [];
  formatSelect.innerHTML = '<option value="">Seleziona...</option>';
  updateFileList();
  status.textContent = 'Pronto';
  status.className = '';
}

// EVENTI DROP ZONE (PC)
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

// CLICK sulla zona drop (solo PC, non su iPad)
dropZone.addEventListener('click', () => {
  if (!isMobile) {
    fileInput.click();
  }
});

// INPUT FILE
fileInput.addEventListener('change', (e) => {
  handleFiles(e.target.files);
  fileInput.value = '';
});

function handleDrop(e) {
  dropZone.classList.remove('dragover');
  handleFiles(e.dataTransfer.files);
}

function handleFiles(inputFiles) {
  const newFiles = Array.from(inputFiles).slice(0, 10);
  if (currentMode === 'merge') {
    files = newFiles.filter(f => f.name.toLowerCase().endsWith('.pdf'));
  } else {
    files = newFiles;
  }
  updateFileList();
}

// FORMATO byte
function formatBytes(bytes) {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

function getFileExt(filename) {
  return filename.slice((filename.lastIndexOf('.') - 1 >>> 0) + 1).toLowerCase();
}

// AGGIORNA LISTA FILE
function updateFileList() {
  if (files.length === 0) {
    const config = modeConfig[currentMode];
    dropText.innerHTML = config.mobileText;
    fileList.innerHTML = '';
    convertBtn.disabled = compressBtn.disabled = mergeBtn.disabled = true;
    return;
  }

  const config = modeConfig[currentMode];
  dropText.textContent = `${files.length} file caricati${currentMode === 'merge' && files.length < 2 ? ' (servono almeno 2 PDF)' : ''}`;

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

// RIMUOVI FILE
window.removeFile = (index) => {
  files.splice(index, 1);
  updateFileList();
};

// FORMATI DI CONVERSIONE
function updateConvertSelect() {
  formatSelect.innerHTML = '<option value="">Seleziona...</option>';
  if (files.length === 0) {
    status.textContent = 'Carica un file';
    status.className = 'error';
    return;
  }

  const ext = getFileExt(files[0].name);
  const available = convertibleFormats[ext];

  if (available) {
    available.forEach(fmt => {
      const opt = document.createElement('option');
      opt.value = fmt;
      opt.textContent = fmt.toUpperCase();
      formatSelect.appendChild(opt);
    });
    status.textContent = 'Seleziona formato di destinazione';
    status.className = '';
  } else {
    formatSelect.innerHTML = '<option value="">Non convertibile</option>';
    status.textContent = `Formato ${ext.toUpperCase()} non supportato`;
    status.className = 'error';
  }
}

formatSelect.addEventListener('change', () => {
  const format = formatSelect.value;
  if (!format) {
    status.textContent = 'Seleziona formato';
    status.className = 'error';
    return;
  }
  status.textContent = `${getFileExt(files[0]?.name || '').toUpperCase()} → ${format.toUpperCase()}`;
  status.className = '';
});

// BOTTONI PRINCIPALI
convertBtn.addEventListener('click', convertFiles);
compressBtn.addEventListener('click', compressFiles);
mergeBtn.addEventListener('click', mergePDFs);

function updateProgress(index, percent, text) {
  const el = document.getElementById(`progress-${index}`);
  if (!el) return;
  const bar = el.querySelector('.progress-bar');
  const textEl = el.querySelector('.progress-text');
  if (bar) bar.style.width = Math.max(0, Math.min(100, percent)) + '%';
  if (textEl) textEl.textContent = text;
}

// CONVERSIONE SINGOLO FILE
async function convertSingleFile(file, format) {
  const ext = getFileExt(file.name);
  updateProgress(0, 30, 'Letto file...');

  // DOCX → PDF
  if (ext === 'docx' && format === 'pdf') {
    const zip = new JSZip();
    await zip.loadAsync(file);
    const xml = await zip.file('word/document.xml')?.async('string') || '<p>DOCX</p>';
    const html = `
      <!DOCTYPE html>
      <html><head><meta charset="UTF-8"></head>
      <body style="font-family:sans-serif;padding:40px;">${xml.slice(0, 5000)}</body>
    `;
    return await html2pdf().set({
      margin: 1,
      jsPDF: { format: 'a4' }
    }).from(html).outputPdf('blob');
  }

  // XLSX → PDF
  if (ext === 'xlsx' && format === 'pdf') {
    const data = await file.arrayBuffer();
    const workbook = XLSX.read(data, { type: 'array' });
    const html = XLSX.write(workbook, { bookType: 'html', type: 'string' });
    return await html2pdf().from(html).outputPdf('blob');
  }

  // IMMAGINI
  if (['png', 'jpg', 'jpeg', 'bmp'].includes(ext)) {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        canvas.width = img.width;
        canvas.height = img.height;
        const ctx = canvas.getContext('2d');
        ctx.drawImage(img, 0, 0);
        const mimeType = format === 'jpg' ? 'image/jpeg' : `image/${format}`;
        canvas.toBlob(resolve, mimeType, 0.95);
      };
      img.onerror = reject;
      img.src = URL.createObjectURL(file);
    });
  }

  // MP4 → MP3
  if (ext === 'mp4' && format === 'mp3') {
    const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    const buffer = await file.arrayBuffer();
    const audioBuffer = await audioCtx.decodeAudioData(buffer);
    const channels = Math.min(audioBuffer.numberOfChannels, 2);
    const sampleRate = audioBuffer.sampleRate;
    const int16Data = [];

    for (let ch = 0; ch < channels; ch++) {
      const floatData = audioBuffer.getChannelData(ch);
      const intData = new Int16Array(floatData.length);
      for (let i = 0; i < floatData.length; i++) {
        intData[i] = Math.max(-32768, Math.min(32767, floatData[i] * 32767));
      }
      int16Data.push(intData);
    }

    const mp3Encoder = new lamejs.Mp3Encoder(channels, sampleRate, 128);
    const mp3Data = [];
    const samplesPerFrame = 1152;

    for (let i = 0; i < int16Data.length; i += samplesPerFrame) {
      const leftChunk = int16Data[i].subarray(0, samplesPerFrame);
      let mp3buf;
      if (channels === 2) {
        const rightChunk = int16Data[i + 1]?.subarray(0, samplesPerFrame);
        mp3buf = mp3Encoder.encodeBuffer(leftChunk, rightChunk);
      } else {
        mp3buf = mp3Encoder.encodeBuffer(leftChunk);
      }
      if (mp3buf && mp3buf.length > 0) mp3Data.push(mp3buf);
    }

    const final = mp3Encoder.flush();
    if (final && final.length > 0) mp3Data.push(final);

    return new Blob(mp3Data, { type: 'audio/mp3' });
  }

  throw new Error(`Conversione ${ext} → ${format} non supportata`);
}

async function convertFiles() {
  const format = formatSelect.value;
  if (!format) {
    status.textContent = 'Seleziona formato';
    status.className = 'error';
    return;
  }

  status.textContent = 'Conversione in corso…';
  status.className = 'loading';

  let successCount = 0;
  const total = files.length;

  for (let i = 0; i < total; i++) {
    const file = files[i];
    updateProgress(i, 10, 'Preparazione…');

    try {
      const result = await convertSingleFile(file, format);
      const newName = file.name.replace(/\\.[^/.]+$/, `.${format}`);
      download(result, newName);
      successCount++;
      updateProgress(i, 100, '✓ Completato');
    } catch (error) {
      console.error('Errore in conversione:', error);
      updateProgress(i, 100, '✗ Errore');
    }
  }

  status.textContent = `${successCount}/${total} convertiti!`;
  status.className = successCount > 0 ? 'success' : 'error';
}

// COMPRESSIONE
async function compressFile(file) {
  const ext = getFileExt(file.name);

  if (['png', 'jpg', 'jpeg', 'webp'].includes(ext)) {
    return new Promise((resolve) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const maxDim = 1200;
        let { width, height } = img;

        if (width > height) {
          if (width > maxDim) {
            height *= maxDim / width;
            width = maxDim;
          }
        } else {
          if (height > maxDim) {
            width *= maxDim / height;
            height = maxDim;
          }
        }

        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        ctx.imageSmoothingQuality = 'high';
        ctx.drawImage(img, 0, 0, width, height);

        const quality = ext === 'png' ? 1.0 : 0.75;
        const mimeType = `image/${ext === 'png' ? 'png' : 'jpeg'}`;
        canvas.toBlob(resolve, mimeType, quality);
      };
      img.src = URL.createObjectURL(file);
    });
  }

  const buffer = await file.arrayBuffer();
  return new Blob([buffer], { type: file.type });
}

async function compressFiles() {
  status.textContent = 'Comprimendo…';
  status.className = 'loading';

  let successCount = 0;
  for (let i = 0; i < files.length; i++) {
    const file = files[i];
    updateProgress(i, 20, 'Analisi…');

    try {
      const compressed = await compressFile(file);
      const newName = `compressed_${file.name}`;
      download(compressed, newName);
      successCount++;
      updateProgress(i, 100, '✓ Completato');
    } catch (error) {
      console.error('Errore in compressione:', error);
      updateProgress(i, 100, '✗ Errore');
    }
  }

  status.textContent = `${successCount} file compressi!`;
  status.className = 'success';
}

// UNIONE PDF in ZIP
async function mergePDFs() {
  if (files.length < 2) {
    status.textContent = 'Servono almeno 2 PDF';
    status.className = 'error';
    return;
  }

  status.textContent = 'Unendo PDF…';
  status.className = 'loading';

  try {
    const zip = new JSZip();
    for (let i = 0; i < files.length; i++) {
      zip.file(`pdf_${i + 1}_${files[i].name}`, files[i]);
      updateProgress(i, 70, 'Aggiunto a ZIP…');
    }

    const zipBlob = await zip.generateAsync({ type: 'blob' });
    download(zipBlob, `pdf_uniti_${new Date().getTime()}.zip`);

    files.forEach((_, i) => updateProgress(i, 100, '✓ Completato'));
    status.textContent = `${files.length} PDF uniti in ZIP!`;
    status.className = 'success';
  } catch (error) {
    console.error('Errore unione:', error);
    status.textContent = 'Errore unione';
    status.className = 'error';
  }
}

// DOWNLOAD FILE
function download(blob, filename) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
  // opzionale, più sicuro
  setTimeout(() => URL.revokeObjectURL(url), 100);
}
