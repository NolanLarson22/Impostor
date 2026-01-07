document.addEventListener('DOMContentLoaded', () => {
    const playersGrid = document.getElementById('players-grid');
    const revealScreen = document.getElementById('reveal-screen');
    const revealContent = document.getElementById('reveal-content');
    const categoryNameDiv = document.getElementById('category-name');
    const imposterTitle = document.getElementById('imposter-title');
    const crewWord = document.getElementById('crew-word');
    const imposterHint = document.getElementById('imposter-hint');
    const hintWordSpan = document.getElementById('hint-word');
    const passBtn = document.getElementById('pass-btn');
    const startDiscussionBtn = document.getElementById('start-discussion-btn');

    const round = JSON.parse(localStorage.getItem('imposterRound') || 'null');
    if (!round || !Array.isArray(round.players) || round.players.length === 0) {
        alert('No round data found. Please complete setup first.');
        window.location.replace('setup.html');
        return;
    }

    const players = round.players;
    const categoryName = round.category || 'Unknown';
    let revealedCount = 0;

    players.forEach((player, index) => {
        const isImposter = player.role === 'imposter';

        const card = document.createElement('div');
        card.className = 'player-card';
        card.innerHTML = `<div class="player-name">${player.name}</div>`;

        card.addEventListener('click', () => {
            if (card.classList.contains('revealed')) return;

            // Reset previous state
            revealContent.classList.remove('crewmate-glow', 'imposter-glow');
            imposterTitle.classList.add('hidden');
            crewWord.textContent = '';
            imposterHint.classList.add('hidden');
            categoryNameDiv.textContent = categoryName;

            if (isImposter) {
                // IMPOSTER REVEAL
                revealContent.classList.add('imposter-glow');
                imposterTitle.classList.remove('hidden');
                imposterHint.classList.remove('hidden');
                hintWordSpan.textContent = player.displayWord || '';
            } else {
                // CREWMATE REVEAL
                revealContent.classList.add('crewmate-glow');
                crewWord.textContent = player.displayWord || '';
            }

            revealScreen.classList.remove('hidden');

            card.classList.add('revealed');
            revealedCount++;

            if (revealedCount === players.length) {
                startDiscussionBtn.classList.remove('hidden');
            }
        });

        playersGrid.appendChild(card);
    });

    passBtn.addEventListener('click', () => {
        revealScreen.classList.add('hidden');
    });

    startDiscussionBtn.addEventListener('click', () => {
        window.location.replace('voting.html');
    });
});
