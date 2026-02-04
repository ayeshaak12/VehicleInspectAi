// ═══════════════════════════════════════════════════════════
// AUTOSPECT - AI VEHICLE INSPECTION APPLICATION
// Complete JavaScript Application Code
// ═══════════════════════════════════════════════════════════

// ══════════════════════════════════════════════════════════════════════════════
// AUTHENTICATION SYSTEM
// ══════════════════════════════════════════════════════════════════════════════

// Hardcoded credentials
const AUTH_CREDENTIALS = {
  username: 'autospect',
  password: 'miniproject'
};

// Password visibility toggle function
function togglePasswordVisibility() {
  const passwordInput = document.getElementById('password');
  const toggleText = document.getElementById('toggleText');
  
  if (passwordInput.type === 'password') {
    passwordInput.type = 'text';
    toggleText.textContent = 'Hide';
  } else {
    passwordInput.type = 'password';
    toggleText.textContent = 'Show';
  }
}

// Check if user is already logged in
function checkAuth() {
  const isLoggedIn = sessionStorage.getItem('autospect_authenticated') === 'true';
  return isLoggedIn;
}

// Handle login form submission
function handleLogin(event) {
  event.preventDefault();
  
  const username = document.getElementById('username').value;
  const password = document.getElementById('password').value;
  const errorDiv = document.getElementById('loginError');
  
  // Validate credentials
  if (username === AUTH_CREDENTIALS.username && password === AUTH_CREDENTIALS.password) {
    // Successful login
    sessionStorage.setItem('autospect_authenticated', 'true');
    
    // Hide login screen with fade effect
    document.getElementById('loginContainer').classList.add('hidden');
    document.body.classList.remove('splash-active');
    
    // Clear form
    document.getElementById('username').value = '';
    document.getElementById('password').value = '';
    errorDiv.classList.remove('show');
    
    // Show app immediately
    document.getElementById('home').classList.add('active');
  } else {
    // Failed login
    errorDiv.classList.add('show');
    document.getElementById('password').value = '';
    
    // Hide error after 3 seconds
    setTimeout(() => {
      errorDiv.classList.remove('show');
    }, 3000);
  }
}

// Handle logout
function handleLogout() {
  if (confirm('Are you sure you want to logout?')) {
    sessionStorage.removeItem('autospect_authenticated');
    
    // Hide all pages
    document.querySelectorAll('.page').forEach(page => page.classList.remove('active'));
    
    // Show splash screen first
    document.body.classList.add('splash-active');
    const splash = document.getElementById('splash');
    splash.classList.remove('hidden');
    
    // After splash, show login
    setTimeout(() => {
      splash.classList.add('hidden');
      document.getElementById('loginContainer').classList.remove('hidden');
    }, 3200);
    
    // Reset inspection data if needed
    resetInspection();
  }
}

// ═══════════════════════════════════════════════════════════
// GLOBAL STATE
// ═══════════════════════════════════════════════════════════

let uploadedFiles = [];
let currentResults = null;
let videoStream = null;
let detectionInterval = null;
let isProcessing = false;
let isLiveMode = false;
let currentFacingMode = 'environment';
let inspectionHistory = [];
let capturedImages = [];  // Store captured image data for review

// ═══════════════════════════════════════════════════════════
// SPLASH SCREEN INITIALIZATION
// ═══════════════════════════════════════════════════════════

(function() {
  document.documentElement.classList.add('splash-active');
  document.body.classList.add('splash-active');

  window.addEventListener('load', () => {
    const isAuthenticated = checkAuth();
    
    setTimeout(() => {
      const splash = document.getElementById('splash');
      if (splash) {
        splash.classList.add('hidden');
      }
      document.body.classList.remove('splash-active');
      document.documentElement.classList.remove('splash-active');

      if (isAuthenticated) {
        // User is logged in - show app
        const home = document.getElementById('home');
        if (home) {
          home.classList.add('active');
        }
      } else {
        // User not logged in - show login screen
        document.getElementById('loginContainer').classList.remove('hidden');
      }

      window.scrollTo({ top: 0, behavior: 'instant' });
    }, 3200);
  });

  setTimeout(() => {
    const splash = document.getElementById('splash');
    if (splash && !splash.classList.contains('hidden')) {
      splash.classList.add('hidden');
      document.body.classList.remove('splash-active');
      document.documentElement.classList.remove('splash-active');
      
      if (checkAuth()) {
        const home = document.getElementById('home');
        if (home) {
          home.classList.add('active');
        }
      } else {
        document.getElementById('loginContainer').classList.remove('hidden');
      }
    }
  }, 4000);
})();

