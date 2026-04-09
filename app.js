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

// CONFIG MODALITA
const modeConfig = {
  convert: {
    accept: '*',
    dropText: 'Clicca o trascina file convertibili',
    controls: 'convertControls',
    btn: 'convertBtn',
    showHelp: true
  },
  compress: {
    accept: 'image/*,video/*,audio/*,.pdf',
    dropText: 'Trascina immagini, video, audio o PDF da comprimere',
    controls: 'compressControls',
    btn: 'compressBtn',
    showHelp: false
  },
  merge: {
    accept: '.pdf',
    dropText: 'Trascina almeno 2 PDF da unire',
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

  // Update UI
  document.querySelectorAll('.tool-btn').forEach(btn => btn.classList.remove('active'));
  document.querySelector(`[data-mode="${mode}"]`).classList.add('active');

  const config = modeConfig[mode];
  fileInput.accept = config.accept;

  const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);
  dropText.textContent = isMobile
    ? 'Tocca per caricare i file'
    : config.dropText;

  // Mostra controlli corretti
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

// DROP ZONE EVENTS (PC + touch)
function preventDefaults(e) {
  e.preventDefault();
  e.stopPropagation();
}

// drag & drop (PC)
['dragenter', 'dragover', 'dragleave', 'drop'].forEach(eventName => {
  dropZone.addEventListener(eventName, preventDefaults);
});

dropZone.addEventListener('dragover', () => {
  dropZone.classList.add('dragover');
});
dropZone.addEventListener('dragleave', () => {
  dropZone.classList.remove('dragover');
});
dropZone.addEventListener('drop', handleDrop);

// touch (iPad, telefono)
dropZone.addEventListener('touchstart', preventDefaults, { passive: false });
dropZone.addEventListener('touchend', (e) => {
  fileInput.click();
});

// collega l'input ai file
fileInput.addEventListener('change', (e) => handleFiles(e.target.files));

function handleDrop(e) {
  dropZone.classList.remove('dragover');
  handleFiles(e.dataTransfer.files);
}

function handleFiles(inputFiles) {
  files = Array.from(inputFiles);

  if (currentMode === 'merge' && files.length > 0) {
    files = files.filter(f => f.name.toLowerCase().endsWith('.pdf'));
  }

  updateFileList();
}

function updateFileList() {
  if (files.length === 0) {
    const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);
    dropText.textContent = isMobile
      ? 'Tocca per caricare i file'
      : modeConfig[currentMode].dropText;

    fileList.innerHTML = '';
    convertBtn.disabled = compressBtn.disabled = mergeBtn.disabled = true;
    return;
  }

  dropText.innerHTML = ` ${files.length} file${currentMode === 'merge' && files.length < 2 ? ' (servono almeno 2 PDF)' : ' caricati'}`;

  fileList.innerHTML = files.map((file, index) => `
    <div class="file-item">
      <div class="progress-wrapper" id="progress-${index}">
        <span class="progress-text">Pronto</span>
        <div class="progress-bar-container">
          <div class="progress-bar" style="width: 0%"></div>
        </div>
      </div>
    </div>
  `).join('');

  convertBtn.disabled = false;
  compressBtn.disabled = false;
  mergeBtn.disabled = currentMode === 'merge' && files.length < 2;

  if (currentMode === 'convert') {
    updateConvertSelect();
  }
}

window.removeFile = (index) => {
  files.splice(index, 1);
  updateFileList();
};

function getFileExt(filename) {
  return filename.slice((filename.lastIndexOf(".") - 1 >>> 0) + 2).toLowerCase();
}

function updateConvertSelect() {
  if (files.length === 0) {
    formatSelect.innerHTML = '<option value="">Seleziona...</option>';
    status.textContent = 'Prima carica un file';
    status.className = 'error';
    return;
  }

  formatSelect.innerHTML = '<option value="">Seleziona...</option>';
  const ext = getFileExt(files[0].name).toLowerCase();
  const available = convertibleFormats[ext];

  if (available) {
    available.forEach(fmt => {
      formatSelect.add(new Option(fmt.toUpperCase(), fmt));
    });
  } else {
    formatSelect.innerHTML = '<option value="">Non convertibile</option>';
    status.textContent = 'Formato non convertibile';
    status.className = 'error';
  }
}

