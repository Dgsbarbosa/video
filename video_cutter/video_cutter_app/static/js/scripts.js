const videoUploadInput = document.getElementById('video-upload-input');
const chooseVideoButton = document.getElementById('choose-video-button');
const downloadUrlVideo = document.getElementById('download-video-button');
const videoPlayer = document.getElementById('video-player');
const cutFormContainer = document.getElementById('cut-form-container');
const cutForm = document.getElementById('cut-form');
const cutVideoButton = document.getElementById('cut-video-button');
const addCutFormButton = document.getElementById('add-cut-form');
const removeCutFormButtons = document.querySelectorAll('.remove-cut-form-button');

chooseVideoButton.addEventListener('click', function () {
    videoUploadInput.click();
});

videoUploadInput.addEventListener('change', function () {
    const file = this.files[0];
    const videoURL = URL.createObjectURL(file);
    videoPlayer.src = videoURL;
    videoPlayer.style.display = 'block';
    cutFormContainer.style.display = 'block';
    cutVideoButton.style.display = 'block';
    addCutFormButton.style.display = 'block';
    const chooseFileDiv = document.getElementById("choose-file");
    chooseFileDiv.style.display = "none";
});

applyRemoveCutFormButtonListener();

addCutFormButton.addEventListener('click', function () {
    const cutFormItems = document.querySelectorAll('.cut-form-item');
    const newCutFormItem = cutFormItems[0].cloneNode(true);
    const startInput = newCutFormItem.querySelector('.start-time');
    const endInput = newCutFormItem.querySelector('.end-time');
    startInput.value = "";
    endInput.value = "";
    cutForm.appendChild(newCutFormItem);
    startInput.addEventListener('input', function () {
        formatTimeInput(startInput);
    });
    endInput.addEventListener('input', function () {
        formatTimeInput(endInput);
    });
    applyRemoveCutFormButtonListener();
});

function applyRemoveCutFormButtonListener() {
    const removeCutFormButtons = document.querySelectorAll('.remove-cut-form-button');
    const cutFormItems = document.querySelectorAll('.cut-form-item');
    const cutFormContainer = document.getElementById('cut-form-container');
    removeCutFormButtons.forEach(button => {
        button.addEventListener('click', function () {
            const cutFormItems = document.querySelectorAll('.cut-form-item');
            if (cutFormItems.length > 1) {
                const cutFormItem = button.closest('.cut-form-item');
                if (cutFormItem) {
                    cutFormItem.remove();
                }
            } else {
                alert("Você não pode excluir o único corte.");
            }
        });
    });
}

function formatTimeInput(input) {
    let value = input.value.replace(/\D/g, '');
    const formattedValue = [];
    if (value.length > 2) {
        formattedValue.push(value.slice(0, 2));
        value = value.slice(2);
    }
    if (value.length > 2) {
        formattedValue.push(value.slice(0, 2));
        value = value.slice(2);
    }
    if (value.length > 0) {
        formattedValue.push(value);
    }
    input.value = formattedValue.join(':').substring(0, 8);
}

const startInputs = document.querySelectorAll('.start-time');
const endInputs = document.querySelectorAll('.end-time');

startInputs.forEach(input => {
    input.addEventListener('input', function () {
        formatTimeInput(input);
    });
});

endInputs.forEach(input => {
    input.addEventListener('input', function () {
        formatTimeInput(input);
    });
});

const loadingModal = document.getElementById('loading-modal');

function getVideoDuration(video) {
    return new Promise((resolve, reject) => {
        const videoElement = document.createElement('video');
        videoElement.src = URL.createObjectURL(video);
        videoElement.addEventListener('loadedmetadata', () => {
            const duration = videoElement.duration;
            resolve(duration.toFixed(2));
        });
    });
};

function formatTime(seconds) {
    let hrs = Math.floor(seconds / 3600);
    let mins = Math.floor((seconds % 3600) / 60);
    let secs = seconds % 60;
    return `${hrs.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
}

function cutVideoOption(durationPerVideo, durationTotal) {
    let cortes = [];
    for (let i = 0; i < durationTotal; i += durationPerVideo) {
        let inicio = i;
        let fim = i + durationPerVideo > durationTotal ? durationTotal : i + durationPerVideo;
        cortes.push({ start: formatTime(Math.floor(inicio)), end: formatTime(Math.floor(fim)) });
    }
    return cortes;
}


async function automaticCuts(video) {
    let cuts = [];
    let durationTotal = await getVideoDuration(video);
    let validOption = false;

    while (!validOption) {
        const choice = prompt("Escolha como dividir o vídeo:\n\n1. Dividir em quantas partes?\n2. Escolher a duração de cada vídeo (em segundos)\n3. Sair?");
        if (choice === "1") {
            const parts = parseInt(prompt("Quantas partes você deseja dividir o vídeo?"));
            if (!isNaN(parts) && parts > 0) {
                const durationPerVideo = durationTotal / parts;
                cuts = cutVideoOption(durationPerVideo, durationTotal);
                validOption = true;
            } else {
                alert("Por favor, insira um número válido de partes.");
            }
        } else if (choice === "2") {
            const duration = parseFloat(prompt("Qual a duração desejada de cada vídeo (em segundos)?"));
            if (!isNaN(duration) && duration > 0 && duration < parseFloat(durationTotal)) {
                cuts = cutVideoOption(duration, durationTotal);
                validOption = true;
            } else {
                alert("Escolha um valor válido.");
            }
        } else if (choice === "3") {
            window.location.href = '/';
            break;
        } else {
            alert("Escolha inválida.");
        }
    }
    return cuts;
}

cutVideoButton.addEventListener('click', async function (event) {
    event.preventDefault();
    const videoFile = videoUploadInput.files[0];
    const startInputs = document.querySelectorAll('.start-time');
    const endInputs = document.querySelectorAll('.end-time');
    let cuts = [];
    loadingModal.style.display = 'block';
    const csrfToken = document.querySelector("[name=csrfmiddlewaretoken]").value;

    if (Array.from(startInputs).every(input => input.value.trim() !== '') &&
        Array.from(endInputs).every(input => input.value.trim() !== '')) {
        startInputs.forEach((startInput, index) => {
            const inicio = startInput.value;
            const fim = endInputs[index].value;
            cuts.push({ start: inicio, end: fim });
        });
    } else {
        cuts = await automaticCuts(videoFile);
    }

    const formData = new FormData();
    formData.append('csrfmiddlewaretoken', csrfToken);
    formData.append('video', videoFile);
    formData.append('cuts', JSON.stringify(cuts));

    fetch('/process_video', {
        method: 'POST',
        body: formData,
    })
    .then(response => response.json())
    .then(data => {
        loadingModal.style.display = 'none';
        if (data.message === 'Ok') {
            window.location.href = '/results';
        } else {
            alert('Erro no processamento.');
        }
    })
    .catch(error => {
        console.error('Erro na solicitação:', error);
        alert('Erro na solicitação:', error);
        loadingModal.style.display = 'none';
    });
});
