document.addEventListener('DOMContentLoaded', () => {

    // --- 1. INITIALISATION DES ANIMATIONS (AOS) ---
    AOS.init({
        duration: 800,      // Durée de l'animation (0.8s pour le côté "Luxe")
        easing: 'ease-out-cubic', // Courbe de vitesse fluide
        once: true,         // L'animation ne se joue qu'une seule fois
        offset: 50          // Déclenche l'animation un peu avant que l'élément soit visible
    });

    
    
    // --- CONFIGURATION API MISTRAL ---
    const API_KEY = 'R3mNrENew8ratbxJoT7om16YMyU9PdSW'; // <--- COLLES TA CLÉ ICI
    const API_URL = 'https://api.mistral.ai/v1/chat/completions';

    // Le "Cerveau" de l'IA
    const systemPrompt = {
        role: "system",
        content: "Tu es le Chrono-Guide, l'IA de l'agence de voyage temporel de luxe 'AGENCY'. Ton ton est courtois, sophistiqué et expert. Tu ne réponds qu'aux questions concernant le voyage temporel et nos 3 destinations : Paris 1889, Florence 1504 et le Crétacé. Informations clés : Paris 1889 (5000 Crédits), Florence 1504 (7500 Crédits), Crétacé (12000 Crédits). Sois très concis et immersif."
    };

    // Historique de la conversation (pour qu'il se souvienne du contexte)
    let chatHistory = [systemPrompt];

    // --- ELEMENTS DOM ---
    const chatToggle = document.getElementById('chat-toggle');
    const chatWindow = document.getElementById('chat-window');
    const closeBtn = document.getElementById('chat-close');
    const sendBtn = document.getElementById('send-btn');
    const userInput = document.getElementById('user-input');
    const chatBody = document.getElementById('chat-body');

    // --- GESTION INTERFACE ---
    function toggleChat() {
        chatWindow.classList.toggle('hidden');
    }

    chatToggle.addEventListener('click', toggleChat);
    closeBtn.addEventListener('click', toggleChat);

    function addMessage(text, sender) {
        const div = document.createElement('div');
        div.classList.add('message', sender);
        
        // --- MODIFICATION ICI ---
        // On utilise marked.parse() pour convertir le Markdown en HTML
        // Si c'est l'IA (bot), on parse. Si c'est l'user, on laisse en texte simple.
        if (sender === 'bot') {
            div.innerHTML = marked.parse(text);
        } else {
            div.innerHTML = `<p>${text}</p>`;
        }
        // ------------------------

        chatBody.appendChild(div);
        chatBody.scrollTop = chatBody.scrollHeight;
    }
    function addLoading() {
        const div = document.createElement('div');
        div.classList.add('message', 'bot', 'loading-dots');
        div.innerHTML = `<span>.</span><span>.</span><span>.</span>`;
        div.id = "loading-msg";
        chatBody.appendChild(div);
        chatBody.scrollTop = chatBody.scrollHeight;
    }

    function removeLoading() {
        const loadingMsg = document.getElementById('loading-msg');
        if (loadingMsg) loadingMsg.remove();
    }

    // --- APPEL API (LA VRAIE MAGIE) ---
    async function sendMessage() {
        const text = userInput.value.trim();
        if (text === "") return;

        // 1. Afficher message utilisateur
        addMessage(text, 'user');
        userInput.value = "";
        
        // 2. Ajouter à l'historique
        chatHistory.push({ role: "user", content: text });

        // 3. Afficher chargement
        addLoading();

        try {
            // 4. Appel à Mistral AI
            const response = await fetch(API_URL, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${API_KEY}`
                },
                body: JSON.stringify({
                    model: "mistral-tiny", // Modèle rapide et économique
                    messages: chatHistory,
                    max_tokens: 150
                })
            });

            const data = await response.json();

            // 5. Traitement de la réponse
            removeLoading();
            
            if (data.choices && data.choices.length > 0) {
                const aiResponse = data.choices[0].message.content;
                addMessage(aiResponse, 'bot');
                // Ajouter la réponse de l'IA à l'historique
                chatHistory.push({ role: "assistant", content: aiResponse });
            } else {
                addMessage("Erreur de communication temporelle.", 'bot');
            }

        } catch (error) {
            removeLoading();
            console.error("Erreur API:", error);
            addMessage("Connexion au vortex perdue. Vérifiez votre clé API.", 'bot');
        }
    }

    // --- EVENTS ---
    sendBtn.addEventListener('click', sendMessage);
    userInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') sendMessage();
    });

    // --- QUIZ INTELLIGENT ---
    
    // 1. Les Données du Quiz
    const questions = [
        {
            text: "Quel type d'expérience recherchez-vous ?",
            options: [
                { text: "Culturelle et Artistique", score: "florence" },
                { text: "Aventure et Nature Sauvage", score: "cretaceous" },
                { text: "Élégance et Modernité", score: "paris" }
            ]
        },
        {
            text: "Votre période historique préférée ?",
            options: [
                { text: "La Révolution Industrielle (XIXe)", score: "paris" },
                { text: "Les Origines du Monde", score: "cretaceous" },
                { text: "La Renaissance Italienne", score: "florence" }
            ]
        },
        {
            text: "Votre activité idéale pour ce voyage ?",
            options: [
                { text: "Dîner mondain et balade urbaine", score: "paris" },
                { text: "Observation de la faune", score: "cretaceous" },
                { text: "Visite de musées et ateliers", score: "florence" }
            ]
        }
    ];

    let currentQuestion = 0;
    let scores = { paris: 0, florence: 0, cretaceous: 0 };
    let userChoices = []; // Pour l'IA

    // Elements DOM
    const quizModal = document.getElementById('quiz-modal');
    const startQuizBtn = document.getElementById('start-quiz-btn');
    const closeQuizBtn = document.getElementById('close-quiz');
    const questionText = document.getElementById('question-text');
    const optionsContainer = document.getElementById('options-container');
    const progressFill = document.getElementById('quiz-progress');
    const quizBody = document.getElementById('quiz-body');
    const quizResult = document.getElementById('quiz-result');

    // Ouverture / Fermeture
    if(startQuizBtn) {
        startQuizBtn.addEventListener('click', () => {
            quizModal.classList.add('active');
            resetQuiz();
            showQuestion();
        });
    }

    if(closeQuizBtn) {
        closeQuizBtn.addEventListener('click', () => {
            quizModal.classList.remove('active');
        });
    }

    function resetQuiz() {
        currentQuestion = 0;
        scores = { paris: 0, florence: 0, cretaceous: 0 };
        userChoices = [];
        quizBody.classList.remove('hidden');
        quizResult.classList.add('hidden');
    }

    function showQuestion() {
        const q = questions[currentQuestion];
        questionText.innerText = q.text;
        optionsContainer.innerHTML = '';

        // Barre de progression
        const progress = ((currentQuestion) / questions.length) * 100;
        progressFill.style.width = `${progress}%`;

        q.options.forEach(opt => {
            const btn = document.createElement('button');
            btn.classList.add('option-btn');
            btn.innerHTML = `<span>${opt.text}</span> <i class="ph ph-caret-right"></i>`;
            
            btn.addEventListener('click', () => {
                scores[opt.score]++;
                userChoices.push(opt.text);
                nextQuestion();
            });
            optionsContainer.appendChild(btn);
        });
    }

    function nextQuestion() {
        currentQuestion++;
        if (currentQuestion < questions.length) {
            showQuestion();
        } else {
            showResult();
        }
    }

    async function showResult() {
        quizBody.classList.add('hidden');
        quizResult.classList.remove('hidden');
        progressFill.style.width = '100%';

        // Calcul du gagnant
        let winner = Object.keys(scores).reduce((a, b) => scores[a] > scores[b] ? a : b);
        
        // Configuration de l'affichage
        const destinations = {
            paris: { name: "Paris 1889", link: "paris.html" },
            florence: { name: "Florence 1504", link: "florence.html" },
            cretaceous: { name: "Crétacé Supérieur", link: "cretaceous.html" }
        };

        const resultData = destinations[winner];
        document.getElementById('result-destination').innerText = resultData.name;
        document.getElementById('result-link').href = resultData.link;

        // --- GÉNÉRATION IA (MISTRAL) ---
        const aiTextElement = document.getElementById('result-description');
        aiTextElement.innerText = "L'IA analyse vos réponses pour générer votre itinéraire...";
        
        // Prompt personnalisé pour la recommandation
        const recommendationPrompt = [
            {
                role: "system",
                content: "Tu es une IA experte en voyage. Le client a répondu à un quiz. Explique en 2 phrases courtes et séduisantes pourquoi la destination choisie est PARFAITE pour lui, en te basant sur ses choix."
            },
            {
                role: "user",
                content: `Destination gagnante : ${resultData.name}. Choix du client : ${userChoices.join(', ')}.`
            }
        ];

        try {
            // Appel API avec plus de "tokens" (longueur)
            const response = await fetch(API_URL, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${API_KEY}` },
                body: JSON.stringify({ 
                    model: "mistral-tiny", 
                    messages: recommendationPrompt, 
                    max_tokens: 300 // <--- AUGMENTÉ (était 100) pour ne pas couper le texte
                })
            });
            
            const data = await response.json();
            
            if (data.choices) {
                // <--- CORRECTION ICI : On utilise innerHTML + marked.parse()
                // Cela transforme les **texte** en <strong>texte</strong>
                aiTextElement.innerHTML = marked.parse(data.choices[0].message.content);
                
                // On s'assure que le style doré s'applique aux éléments en gras
                aiTextElement.querySelectorAll('strong').forEach(el => el.style.color = 'var(--accent-gold)');
            }
        } catch (error) {
            console.error(error);
            aiTextElement.innerText = "L'analyse a réussi. Destination calculée avec une probabilité de 99%.";
        }
    }

});