// ═══════════════════════════════════════════════════════════
// NAVIGATION
// ═══════════════════════════════════════════════════════════

function showPage(pageId) {
  if (!checkAuth()) return;
  
  document.querySelectorAll('.page').forEach(page => page.classList.remove('active'));
  document.querySelectorAll('.nav-link').forEach(link => link.classList.remove('active'));
  
  document.getElementById(pageId).classList.add('active');
  
  const navLinks = document.querySelectorAll('.nav-link');
  navLinks.forEach(link => {
    if (link.getAttribute('onclick') === `showPage('${pageId}')`) {
      link.classList.add('active');
    }
  });
  
  if (pageId === 'history') {
    renderHistory();
  }
  
  window.scrollTo({ top: 0, behavior: 'smooth' });
}

// ═══════════════════════════════════════════════════════════
// UPLOAD MODE
// ═══════════════════════════════════════════════════════════

function switchToUploadMode() {
  isLiveMode = false;
  document.getElementById('uploadModeSection').classList.remove('hidden');
  document.getElementById('liveModeSection').classList.add('hidden');
  document.getElementById('uploadModeBtn').className = 'btn btn-primary';
  document.getElementById('liveModeBtn').className = 'btn btn-secondary';
  document.getElementById('analyzeBtn').classList.remove('hidden');
  
  if (videoStream) {
    stopLiveCamera();
  }
}

function handleFiles(files) {
  uploadedFiles = Array.from(files);
  displayPreviews();
  updateSteps(2);
}

function displayPreviews() {
  const container = document.getElementById('previewContainer');
  container.innerHTML = '';
  
  uploadedFiles.forEach((file, index) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const div = document.createElement('div');
      div.className = 'preview-item';
      div.innerHTML = `
        <img src="${e.target.result}" alt="Preview ${index + 1}">
        <button class="preview-remove" onclick="removeFile(${index})">×</button>
      `;
      container.appendChild(div);
    };
    reader.readAsDataURL(file);
  });
}

function removeFile(index) {
  uploadedFiles.splice(index, 1);
  displayPreviews();
}

// ═══════════════════════════════════════════════════════════
// DRAG AND DROP SETUP
// ═══════════════════════════════════════════════════════════

function setupDragAndDrop() {
  const uploadArea = document.getElementById('uploadArea');
  if (!uploadArea) return;
  
  ['dragenter', 'dragover', 'dragleave', 'drop'].forEach(eventName => {
    uploadArea.addEventListener(eventName, preventDefaults, false);
  });

  function preventDefaults(e) {
    e.preventDefault();
    e.stopPropagation();
  }

  ['dragenter', 'dragover'].forEach(eventName => {
    uploadArea.addEventListener(eventName, () => uploadArea.classList.add('drag-over'), false);
  });

  ['dragleave', 'drop'].forEach(eventName => {
    uploadArea.addEventListener(eventName, () => uploadArea.classList.remove('drag-over'), false);
  });

  uploadArea.addEventListener('drop', (e) => {
    const dt = e.dataTransfer;
    const files = dt.files;
    handleFiles(files);
  });
}

// ═══════════════════════════════════════════════════════════
// LIVE CAMERA MODE - IMPROVED
// ═══════════════════════════════════════════════════════════

function switchToLiveMode() {
  isLiveMode = true;
  document.getElementById('uploadModeSection').classList.add('hidden');
  document.getElementById('liveModeSection').classList.remove('hidden');
  document.getElementById('uploadModeBtn').className = 'btn btn-secondary';
  document.getElementById('liveModeBtn').className = 'btn btn-primary';
  document.getElementById('analyzeBtn').classList.add('hidden');
}