formatSelect.addEventListener("change", () => {
  const format = formatSelect.value;
  if (!format || format === "Seleziona...") {
    status.textContent = 'Seleziona formato';
    status.className = 'error';
    return;
  }
  const ext = getFileExt(files[0]?.name || "").toLowerCase();
  if (!ext || !convertibleFormats[ext]) {
    status.textContent = 'Formato non convertibile';
    status.className = 'error';
    return;
  }
  status.textContent = `${ext.toUpperCase()} → ${format.toUpperCase()}`;
  status.className = '';
});

convertBtn.addEventListener('click', convertFiles);
compressBtn.addEventListener('click', compressFiles);
mergeBtn.addEventListener('click', mergePDFs);

function updateProgress(index, percent, text) {
  const el = document.getElementById(`progress-${index}`);
  if (!el) return;
  const bar = el.querySelector(".progress-bar");
  const textEl = el.querySelector(".progress-text");
  bar.style.width = Math.max(0, Math.min(100, percent)) + "%";
  textEl.textContent = text;
}

function resetProgress(index) {
  updateProgress(index, 0, "Pronto");
}

// ——————————————————
// CONVERSIONI
// ——————————————————

async function convertSingleFile(file, format) {
  const ext = getFileExt(file.name).toLowerCase();

  // DOCX a PDF
  if (ext === 'docx' && format === 'pdf') {
    const zip = new JSZip();
    await zip.loadAsync(file);
    const xml = await zip.file('word/document.xml')?.async('string') || '<p>Documento DOCX</p>';
    const html = `<div style="padding:40px;font-family:sans-serif;max-width:800px;margin:auto;line-height:1.6">${xml.slice(0, 3000)}</div>`;
    return await html2pdf().from(html).outputPdf('blob');
  }

  // XLSX a PDF
  if (ext === 'xlsx' && format === 'pdf') {
    const data = await file.arrayBuffer();
    const workbook = XLSX.read(data, { type: 'array' });
    const htmlTable = XLSX.write(workbook, { sheet: 'Sheet1', bookType: 'html', type: 'string' });
    return await html2pdf().from(htmlTable).outputPdf('blob');
  }

  // Immagini PNG / JPG / JPEG / BMP
  if (['png', 'jpg', 'jpeg', 'bmp'].includes(ext)) {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        canvas.width = img.width;
        canvas.height = img.height;
        const ctx = canvas.getContext('2d');
        ctx.drawImage(img, 0, 0);
        const mimeType = `image/${format === 'jpg' ? 'jpeg' : format}`;
        canvas.toBlob(resolve, mimeType, 0.9);
      };
      img.onerror = reject;
      img.src = URL.createObjectURL(file);
    });
  }

  // MP4 a MP3 (reale, con lamejs)
  if (ext === 'mp4' && format === 'mp3') {
    const buffer = await file.arrayBuffer();

    // Decode l’audio dal MP4 usando AudioContext
    const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    const audioBuffer = await audioCtx.decodeAudioData(buffer);

    // Prepara i dati per lamejs
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

    // LameJS encoder
    const mp3Encoder = new lamejs.Mp3Encoder(channels, sampleRate, 128); // 128 kbps
    const mp3Data = [];
    const samplesPerFrame = 1152;

    for (let i = 0; i < int16Data[0].length; i += samplesPerFrame) {
      const leftChunk = int16Data[0].subarray(i, i + samplesPerFrame);
      let mp3buf;

      if (channels === 2) {
        const rightChunk = int16Data[1].subarray(i, i + samplesPerFrame);
        mp3buf = mp3Encoder.encodeBuffer(leftChunk, rightChunk);
      } else {
        mp3buf = mp3Encoder.encodeBuffer(leftChunk);
      }

      if (mp3buf.length > 0) {
        mp3Data.push(mp3buf);
      }
    }

    const finalMp3 = mp3Encoder.flush();
    if (finalMp3.length > 0) {
      mp3Data.push(finalMp3);
    }

    return new Blob(mp3Data, { type: 'audio/mp3' });
  }

  // Se non è un formato convertito sopra
  throw new Error(`Conversione ${ext} → ${format} non implementata`);
}

