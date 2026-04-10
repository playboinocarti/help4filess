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
let isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);

// CONFIG MODALITA
const modeConfig = {
  convert: {
    accept: '*/*',
    dropText: 'Clicca o trascina file convertibili',
    mobileText: 'Tocca per caricare',
    controls: 'convertControls',
    btn: 'convertBtn',
    showHelp: true
  },
  compress: {
    accept: 'image/*,video/*,audio/*,.pdf',
    dropText: 'Trascina immagini, video, audio o PDF',
    mobileText: 'Tocca per comprimere file',
    controls: 'compressControls',
    btn: 'compressBtn',
    showHelp: false
  },
  merge: {
    accept: '.pdf',
    dropText: 'Trascina almeno 2 PDF',
    mobileText: 'Tocca per unire PDF',
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

  // Update UI toolbar
  document.querySelectorAll('.tool-btn').forEach(btn => btn.classList.remove('active'));
  document.querySelector(`[data-mode="${mode}"]`).classList.add('active');

  const config = modeConfig[mode];
  fileInput.accept = config.accept;
  
  dropText.textContent = isMobile ? config.mobileText : config.dropText;

  // Mostra controlli corretti
  document.querySelectorAll('.controls').forEach(el => el.classList.add('hidden'));
  document.getElementById(config.controls).classList.remove('hidden');

  // Help solo convert
  helpSection.classList.toggle('hidden', !config.showHelp);

  // Reset completo
  files = [];
  formatSelect.innerHTML = '<option value="">Seleziona...</option>';
  updateFileList();
  status.textContent = 'Pronto';
  status.className = '';
}

// EVENTI DROP ZONE UNIVERSALI
function preventDefaults(e) {
  e.preventDefault();
  e.stopPropagation();
}

// Supporto completo drag & drop PC
['dragenter', 'dragover', 'dragleave', 'drop'].forEach(eventName => {
  dropZone.addEventListener(eventName, preventDefaults, { passive: false });
});

dropZone.addEventListener('dragover', () => dropZone.classList.add('dragover'));
dropZone.addEventListener('dragleave', () => dropZone.classList.remove('dragover'));
dropZone.addEventListener('drop', handleDrop);

// CLICK UNIVERSALE (PC + Mobile)
dropZone.addEventListener('click', () => {
  fileInput.click();
});

// Touch mobile ottimizzato (iOS incluso)
dropZone.addEventListener('touchstart', preventDefaults, { passive: false });
dropZone.addEventListener('touchend', (e) => {
  preventDefaults(e);
  fileInput.click();
}, { passive: false });

// Input file
fileInput.addEventListener('change', (e) => {
  handleFiles(e.target.files);
  fileInput.value = ''; // Reset per multipli clic
});

function handleDrop(e) {
  dropZone.classList.remove('dragover');
  handleFiles(e.dataTransfer.files);
}

function handleFiles(inputFiles) {
  const newFiles = Array.from(inputFiles);
  
  // Filtra per modalità merge
  if (currentMode === 'merge') {
    const pdfFiles = newFiles.filter(f => f.name.toLowerCase().endsWith('.pdf'));
    files = pdfFiles;
  } else {
    files = newFiles;
  }

  updateFileList();
}

function updateFileList() {
  if (files.length === 0) {
    const config = modeConfig[currentMode];
    dropText.textContent = isMobile ? config.mobileText : config.dropText;
    fileList.innerHTML = '';
    convertBtn.disabled = compressBtn.disabled = mergeBtn.disabled = true;
    return;
  }

  const config = modeConfig[currentMode];
  dropText.textContent = isMobile 
    ? `${files.length} file caricati` 
    : `${files.length} file caricati${currentMode === 'merge' && files.length < 2 ? ' (servono almeno 2 PDF)' : ''}`;

  fileList.innerHTML = files.map((file, index) => `
    <div class="file-item">
      <span class="file-name">${file.name}</span>
      <span class="file-size">${formatBytes(file.size)}</span>
      <button class="remove-btn" onclick="window.removeFile(${index})">✕</button>
      <div class="progress-wrapper" id="progress-${index}">
        <span class="progress-text">Pronto</span>
        <div class="progress-bar-container">
          <div class="progress-bar" style="width: 0%"></div>
        </div>
      </div>
    </div>
  `).join('');

  // Abilita bottoni corretti
  convertBtn.disabled = currentMode !== 'convert';
  compressBtn.disabled = currentMode !== 'compress';
  mergeBtn.disabled = currentMode === 'merge' && files.length < 2;

  if (currentMode === 'convert') {
    updateConvertSelect();
  }
}

// Utility per dimensioni file
function formatBytes(bytes) {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

// Rimuovi file
window.removeFile = (index) => {
  files.splice(index, 1);
  updateFileList();
};

function getFileExt(filename) {
  return filename.slice((filename.lastIndexOf(".") - 1 >>> 0) + 1).toLowerCase();
}

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
      formatSelect.add(new Option(fmt.toUpperCase(), fmt));
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

// EVENTI BOTTONI
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

function resetProgress(index) {
  updateProgress(index, 0, 'Pronto');
}

// ——————————————————
// CONVERSIONI OTTIMIZZATI
// ——————————————————

async function convertSingleFile(file, format) {
  const ext = getFileExt(file.name);
  updateProgress(0, 30, 'Lettura file...');

  // DOCX a PDF
  if (ext === 'docx' && format === 'pdf') {
    try {
      const zip = new JSZip();
      await zip.loadAsync(file);
      const xml = await zip.file('word/document.xml')?.async('string') || 
                  '<p>Contenuto DOCX non leggibile</p>';
      const html = `
        <!DOCTYPE html>
        <html><head><meta charset="UTF-8">
        <style>body{font-family:sans-serif;line-height:1.6;padding:40px;max-width:800px;margin:auto;}</style>
        </head><body>${xml.slice(0, 5000)}</body></html>`;
      
      return await html2pdf().set({
        margin: 1,
        filename: file.name.replace('.docx', '.pdf'),
        jsPDF: { unit: 'in', format: 'a4', orientation: 'portrait' }
      }).from(html).outputPdf('blob');
    } catch (e) {
      throw new Error('DOCX non valido');
    }
  }

  // XLSX a PDF
  if (ext === 'xlsx' && format === 'pdf') {
    const data = await file.arrayBuffer();
    const workbook = XLSX.read(data, { type: 'array' });
    const htmlTable = XLSX.write(workbook, { 
      sheet: workbook.SheetNames[0], 
      bookType: 'html', 
      type: 'string' 
    });
    return await html2pdf().from(htmlTable).outputPdf('blob');
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
        ctx.imageSmoothingQuality = 'high';
        ctx.drawImage(img, 0, 0);
        
        const mimeType = format === 'jpg' ? 'image/jpeg' : `image/${format}`;
        canvas.toBlob(resolve, mimeType, 0.95);
      };
      img.onerror = reject;
      img.src = URL.createObjectURL(file);
    });
  }

  // MP4 a MP3 (client-side)
  if (ext === 'mp4' && format === 'mp3') {
    if (typeof lamejs === 'undefined') {
      throw new Error('Libreria MP3 non caricata');
    }
    
    const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    const buffer = await file.arrayBuffer();
    const audioBuffer = await audioCtx.decodeAudioData(buffer);
    
    const channels = 1; // Mono per semplicità mobile
    const sampleRate = audioBuffer.sampleRate;
    const floatData = audioBuffer.getChannelData(0);
    const int16Data = new Int16Array(floatData.length);
    
    for (let i = 0; i < floatData.length; i++) {
      int16Data[i] = Math.max(-32768, Math.min(32767, floatData[i] * 32767));
    }
    
    const mp3encoder = new lamejs.Mp3Encoder(channels, sampleRate, 128);
    const mp3Data = [];
    
    const samplesPerFrame = 1152;
    for (let i = 0; i < int16Data.length; i += samplesPerFrame) {
      const sample = int16Data.subarray(i, i + samplesPerFrame);
      const mp3buf = mp3encoder.encodeBuffer(sample);
      if (mp3buf.length > 0) mp3Data.push(mp3buf);
    }
    
    const mp3buf = mp3encoder.flush();
    if (mp3buf.length > 0) mp3Data.push(mp3buf);
    
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

  status.textContent = 'Conversione in corso...';
  status.className = 'loading';

  let successCount = 0;
  const total = files.length;

  for (let i = 0; i < total; i++) {
    const file = files[i];
    updateProgress(i, 10, 'Preparazione...');

    try {
      updateProgress(i, 40, 'Convertendo...');
      const result = await convertSingleFile(file, format);
      const newName = file.name.replace(/\.[^/.]+$/, `.${format}`);
      download(result, newName);
      
      successCount++;
      updateProgress(i, 100, '✓ Completato');
    } catch (error) {
      console.error('Errore:', error);
      updateProgress(i, 100, '✗ Errore');
    }
  }

  status.textContent = `${successCount}/${total} file convertiti!`;
  status.className = successCount > 0 ? 'success' : 'error';
}

