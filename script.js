// /quiz/script.js

import { initializeApp } from "https://www.gstatic.com/firebasejs/9.6.10/firebase-app.js";
import { getDatabase, ref, set, get, child, onValue } from "https://www.gstatic.com/firebasejs/9.6.10/firebase-database.js";

// Firebase configuration (using the one you provided previously)
const firebaseConfig = {
    apiKey: "AIzaSyDfCO-xxHPpgSfE-I6KTmsw35Lo9n2v56s",
    authDomain: "live-quiz-6e77b.firebaseapp.com",
    databaseURL: "https://live-quiz-6e77b-default-rtdb.asia-southeast1.firebasedatabase.app",
    projectId: "live-quiz-6e77b",
    storageBucket: "live-quiz-6e77b.appspot.com",
    messagingSenderId: "50057610341",
    appId: "1:50057610341:web:d4e88673a20757d4c9328c"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const db = getDatabase(app);

// Medical quiz data
const questions = [
    {
        question: "What is the largest organ in the human body?",
        options: ["Heart", "Brain", "Skin", "Liver"],
        correct: 3 // Index of "Skin"
    },
    {
        question: "Which of the following is NOT a type of blood cell?",
        options: ["Erythrocyte", "Leukocyte", "Nephron", "Thrombocyte"],
        correct: 3 // Index of "Nephron" (which is a kidney unit)
    },
    {
        question: "What is the primary function of red blood cells?",
        options: ["Fighting infection", "Clotting blood", "Carrying oxygen", "Producing antibodies"],
        correct: 3 // Index of "Carrying oxygen"
    },
    {
        question: "Which vitamin is synthesized in the skin upon exposure to sunlight?",
        options: ["Vitamin A", "Vitamin B12", "Vitamin C", "Vitamin D"],
        correct: 4 // Index of "Vitamin D"
    },
    {
        question: "The human heart has how many chambers?",
        options: ["One", "Two", "Three", "Four"],
        correct: 4 // Index of "Four"
    }
];

let currentUser = { name: null, email: null };
let currentQuestion = 0;
let correctAnswers = 0;
let wrongAnswers = 0;

const appDiv = document.getElementById('app');
// Check if modalErrorMessage exists before trying to access it
const modalErrorMessage = document.getElementById('modalErrorMessage');


/**
 * Checks if a user with the given name (and optional email) already exists in the Firebase database.
 * @param {string} name - The name to check.
 * @returns {Promise<boolean>} True if user exists, false otherwise.
 */
async function checkUserExist(name) {
    if (!name) return false;
    const dbRef = ref(db);
    try {
        // We will use the name as the primary identifier (userId) in the database.
        // This ensures uniqueness based on name as per "one person can take one time".
        const snapshot = await get(child(dbRef, `users/${name}`));
        return snapshot.exists();
    } catch (error) {
        console.error("Error checking user existence:", error);
        return false;
    }
}

/**
 * Saves the user's score and quiz details to Firebase.
 * @param {object} user - An object containing user's name and email.
 * @param {number} score - The calculated score.
 * @param {number} totalQuestions - The total number of questions.
 */
async function saveScore(user, score, totalQuestions) {
    if (!user || !user.name) {
        console.error("Cannot save score: user name is null.");
        return;
    }
    try {
        await set(ref(db, 'users/' + user.name), { // Use name as the key
            name: user.name,
            email: user.email || 'Not provided', // Save email, default if empty
            score: score,
            correct: correctAnswers,
            wrong: wrongAnswers,
            total: totalQuestions,
            timestamp: new Date().toISOString() // Add a timestamp
        });
        console.log(`Score for ${user.name} saved successfully.`);
    } catch (error) {
        console.error("Error saving score:", error);
    }
}

/**
 * Initiates the quiz flow with provided user name and email.
 * @param {string} name - The user's name.
 * @param {string} email - The user's email (optional).
 * @param {function} onSuccessCallback - Callback to execute if quiz starts successfully.
 */
window.startQuiz = async function (name, email, onSuccessCallback) {
    if (!name) {
        if (modalErrorMessage) modalErrorMessage.textContent = 'Name is required to start the quiz.';
        return;
    }

    if (modalErrorMessage) modalErrorMessage.textContent = 'Checking user...';

    // Check if the user (by name) has already taken the quiz
    const exists = await checkUserExist(name);
    if (exists) {
        if (modalErrorMessage) modalErrorMessage.textContent = `User '${name}' has already taken the quiz. Please use a different name or view the leaderboard.`;
        return;
    }

    // If user does not exist, proceed
    currentUser.name = name;
    currentUser.email = email; // Store email
    currentQuestion = 0;
    correctAnswers = 0;
    wrongAnswers = 0;

    if (onSuccessCallback) {
        onSuccessCallback(); // Hide the modal
    }
    loadQuestion();
};

/**
 * Loads and displays the current quiz question.
 */
function loadQuestion() {
    if (currentQuestion >= questions.length) {
        showResult();
        return;
    }

    const q = questions[currentQuestion];
    appDiv.innerHTML = `
        <h2>Question ${currentQuestion + 1} of ${questions.length}</h2>
        <p>${q.question}</p>
        ${q.options.map((opt, index) =>
            `<button onclick="selectAnswer(${index + 1})">${opt}</button>`
        ).join('')}
    `;
}

/**
 * Handles the user's answer selection.
 * @param {number} selected - The index (1-based) of the selected option.
 */
window.selectAnswer = function (selected) {
    if (selected === questions[currentQuestion].correct) {
        correctAnswers++;
    } else {
        wrongAnswers++;
    }
    currentQuestion++;
    loadQuestion();
};

/**
 * Displays the final quiz result, saves the score, and calculates rank.
 */
async function showResult() {
    const totalQuestions = questions.length;
    // Score calculation: 1 point for correct, -0.25 for wrong
    const score = (correctAnswers * 1) - (wrongAnswers * 0.25);
    await saveScore(currentUser, score, totalQuestions); // Pass currentUser object
    calculateRank(score);
}

/**
 * Calculates the user's rank and percentile based on all participants' scores.
 * @param {number} userScore - The current user's score.
 */
async function calculateRank(userScore) {
    const dbRef = ref(db);
    try {
        const snapshot = await get(child(dbRef, 'users'));

        if (snapshot.exists()) {
            const allUsers = snapshot.val();
            const allScores = [];

            for (let userKey in allUsers) {
                const userData = allUsers[userKey];
                if (userData.score !== undefined) {
                    allScores.push(userData.score);
                }
            }

            allScores.sort((a, b) => b - a); // Sort in descending order

            // Find the rank of the current user's score.
            // If multiple users have the same score, they share the same rank.
            const uniqueScores = [...new Set(allScores)];
            const rank = uniqueScores.indexOf(userScore) + 1;
            const totalParticipants = allScores.length;

            const percentagePosition = totalParticipants > 0 ? ((totalParticipants - rank) / totalParticipants) * 100 : 0;

            appDiv.innerHTML = `
                <h2>Quiz Completed!</h2>
                <p>Your Score: ${userScore.toFixed(2)}</p>
                <p>Correct Answers: ${correctAnswers}</p>
                <p>Wrong Answers: ${wrongAnswers}</p>
                <p>Your Rank: ${rank} out of ${totalParticipants} participants</p>
                <p>Your Percentile: ${percentagePosition.toFixed(2)}% (You scored better than this percentage of participants)</p>
                <p><a href="leaderboard.html" target="_blank" style="color: #007bff; text-decoration: none; font-weight: bold;">View Leaderboard</a></p>
                <button onclick="window.location.reload()" style="margin-top: 20px;">Take Quiz Again</button>
            `;
        } else {
            appDiv.innerHTML = `
                <h2>Quiz Completed!</h2>
                <p>Your Score: ${userScore.toFixed(2)}</p>
                <p>Correct Answers: ${correctAnswers}</p>
                <p>Wrong Answers: ${wrongAnswers}</p>
                <p>You are the first participant! No rank yet.</p>
                <button onclick="window.location.reload()" style="margin-top: 20px;">Take Quiz Again</button>
            `;
        }
    } catch (error) {
        console.error("Error calculating rank:", error);
        appDiv.innerHTML = `
            <h2>Quiz Completed!</h2>
            <p>Your Score: ${userScore.toFixed(2)}</p>
            <p>Correct Answers: ${correctAnswers}</p>
            <p>Wrong Answers: ${wrongAnswers}</p>
            <p>Could not calculate rank due to an error. Please try again later.</p>
            <button onclick="window.location.reload()" style="margin-top: 20px;">Take Quiz Again</button>
        `;
    }
}