async function startLiveCamera(mode) {
  try {
    if (mode) currentFacingMode = mode;

    if (videoStream) {
      if (detectionInterval) {
        clearInterval(detectionInterval);
        detectionInterval = null;
      }
      try {
        videoStream.getTracks().forEach(t => t.stop());
      } catch (e) { }
      videoStream = null;
    }

    const constraints = {
      video: {
        width: { ideal: 1920 },
        height: { ideal: 1080 },
        facingMode: { ideal: currentFacingMode }
      }
    };

    try {
      videoStream = await navigator.mediaDevices.getUserMedia(constraints);
    } catch (err) {
      videoStream = await navigator.mediaDevices.getUserMedia({
        video: {
          width: { ideal: 1920 },
          height: { ideal: 1080 }
        }
      });
    }

    document.getElementById('videoElement').srcObject = videoStream;
    document.getElementById('cameraContainer').classList.remove('hidden');
    document.getElementById('startCameraBtn').classList.add('hidden');
    document.getElementById('stopCameraBtn').classList.remove('hidden');
    
    const flipBtn = document.getElementById('flipCameraBtn');
    if (flipBtn) flipBtn.classList.remove('hidden');

    document.getElementById('detectedCount').textContent = '0';
    document.getElementById('captureCount').textContent = '0';

    // IMPROVED: Slower detection interval for better stability
    detectionInterval = setInterval(performLiveDetection, 2000);  // Every 2 seconds
    updateSteps(2);
  } catch (error) {
    showStatus('Camera access denied. Please ensure:<br>1. iVCam is running<br>2. Phone is connected<br>3. Browser has camera permission<br><br>Error: ' + (error.message || error), 'error');
  }
}

async function performLiveDetection() {
  if (isProcessing) return;
  isProcessing = true;
  
  const video = document.getElementById('videoElement');
  const canvas = document.createElement('canvas');
  canvas.width = video.videoWidth;
  canvas.height = video.videoHeight;
  canvas.getContext('2d').drawImage(video, 0, 0);
  
  canvas.toBlob(async (blob) => {
    try {
      const formData = new FormData();
      formData.append('file', blob, 'frame.jpg');
      const response = await fetch('/detect-live', { method: 'POST', body: formData });
      const data = await response.json();
      
      document.getElementById('detectedCount').textContent = data.unique_defects || 0;
      document.getElementById('captureCount').textContent = data.total_captures || 0;
      
      if (data.new_capture) {
        const badge = document.getElementById('capturedBadge');
        badge.classList.remove('hidden');
        setTimeout(() => badge.classList.add('hidden'), 1000);
      }
    } catch (error) {
      console.error('Detection error:', error);
    } finally {
      isProcessing = false;
    }
  }, 'image/jpeg', 0.9);
}

async function stopLiveCamera() {
  if (detectionInterval) {
    clearInterval(detectionInterval);
    detectionInterval = null;
  }
  
  if (videoStream) {
    videoStream.getTracks().forEach(track => track.stop());
    videoStream = null;
  }
  
  document.getElementById('cameraContainer').classList.add('hidden');
  document.getElementById('startCameraBtn').classList.remove('hidden');
  document.getElementById('stopCameraBtn').classList.add('hidden');
  
  const flipBtn = document.getElementById('flipCameraBtn');
  if (flipBtn) flipBtn.classList.add('hidden');
  
  const captureCount = parseInt(document.getElementById('captureCount').textContent);
  
  if (captureCount > 0) {
    // NEW: Go to review page instead of generating report directly
    await loadCapturedImagesForReview();
  } else {
    showStatus('No defects were detected. Try capturing the vehicle from different angles.', 'error');
    await fetch('/reset-live-detection', { method: 'POST' }).catch(e => console.error(e));
  }
}

async function flipCamera() {
  const btn = document.getElementById('flipCameraBtn');
  const startBtn = document.getElementById('startCameraBtn');
  try {
    if (btn) btn.disabled = true;
    if (startBtn) startBtn.disabled = true;

    currentFacingMode = currentFacingMode === 'environment' ? 'user' : 'environment';

    if (detectionInterval) {
      clearInterval(detectionInterval);
      detectionInterval = null;
    }
    if (videoStream) {
      try {
        videoStream.getTracks().forEach(t => t.stop());
      } catch (e) { }
      videoStream = null;
    }

    await startLiveCamera();
  } catch (err) {
    console.error('Flip error:', err);
    showStatus('Could not flip camera: ' + (err.message || err), 'error');
  } finally {
    if (btn) btn.disabled = false;
    if (startBtn) startBtn.disabled = false;
  }
}

// ═══════════════════════════════════════════════════════════
// IMAGE REVIEW SYSTEM - NEW
// ═══════════════════════════════════════════════════════════

