import { GestureRecognizer, FilesetResolver } from "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.3";

const video = document.getElementById("webcam");
const gestureOutput = document.getElementById("user-gesture");
const pcOutput = document.getElementById("pc-gesture");
const timerDisplay = document.getElementById("timer");
const statusText = document.getElementById("status-text");
// De nieuwe knop variabele
const playBtn = document.getElementById("play-round-btn");

let gestureRecognizer;
let userCurrentHand = "";
let isPlaying = false;

// 1. Model laden
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
            
            // Luisteren naar de knop in plaats van de video
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

    const interval = setInterval(() => {
        count--;
        if (count > 0) {
            timerDisplay.innerText = count;
        } else {
            clearInterval(interval);
            timerDisplay.innerText = "GO!";
            determineWinner();
            
            // Na de uitslag (3 seconden) zetten we de knop weer aan
            setTimeout(() => {
                isPlaying = false;
                playBtn.style.opacity = "1";
                playBtn.innerText = "Speel Ronde!";
                statusText.innerText = "Klaar voor de volgende ronde?";
            }, 3000);
        }
    }, 1000);
}

// 3. Winnaar bepalen
function determineWinner() {
    const choices = ["STEEN", "PAPIER", "SCHAAR"];
    const pcChoice = choices[Math.floor(Math.random() * choices.length)];
    const userChoice = userCurrentHand;

    pcOutput.innerText = `PC: ${pcChoice}`;

    if (!userChoice || userChoice === "" || userChoice === "Zoeken...") {
        statusText.innerText = "Geen hand herkent! Probeer het opnieuw.";
    } else if (userChoice === pcChoice) {
        statusText.innerText = "Gelijkspel! 🤝";
    } else if (
        (userChoice === "STEEN" && pcChoice === "SCHAAR") ||
        (userChoice === "PAPIER" && pcChoice === "STEEN") ||
        (userChoice === "SCHAAR" && pcChoice === "PAPIER")
    ) {
        statusText.innerText = "JIJ WINT! 🎉";
    } else {
        statusText.innerText = "COMPUTER WINT! 🤖";
    }
}

// 4. Continu detecteren
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