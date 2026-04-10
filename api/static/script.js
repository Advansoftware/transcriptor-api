document.addEventListener('DOMContentLoaded', () => {
    const dropZone = document.getElementById('drop-zone');
    const fileInput = document.getElementById('file-input');
    const apiStatus = document.getElementById('api-status');
    const resultSection = document.getElementById('result-section');
    const transcriptionText = document.getElementById('transcription-text');
    const transcriptionDuration = document.getElementById('transcription-duration');
    const transcriptionLang = document.getElementById('transcription-lang');
    const progressContainer = document.getElementById('progress-container');
    const progressText = document.getElementById('progress-text');
    const progressBar = document.getElementById('progress-bar');
    const btnCopy = document.getElementById('btn-copy');
    const apiKeyInput = document.getElementById('api-key-input');
    const modelSelect = document.getElementById('model-select');
    const transcriptionModel = document.getElementById('transcription-model');

    // Load saved API Key
    if (localStorage.getItem('whisper_api_key')) {
        apiKeyInput.value = localStorage.getItem('whisper_api_key');
    }

    // Check API Status
    async function checkStatus() {
        try {
            const response = await fetch('/status');
            if (response.ok) {
                const data = await response.json();
                apiStatus.querySelector('.status-text').textContent = 'Online';
                apiStatus.querySelector('.dot').classList.remove('offline');
            }
        } catch (err) {
            apiStatus.querySelector('.status-text').textContent = 'Offline';
            apiStatus.querySelector('.dot').classList.add('offline');
            apiStatus.querySelector('.dot').classList.remove('pulse');
        }
    }

    async function loadModels() {
        try {
            const response = await fetch('/models');
            if (response.ok) {
                const data = await response.json();
                modelSelect.innerHTML = data.models.map(m => 
                    `<option value="${m}" ${m === (data.current || 'base') ? 'selected' : ''}>Modelo: ${m}</option>`
                ).join('');
            }
        } catch (err) {
            console.error('Erro ao carregar modelos:', err);
        }
    }

    checkStatus();
    loadModels();

    // Drag and Drop Logic
    dropZone.addEventListener('dragover', (e) => {
        e.preventDefault();
        dropZone.classList.add('dragging');
    });

    ['dragleave', 'dragend'].forEach(type => {
        dropZone.addEventListener(type, () => {
            dropZone.classList.remove('dragging');
        });
    });

    dropZone.addEventListener('drop', (e) => {
        e.preventDefault();
        dropZone.classList.remove('dragging');
        const files = e.dataTransfer.files;
        if (files.length > 0) {
            handleUpload(files[0]);
        }
    });

    fileInput.addEventListener('change', (e) => {
        if (e.target.files.length > 0) {
            handleUpload(e.target.files[0]);
        }
    });

    async function handleUpload(file) {
        // Reset UI
        resultSection.style.display = 'none';
        progressContainer.style.display = 'block';
        dropZone.querySelector('.drop-content').style.display = 'none';
        progressBar.style.width = '10%';
        progressText.textContent = 'Enviando arquivo...';

        const formData = new FormData();
        formData.append('file', file);
        formData.append('model', modelSelect.value);

        // Save key for next time
        localStorage.setItem('whisper_api_key', apiKeyInput.value);

        try {
            // Fake progress animation for processing
            let progress = 10;
            const interval = setInterval(() => {
                if (progress < 90) {
                    progress += 2;
                    progressBar.style.width = `${progress}%`;
                    if (progress > 30) progressText.textContent = 'IA transcrevendo áudio...';
                    if (progress > 70) progressText.textContent = 'Finalizando transcrição...';
                }
            }, 500);

            const response = await fetch('/transcribe', {
                method: 'POST',
                headers: {
                    'X-API-Key': apiKeyInput.value
                },
                body: formData
            });

            clearInterval(interval);
            progressBar.style.width = '100%';

            if (response.ok) {
                const data = await response.json();
                showResult(data);
            } else {
                const error = await response.json();
                alert('Erro: ' + (error.detail || 'Falha na transcrição'));
                resetUploadArea();
            }
        } catch (err) {
            alert('Erro de conexão com a API');
            resetUploadArea();
        }
    }

    function showResult(data) {
        transcriptionText.textContent = data.text;
        transcriptionDuration.innerText = `${data.duration}s de processamento`;
        transcriptionModel.innerText = `Modelo: ${data.model.toUpperCase()}`;
        transcriptionLang.innerText = `Idioma: ${data.language.toUpperCase()} (${Math.round(data.language_probability * 100)}%)`;
        
        resultSection.style.display = 'block';
        resetUploadArea();
        
        // Scroll to result
        resultSection.scrollIntoView({ behavior: 'smooth' });
    }

    function resetUploadArea() {
        progressContainer.style.display = 'none';
        dropZone.querySelector('.drop-content').style.display = 'flex';
        progressBar.style.width = '0%';
        fileInput.value = '';
    }

    // Copy to clipboard
    btnCopy.addEventListener('click', () => {
        navigator.clipboard.writeText(transcriptionText.textContent);
        
        const originalIcon = btnCopy.innerHTML;
        btnCopy.innerHTML = '<i data-lucide="check"></i>';
        lucide.createIcons();
        
        setTimeout(() => {
            btnCopy.innerHTML = originalIcon;
            lucide.createIcons();
        }, 2000);
    });
    // Tab Switching Logic
    const tabBtns = document.querySelectorAll('.tab-btn');
    const tabContents = document.querySelectorAll('.tab-content');

    tabBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            const target = btn.dataset.tab;

            tabBtns.forEach(b => b.classList.remove('active'));
            tabContents.forEach(c => c.classList.remove('active'));

            btn.classList.add('active');
            document.getElementById(target).classList.add('active');
        });
    });
});
