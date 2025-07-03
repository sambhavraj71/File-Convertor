document.getElementById('conversionType').addEventListener('change', function () {
  const type = this.value;
  const input = document.getElementById('fileInput');
  const pageOpts = document.getElementById('pageOptions');

  // Reset multiple files and page options
  input.multiple = type === 'merge-pdf';
  pageOpts.style.display = type === 'extract-pdf' ? 'block' : 'none';
  
  // Update file input accept attribute based on conversion type
  if (type === 'pdf-to-word' || type === 'pdf-to-jpg' || type === 'merge-pdf' || type === 'extract-pdf') {
    input.accept = '.pdf';
  } else if (type === 'image-to-pdf') {
    input.accept = 'image/*';
  } else {
    input.accept = '';
  }
});

document.getElementById('converterForm').addEventListener('submit', async function (e) {
  e.preventDefault();
  const formData = new FormData();
  const type = document.getElementById('conversionType').value;
  const input = document.getElementById('fileInput');
  const status = document.getElementById('status');
  const downloadArea = document.getElementById('downloadArea');
  const progressContainer = document.getElementById('progressContainer');
  const progressBar = document.getElementById('progressBar');
  const convertBtn = document.getElementById('convertBtn');
  const files = input.files;

  // Reset UI
  status.className = '';
  status.innerText = '';
  downloadArea.innerHTML = '';
  progressBar.style.width = '0%';
  progressContainer.style.display = 'none';
  convertBtn.disabled = true;

  if (!files.length) {
    status.className = 'error';
    status.innerText = '❌ Please select file(s)';
    convertBtn.disabled = false;
    return;
  }

  // Validate page numbers for PDF extraction
  if (type === 'extract-pdf') {
    const startPage = parseInt(document.getElementById('startPage').value);
    const endPage = parseInt(document.getElementById('endPage').value);
    
    if (isNaN(startPage) || isNaN(endPage) || startPage <= 0 || endPage <= 0 || startPage > endPage) {
      status.className = 'error';
      status.innerText = '❌ Please enter valid page numbers';
      convertBtn.disabled = false;
      return;
    }
  }

  // Prepare form data
  if (type === 'merge-pdf') {
    for (let f of files) formData.append('files', f);
  } else {
    formData.append('file', files[0]);
  }

  if (type === 'extract-pdf') {
    formData.append('start', document.getElementById('startPage').value);
    formData.append('end', document.getElementById('endPage').value);
  }

  // Show progress
  status.className = 'uploading';
  status.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Uploading and Converting...';
  progressContainer.style.display = 'block';

  // Simulate progress (in a real app, you'd use actual upload progress events)
  let progress = 0;
  const progressInterval = setInterval(() => {
    progress += Math.random() * 10;
    if (progress >= 90) clearInterval(progressInterval);
    progressBar.style.width = `${Math.min(progress, 90)}%`;
  }, 300);

  try {
    const res = await fetch(`http://localhost:5000/convert/${type}`, {
      method: 'POST',
      body: formData
    });

    clearInterval(progressInterval);
    progressBar.style.width = '100%';

    const json = await res.json();
    console.log('Server response:', json);

    if (json.status === 'success') {
      status.className = 'success';
      status.innerHTML = '<i class="fas fa-check-circle"></i> Conversion Complete!';

      // Create download buttons
      if (json.filename) {
        createDownloadButton(json.filename, downloadArea);
      } else if (json.filenames) {
        json.filenames.forEach(name => {
          createDownloadButton(name, downloadArea);
        });
      }
    } else {
      status.className = 'error';
      status.innerHTML = `<i class="fas fa-exclamation-circle"></i> Error: ${json.message}`;
    }
  } catch (err) {
    console.error('Fetch error:', err);
    status.className = 'error';
    status.innerHTML = '<i class="fas fa-exclamation-circle"></i> Failed to connect to backend';
  } finally {
    convertBtn.disabled = false;
  }
});

function createDownloadButton(filename, container) {
  const fileExt = filename.split('.').pop().toUpperCase();
  const fileSize = Math.floor(Math.random() * 5000) + 100; // Simulated file size
  
  const fileInfo = document.createElement('div');
  fileInfo.className = 'file-info';
  fileInfo.innerHTML = `
    <div>
      <i class="fas fa-file-alt"></i> ${filename}
      <span class="file-meta">${fileSize} KB • ${fileExt}</span>
    </div>
  `;
  
  const downloadBtn = document.createElement('a');
  downloadBtn.className = 'download-btn';
  downloadBtn.href = `http://localhost:5000/download/${filename}`;
  downloadBtn.download = filename;
  downloadBtn.innerHTML = `<i class="fas fa-download"></i> Download`;
  downloadBtn.target = '_blank';
  
  // Add click handler to track downloads
  downloadBtn.addEventListener('click', () => {
    console.log(`Downloading ${filename}`);
    // In a real app, you might send analytics here
  });
  
  const downloadContainer = document.createElement('div');
  downloadContainer.appendChild(fileInfo);
  downloadContainer.appendChild(downloadBtn);
  container.appendChild(downloadContainer);
}