async function loadCapturedImagesForReview() {
  try {
    updateSteps(3);
    showStatus('<span class="spinner"></span>Loading captured images for review...', 'info', 'reviewStatus');
    
    const response = await fetch('/get-captured-images');
    const data = await response.json();
    
    if (data.images && data.images.length > 0) {
      capturedImages = data.images;
      displayReviewPage();
      showPage('review');
    } else {
      showStatus('No images captured. Please try again.', 'error');
    }
  } catch (error) {
    showStatus('Error loading images: ' + error.message, 'error');
  }
}

function displayReviewPage() {
  const grid = document.getElementById('reviewGrid');
  grid.innerHTML = '';
  
  let approvedCount = 0;
  let excludedCount = 0;
  
  capturedImages.forEach((imgData, index) => {
    const isApproved = imgData.approved !== false;
    if (isApproved) approvedCount++;
    else excludedCount++;
    
    const defectsList = imgData.defects.map(d => `${d[0]} (${d[1]}%)`).join(', ');
    
    const div = document.createElement('div');
    div.className = `review-item ${!isApproved ? 'excluded' : ''}`;
    div.id = `review-item-${index}`;
    
    div.innerHTML = `
      <img src="/${imgData.path}" alt="Capture ${index + 1}">
      <div class="review-item-info">
        <div class="review-item-defects">
          <strong>Detected:</strong> ${defectsList || 'No defects'}
        </div>
        <button class="review-item-toggle ${isApproved ? 'included' : 'excluded'}" 
                onclick="toggleImageApproval(${index})">
          ${isApproved ? '✓ Included in Report' : '✕ Excluded from Report'}
        </button>
      </div>
    `;
    
    grid.appendChild(div);
  });
  
  document.getElementById('approvedCount').textContent = approvedCount;
  document.getElementById('excludedCount').textContent = excludedCount;
}

async function toggleImageApproval(index) {
  try {
    const currentStatus = capturedImages[index].approved !== false;
    const newStatus = !currentStatus;
    
    const response = await fetch('/toggle-image-approval', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        index: index,
        approved: newStatus
      })
    });
    
    const data = await response.json();
    
    if (data.success) {
      // Update local state
      capturedImages[index].approved = newStatus;
      
      // Update UI
      const item = document.getElementById(`review-item-${index}`);
      const button = item.querySelector('.review-item-toggle');
      
      if (newStatus) {
        item.classList.remove('excluded');
        button.className = 'review-item-toggle included';
        button.textContent = '✓ Included in Report';
      } else {
        item.classList.add('excluded');
        button.className = 'review-item-toggle excluded';
        button.textContent = '✕ Excluded from Report';
      }
      
      // Update counts
      document.getElementById('approvedCount').textContent = data.approved_count;
      document.getElementById('excludedCount').textContent = 
        capturedImages.length - data.approved_count;
      
      showStatus(`Image ${newStatus ? 'included' : 'excluded'}. Total approved: ${data.approved_count}`, 
                'success', 'reviewStatus');
    }
  } catch (error) {
    showStatus('Error toggling image: ' + error.message, 'error', 'reviewStatus');
  }
}

async function generateFinalReport() {
  const approvedCount = capturedImages.filter(img => img.approved !== false).length;
  
  if (approvedCount === 0) {
    showStatus('Please approve at least one image to generate a report.', 'error', 'reviewStatus');
    return;
  }
  
  const btn = document.getElementById('generateReportBtn');
  btn.disabled = true;
  updateSteps(4);
  showStatus('<span class="spinner"></span>Generating report from approved images...', 'info', 'reviewStatus');
  
  const formData = new FormData();
  formData.append('vin', document.getElementById('vin').value);
  formData.append('make', document.getElementById('make').value);
  formData.append('model', document.getElementById('model').value);
  formData.append('year', document.getElementById('year').value);
  formData.append('mileage', document.getElementById('mileage').value);
  
  try {
    const response = await fetch('/finalize-live-detection', {
      method: 'POST',
      body: formData
    });
    
    const data = await response.json();
    
    if (response.ok) {
      currentResults = data;
      displayResults(data);
      showPage('results');
    } else {
      showStatus('Error: ' + (data.detail || 'Failed to generate report'), 'error', 'reviewStatus');
    }
  } catch (err) {
    showStatus('Network error: ' + err.message, 'error', 'reviewStatus');
  } finally {
    btn.disabled = false;
  }
}