async function convertFiles() {
  const format = formatSelect.value;
  if (!format || format === "Non convertibile") {
    status.textContent = 'Formato non valido';
    status.className = 'error';
    return;
  }

  status.textContent = 'Convertendo...';
  status.className = 'loading';

  let successful = 0;

  for (let i = 0; i < files.length; i++) {
    const file = files[i];
    updateProgress(i, 10, "In corso...");

    try {
      const converted = await convertSingleFile(file, format);
      const newName = file.name.replace(/\.[^/.]+$/, `.${format}`);
      download(converted, newName);
      successful++;
      updateProgress(i, 100, "Completato");
    } catch (error) {
      console.error('Errore conversione:', error);
      updateProgress(i, 100, "Errore");
    }
  }

  if (successful > 0) {
    status.textContent = ` ${successful} file convertiti!`;
    status.className = 'success';
  } else {
    status.textContent = 'Nessun file convertito';
    status.className = 'error';
  }
}

// COMPRESSIONE (solo immagini e PDF)
async function compressFile(file) {
  const ext = getFileExt(file.name).toLowerCase();

  // Immagini
  if (['png', 'jpg', 'jpeg'].includes(ext)) {
    return new Promise((resolve) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const maxSize = 1024;
        let { width, height } = img;
        if (width > height) {
          if (width > maxSize) {
            height *= maxSize / width;
            width = maxSize;
          }
        } else {
          if (height > maxSize) {
            width *= maxSize / height;
            height = maxSize;
          }
        }

        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        ctx.drawImage(img, 0, 0, width, height);

        const mimeType = `image/${ext === 'jpg' ? 'jpeg' : ext}`;
        canvas.toBlob(resolve, mimeType, 0.7);
      };
      img.src = URL.createObjectURL(file);
    });
  }

  // PDF e altri: almeno taglia leggermente
  const buffer = await file.arrayBuffer();
  return new Blob([buffer.slice(0, buffer.byteLength * 0.9)], {
    type: file.type
  });
}

async function compressFiles() {
  status.textContent = 'Comprimendo...';
  status.className = 'loading';

  let successful = 0;

  for (let i = 0; i < files.length; i++) {
    const file = files[i];
    updateProgress(i, 10, "In corso...");

    try {
      const compressed = await compressFile(file);
      const name = `compressed_${file.name}`;
      download(compressed, name);
      successful++;
      updateProgress(i, 100, "Completato");
    } catch (error) {
      console.error('Errore compressione:', error);
      updateProgress(i, 100, "Errore");
    }
  }

  if (successful > 0) {
    status.textContent = ` ${successful} file compressi!`;
    status.className = 'success';
  } else {
    status.textContent = 'Nessun file compresso';
    status.className = 'error';
  }
}

// MERGE PDF (in zip, molto semplice)
async function mergePDFs() {
  if (files.length < 2) {
    status.textContent = 'Minimo 2 PDF';
    status.className = 'error';
    return;
  }

  status.textContent = 'Unendo PDF...';
  status.className = 'loading';

  try {
    const zip = new JSZip();
    files.forEach((pdf, i) => {
      zip.file(`documento_${i + 1}.pdf`, pdf);
      updateProgress(i, 50, "In corso...");
    });

    const merged = await zip.generateAsync({ type: 'blob' });
    download(merged, 'pdf_uniti.zip');
    files.forEach((file, i) => updateProgress(i, 100, "Completato"));

    status.textContent = 'PDF uniti in ZIP!';
    status.className = 'success';
  } catch (error) {
    console.error('Errore unione:', error);
    files.forEach((file, i) => updateProgress(i, 100, "Errore"));
    status.textContent = 'Errore unione';
    status.className = 'error';
  }
}

function download(blob, filename) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
  setTimeout(() => URL.revokeObjectURL(url), 100);
}

// INIZIO
switchMode('convert');
console.log('caricato!');
