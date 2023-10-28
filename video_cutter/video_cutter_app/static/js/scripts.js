const videoUploadInput = document.getElementById('video-upload-input');
const chooseVideoButton = document.getElementById('choose-video-button');
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

    // Exibir o contêiner de corte quando houver vídeo
    cutFormContainer.style.display = 'block';
    cutVideoButton.style.display = 'block';
    addCutFormButton.style.display = 'block';

     // Adicionar classe de centralização
     const chooseFileDiv = document.querySelector('.choose-file');
     const videoChooseDiv = document.querySelector('.video-choose');
     chooseFileDiv.classList.remove('center-button');
     videoChooseDiv.classList.remove('center-button');
});






applyRemoveCutFormButtonListener();


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


   

    // Reaplicar ouvinte de evento para todos os botões "Remover Corte"
    applyRemoveCutFormButtonListener();
});




// Função para aplicar ouvinte de evento para botões "Remover Corte"

function applyRemoveCutFormButtonListener() {
    const removeCutFormButtons = document.querySelectorAll('.remove-cut-form-button');
    const cutFormItems = document.querySelectorAll('.cut-form-item');
    const cutFormContainer = document.getElementById('cut-form-container');

    console.log("cutFormItems antes " + cutFormItems.length)
            
    //console.log("cutVideoButton antes "+cutVideoButton.length)
    removeCutFormButtons.forEach(button => {
        
        button.addEventListener('click', function () {
            const cutFormItems = document.querySelectorAll('.cut-form-item');

            console.log("cutFormItems depois " + cutFormItems.length)
            
            // console.log("cutVideoButton depois "+cutVideoButton.length)

            // Verifique se há mais de um .cut-form-item
            if (cutFormItems.length > 1) {
                // Encontre o elemento pai .cut-form-item do botão clicado
                const cutFormItem = button.closest('.cut-form-item');
                if (cutFormItem) {
                    // Remova o .cut-form-item correspondente
                    cutFormItem.remove();
                    return;
                }
            } else {
                alert("Você não pode excluir o único corte.");
                return;
            }
        });
    });
}


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

// Abra o modal quando o botão "Cortar Vídeo" for clicado

const loadingModal = document.getElementById('loading-modal');
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
        loadingModal.style.display = 'block';
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
                loadingModal.style.display = 'none';
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
                loadingModal.style.display = 'none';
            });
    } else {
        alert("Preencha todos os campos de início e fim antes de cortar o vídeo.");
    }
});