function cancelReview() {
  if (confirm('Cancel review and return? Captured images will be lost.')) {
    fetch('/reset-live-detection', { method: 'POST' }).catch(e => console.error(e));
    showPage('inspection');
    resetInspection();
  }
}

// ═══════════════════════════════════════════════════════════
// UPLOAD MODE ANALYSIS
// ═══════════════════════════════════════════════════════════

async function startAnalysis() {
  if (!isLiveMode && uploadedFiles.length === 0) {
    showStatus('Please upload at least one vehicle photo.', 'error');
    return;
  }

  const btn = document.getElementById('analyzeBtn');
  btn.disabled = true;
  updateSteps(2);
  showStatus(`<span class="spinner"></span>Analyzing ${uploadedFiles.length} image(s) with AI... Please wait...`, 'info');

  const formData = new FormData();
  uploadedFiles.forEach(file => formData.append('files', file));
  formData.append('vin', document.getElementById('vin').value);
  formData.append('make', document.getElementById('make').value);
  formData.append('model', document.getElementById('model').value);
  formData.append('year', document.getElementById('year').value);
  formData.append('mileage', document.getElementById('mileage').value);

  try {
    const response = await fetch('/inspect', {
      method: 'POST',
      body: formData
    });

    const data = await response.json();

    if (response.ok) {
      currentResults = data;
      updateSteps(4);
      displayResults(data);
      showPage('results');
    } else {
      showStatus('Error: ' + (data.detail || 'Inspection failed'), 'error');
    }
  } catch (err) {
    showStatus('Network error: ' + err.message + '. Make sure the server is running!', 'error');
  } finally {
    btn.disabled = false;
  }
}

// ═══════════════════════════════════════════════════════════
// RESULTS DISPLAY
// ═══════════════════════════════════════════════════════════

function displayResults(data) {
  document.getElementById('imageCount').textContent = data.image_count || 0;
  document.getElementById('defectCount').textContent = data.unique_defect_types || 0;
  
  const avgConf = data.defects_detected && data.defects_detected.length > 0
    ? Math.round(data.defects_detected.reduce((sum, d) => sum + d[1], 0) / data.defects_detected.length)
    : 0;
  document.getElementById('confidenceScore').textContent = avgConf + '%';

  const gallery = document.getElementById('resultsGallery');
  gallery.innerHTML = '';
  const timestamp = new Date().getTime();
  
  data.annotated_images.forEach((path, index) => {
    const div = document.createElement('div');
    div.className = 'gallery-item';
    div.innerHTML = `<img src="/${path}?t=${timestamp}" alt="Result ${index + 1}">`;
    gallery.appendChild(div);
  });

  document.getElementById('pdfViewer').src = `/report?t=${timestamp}`;
  
  saveToHistory(data);
}

// ═══════════════════════════════════════════════════════════
// UTILITY FUNCTIONS
// ═══════════════════════════════════════════════════════════

function updateSteps(activeStep) {
  document.querySelectorAll('.step').forEach((step, index) => {
    step.classList.toggle('active', index < activeStep);
  });
}

function showStatus(message, type, containerId = 'statusMessage') {
  const container = document.getElementById(containerId);
  if (container) {
    container.innerHTML = `<div class="status ${type}">${message}</div>`;
    setTimeout(() => container.innerHTML = '', 5000);
  }
}

function resetInspection() {
  uploadedFiles = [];
  capturedImages = [];
  isLiveMode = false;
  document.getElementById('previewContainer').innerHTML = '';
  document.getElementById('fileInput').value = '';
  document.getElementById('vin').value = '';
  document.getElementById('make').value = '';
  document.getElementById('model').value = '';
  document.getElementById('year').value = '';
  document.getElementById('mileage').value = '';
  document.getElementById('statusMessage').innerHTML = '';
  updateSteps(1);
  switchToUploadMode();
  
  if (videoStream) {
    stopLiveCamera();
  }
  
  fetch('/reset-live-detection', { method: 'POST' }).catch(e => console.error(e));
}

