import { gameData } from './data.js';

document.addEventListener('DOMContentLoaded', () => {
    const playersGrid = document.getElementById('players-grid');
    const resultScreen = document.getElementById('result-screen');
    const voteResult = document.getElementById('vote-result');
    const votedNameEl = document.getElementById('voted-name');
    const imposterNameEl = document.getElementById('imposter-name');
    const realWordEl = document.getElementById('real-word');
    const scoreChangeEl = document.getElementById('score-change');
    const leaderboardEl = document.getElementById('leaderboard');
    const nextRoundBtn = document.getElementById('next-round-btn');
    const changeCategoryBtn = document.getElementById('change-category-btn');
    const newGameBtn = document.getElementById('new-game-btn');

    // Load round data
    const round = JSON.parse(localStorage.getItem('imposterRound') || 'null');
    if (!round || !Array.isArray(round.players) || round.players.length === 0) {
        alert('Error: Game data missing. Go back to setup.');
        window.location.href = 'setup.html';
        return;
    }

    const playerNames = round.players.map(p => p.name);
    const imposterPlayers = round.players.filter(p => p.role === 'imposter');
    const imposterName = imposterPlayers.length > 0 ? imposterPlayers[0].name : 'Unknown';

    let playerScores = JSON.parse(localStorage.getItem('playerScores') || '{}');

    // === ENSURE ALL PLAYERS ARE IN THE SCOREBOARD (even with 0) ===
    playerNames.forEach(name => {
        if (!(name in playerScores)) {
            playerScores[name] = 0;
        }
    });
    localStorage.setItem('playerScores', JSON.stringify(playerScores));

    // Determine max votes: if random impostor, allow any number, otherwise use impostor count
    const isRandomImpostor = localStorage.getItem('randomImpostorCount') === 'true';
    const maxVotes = isRandomImpostor ? playerNames.length : imposterPlayers.length;
    
    const votedIndices = new Set();
    const voteCounterEl = document.getElementById('vote-counter');
    const submitVotesBtn = document.getElementById('submit-votes-btn');
    
    function updateVoteCounter() {
        if (isRandomImpostor) {
            voteCounterEl.textContent = `Votes: ${votedIndices.size}`;
            // Show submit button if at least 1 vote selected
            if (votedIndices.size >= 1) {
                submitVotesBtn.classList.remove('hidden');
            } else {
                submitVotesBtn.classList.add('hidden');
            }
        } else {
            voteCounterEl.textContent = `Votes: ${votedIndices.size} / ${maxVotes}`;
            // Show submit button only when exact count is reached
            if (votedIndices.size === maxVotes) {
                submitVotesBtn.classList.remove('hidden');
            } else {
                submitVotesBtn.classList.add('hidden');
            }
        }
    }
    
    updateVoteCounter();

    // Create votable player cards
    playerNames.forEach((name, index) => {
        const card = document.createElement('div');
        card.className = 'player-card';
        card.innerHTML = `<div class="player-name">${name}</div>`;

        card.addEventListener('click', () => {
            if (!resultScreen.classList.contains('hidden')) return;

            // Toggle vote selection
            if (votedIndices.has(index)) {
                votedIndices.delete(index);
                card.classList.remove('voted');
            } else {
                // For random mode, allow selecting any player; for specific count, enforce max
                if (isRandomImpostor || votedIndices.size < maxVotes) {
                    votedIndices.add(index);
                    card.classList.add('voted');
                }
            }
            
            updateVoteCounter();
        });

        playersGrid.appendChild(card);
    });
    
    // Submit votes button handler
    submitVotesBtn.addEventListener('click', () => {
        if (votedIndices.size === 0) return;
        
        const votedPlayers = Array.from(votedIndices).map(idx => round.players[idx]);
        const votedNames = votedPlayers.map(p => p.name);
        
        // Separate caught and escaped impostors
        const caughtImpostors = votedPlayers.filter(p => p.role === 'imposter');
        const caughtImpostorNames = caughtImpostors.map(p => p.name);
        const escapedImpostors = imposterPlayers.filter(imp => !caughtImpostorNames.includes(imp.name));
        
        // Track score changes for each player
        const scoreChanges = {};
        
        // Scoring logic: Each caught impostor loses 1 point, each escaped impostor gains 1 point
        caughtImpostors.forEach(imp => {
            playerScores[imp.name] = (playerScores[imp.name] || 0) - 1;
            scoreChanges[imp.name] = -1;
        });
        
        escapedImpostors.forEach(imp => {
            playerScores[imp.name] = (playerScores[imp.name] || 0) + 1;
            scoreChanges[imp.name] = +1;
        });
        
        localStorage.setItem('playerScores', JSON.stringify(playerScores));

        // Update display
        votedNameEl.textContent = votedNames.join(', ');
        imposterNameEl.textContent = imposterPlayers.map(p => p.name).join(', ');
        realWordEl.textContent = round.selectedWord || round.realWord || 'Unknown';

        const allCaught = caughtImpostors.length === imposterPlayers.length;
        const allEscaped = escapedImpostors.length === imposterPlayers.length;
        
        if (allCaught) {
            voteResult.textContent = 'ALL IMPOSTORS CAUGHT!';
            voteResult.className = 'caught';
        } else if (allEscaped) {
            voteResult.textContent = 'IMPOSTORS ESCAPED!';
            voteResult.className = 'escaped';
        } else {
            voteResult.textContent = 'MIXED RESULTS!';
            voteResult.className = 'escaped';
        }
        
        // Hide the score change element since we're showing it in leaderboard
        scoreChangeEl.style.display = 'none';

        // Render leaderboard with score changes
        renderLeaderboard(scoreChanges);

        resultScreen.classList.remove('hidden');
    });

    function renderLeaderboard(scoreChanges = {}) {
        // Sort by score descending
        const sorted = playerNames
            .map(name => ({ name, score: playerScores[name] || 0 }))
            .sort((a, b) => b.score - a.score);

        leaderboardEl.innerHTML = sorted.map((player, idx) => {
            const change = scoreChanges[player.name];
            let changeHTML = '';
            if (change !== undefined) {
                const changeClass = change > 0 ? 'score-gain' : 'score-loss';
                const changeSign = change > 0 ? '+' : '';
                changeHTML = `<span class="${changeClass}">${changeSign}${change}</span> `;
            }
            return `
                <div class="leaderboard-item">
                    <span class="leaderboard-rank">#${idx + 1}</span>
                    <span class="leaderboard-name">${player.name}</span>
                    <span class="leaderboard-score">${changeHTML}${player.score}</span>
                </div>
            `;
        }).join('');
    }

    // Initial leaderboard render
    renderLeaderboard();

    // Next Round: New word from same category, same players (unless Random mode is active)
    nextRoundBtn.addEventListener('click', () => {
        const playerNames = JSON.parse(localStorage.getItem('imposterPlayers'));
        
        // Check if Random modes are active
        const randomCategory = localStorage.getItem('randomCategory') === 'true';
        const randomImpostorCount = localStorage.getItem('randomImpostorCount') === 'true';
        
        let category = round.category;
        let impostorCount = imposterPlayers.length;
        let allGameData = { ...gameData };
        
        // Load custom categories
        const customCategories = JSON.parse(localStorage.getItem('customCategories') || '{}');
        allGameData = { ...gameData, ...customCategories };
        
        // If Random category mode, pick a new random category
        if (randomCategory) {
            const allCategories = Object.keys(allGameData);
            category = allCategories[Math.floor(Math.random() * allCategories.length)];
        }
        
        // If Random impostor count mode, pick a new random count
        if (randomImpostorCount) {
            impostorCount = Math.floor(Math.random() * playerNames.length) + 1;
        }
        
        // Get session-level used words (all words used in this game)
        const sessionUsed = JSON.parse(localStorage.getItem('sessionUsedWords') || '[]');
        
        // Get words for category and filter used
        const words = Object.keys(allGameData[category] || {});
        const available = words.filter(w => !sessionUsed.includes(w));

        if (available.length === 0) {
            alert('You have gone through all the words in this category. Please click "Choose New Category" to continue playing with a different category.');
            return;
        }

        const selectedWord = available[Math.floor(Math.random() * available.length)];

        // Mark word as used in this session
        sessionUsed.push(selectedWord);
        localStorage.setItem('sessionUsedWords', JSON.stringify(sessionUsed));

        // Also mark in category-level tracking for future games
        const usedByCategory = JSON.parse(localStorage.getItem('usedWordsByCategory') || '{}');
        const categoryUsed = usedByCategory[category] || [];
        if (!categoryUsed.includes(selectedWord)) {
            categoryUsed.push(selectedWord);
            usedByCategory[category] = categoryUsed;
            localStorage.setItem('usedWordsByCategory', JSON.stringify(usedByCategory));
        }

        const hints = allGameData[category][selectedWord] || [];

        // Randomly pick impostor indices
        const indices = playerNames.map((_, i) => i);
        for (let i = indices.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [indices[i], indices[j]] = [indices[j], indices[i]];
        }
        const imposterIndices = new Set(indices.slice(0, impostorCount));

        // Shuffle hints and assign unique ones
        const hintPool = hints.slice();
        for (let i = hintPool.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [hintPool[i], hintPool[j]] = [hintPool[j], hintPool[i]];
        }

        const playersRound = playerNames.map((name, idx) => {
            if (imposterIndices.has(idx)) {
                const hint = hintPool.pop();
                return { name, role: 'imposter', displayWord: hint, realWord: selectedWord };
            } else {
                return { name, role: 'crewmate', displayWord: selectedWord, realWord: selectedWord };
            }
        });

        const newRound = { category, selectedWord, players: playersRound };
        localStorage.setItem('imposterRound', JSON.stringify(newRound));

        // Navigate to reveal
        window.location.href = 'roles.html';
    });

    // Change Category: Keep players and scores, choose new category
    changeCategoryBtn.addEventListener('click', () => {
        window.location.href = 'category-select.html';
    });

    // New Game: Reset everything
    newGameBtn.addEventListener('click', () => {
        localStorage.clear();
        window.location.href = 'setup.html';
    });
});
