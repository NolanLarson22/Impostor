// script.js - module-based player setup and category selection
import { gameData } from './data.js';

document.addEventListener('DOMContentLoaded', () => {
    const playerCountSelect = document.getElementById('playerCount');
    const startAddingBtn = document.getElementById('startAddingBtn');
    const playerCountStep = document.getElementById('player-count-step');
    const nameEntryStep = document.getElementById('name-entry-step');
    const playersContainer = document.getElementById('players-container');
    const currentCountSpan = document.getElementById('currentCount');
    const totalCountSpan = document.getElementById('totalCount');
    const proceedCategoryBtn = document.getElementById('proceedCategoryBtn');

    const categoryStep = document.getElementById('category-step');
    const categorySelect = document.getElementById('category');
    const impostorCountSelect = document.getElementById('impostorCount');
    const startGameBtn = document.getElementById('startGameBtn');

    let totalPlayers = 5;
    let players = [];
    
    // Function definitions and event listeners need to be set up before early returns
    function populateCategoryDropdown() {
        // populate categories with Random option and custom categories
        const categories = Object.keys(gameData);
        const customCategories = JSON.parse(localStorage.getItem('customCategories') || '{}');
        const customCategoryNames = Object.keys(customCategories);
        
        categorySelect.innerHTML = '';
        
        // Add built-in categories first
        categories.forEach(cat => {
            const opt = document.createElement('option');
            opt.value = cat;
            opt.textContent = cat;
            categorySelect.appendChild(opt);
        });
        
        // Add Random option
        const randomOpt = document.createElement('option');
        randomOpt.value = 'Random';
        randomOpt.textContent = 'Random';
        categorySelect.appendChild(randomOpt);
        
        // Add "Create Custom Category" option
        const createOpt = document.createElement('option');
        createOpt.value = 'CREATE_CUSTOM';
        createOpt.textContent = 'New Category';
        categorySelect.appendChild(createOpt);
        
        // Add "Manage Categories" option
        const manageOpt = document.createElement('option');
        manageOpt.value = 'MANAGE_CATEGORIES';
        manageOpt.textContent = 'Manage Custom Categories';
        categorySelect.appendChild(manageOpt);
        
        // Add custom categories
        if (customCategoryNames.length > 0) {
            const separator = document.createElement('option');
            separator.disabled = true;
            separator.textContent = 'Custom Categories';
            categorySelect.appendChild(separator);
            
            customCategoryNames.forEach(cat => {
                const opt = document.createElement('option');
                opt.value = 'CUSTOM:' + cat;
                opt.textContent = cat;
                categorySelect.appendChild(opt);
            });
        }

        // populate impostor count options with Random option (allow up to totalPlayers)
        impostorCountSelect.innerHTML = '';
        
        for (let i = 1; i <= totalPlayers; i++) {
            const opt = document.createElement('option');
            opt.value = i;
            opt.textContent = i;
            impostorCountSelect.appendChild(opt);
        }
        
        // Add Random option at the end
        const randomImpOpt = document.createElement('option');
        randomImpOpt.value = 'Random';
        randomImpOpt.textContent = 'Random';
        impostorCountSelect.appendChild(randomImpOpt);
    }
    
    // Check if we should skip to category selection
    const skipToCategorySelection = sessionStorage.getItem('skipToCategorySelection');
    if (skipToCategorySelection === 'true') {
        sessionStorage.removeItem('skipToCategorySelection');
        const savedPlayers = JSON.parse(localStorage.getItem('imposterPlayers') || '[]');
        if (savedPlayers.length > 0) {
            totalPlayers = savedPlayers.length;
            players = savedPlayers.map(name => ({ name }));
            
            // Hide steps 1 and 2, show step 3
            playerCountStep.classList.add('hidden');
            nameEntryStep.classList.add('hidden');
            categoryStep.classList.remove('hidden');
            
            // Populate category dropdown
            populateCategoryDropdown();
            // Don't return yet - we need to set up event listeners below
        }
    }

    startAddingBtn.addEventListener('click', () => {
        totalPlayers = parseInt(playerCountSelect.value);
        totalCountSpan.textContent = totalPlayers;
        currentCountSpan.textContent = '0';
        players = [];
        playersContainer.innerHTML = '';
        
        // Clear scores when starting a new game
        localStorage.removeItem('playerScores');
        localStorage.removeItem('sessionUsedWords');

        playerCountStep.classList.add('hidden');
        nameEntryStep.classList.remove('hidden');

        // Create all player cards at once
        for (let i = 0; i < totalPlayers; i++) {
            addPlayerCard();
        }
    });

    function addPlayerCard() {
        if (players.length >= totalPlayers) return;

        const index = players.length;
        const defaultName = `Name ${index + 1}`;

        const card = document.createElement('div');
        card.className = 'player-card';
        card.innerHTML = `
            <input type="text" value="" placeholder="${defaultName}" maxlength="7">
            <div class="player-number">#${index + 1}</div>
        `;

        const input = card.querySelector('input');

        input.addEventListener('input', () => {
            players[index].name = input.value.trim() || defaultName;
            updateProceedButton();
        });

        // Auto-focus the new input
        setTimeout(() => {
            input.focus();
        }, 100);

        playersContainer.appendChild(card);
        players.push({ name: defaultName });
        currentCountSpan.textContent = players.length;

        updateProceedButton();
    }

    // Enter key functionality removed - all cards are displayed at once

    function updateProceedButton() {
        const allHaveNames = players.every(p => p.name && p.name.trim() !== '');
        const fullCount = players.length === totalPlayers;
        proceedCategoryBtn.disabled = !(fullCount && allHaveNames);
    }

    proceedCategoryBtn.addEventListener('click', () => {
        const playerNames = players.map(p => p.name.trim());
        localStorage.setItem('imposterPlayers', JSON.stringify(playerNames));

        populateCategoryDropdown();

        nameEntryStep.classList.add('hidden');
        categoryStep.classList.remove('hidden');
    });

    startGameBtn.addEventListener('click', () => {
        const playerNames = JSON.parse(localStorage.getItem('imposterPlayers') || '[]');
        if (!playerNames || playerNames.length === 0) {
            alert('No players found. Please enter player names first.');
            return;
        }

        const categorySelection = categorySelect.value;
        
        // Check if user wants to create a custom category
        if (categorySelection === 'CREATE_CUSTOM') {
            sessionStorage.setItem('customCategoryReturnUrl', 'setup.html');
            sessionStorage.setItem('skipToCategorySelection', 'true');
            window.location.replace('custom-category.html');
            return;
        }
        
        // Check if user wants to manage categories
        if (categorySelection === 'MANAGE_CATEGORIES') {
            sessionStorage.setItem('customCategoryReturnUrl', 'setup.html');
            sessionStorage.setItem('skipToCategorySelection', 'true');
            window.location.replace('manage-categories.html');
            return;
        }
        
        const impostorCountSelection = impostorCountSelect.value;

        // Store whether Random was selected
        localStorage.setItem('randomCategory', categorySelection === 'Random' ? 'true' : 'false');
        localStorage.setItem('randomImpostorCount', impostorCountSelection === 'Random' ? 'true' : 'false');

        let category = categorySelection;
        let impostorCount = impostorCountSelection;
        let isCustomCategory = false;
        let allGameData = { ...gameData };
        
        // Handle custom categories
        if (category.startsWith('CUSTOM:')) {
            const customCategories = JSON.parse(localStorage.getItem('customCategories') || '{}');
            const customCategoryName = category.substring(7); // Remove 'CUSTOM:' prefix
            category = customCategoryName;
            isCustomCategory = true;
            allGameData = { ...gameData, ...customCategories };
        }

        // Handle Random category
        if (category === 'Random') {
            const customCategories = JSON.parse(localStorage.getItem('customCategories') || '{}');
            allGameData = { ...gameData, ...customCategories };
            const allCategories = Object.keys(allGameData);
            category = allCategories[Math.floor(Math.random() * allCategories.length)];
        }

        // Handle Random impostor count
        if (impostorCount === 'Random') {
            impostorCount = Math.floor(Math.random() * playerNames.length) + 1;
        } else {
            impostorCount = parseInt(impostorCount, 10);
        }

        // get words for category and filter used
        const words = Object.keys(allGameData[category] || {});
        const usedByCategory = JSON.parse(localStorage.getItem('usedWordsByCategory') || '{}');
        const used = usedByCategory[category] || [];
        const available = words.filter(w => !used.includes(w));

        if (available.length === 0) {
            alert('You have gone through all the words in this category. Please choose a new category.');
            return;
        }

        const selectedWord = available[Math.floor(Math.random() * available.length)];

        // mark used in category-level tracking (for future games)
        used.push(selectedWord);
        usedByCategory[category] = used;
        localStorage.setItem('usedWordsByCategory', JSON.stringify(usedByCategory));

        // Initialize session-level used words (for current game)
        localStorage.setItem('sessionUsedWords', JSON.stringify([selectedWord]));

        const hints = allGameData[category][selectedWord] || [];
        if (impostorCount > hints.length) {
            alert(`Only ${hints.length} unique hints available for this word. Reducing impostor count to ${hints.length}.`);
            impostorCount = hints.length;
        }

        // pick impostor indices
        const indices = playerNames.map((_, i) => i);
        // shuffle indices
        for (let i = indices.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [indices[i], indices[j]] = [indices[j], indices[i]];
        }
        const imposterIndices = new Set(indices.slice(0, impostorCount));

        // shuffle hints and take unique
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

        const round = { category, selectedWord, players: playersRound };
        localStorage.setItem('imposterRound', JSON.stringify(round));

        // navigate to reveal
        window.location.replace('roles.html');
    });
});