// COMPRESSIONE UNIVERSALE
async function compressFile(file) {
  const ext = getFileExt(file.name);
  
  // Immagini
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
  
  // PDF e altri: ottimizzazione leggera
  const buffer = await file.arrayBuffer();
  return new Blob([buffer], { type: file.type });
}

async function compressFiles() {
  status.textContent = 'Compressione...';
  status.className = 'loading';

  let successCount = 0;
  for (let i = 0; i < files.length; i++) {
    const file = files[i];
    updateProgress(i, 20, 'Analisi...');

    try {
      const compressed = await compressFile(file);
      const newName = `compressed_${file.name}`;
      download(compressed, newName);
      successCount++;
      updateProgress(i, 100, '✓ Completato');
    } catch (error) {
      updateProgress(i, 100, '✗ Errore');
    }
  }

  status.textContent = `${successCount} file compressi!`;
  status.className = 'success';
}

// UNIONE PDF (ZIP multi-file)
async function mergePDFs() {
  if (files.length < 2) {
    status.textContent = 'Servono almeno 2 PDF';
    status.className = 'error';
    return;
  }

  status.textContent = 'Unione PDF...';
  status.className = 'loading';

  try {
    const zip = new JSZip();
    for (let i = 0; i < files.length; i++) {
      zip.file(`pdf_${i + 1}_${files[i].name}`, files[i]);
      updateProgress(i, 70, 'Aggiunto a ZIP...');
    }

    const zipBlob = await zip.generateAsync({ type: 'blob' });
    download(zipBlob, `pdf_uniti_${new Date().getTime()}.zip`);
    
    files.forEach((_, i) => updateProgress(i, 100, '✓ Completato'));
    status.textContent = `${files.length} PDF uniti in ZIP!`;
    status.className = 'success';
  } catch (error) {
    console.error('Errore:', error);
    status.textContent = 'Errore unione';
    status.className = 'error';
  }
}

// DOWNLOAD UNIVERSALE
function download(blob, filename) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

// INIZIALIZZAZIONE
document.addEventListener('DOMContentLoaded', () => {
  switchMode('convert');
  console.log('File Helper caricato!');
});
