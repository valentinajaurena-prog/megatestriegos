// --- IMPORTS FIREBASE (usa módulos) ---
import { initializeApp } from "https://www.gstatic.com/firebasejs/11.0.1/firebase-app.js";
import {
  getDatabase,
  ref,
  push,
  query,
  orderByChild,
  limitToLast,
  onValue
} from "https://www.gstatic.com/firebasejs/11.0.1/firebase-database.js";

// 🔧 RELLENA ESTO CON TU PROYECTO FIREBASE
const firebaseConfig = {
  apiKey: "TU_API_KEY",
  authDomain: "TU_AUTH_DOMAIN",
  databaseURL: "TU_DATABASE_URL",
  projectId: "TU_PROJECT_ID",
  storageBucket: "TU_STORAGE_BUCKET",
  messagingSenderId: "TU_SENDER_ID",
  appId: "TU_APP_ID"
};

const app = initializeApp(firebaseConfig);
const db = getDatabase(app);
const scoresRef = ref(db, "prl-almacen-scores");

// --- ESTADO DEL JUEGO ---
let playerName = "";
let difficulty = "facil";
let questionCount = 8;

let currentQuestions = [];
let currentIndex = 0;
let score = 0;
let streak = 0;
let maxStreak = 0;
let answered = false;
let selectedOptionIndex = null;

