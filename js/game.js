import { GestureRecognizer, FilesetResolver } from "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.3";

// Elementen uit de HTML halen
const video = document.getElementById("webcam");
const gestureOutput = document.getElementById("user-gesture");
const pcOutput = document.getElementById("pc-gesture");
const timerDisplay = document.getElementById("timer");
const statusText = document.getElementById("status-text");
const playBtn = document.getElementById("play-round-btn");

// Score elementen
let userScore = 0;
let pcScore = 0;
const userScoreDisplay = document.getElementById("user-score");
const pcScoreDisplay = document.getElementById("pc-score");

// Game Over Scherm elementen
const modal = document.getElementById("game-over-modal");
const finalResultText = document.getElementById("final-result-text");
const finalScoreText = document.getElementById("final-score");
const restartBtn = document.getElementById("restart-btn");

// Geluidseffecten elementen
const sndTick = document.getElementById("snd-tick");
const sndGo = document.getElementById("snd-go");
const sndWin = document.getElementById("snd-win");
const sndLose = document.getElementById("snd-lose");

let gestureRecognizer;
let userCurrentHand = "";
let isPlaying = false;

// 1. MediaPipe Model laden
const init = async () => {
    const vision = await FilesetResolver.forVisionTasks("https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.3/wasm");
    gestureRecognizer = await GestureRecognizer.createFromOptions(vision, {
        baseOptions: {
            modelAssetPath: "https://storage.googleapis.com/mediapipe-models/gesture_recognizer/gesture_recognizer/float16/1/gesture_recognizer.task",
            delegate: "GPU"
        },
        runningMode: "VIDEO"
    });
    statusText.innerText = "Systeem klaar! Klik op de knop om te starten.";
    startCamera();
};

function startCamera() {
    navigator.mediaDevices.getUserMedia({ video: true }).then((stream) => {
        video.srcObject = stream;
        video.addEventListener("loadeddata", () => {
            predictWebcam();
            
            playBtn.addEventListener("click", () => {
                if (!isPlaying) startRound();
            });
        });
    });
}

// 2. De Spelronde (3, 2, 1... GO!)
async function startRound() {
    isPlaying = true;
    playBtn.style.opacity = "0.5";
    playBtn.innerText = "Bezig...";
    
    let count = 3;
    timerDisplay.innerText = count;
    pcOutput.innerText = "PC: ?";
    
    // Eerste tik bij de start van het aftellen
    sndTick.play();

    const interval = setInterval(() => {
        count--;
        if (count > 0) {
            timerDisplay.innerText = count;
            sndTick.play(); // Geluidje bij elke seconde
        } else {
            clearInterval(interval);
            timerDisplay.innerText = "GO!";
            sndGo.play(); // Geluidje bij de start
            determineWinner();
            
            setTimeout(() => {
                isPlaying = false;
                playBtn.style.opacity = "1";
                playBtn.innerText = "Speel Ronde!";
                if(userScore < 2 && pcScore < 2) {
                    statusText.innerText = "Klaar voor de volgende ronde?";
                }
            }, 3000);
        }
    }, 1000);
}

// 3. Winnaar bepalen & Score bijhouden
function determineWinner() {
    const choices = ["STEEN", "PAPIER", "SCHAAR"];
    const pcChoice = choices[Math.floor(Math.random() * choices.length)];
    const userChoice = userCurrentHand;

    pcOutput.innerText = `PC: ${pcChoice}`;

    if (!userChoice || userChoice === "" || userChoice === "Zoeken...") {
        statusText.innerText = "Geen hand herkent! Ronde telt niet.";
    } else if (userChoice === pcChoice) {
        statusText.innerText = "Gelijkspel! 🤝";
    } else if (
        (userChoice === "STEEN" && pcChoice === "SCHAAR") ||
        (userChoice === "PAPIER" && pcChoice === "STEEN") ||
        (userChoice === "SCHAAR" && pcChoice === "PAPIER")
    ) {
        statusText.innerText = "Punt voor jou! 🎉";
        userScore++;
    } else {
        statusText.innerText = "Punt voor de computer! 🤖";
        pcScore++;
    }

    if(userScoreDisplay) userScoreDisplay.innerText = userScore;
    if(pcScoreDisplay) pcScoreDisplay.innerText = pcScore;

    // Check voor Best of 3 winnaar
    if (userScore === 2 || pcScore === 2) {
        setTimeout(() => {
            const winnaarTekst = userScore === 2 ? "JIJ HEBT GEWONNEN! 🎉" : "COMPUTER WINT... 🤖";
            finalResultText.innerText = winnaarTekst;
            finalScoreText.innerText = `Eindstand: ${userScore} - ${pcScore}`;
            
            if (userScore === 2) {
                sndWin.play(); // Juichen bij winst!
                
                // Confetti regen
                var duration = 3 * 1000;
                var end = Date.now() + duration;

                (function frame() {
                  confetti({
                    particleCount: 3,
                    angle: 60,
                    spread: 55,
                    origin: { x: 0 },
                    colors: ['#F7D560', '#29A7D9']
                  });
                  confetti({
                    particleCount: 3,
                    angle: 120,
                    spread: 55,
                    origin: { x: 1 },
                    colors: ['#F7D560', '#29A7D9']
                  });

                  if (Date.now() < end) {
                    requestAnimationFrame(frame);
                  }
                }());
            } else {
                sndLose.play(); // Boing bij verlies...
            }

            modal.style.display = "flex";
        }, 500);
    }
}

function resetGame() {
    userScore = 0;
    pcScore = 0;
    if(userScoreDisplay) userScoreDisplay.innerText = "0";
    if(pcScoreDisplay) pcScoreDisplay.innerText = "0";
    statusText.innerText = "Nieuw spel! Klik op de knop.";
}

restartBtn.addEventListener("click", () => {
    modal.style.display = "none";
    resetGame();
});

async function predictWebcam() {
    const results = gestureRecognizer.recognizeForVideo(video, Date.now());
    
    if (results.gestures.length > 0) {
        const categoryName = results.gestures[0][0].categoryName;
        if (categoryName === "Closed_Fist") userCurrentHand = "STEEN";
        else if (categoryName === "Open_Palm") userCurrentHand = "PAPIER";
        else if (categoryName === "Victory") userCurrentHand = "SCHAAR";
        else userCurrentHand = "";
        
        gestureOutput.innerText = `Jij: ${userCurrentHand || "?"}`;
    }
    window.requestAnimationFrame(predictWebcam);
}

init();