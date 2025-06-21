// /quiz/leaderboard.js

import { initializeApp } from "https://www.gstatic.com/firebasejs/9.6.10/firebase-app.js";
import { getDatabase, ref, onValue } from "https://www.gstatic.com/firebasejs/9.6.10/firebase-database.js";

// Firebase configuration
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

const scoresList = document.getElementById('scores');
const searchInput = document.getElementById('search');
const prevBtn = document.getElementById('prev');
const nextBtn = document.getElementById('next');
const pageInfo = document.getElementById('page-info');

let scores = [];
let currentPage = 1;
const itemsPerPage = 10;

/**
 * Renders the current page of scores on the leaderboard.
 * @param {number} page - The page number to render.
 */
function renderPage(page = 1) {
    currentPage = page;
    const start = (page - 1) * itemsPerPage;
    const end = start + itemsPerPage;
    const pageScores = scores.slice(start, end);

    scoresList.innerHTML = pageScores.map((entry, index) => {
        // Calculate rank based on the full sorted scores array
        const rank = scores.findIndex(s => s.name === entry.name && s.score === entry.score) + 1;
        // Calculate percentile based on the full sorted scores array
        const percentile = scores.length > 0 ? (((scores.length - rank) / scores.length) * 100).toFixed(2) : '0.00';
        return `<li><strong>Rank ${rank}</strong>: ${entry.name} (${entry.email || 'N/A'}) - Score: ${entry.score} | Percentile: ${percentile}%</li>`;
    }).join('');

    pageInfo.innerText = `Page ${currentPage} of ${Math.ceil(scores.length / itemsPerPage)}`;
}

/**
 * Sets up event listeners for pagination buttons.
 */
function setupPagination() {
    prevBtn.onclick = () => {
        if (currentPage > 1) {
            currentPage--;
            renderPage(currentPage);
        }
    };

    nextBtn.onclick = () => {
        if (currentPage < Math.ceil(scores.length / itemsPerPage)) {
            currentPage++;
            renderPage(currentPage);
        }
    };
}

/**
 * Sets up event listener for the search input.
 */
function setupSearch() {
    searchInput.addEventListener('input', () => {
        const query = searchInput.value.trim().toLowerCase();
        if (query) {
            const filteredScores = scores.filter(score => score.name.toLowerCase().includes(query) || (score.email && score.email.toLowerCase().includes(query)));
            displaySearchResults(filteredScores);
        } else {
            renderPage(currentPage); // Go back to pagination view if search is cleared
        }
    });
}

/**
 * Displays search results on the leaderboard.
 * @param {Array<Object>} filteredScores - The scores filtered by the search query.
 */
function displaySearchResults(filteredScores) {
    if (filteredScores.length === 0) {
        scoresList.innerHTML = '<li>No matching results found.</li>';
        pageInfo.innerText = 'Search Results: 0 found';
        return;
    }

    scoresList.innerHTML = filteredScores.map((entry) => {
        // Find the original rank for the searched entry from the full sorted scores array
        const rank = scores.findIndex(s => s.name === entry.name && s.score === entry.score) + 1;
        const percentile = scores.length > 0 ? (((scores.length - rank) / scores.length) * 100).toFixed(2) : '0.00';
        return `<li><strong>Rank ${rank}</strong>: ${entry.name} (${entry.email || 'N/A'}) - Score: ${entry.score} | Percentile: ${percentile}%</li>`;
    }).join('');

    pageInfo.innerText = `Search Results: ${filteredScores.length} found`;
}

/**
 * Loads leaderboard data from Firebase and initializes pagination and search.
 */
function loadLeaderboard() {
    const usersRef = ref(db, 'users');

    onValue(usersRef, (snapshot) => {
        const data = snapshot.val();
        scores = [];

        if (data) {
            for (let userId in data) {
                scores.push({
                    name: data[userId].name,
                    email: data[userId].email || 'Not provided',
                    score: data[userId].score !== undefined ? data[userId].score : 0 // Ensure score is a number
                });
            }
        }

        scores.sort((a, b) => b.score - a.score); // Sort by score descending

        // Reset current page to 1 if the scores data changes (e.g., new score added)
        currentPage = 1;
        renderPage(currentPage);
        setupPagination();
        setupSearch();
    }, (error) => {
        console.error("Error loading leaderboard data:", error);
        scoresList.innerHTML = '<li>Error loading leaderboard. Please try again.</li>';
    });
}

// Initial load of the leaderboard
document.addEventListener('DOMContentLoaded', loadLeaderboard);