// --- PREGUNTAS (más técnicas y con distractores mejores) ---
const QUESTIONS = [
  // FÁCIL
  {
    text: "¿Cuál es el objetivo principal de la prevención de riesgos laborales en el almacén?",
    options: [
      "Evitar sanciones administrativas",
      "Eliminar o reducir los riesgos para la salud y seguridad de los trabajadores",
      "Aumentar la productividad a cualquier precio",
      "Reducir el coste de la plantilla"
    ],
    correctIndex: 1,
    difficulty: "facil",
    topic: "Conceptos básicos PRL"
  },
  {
    text: "¿Qué significa la sigla EPI?",
    options: [
      "Equipo de Protección Individual",
      "Elemento de Protección Industrial",
      "Equipo de Prevención Interna",
      "Elemento Personal de Inspección"
    ],
    correctIndex: 0,
    difficulty: "facil",
    topic: "EPIs"
  },
  {
    text: "¿Qué color identifica las señales de obligación (por ejemplo, uso obligatorio de casco)?",
    options: ["Rojo", "Amarillo", "Azul", "Verde"],
    correctIndex: 2,
    difficulty: "facil",
    topic: "Señalización"
  },
  {
    text: "¿Qué EPI es adecuado para proteger los pies frente a caída de objetos pesados?",
    options: [
      "Zapatillas deportivas",
      "Calzado de seguridad con puntera reforzada",
      "Zapatos de vestir",
      "Chanclas con suela gruesa"
    ],
    correctIndex: 1,
    difficulty: "facil",
    topic: "EPIs"
  },
  {
    text: "¿Qué se debe hacer si se detecta un riesgo grave e inminente?",
    options: [
      "Continuar trabajando con más cuidado",
      "Esperar al descanso para comunicarlo",
      "Informar de inmediato y, si es necesario, abandonar la zona",
      "Ignorarlo si no afecta directamente"
    ],
    correctIndex: 2,
    difficulty: "facil",
    topic: "Emergencias"
  },

  // MEDIA
  {
    text: "¿Qué postura es más adecuada para levantar una carga manualmente?",
    options: [
      "Espalda curvada y piernas estiradas",
      "Espalda recta, carga cerca del cuerpo y flexionando las rodillas",
      "Girar el tronco mientras se levanta",
      "Levantar solo con la fuerza de la espalda"
    ],
    correctIndex: 1,
    difficulty: "media",
    topic: "Manipulación de cargas"
  },
  {
    text: "¿Qué medida preventiva ayuda a evitar caídas al mismo nivel en el almacén?",
    options: [
      "Aumentar la velocidad de trabajo",
      "Mantener el suelo limpio, seco y sin obstáculos",
      "Apagar parte de la iluminación",
      "Almacenar productos en los pasillos"
    ],
    correctIndex: 1,
    difficulty: "media",
    topic: "Riesgos en el almacén"
  },
  {
    text: "¿Quién puede manejar una carretilla elevadora en el almacén?",
    options: [
      "Cualquier trabajador con contrato indefinido",
      "Cualquier trabajador mayor de edad",
      "Solo quien tenga formación específica y autorización de la empresa",
      "El trabajador más fuerte físicamente"
    ],
    correctIndex: 2,
    difficulty: "media",
    topic: "Carretillas"
  },
  {
    text: "¿Qué se debe hacer con una estantería que presenta daños visibles en montantes o largueros?",
    options: [
      "Seguir utilizándola con menos carga",
      "Repararla o sustituirla y no usarla hasta que sea segura",
      "Ignorar los daños si no se ha caído nada",
      "Marcarla con una etiqueta y seguir usándola"
    ],
    correctIndex: 1,
    difficulty: "media",
    topic: "Almacenamiento"
  },
  {
    text: "¿Qué es un plan de emergencia en el contexto del almacén?",
    options: [
      "Un listado de vacaciones del personal",
      "Un conjunto de medidas organizativas y técnicas para actuar ante situaciones de emergencia",
      "Un documento de sanciones disciplinarias",
      "Un inventario de productos peligrosos"
    ],
    correctIndex: 1,
    difficulty: "media",
    topic: "Emergencias"
  },

  // DIFÍCIL
  {
    text: "En la evaluación de riesgos, ¿qué combinación de factores se analiza habitualmente para priorizar las medidas?",
    options: [
      "Edad, antigüedad y salario",
      "Probabilidad, gravedad y número de trabajadores expuestos",
      "Turno, horario y productividad",
      "Color, tamaño y peso de la carga"
    ],
    correctIndex: 1,
    difficulty: "dificil",
    topic: "Evaluación de riesgos"
  },
  {
    text: "En la manipulación manual de cargas, ¿qué situación incrementa especialmente el riesgo de lesión lumbar?",
    options: [
      "Cargas ligeras y agarre fácil",
      "Cargas pesadas, agarre difícil y giro del tronco",
      "Cargas medianas y pausas frecuentes",
      "Cargas ligeras y postura neutra"
    ],
    correctIndex: 1,
    difficulty: "dificil",
    topic: "Manipulación de cargas"
  },
  {
    text: "Respecto al almacenamiento en altura, ¿qué medida es correcta desde el punto de vista preventivo?",
    options: [
      "Colocar las cargas más pesadas en los niveles superiores",
      "Respetar la carga máxima de las estanterías indicada por el fabricante",
      "Permitir que los trabajadores se suban a las estanterías para alcanzar productos",
      "Almacenar sin tener en cuenta la estabilidad del conjunto"
    ],
    correctIndex: 1,
    difficulty: "dificil",
    topic: "Almacenamiento"
  },
  {
    text: "En la gestión de productos peligrosos, ¿qué información es imprescindible en el etiquetado según la normativa?",
    options: [
      "Solo el nombre comercial y el logotipo",
      "Nombre del trabajador responsable",
      "Pictogramas de peligro, indicaciones de peligro y consejos de prudencia",
      "Precio de compra y proveedor"
    ],
    correctIndex: 2,
    difficulty: "dificil",
    topic: "Productos peligrosos"
  },
  {
    text: "En la investigación de un accidente en el almacén, ¿cuál es el objetivo principal desde la perspectiva de la prevención?",
    options: [
      "Determinar el coste económico del accidente",
      "Buscar culpables para sancionarlos",
      "Determinar las causas para evitar que vuelva a ocurrir",
      "Reducir la duración de la baja médica"
    ],
    correctIndex: 2,
    difficulty: "dificil",
    topic: "Investigación de accidentes"
  }
];

