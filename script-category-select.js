// script-category-select.js - Mid-game category selection
import { gameData } from './data.js';

document.addEventListener('DOMContentLoaded', () => {
    const categorySelect = document.getElementById('category');
    const impostorCountSelect = document.getElementById('impostorCount');
    const startGameBtn = document.getElementById('startGameBtn');

    // Load player names from existing game
    const playerNames = JSON.parse(localStorage.getItem('imposterPlayers') || '[]');
    if (!playerNames || playerNames.length === 0) {
        alert('No players found. Please start a new game.');
        window.location.replace('setup.html');
        return;
    }

    // Get the previous impostor count if available
    const previousRound = JSON.parse(localStorage.getItem('imposterRound') || 'null');
    const previousImpostorCount = previousRound 
        ? previousRound.players.filter(p => p.role === 'imposter').length 
        : 1;

    // Populate categories with Random option and custom categories
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

    // Populate impostor count options with Random option (allow up to totalPlayers)
    impostorCountSelect.innerHTML = '';
    
    // Add Random option first
    const randomImpOpt = document.createElement('option');
    randomImpOpt.value = 'Random';
    randomImpOpt.textContent = 'Random';
    impostorCountSelect.appendChild(randomImpOpt);
    
    for (let i = 1; i <= playerNames.length; i++) {
        const opt = document.createElement('option');
        opt.value = i;
        opt.textContent = i;
        if (i === previousImpostorCount) {
            opt.selected = true;
        }
        impostorCountSelect.appendChild(opt);
    }

    startGameBtn.addEventListener('click', () => {
        const categorySelection = categorySelect.value;
        
        // Check if user wants to create a custom category
        if (categorySelection === 'CREATE_CUSTOM') {
            sessionStorage.setItem('customCategoryReturnUrl', 'category-select.html');
            window.location.replace('custom-category.html');
            return;
        }
        
        // Check if user wants to manage categories
        if (categorySelection === 'MANAGE_CATEGORIES') {
            sessionStorage.setItem('customCategoryReturnUrl', 'category-select.html');
            window.location.replace('manage-categories.html');
            return;
        }
        
        const impostorCountSelection = impostorCountSelect.value;

        // Store whether Random was selected
        localStorage.setItem('randomCategory', categorySelection === 'Random' ? 'true' : 'false');
        localStorage.setItem('randomImpostorCount', impostorCountSelection === 'Random' ? 'true' : 'false');

        let category = categorySelection;
        let impostorCount = impostorCountSelection;
        let allGameData = { ...gameData };
        
        // Handle custom categories
        if (category.startsWith('CUSTOM:')) {
            const customCats = JSON.parse(localStorage.getItem('customCategories') || '{}');
            const customCategoryName = category.substring(7); // Remove 'CUSTOM:' prefix
            category = customCategoryName;
            allGameData = { ...gameData, ...customCats };
        }

        // Handle Random category
        if (category === 'Random') {
            const customCats = JSON.parse(localStorage.getItem('customCategories') || '{}');
            allGameData = { ...gameData, ...customCats };
            const allCategories = Object.keys(allGameData);
            category = allCategories[Math.floor(Math.random() * allCategories.length)];
        }

        // Handle Random impostor count
        if (impostorCount === 'Random') {
            impostorCount = Math.floor(Math.random() * playerNames.length) + 1;
        } else {
            impostorCount = parseInt(impostorCount, 10);
        }

        // Get session-level used words (all words used in this game)
        const sessionUsed = JSON.parse(localStorage.getItem('sessionUsedWords') || '[]');
        
        // Get words for category and filter used
        const words = Object.keys(allGameData[category] || {});
        const available = words.filter(w => !sessionUsed.includes(w));

        if (available.length === 0) {
            alert('You have gone through all the words in this category too. Please choose a different category.');
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
        if (impostorCount > hints.length) {
            alert(`Only ${hints.length} unique hints available for this word. Reducing impostor count to ${hints.length}.`);
            impostorCount = hints.length;
        }

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

        const round = { category, selectedWord, players: playersRound };
        localStorage.setItem('imposterRound', JSON.stringify(round));

        // Navigate to reveal
        window.location.replace('roles.html');
    });
});
