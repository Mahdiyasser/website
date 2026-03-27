// tools/quiz.js

const API_KEY = "Zi20kePaSQ5X6BRsUCzlAeA1kGwQbkc6g3fOYJMz";
let rrqCurrentIndex = 0;
let rrqScore = 0;
let rrqQuestions = [];

function renderRealquiz() {
    const toolContentDiv = document.getElementById('tool-content');
    toolContentDiv.innerHTML = `
        <div id="rrq-loading" class="text-center text-gray-200">Loading questions...</div>
        <div id="rrq-container" class="hidden"></div>
    `;
    fetchQuestions();
}

async function fetchQuestions() {
    const url = `https://quizapi.io/api/v1/questions?apiKey=${API_KEY}&category=Linux&limit=10`;
    try {
        const res = await fetch(url);
        if (!res.ok) throw new Error('Failed to fetch');
        rrqQuestions = await res.json();
        rrqCurrentIndex = 0;
        rrqScore = 0;
        renderRRQQuestion();
    } catch (e) {
        document.getElementById('tool-content').innerHTML = `<p class="text-red-500">Error loading quiz.</p>`;
    }
}

function renderRRQQuestion() {
    if (!rrqQuestions[rrqCurrentIndex]) {
        renderRRQScore();
        return;
    }

    const q = rrqQuestions[rrqCurrentIndex];
    const answers = Object.entries(q.answers)
        .filter(([k, v]) => v)
        .map(([k, v]) => ({ key: k, text: v }));
    for (let i = answers.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [answers[i], answers[j]] = [answers[j], answers[i]];
    }

    const container = document.getElementById('rrq-container');
    container.classList.remove('hidden');
    container.innerHTML = `
        <div class="mb-4">
            <h3 class="text-lg font-semibold text-purple-400 mb-2">Question ${rrqCurrentIndex + 1} of ${rrqQuestions.length}</h3>
            <p class="text-gray-200 text-sm">${q.question}</p>
        </div>
        <div id="rrq-options" class="grid grid-cols-1 gap-3 mb-3"></div>
        <div class="flex gap-3">
            <button id="rrq-skip" class="bg-gray-600 hover:bg-gray-700 text-white py-2 px-4 rounded-lg">Skip</button>
            <button id="rrq-new" class="bg-green-600 hover:bg-green-700 text-white py-2 px-4 rounded-lg">New Quiz</button>
        </div>
    `;

    const optionsDiv = document.getElementById('rrq-options');
    answers.forEach(opt => {
        const btn = document.createElement('button');
        btn.textContent = opt.text;
        btn.className = "bg-purple-600 hover:bg-purple-700 text-white py-2 px-4 rounded-lg";
        btn.onclick = () => rrqSelectAnswer(opt.key);
        optionsDiv.appendChild(btn);
    });

    document.getElementById('rrq-skip').onclick = () => {
        rrqCurrentIndex++;
        renderRRQQuestion();
    };
    document.getElementById('rrq-new').onclick = () => fetchQuestions();
    document.getElementById('rrq-loading').classList.add('hidden');
}

function rrqSelectAnswer(selectedKey) {
    const q = rrqQuestions[rrqCurrentIndex];
    const correctKey = Object.entries(q.correct_answers).find(([k, v]) => v === "true")[0].replace("_correct","");
    if (selectedKey === correctKey) rrqScore++;
    rrqCurrentIndex++;
    renderRRQQuestion();
}

function renderRRQScore() {
    const container = document.getElementById('rrq-container');
    container.innerHTML = `
        <div class="text-center">
            <h3 class="text-2xl font-bold text-green-400 mb-4">Quiz Completed!</h3>
            <p class="text-gray-200 mb-4">Score: ${rrqScore} / ${rrqQuestions.length}</p>
            <button id="rrq-retry" class="bg-purple-600 hover:bg-purple-700 text-white py-2 px-4 rounded-lg">Try Again</button>
            <button id="rrq-newquiz" class="bg-green-500 hover:bg-green-600 text-white py-2 px-4 rounded-lg">New Quiz</button>
        </div>
    `;
    document.getElementById('rrq-retry').onclick = () => {
        rrqCurrentIndex = 0;
        rrqScore = 0;
        renderRRQQuestion();
    };
    document.getElementById('rrq-newquiz').onclick = () => fetchQuestions();
}

