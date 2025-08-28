// script.js

document.addEventListener('DOMContentLoaded', () => {

    // --- CONFIGURAÇÕES E CONSTANTES ---
    const config = {
        webhookURL: 'https://vendas-n8n.dttlw7.easypanel.host/webhook-test/filmes',
        finalRedirectURL: 'https://drive.google.com/file/d/1BKrnqryfyJmaMnD6Wv6MUEthSnnaLEfB/view?usp=sharing',
        backgroundMusicPath: 'musica.mp3',
        finalVideoPath: 'loading-video.mp4',
        finalVideoDuration: 30, // em segundos
    };

    const validationRegex = {
        name: /^[a-zA-ZáàãâéèêíìóòõôúùçÇÁÀÃÂÉÈÊÍÌÓÒÕÔÚÙ\s'-]{3,}$/,
        phone: /^\(?(?:[1-9][0-9])\)?\s?9?\d{4,5}-?\d{4}$/,
        email: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
    };
    
    // --- ESTRUTURA DA JORNADA ---
    const journey = [
        { type: 'multiple-choice', name: "etapa_1_engajamento", image: "imagem01.png", options: [ { text: "Achar alguém com exatamente o mesmo gosto que eu.", value: 2 }, { text: "Conseguir combinar um horário com meus amigos.", value: 1 }, { text: "Decidir qual filme assistir no meio de tantas opções.", value: 0 } ] },
        { type: 'text-input', name: 'nome', image: 'imagem02.png', question: 'Entendido. Para continuarmos, qual seu nome?', validation: validationRegex.name },
        { type: 'text-input', name: 'email', image: 'imagem03.png', question: 'Obrigado. Agora, seu melhor e-mail.', validation: validationRegex.email },
        { type: 'text-input', name: 'telefone', image: 'imagem04.png', question: 'Perfeito. E para finalizar, seu telefone.', validation: validationRegex.phone },
        { type: 'multiple-choice', name: "etapa_2_solucao", image: "imagem05.png", options: [ { text: "Conhecer pessoas novas que são apaixonadas pelos mesmos filmes que eu.", value: 2 }, { text: "Ter um jeito fácil de me conectar com meus amigos que moram longe.", value: 1 }, { text: "Participar de debates e descobrir filmes que eu não conheceria sozinho.", value: 0 } ] },
        { type: 'multiple-choice', name: "etapa_3_disponibilidade", image: "imagem06.png", options: [ { text: "Uma sessão mais íntima e privada, com um pequeno grupo de amigos.", value: 2 }, { text: "Um grande evento online para um lançamento, com muita gente comentando.", value: 1 }, { text: "Um 'match' um a um, para um encontro de filme mais focado.", value: 0 } ] },
        { type: 'multiple-choice', name: "etapa_4_investimento", image: "imagem07.png", options: [ { text: "Chat de texto para mandar reações e comentários rápidos.", value: 2 }, { text: "Foco total no filme, com os comentários e debates apenas no final.", value: 1 }, { text: "Chat de voz para sentir que estamos todos juntos no mesmo sofá.", value: 0 } ] },
        { type: 'multiple-choice', name: "etapa_5_implementacao", image: "imagem08.png", options: [ { text: "Sessões com debates mediados por críticos ou especialistas no assunto.", value: 2 }, { text: "Um sistema de recomendação super inteligente para achar minha 'alma gêmea' de filmes.", value: 1 }, { text: "Acesso exclusivo a um catálogo de filmes clássicos ou difíceis de encontrar.", value: 0 } ] },
        { type: 'multiple-choice', name: "etapa_6_concorrencia", image: "imagem09.png", options: [ { text: "Saber na hora quem dos meus amigos está livre para ver um filme comigo.", value: 2 }, { text: "Um botão 'Me Surpreenda' que sempre escolhe o filme perfeito para o meu humor.", value: 1 }, { text: "Ver estatísticas e gráficos divertidos sobre todos os filmes que já assisti.", value: 0 } ] },
        { type: 'multiple-choice', name: "etapa_7_decisao", image: "imagem10.png", options: [ { text: "Eu preciso disso para ontem! Onde eu me inscrevo?", value: 2 }, { text: "Parece uma ideia excelente, quero muito acompanhar de perto.", value: 1 }, { text: "É interessante, estou curioso(a) para ver como vai funcionar.", value: 0 } ] }
    ];

    // --- ELEMENTOS DA UI (CACHE) ---
    const ui = {
        interactionContainer: document.getElementById('interaction-container'),
        messageContainer: document.getElementById('message-container'),
        optionsContainer: document.getElementById('options-container'),
        inputArea: document.getElementById('input-area'),
        userInput: document.getElementById('user-input'),
        imageBg1: document.getElementById('image-bg-1'),
        imageBg2: document.getElementById('image-bg-2'),
        backgroundMusic: document.getElementById('background-music'),
        backBtn: document.getElementById('back-btn'),
        audioBtn: document.getElementById('audio-btn'),
        advanceBtn: document.getElementById('advance-btn'),
    };

    // --- ESTADO DA APLICAÇÃO ---
    let state = {
        currentStepIndex: 0,
        userAnswers: {},
        isProcessing: false,
        activeImage: ui.imageBg1,
        inactiveImage: ui.imageBg2,
        imageHistory: [],
        appStatus: 'JOURNEY',
    };

    /**
     * Pré-carrega todos os ativos de mídia para uma experiência fluida.
     */
    const preloadAssets = async () => {
        const imageSources = journey.map(step => step.image).filter(Boolean);
        const mediaPromises = imageSources.map(src => new Promise((resolve) => {
            const img = new Image();
            img.src = src;
            img.onload = resolve;
            img.onerror = resolve; // Resolve mesmo em caso de erro para não travar
        }));

        // Adiciona a promessa de carregamento do vídeo final
        if (config.finalVideoPath) {
             mediaPromises.push(new Promise((resolve) => {
                const video = document.createElement('video');
                video.src = config.finalVideoPath;
                video.oncanplaythrough = resolve;
                video.onerror = resolve;
            }));
        }

        await Promise.all(mediaPromises);
    };

    /**
     * Atualiza a imagem de fundo com um efeito de fade.
     * @param {string} newSrc - O caminho da nova imagem.
     */
    const updateImage = (newSrc) => {
        return new Promise(resolve => {
            if (!newSrc || state.activeImage.src.endsWith(newSrc)) {
                return resolve();
            }

            state.inactiveImage.src = newSrc;
            state.inactiveImage.onload = () => {
                state.activeImage.classList.remove('active');
                state.inactiveImage.classList.add('active');
                [state.activeImage, state.inactiveImage] = [state.inactiveImage, state.activeImage]; // Swap
                // O tempo de espera deve ser igual à transição do CSS
                setTimeout(resolve, 800);
            };
            state.inactiveImage.onerror = () => {
                console.error(`ERRO: Não foi possível carregar a imagem "${newSrc}".`);
                resolve();
            };
        });
    };

    /**
     * Renderiza o passo atual da jornada.
     */
    const renderStep = async () => {
        if (state.currentStepIndex >= journey.length) {
            return finishJourney();
        }
        
        state.isProcessing = true;
        const currentStep = journey[state.currentStepIndex];

        // Atualiza visibilidade dos botões
        ui.backBtn.classList.toggle('hidden', state.currentStepIndex <= 0);
        ui.audioBtn.classList.remove('hidden');

        // Atualiza imagem e limpa a UI
        await updateImage(currentStep.image);
        ui.messageContainer.innerHTML = '';
        ui.optionsContainer.innerHTML = '';
        ui.inputArea.classList.add('hidden');
        ui.advanceBtn.classList.add('hidden');

        // Renderiza o tipo de passo correto
        if (currentStep.type === 'text-input') {
            renderTextInput(currentStep);
        } else if (currentStep.type === 'multiple-choice') {
            renderMultipleChoice(currentStep);
        }

        setTimeout(() => state.isProcessing = false, 200);
    };

    /**
     * Renderiza um passo de entrada de texto.
     * @param {object} step - O objeto do passo atual.
     */
    const renderTextInput = (step) => {
        ui.inputArea.classList.remove('hidden');
        ui.userInput.value = state.userAnswers[step.name] || '';
        ui.userInput.classList.remove('error');
        ui.userInput.focus();
        ui.advanceBtn.classList.remove('hidden');
        
        const msgEl = document.createElement('div');
        msgEl.className = 'bot-message';
        msgEl.textContent = step.question;
        ui.messageContainer.appendChild(msgEl);
    };

    /**
     * Renderiza um passo de múltipla escolha.
     * @param {object} step - O objeto do passo atual.
     */
    const renderMultipleChoice = (step) => {
        step.options.forEach((option, index) => {
            const button = document.createElement('button');
            button.className = 'option-btn';
            button.textContent = option.text;
            button.style.animationDelay = `${index * 100}ms`;
            button.onclick = () => handleChoice(option, step.name);
            ui.optionsContainer.appendChild(button);
        });
    };

    /**
     * Lida com a submissão de texto.
     */
    const handleTextInput = () => {
        if (state.isProcessing) return;
        const currentStep = journey[state.currentStepIndex];
        const answer = ui.userInput.value.trim();

        if (currentStep.validation && !currentStep.validation.test(answer)) {
            ui.userInput.classList.add('error');
            setTimeout(() => ui.userInput.classList.remove('error'), 500);
            return;
        }

        state.isProcessing = true;
        state.userAnswers[currentStep.name] = answer;
        state.imageHistory.push(journey[state.currentStepIndex].image);
        state.currentStepIndex++;
        renderStep();
    };

    /**
     * Lida com a seleção de uma opção.
     * @param {object} option - A opção selecionada.
     * @param {string} stepName - O nome do passo.
     */
    const handleChoice = (option, stepName) => {
        if (state.isProcessing) return;
        state.isProcessing = true;
        state.userAnswers[stepName] = { text: option.text, value: option.value };
        state.imageHistory.push(journey[state.currentStepIndex].image);
        state.currentStepIndex++;
        renderStep();
    };

    /**
     * Navega para o passo anterior.
     */
    const goBack = async () => {
        if (state.isProcessing || state.currentStepIndex === 0) return;
        state.isProcessing = true;
        
        state.currentStepIndex--;
        const previousStep = journey[state.currentStepIndex];
        delete state.userAnswers[previousStep.name];

        if (state.imageHistory.length > 0) {
            const previousImageSrc = state.imageHistory.pop();
            await updateImage(previousImageSrc);
        }
        
        renderStep();
    };

    /**
     * Classifica o lead com base nas respostas.
     * @returns {string} - A classificação (Quente, Morno, Frio).
     */
    const classifyLead = () => {
        const score = Object.values(state.userAnswers)
            .filter(answer => typeof answer === 'object' && typeof answer.value === 'number')
            .reduce((sum, answer) => sum + answer.value, 0);
        
        if (score >= 10) return "Quente";
        if (score >= 5) return "Morno";
        return "Frio";
    };

    /**
     * Finaliza a jornada, envia os dados e mostra o vídeo final.
     */
    const finishJourney = async () => {
        state.isProcessing = true;
        state.appStatus = 'FINISHED';

        // Limpa a UI da jornada
        ui.backgroundMusic.pause();
        ui.inputArea.classList.add('hidden');
        ui.optionsContainer.innerHTML = '';
        ui.messageContainer.innerHTML = '';
        ui.backBtn.classList.add('hidden');
        ui.audioBtn.classList.add('hidden');
        state.activeImage.classList.remove('active');
        state.inactiveImage.classList.remove('active');

        // Envia os dados para o webhook
        sendDataToWebhook();
        
        // Mostra a tela final com o vídeo
        showFinalScreen();

        // Redireciona após a duração do vídeo
        setTimeout(() => {
            window.location.href = config.finalRedirectURL;
        }, config.finalVideoDuration * 1000);
    };
    
    /**
     * Constrói o payload e envia para o webhook.
     */
    const sendDataToWebhook = async () => {
        const payload = {
            nome: state.userAnswers.nome,
            email: state.userAnswers.email,
            telefone: state.userAnswers.telefone,
            classificacao_final: classifyLead()
        };
        journey.forEach(step => {
            if (step.type === 'multiple-choice' && state.userAnswers[step.name]) {
                payload[step.name] = state.userAnswers[step.name].text;
            }
        });

        try {
            await fetch(config.webhookURL, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });
            console.log('Dados enviados com sucesso para o webhook!');
        } catch (error) {
            console.error('Falha ao enviar dados:', error);
        }
    };

    /**
     * Cria e exibe a tela final com o vídeo.
     */
    const showFinalScreen = () => {
        const loadingScreen = document.createElement('div');
        loadingScreen.className = 'loading-screen-container';
        
        // ATENÇÃO: atributos `muted playsinline autoplay` são essenciais para autoplay em mobile
        loadingScreen.innerHTML = `
            <video src="${config.finalVideoPath}" id="final-loading-video" class="loading-video" loop muted playsinline autoplay></video>
            <button id="unmute-video-btn" class="hidden">Ativar Som</button>
        `;
        ui.interactionContainer.appendChild(loadingScreen);
        
        const finalVideo = document.getElementById('final-loading-video');
        const unmuteBtn = document.getElementById('unmute-video-btn');

        finalVideo.oncanplay = () => {
            finalVideo.classList.add('active');
            unmuteBtn.classList.remove('hidden'); // Mostra o botão para o usuário poder ativar o som
        };
        
        unmuteBtn.addEventListener('click', () => {
            finalVideo.muted = false;
            unmuteBtn.classList.add('hidden');
        });
    };
    
    /**
     * Inicializa a aplicação
     */
    const init = async () => {
        // Mostra um indicador de loading enquanto os assets carregam (opcional)
        console.log("Pré-carregando mídias...");
        await preloadAssets();
        console.log("Mídias carregadas.");

        if (config.backgroundMusicPath) {
            ui.backgroundMusic.src = config.backgroundMusicPath;
            ui.backgroundMusic.volume = 0.2;
        }

        // Inicia a UI
        ui.imageBg1.src = journey[0].image;
        ui.imageBg1.onload = () => {
            ui.imageBg1.classList.add('active');
            ui.interactionContainer.classList.add('visible');
            renderStep();
        };

        setupEventListeners();
    };

    /**
     * Configura todos os event listeners da aplicação.
     */
    const setupEventListeners = () => {
        ui.userInput.addEventListener('keydown', (e) => {
            if (e.key === 'Enter') handleTextInput();
        });
        ui.backBtn.addEventListener('click', goBack);
        ui.advanceBtn.addEventListener('click', handleTextInput);
        ui.audioBtn.addEventListener('click', () => {
            const music = ui.backgroundMusic;
            if (music.paused) {
                music.play().catch(() => {});
                ui.audioBtn.classList.remove('muted');
            } else {
                music.pause();
                ui.audioBtn.classList.add('muted');
            }
        });

        // Evento para iniciar a música e pedir tela cheia com a primeira interação do usuário
        document.body.addEventListener('click', () => {
            if (ui.backgroundMusic.paused && state.appStatus !== 'FINISHED') {
                ui.backgroundMusic.play().catch(() => {});
                ui.audioBtn.classList.remove('muted');
            }
            // A API de Fullscreen pode ser intrusiva, use com cautela.
            // document.documentElement.requestFullscreen().catch(err => console.log(err));
        }, { once: true });
    };

    // --- PONTO DE ENTRADA ---
    init();
});