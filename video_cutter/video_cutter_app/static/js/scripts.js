const videoUploadInput = document.getElementById('video-upload-input');
const chooseVideoButton = document.getElementById('choose-video-button');
const videoPlayer = document.getElementById('video-player');
const cutFormContainer = document.getElementById('cut-form-container');
const cutForm = document.getElementById('cut-form');
const cutVideoButton = document.getElementById('cut-video-button');
const addCutFormButton = document.getElementById('add-cut-form');

chooseVideoButton.addEventListener('click', function () {
    videoUploadInput.click();
});

videoUploadInput.addEventListener('change', function () {
    const file = this.files[0];
    const videoURL = URL.createObjectURL(file);
    videoPlayer.src = videoURL;
    videoPlayer.style.display = 'block';

    // Exibir o contêiner de corte quando houver vídeo
    cutFormContainer.style.display = 'block';
    cutVideoButton.style.display = 'block';
    addCutFormButton.style.display = 'block';
});

cutVideoButton.addEventListener('click', function () {
    // Lógica para cortar o vídeo com os valores de startInputs e endInputs
    const startInputs = document.querySelectorAll('.start-time');
    const endInputs = document.querySelectorAll('.end-time');
    // Execute a lógica de corte aqui
});

cutForm.addEventListener('click', function (event) {
    if (event.target.classList.contains('remove-cut-form')) {
        // Obter todos os elementos de corte
        const cutFormItems = document.querySelectorAll('.cut-form-item');

        // Verificar se há mais de um elemento de corte
        if (cutFormItems.length > 1) {
            // Remover o cut-form-item correspondente ao botão "Remover Corte" clicado
            const cutFormItem = event.target.parentElement;
            cutForm.removeChild(cutFormItem);
        }
        else {
            // Mostrar um alert
            alert('Você não pode excluir o único corte.');
        }
    }
});

addCutFormButton.addEventListener('click', function () {
    // Clonar o primeiro cut-form-item e adicionar após o último
    const cutFormItems = document.querySelectorAll('.cut-form-item');
    const newCutFormItem = cutFormItems[0].cloneNode(true);

    // Limpar os campos de entrada no novo corte
    const startInput = newCutFormItem.querySelector('.start-time');
    const endInput = newCutFormItem.querySelector('.end-time');
    startInput.value = "";
    endInput.value = "";

    cutForm.appendChild(newCutFormItem);

    // Adicionar ouvinte de evento input para o novo corte
    startInput.addEventListener('input', function () {
        formatTimeInput(startInput);
    });

    endInput.addEventListener('input', function () {
        formatTimeInput(endInput);
    });
});

// Função para formatar os campos de entrada como HH:mm:ss
function formatTimeInput(input) {
    let value = input.value.replace(/\D/g, ''); // Remove caracteres não numéricos
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

// Adicionar ouvintes de evento para formatar entrada de tempo
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


//envia os dados para o python
cutVideoButton.addEventListener('click', function (event) {
    event.preventDefault();

    const videoFile = videoUploadInput.files[0];

    // Obter todas as entradas de início (start) e fim (end)
    const startInputs = document.querySelectorAll('.start-time');
    const endInputs = document.querySelectorAll('.end-time');


    if (Array.from(startInputs).every(input => input.value.trim() !== '') &&
        Array.from(endInputs).every(input => input.value.trim() !== '')) {

        const cuts = [];

        // Iterar pelas entradas para obter os valores
        startInputs.forEach((startInput, index) => {
            const inicio = startInput.value;
            const fim = endInputs[index].value;

            cuts.push({
                start: inicio,
                end: fim,
            });
        });

        // Criar um objeto com os cortes e o arquivo de vídeo
        const csrfToken = document.querySelector("[name=csrfmiddlewaretoken]").value;
        const videoData = {
            csrfmiddlewaretoken: csrfToken,
            video: videoFile,
            cuts: cuts,
        };

        // Criar uma nova instância do objeto FormData
        const formData = new FormData();

        // Adicionar o token CSRF ao FormData
        formData.append('csrfmiddlewaretoken', csrfToken);

        // Adicionar o arquivo de vídeo ao FormData
        formData.append('video', videoFile);

        // Adicionar os cortes como JSON ao FormData
        formData.append('cuts', JSON.stringify(cuts));

        // Enviar o objeto FormData para o servidor
        fetch('/process_video', {
            method: 'POST',
            body: formData,
        })
            .then(response => response.json())
            .then(data => {
                if (data.message === 'Operação concluída com sucesso') {
                    // Redirecionar para a página "results"
                    window.location.href = '/results';
                } else {
                    alert('Erro no processamento.');
                }
            })
            .catch(error => {
                console.error('Erro na solicitação:', error);
                alert('Erro na solicitação:', error);
            });
    } else {
        alert("Preencha todos os campos de início e fim antes de cortar o vídeo.");
    }
});
