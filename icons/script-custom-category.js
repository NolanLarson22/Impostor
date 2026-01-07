document.addEventListener('DOMContentLoaded', () => {
    const categoryNameInput = document.getElementById('category-name');
    const wordsContainer = document.getElementById('words-container');
    const addWordBtn = document.getElementById('add-word-btn');
    const saveCategoryBtn = document.getElementById('save-category-btn');
    const cancelBtn = document.getElementById('cancel-btn');
    const validationMessage = document.getElementById('validation-message');
    const customBackBtn = document.getElementById('custom-back-btn');

    let wordCount = 0;
    const editingCategoryName = sessionStorage.getItem('editingCategory');
    let isEditMode = false;

    // Handle back button
    const returnUrl = sessionStorage.getItem('customCategoryReturn') || 'setup.html';
    if (customBackBtn) {
        customBackBtn.addEventListener('click', () => {
            sessionStorage.removeItem('editingCategory');
            sessionStorage.removeItem('customCategoryReturn');
            window.location.replace(returnUrl);
        });
    }

    function createWordEntry(wordText = '', hints = []) {
        wordCount++;
        const wordEntry = document.createElement('div');
        wordEntry.className = 'word-entry';
        wordEntry.dataset.wordId = wordCount;
        
        wordEntry.innerHTML = `
            <button class="remove-word-btn" data-word-id="${wordCount}">Remove</button>
            <label>Word ${wordCount}:</label>
            <input type="text" class="word-input" placeholder="Enter word..." data-word-id="${wordCount}" value="${wordText}">
            <div class="hints-container" data-word-id="${wordCount}">
                <label>Hint Words:</label>
                ${hints.length > 0 ? hints.map(hint => `<input type="text" class="hint-input" placeholder="Enter hint word..." value="${hint}">`).join('') : '<input type="text" class="hint-input" placeholder="Enter hint word...">'}
                <button class="add-hint-btn" data-word-id="${wordCount}">+ Add Another Hint</button>
            </div>
        `;
        
        wordsContainer.appendChild(wordEntry);
        
        // Add event listener for add hint button
        const addHintBtn = wordEntry.querySelector('.add-hint-btn');
        addHintBtn.addEventListener('click', () => {
            const hintsContainer = wordEntry.querySelector('.hints-container');
            const newHintInput = document.createElement('input');
            newHintInput.type = 'text';
            newHintInput.className = 'hint-input';
            newHintInput.placeholder = 'Enter hint word...';
            hintsContainer.insertBefore(newHintInput, addHintBtn);
        });
        
        // Add event listener for remove word button
        const removeBtn = wordEntry.querySelector('.remove-word-btn');
        removeBtn.addEventListener('click', () => {
            wordEntry.remove();
            renumberWords();
        });
    }

    function renumberWords() {
        const entries = wordsContainer.querySelectorAll('.word-entry');
        entries.forEach((entry, index) => {
            const label = entry.querySelector('label');
            label.textContent = `Word ${index + 1}:`;
        });
    }

    function validateAndGetCategory() {
        const categoryName = categoryNameInput.value.trim();
        if (!categoryName) {
            return { valid: false, error: 'Please enter a category name.' };
        }

        const wordEntries = wordsContainer.querySelectorAll('.word-entry');
        if (wordEntries.length < 10) {
            return { valid: false, error: `You need at least 10 words. Currently have ${wordEntries.length}.` };
        }

        const categoryData = {};
        const wordNames = new Set();

        for (let i = 0; i < wordEntries.length; i++) {
            const entry = wordEntries[i];
            const wordInput = entry.querySelector('.word-input');
            const word = wordInput.value.trim();

            if (!word) {
                return { valid: false, error: `Word ${i + 1} is empty.` };
            }

            if (wordNames.has(word.toLowerCase())) {
                return { valid: false, error: `Duplicate word found: "${word}"` };
            }
            wordNames.add(word.toLowerCase());

            const hintInputs = entry.querySelectorAll('.hint-input');
            const hints = [];
            
            for (let j = 0; j < hintInputs.length; j++) {
                const hint = hintInputs[j].value.trim();
                if (hint) {
                    hints.push(hint);
                }
            }

            if (hints.length === 0) {
                return { valid: false, error: `Word "${word}" needs at least one hint word.` };
            }

            categoryData[word] = hints;
        }

        return { valid: true, categoryName, categoryData };
    }

    // Check if we're editing an existing category
    if (editingCategoryName) {
        isEditMode = true;
        const customCategories = JSON.parse(localStorage.getItem('customCategories') || '{}');
        const categoryData = customCategories[editingCategoryName];
        
        if (categoryData) {
            categoryNameInput.value = editingCategoryName;
            
            // Load existing words and hints
            Object.entries(categoryData).forEach(([word, hints]) => {
                createWordEntry(word, hints);
            });
        }
        
        sessionStorage.removeItem('editingCategory');
    } else {
        // Initialize with 10 word entries (minimum required) for new categories
        for (let i = 0; i < 10; i++) {
            createWordEntry();
        }
    }

    addWordBtn.addEventListener('click', () => {
        createWordEntry();
    });

    cancelBtn.addEventListener('click', () => {
        if (confirm('Are you sure you want to cancel? Your custom category will not be saved.')) {
            const returnUrl = sessionStorage.getItem('customCategoryReturnUrl') || 'setup.html';
            sessionStorage.removeItem('customCategoryReturnUrl');
            window.location.replace(returnUrl);
        }
    });

    saveCategoryBtn.addEventListener('click', () => {
        const result = validateAndGetCategory();
        
        if (!result.valid) {
            validationMessage.textContent = result.error;
            validationMessage.classList.add('show');
            return;
        }

        validationMessage.classList.remove('show');

        // Load existing custom categories
        const customCategories = JSON.parse(localStorage.getItem('customCategories') || '{}');
        
        // Check if category name already exists (unless we're editing that same category)
        if (customCategories[result.categoryName] && (!isEditMode || result.categoryName !== editingCategoryName)) {
            if (!confirm(`A category named "${result.categoryName}" already exists. Do you want to overwrite it?`)) {
                return;
            }
        }

        // Save the new category
        customCategories[result.categoryName] = result.categoryData;
        
        // If editing and name changed, delete the old category
        if (isEditMode && editingCategoryName && result.categoryName !== editingCategoryName) {
            delete customCategories[editingCategoryName];
        }
        
        localStorage.setItem('customCategories', JSON.stringify(customCategories));

        alert(`Category "${result.categoryName}" saved successfully!`);
        
        // Return to the page that sent us here
        const returnUrl = sessionStorage.getItem('customCategoryReturnUrl') || 'setup.html';
        sessionStorage.removeItem('customCategoryReturnUrl');
        window.location.href = returnUrl;
    });
});