// --- UTILIDADES ---
function shuffle(array) {
  const arr = [...array];
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

function pickQuestions(diff, count) {
  const filtered = QUESTIONS.filter(q => q.difficulty === diff);
  const shuffled = shuffle(filtered);
  return shuffled.slice(0, count);
}

// --- DOM ---
const screenStart = document.getElementById("screenStart");
const screenGame = document.getElementById("screenGame");
const screenResult = document.getElementById("screenResult");
const screenLeaderboard = document.getElementById("screenLeaderboard");

const playerNameInput = document.getElementById("playerNameInput");
const btnStartGame = document.getElementById("btnStartGame");
const diffButtons = document.querySelectorAll(".chip-toggle");
const questionCountButtons = document.querySelectorAll(".chip-toggle-questions");

const labelPlayerName = document.getElementById("labelPlayerName");
const labelDifficulty = document.getElementById("labelDifficulty");
const labelQuestionCounter = document.getElementById("labelQuestionCounter");
const labelStreak = document.getElementById("labelStreak");
const labelTopic = document.getElementById("labelTopic");
const labelScore = document.getElementById("labelScore");
const progressFill = document.getElementById("progressFill");

const questionText = document.getElementById("questionText");
const optionsContainer = document.getElementById("optionsContainer");
const feedbackEl = document.getElementById("feedback");
const btnSkip = document.getElementById("btnSkip");
const btnNext = document.getElementById("btnNext");

const questionImageWrapper = document.getElementById("questionImageWrapper");
const questionImage = document.getElementById("questionImage");

const finalScoreText = document.getElementById("finalScoreText");
const finalStatsText = document.getElementById("finalStatsText");
const finalStreakText = document.getElementById("finalStreakText");
const btnPlayAgain = document.getElementById("btnPlayAgain");
const btnGoHome = document.getElementById("btnGoHome");

const btnShowLeaderboard = document.getElementById("btnShowLeaderboard");
const btnCloseLeaderboard = document.getElementById("btnCloseLeaderboard");
const leaderboardList = document.getElementById("leaderboardList");
const resultLeaderboardList = document.getElementById("resultLeaderboardList");

// --- CAMBIO DE PANTALLA ---
function showScreen(screen) {
  [screenStart, screenGame, screenResult, screenLeaderboard].forEach(s => {
    s.classList.remove("active");
  });
  screen.classList.add("active");
}

// --- INICIO ---
diffButtons.forEach(btn => {
  btn.addEventListener("click", () => {
    diffButtons.forEach(b => b.classList.remove("active"));
    btn.classList.add("active");
    difficulty = btn.dataset.diff;
  });
});

questionCountButtons.forEach(btn => {
  btn.addEventListener("click", () => {
    questionCountButtons.forEach(b => b.classList.remove("active"));
    btn.classList.add("active");
    questionCount = parseInt(btn.dataset.count, 10);
  });
});

btnStartGame.addEventListener("click", () => {
  const name = playerNameInput.value.trim();
  if (!name) {
    alert("Pon un nombre para el ranking.");
    return;
  }
  playerName = name;
  startGame();
});

// --- LÓGICA DE JUEGO ---
function startGame() {
  currentQuestions = pickQuestions(difficulty, questionCount);
  currentIndex = 0;
  score = 0;
  streak = 0;
  maxStreak = 0;
  answered = false;
  selectedOptionIndex = null;

  labelPlayerName.textContent = playerName;
  labelDifficulty.textContent =
    difficulty === "facil" ? "Fácil" : difficulty === "media" ? "Media" : "Difícil";
  labelStreak.textContent = "Racha: 0";
  labelScore.textContent = "Puntos: 0";
  progressFill.style.width = "0%";

  showScreen(screenGame);
  renderQuestion();
}

function renderQuestion() {
  const q = currentQuestions[currentIndex];
  if (!q) return;

  const num = currentIndex + 1;
  labelQuestionCounter.textContent = `Pregunta ${num} / ${currentQuestions.length}`;
  questionText.textContent = q.text;
  labelTopic.textContent = `Tema: ${q.topic}`;
  feedbackEl.textContent = "";
  feedbackEl.className = "feedback";
  btnNext.disabled = true;
  btnNext.textContent = "Comprobar";
  answered = false;
  selectedOptionIndex = null;

  const progressPercent = (currentIndex / currentQuestions.length) * 100;
  progressFill.style.width = `${progressPercent}%`;

  // Imagen opcional (si en el futuro añades q.imageUrl)
  if (q.imageUrl) {
    questionImageWrapper.classList.remove("hidden");
    questionImage.src = q.imageUrl;
  } else {
    questionImageWrapper.classList.add("hidden");
  }

  optionsContainer.innerHTML = "";
  q.options.forEach((opt, index) => {
    const optionEl = document.createElement("button");
    optionEl.className = "option";
    optionEl.dataset.index = index;

    const labelEl = document.createElement("div");
    labelEl.className = "option-label";
    labelEl.textContent = String.fromCharCode(65 + index);

    const textEl = document.createElement("div");
    textEl.className = "option-text";
    textEl.textContent = opt;

    optionEl.appendChild(labelEl);
    optionEl.appendChild(textEl);

    optionEl.addEventListener("click", () => {
      if (answered) return;
      selectedOptionIndex = index;
      document.querySelectorAll(".option").forEach(o => o.classList.remove("selected"));
      optionEl.classList.add("selected");
      btnNext.disabled = false;
    });

    optionsContainer.appendChild(optionEl);
  });
}

function checkAnswer() {
  if (answered || selectedOptionIndex === null) return;

  answered = true;
  const q = currentQuestions[currentIndex];
  const options = document.querySelectorAll(".option");

  options.forEach(optEl => {
    const idx = parseInt(optEl.dataset.index, 10);
    if (idx === q.correctIndex) {
      optEl.classList.add("correct");
    }
    if (idx === selectedOptionIndex && idx !== q.correctIndex) {
      optEl.classList.add("incorrect");
    }
  });

  if (selectedOptionIndex === q.correctIndex) {
    streak++;
    maxStreak = Math.max(maxStreak, streak);
    // Puntuación: base 100 + bonus por racha
    const base = difficulty === "facil" ? 80 : difficulty === "media" ? 100 : 120;
    const bonus = streak * 10;
    score += base + bonus;
    feedbackEl.textContent = `¡Correcto! +${base + bonus} puntos (racha x${streak})`;
    feedbackEl.classList.add("correct");
  } else {
    feedbackEl.textContent = `Incorrecto. La correcta era la opción ${String.fromCharCode(
      65 + q.correctIndex
    )}.`;
    feedbackEl.classList.add("incorrect");
    streak = 0;
  }

  labelStreak.textContent = `Racha: ${streak}`;
  labelScore.textContent = `Puntos: ${score}`;
  btnNext.textContent =
    currentIndex === currentQuestions.length - 1 ? "Ver resultados" : "Siguiente";
}

btnNext.addEventListener("click", () => {
  if (!answered) {
    checkAnswer();
    return;
  }

  if (currentIndex < currentQuestions.length - 1) {
    currentIndex++;
    renderQuestion();
  } else {
    endGame();
  }
});

btnSkip.addEventListener("click", () => {
  if (answered) return;
  streak = 0;
  labelStreak.textContent = "Racha: 0";
  if (currentIndex < currentQuestions.length - 1) {
    currentIndex++;
    renderQuestion();
  } else {
    endGame();
  }
});

// --- FIN DE PARTIDA Y RANKING ---
function endGame() {
  progressFill.style.width = "100%";
  showScreen(screenResult);

  finalScoreText.textContent = `${score} puntos`;
  finalStatsText.textContent = `Has respondido ${currentQuestions.length} preguntas en dificultad ${
    difficulty === "facil" ? "Fácil" : difficulty === "media" ? "Media" : "Difícil"
  }.`;
  finalStreakText.textContent = `Mejor racha: ${maxStreak} aciertos seguidos.`;

  // Guardar en Firebase
  const payload = {
    name: playerName,
    score,
    maxStreak,
    difficulty,
    questions: currentQuestions.length,
    timestamp: Date.now()
  };
  push(scoresRef, payload);

  // Actualizar ranking en pantalla de resultados
  loadLeaderboard(resultLeaderboardList, 5);
}

btnPlayAgain.addEventListener("click", () => {
  startGame();
});

btnGoHome.addEventListener("click", () => {
  showScreen(screenStart);
});

// --- RANKING GLOBAL ---
btnShowLeaderboard.addEventListener("click", () => {
  showScreen(screenLeaderboard);
  loadLeaderboard(leaderboardList, 20);
});

btnCloseLeaderboard.addEventListener("click", () => {
  showScreen(screenStart);
});

function loadLeaderboard(listElement, limit) {
  listElement.innerHTML = "<li class='leaderboard-item'><span class='name'>Cargando...</span></li>";

  const q = query(scoresRef, orderByChild("score"), limitToLast(limit));
  onValue(
    q,
    snapshot => {
      const items = [];
      snapshot.forEach(child => {
        items.push(child.val());
      });
      items.sort((a, b) => b.score - a.score);

      listElement.innerHTML = "";
      if (items.length === 0) {
        listElement.innerHTML =
          "<li class='leaderboard-item'><span class='name'>Sin partidas aún</span></li>";
        return;
      }

      items.forEach((item, index) => {
        const li = document.createElement("li");
        li.className = "leaderboard-item";
        li.innerHTML = `
          <span class="name">${index + 1}. ${item.name}</span>
          <span class="meta">${item.score} pts · racha ${item.maxStreak} · ${
          item.difficulty
        }</span>
        `;
        listElement.appendChild(li);
      });
    },
    () => {
      listElement.innerHTML =
        "<li class='leaderboard-item'><span class='name'>Error cargando ranking</span></li>";
    }
  );
}
