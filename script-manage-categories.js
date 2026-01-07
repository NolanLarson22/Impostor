document.addEventListener('DOMContentLoaded', () => {
    const categoriesList = document.getElementById('categories-list');
    const backBtn = document.getElementById('back-btn');
    const manageBackBtn = document.getElementById('manage-back-btn');
    
    // Handle back button in header
    const returnUrl = sessionStorage.getItem('manageCategoriesReturn') || 'setup.html';
    if (manageBackBtn) {
        manageBackBtn.addEventListener('click', () => {
            sessionStorage.removeItem('manageCategoriesReturn');
            window.location.replace(returnUrl);
        });
    }
    
    function renderCategories() {
        const customCategories = JSON.parse(localStorage.getItem('customCategories') || '{}');
        const categoryNames = Object.keys(customCategories);
        
        if (categoryNames.length === 0) {
            categoriesList.innerHTML = '<div class="no-categories">No custom categories created yet.</div>';
            return;
        }
        
        categoriesList.innerHTML = '<div class="category-list">' + categoryNames.map(categoryName => {
            const categoryData = customCategories[categoryName];
            const wordCount = Object.keys(categoryData).length;
            const totalHints = Object.values(categoryData).reduce((sum, hints) => sum + hints.length, 0);
            const displayName = categoryName.length > 8 ? categoryName.substring(0, 8) + '...' : categoryName;
            
            return `
                <div class="category-item" data-category="${categoryName}">
                    <div class="category-header">
                        <div class="category-name">${displayName}</div>
                        <div class="category-actions">
                            <button class="edit-btn" data-category="${categoryName}">Edit</button>
                            <button class="delete-btn" data-category="${categoryName}">Delete</button>
                        </div>
                    </div>
                    <div class="category-stats">
                        ${wordCount} words • ${totalHints} total hints
                    </div>
                </div>
            `;
        }).join('') + '</div>';
        
        // Add event listeners
        document.querySelectorAll('.edit-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const categoryName = e.target.dataset.category;
                editCategory(categoryName);
            });
        });
        
        document.querySelectorAll('.delete-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const categoryName = e.target.dataset.category;
                deleteCategory(categoryName);
            });
        });
    }
    
    function editCategory(categoryName) {
        // Store the category to edit
        sessionStorage.setItem('editingCategory', categoryName);
        sessionStorage.setItem('customCategoryReturnUrl', 'manage-categories.html');
        window.location.replace('custom-category.html');
    }
    
    function deleteCategory(categoryName) {
        if (!confirm(`Are you sure you want to delete the category "${categoryName}"? This cannot be undone.`)) {
            return;
        }
        
        const customCategories = JSON.parse(localStorage.getItem('customCategories') || '{}');
        delete customCategories[categoryName];
        localStorage.setItem('customCategories', JSON.stringify(customCategories));
        
        // Also clear used words for this category
        const usedWordsByCategory = JSON.parse(localStorage.getItem('usedWordsByCategory') || '{}');
        if (usedWordsByCategory[categoryName]) {
            delete usedWordsByCategory[categoryName];
            localStorage.setItem('usedWordsByCategory', JSON.stringify(usedWordsByCategory));
        }
        
        renderCategories();
    }
    
    backBtn.addEventListener('click', () => {
        const returnUrl = sessionStorage.getItem('customCategoryReturnUrl') || 'setup.html';
        sessionStorage.removeItem('customCategoryReturnUrl');
        window.location.replace(returnUrl);
    });
    
    renderCategories();
});