async function downloadReport() {
  const link = document.createElement('a');
  link.href = `/report?t=${new Date().getTime()}`;
  link.download = 'AI_Vehicle_Inspection_Report.pdf';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

// ═══════════════════════════════════════════════════════════
// HISTORY MANAGEMENT
// ═══════════════════════════════════════════════════════════

function loadHistory() {
  try {
    const saved = localStorage.getItem('inspectionHistory');
    if (saved) {
      inspectionHistory = JSON.parse(saved);
      updateHistoryBadge();
    }
  } catch (e) {
    console.error('Error loading history:', e);
    inspectionHistory = [];
  }
}

function saveToHistory(data) {
  const inspection = {
    id: Date.now(),
    timestamp: new Date().toISOString(),
    vin: document.getElementById('vin')?.value || 'Not Provided',
    make: document.getElementById('make')?.value || 'Unknown',
    model: document.getElementById('model')?.value || 'Vehicle',
    year: document.getElementById('year')?.value || '',
    mileage: document.getElementById('mileage')?.value || '',
    image_count: data.image_count || 0,
    unique_defect_types: data.unique_defect_types || 0,
    defects_detected: data.defects_detected || [],
    annotated_images: data.annotated_images || []
  };
  
  inspectionHistory.push(inspection);
  
  try {
    localStorage.setItem('inspectionHistory', JSON.stringify(inspectionHistory));
    updateHistoryBadge();
    updateHomeStats();
  } catch (e) {
    console.error('Error saving to history:', e);
  }
}

function updateHistoryBadge() {
  const badge = document.getElementById('historyBadge');
  if (badge) {
    badge.textContent = inspectionHistory.length;
    badge.style.display = inspectionHistory.length > 0 ? 'inline' : 'none';
  }
}

function updateHomeStats() {
  const totalElem = document.getElementById('totalInspections');
  const defectsElem = document.getElementById('totalDefects');
  
  if (totalElem) totalElem.textContent = inspectionHistory.length;
  if (defectsElem) {
    const total = inspectionHistory.reduce((sum, i) => sum + (i.unique_defect_types || 0), 0);
    defectsElem.textContent = total;
  }
}

function renderHistory() {
  const container = document.getElementById('historyContent');
  if (!container) return;
  
  if (inspectionHistory.length === 0) {
    container.innerHTML = `
      <div class="inspection-card" style="text-align: center; padding: 100px 50px;">
        <span style="font-size: 64px;">📦</span>
        <h3 style="margin: 20px 0; color: #cccccc;">No inspections yet</h3>
        <p style="color: #999999; margin-bottom: 30px;">Start your first inspection to see it here</p>
        <button class="btn btn-primary" onclick="showPage('inspection')">New Inspection</button>
      </div>
    `;
    return;
  }

  const html = `
    <div style="display: grid; grid-template-columns: repeat(auto-fill, minmax(350px, 1fr)); gap: 30px;">
      ${inspectionHistory.slice().reverse().map((inspection, idx) => {
        const date = new Date(inspection.timestamp);
        const formattedDate = date.toLocaleDateString('en-US', { 
          month: 'short', 
          day: 'numeric', 
          year: 'numeric' 
        });
        const formattedTime = date.toLocaleTimeString('en-US', { 
          hour: '2-digit', 
          minute: '2-digit' 
        });
        
        const avgConf = inspection.defects_detected && inspection.defects_detected.length > 0
          ? Math.round(inspection.defects_detected.reduce((sum, d) => sum + d[1], 0) / inspection.defects_detected.length)
          : 0;
        
        return `
          <div style="background: rgba(255, 255, 255, 0.03); border: 2px solid rgba(255, 255, 255, 0.1); border-radius: 16px; overflow: hidden; transition: all 0.3s; cursor: pointer;" 
               onmouseover="this.style.borderColor='#ffffff'; this.style.transform='translateY(-5px)'" 
               onmouseout="this.style.borderColor='rgba(255, 255, 255, 0.1)'; this.style.transform='translateY(0)'"
               onclick="viewHistoryInspection(${idx})">
            ${inspection.annotated_images && inspection.annotated_images.length > 0 ? 
              `<img src="/${inspection.annotated_images[0]}" style="width: 100%; height: 200px; object-fit: cover;">` 
              : '<div style="width: 100%; height: 200px; background: #333; display: flex; align-items: center; justify-content: center; color: #999;">No Image</div>'}
            <div style="padding: 20px;">
              <div style="display: flex; justify-content: space-between; margin-bottom: 10px;">
                <div>
                  <div style="font-size: 18px; font-weight: 700; color: #ffffff;">${inspection.make} ${inspection.model}</div>
                  <div style="font-size: 12px; color: #999999; margin-top: 5px;">${formattedDate} at ${formattedTime}</div>
                </div>
              </div>
              <div style="font-size: 13px; color: #cccccc; margin-bottom: 15px;">
                ${inspection.vin !== 'Not Provided' ? `VIN: ${inspection.vin.substring(0, 10)}...` : 'No VIN'} ${inspection.year ? ` • ${inspection.year}` : ''}
              </div>
              <div style="display: grid; grid-template-columns: repeat(3, 1fr); gap: 10px; margin: 15px 0;">
                <div style="text-align: center; padding: 10px; background: rgba(255, 255, 255, 0.05); border-radius: 8px;">
                  <div style="font-size: 20px; font-weight: 700; color: #ffffff;">${inspection.image_count}</div>
                  <div style="font-size: 10px; color: #999999; text-transform: uppercase; margin-top: 5px;">Images</div>
                </div>
                <div style="text-align: center; padding: 10px; background: rgba(255, 255, 255, 0.05); border-radius: 8px;">
                  <div style="font-size: 20px; font-weight: 700; color: #ffffff;">${inspection.unique_defect_types}</div>
                  <div style="font-size: 10px; color: #999999; text-transform: uppercase; margin-top: 5px;">Defects</div>
                </div>
                <div style="text-align: center; padding: 10px; background: rgba(255, 255, 255, 0.05); border-radius: 8px;">
                  <div style="font-size: 20px; font-weight: 700; color: #ffffff;">${avgConf}%</div>
                  <div style="font-size: 10px; color: #999999; text-transform: uppercase; margin-top: 5px;">Confidence</div>
                </div>
              </div>
              <div style="display: flex; gap: 10px; margin-top: 15px;" onclick="event.stopPropagation()">
                <button style="flex: 1; padding: 10px; background: rgba(255, 255, 255, 0.05); border: 1px solid rgba(255, 255, 255, 0.1); color: #ffffff; border-radius: 8px; cursor: pointer; font-size: 12px; font-weight: 600;" 
                        onmouseover="this.style.background='rgba(255, 255, 255, 0.1)'; this.style.borderColor='#ffffff'" 
                        onmouseout="this.style.background='rgba(255, 255, 255, 0.05)'; this.style.borderColor='rgba(255, 255, 255, 0.1)'"
                        onclick="viewHistoryInspection(${idx})">View</button>
                <button style="flex: 1; padding: 10px; background: rgba(255, 255, 255, 0.05); border: 1px solid rgba(255, 255, 255, 0.1); color: #ffffff; border-radius: 8px; cursor: pointer; font-size: 12px; font-weight: 600;" 
                        onmouseover="this.style.background='rgba(255, 255, 255, 0.1)'; this.style.borderColor='#ffffff'" 
                        onmouseout="this.style.background='rgba(255, 255, 255, 0.05)'; this.style.borderColor='rgba(255, 255, 255, 0.1)'"
                        onclick="deleteHistoryInspection(${inspection.id})">Delete</button>
              </div>
            </div>
          </div>
        `}).join('')}
    </div>
  `;
  
  container.innerHTML = html;
}

function viewHistoryInspection(index) {
  const inspection = inspectionHistory.slice().reverse()[index];
  if (inspection) {
    currentResults = inspection;
    displayResults(inspection);
    showPage('results');
  }
}

function deleteHistoryInspection(id) {
  if (confirm('Delete this inspection?')) {
    inspectionHistory = inspectionHistory.filter(i => i.id !== id);
    localStorage.setItem('inspectionHistory', JSON.stringify(inspectionHistory));
    renderHistory();
    updateHistoryBadge();
    updateHomeStats();
  }
}

function clearHistory() {
  if (confirm('Clear all inspection history? This cannot be undone.')) {
    inspectionHistory = [];
    localStorage.removeItem('inspectionHistory');
    renderHistory();
    updateHistoryBadge();
    updateHomeStats();
  }
}

// ═══════════════════════════════════════════════════════════
// INITIALIZATION
// ═══════════════════════════════════════════════════════════

document.addEventListener('DOMContentLoaded', function() {
  loadHistory();
  updateHomeStats();
  setupDragAndDrop();
});