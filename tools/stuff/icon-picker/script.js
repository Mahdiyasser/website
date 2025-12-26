document.addEventListener('DOMContentLoaded', () => {
    if (typeof fontAwesomeMetadata === 'undefined' || typeof fontAwesomeCategories === 'undefined') {
        alert("Metadata or Categories missing.");
        return;
    }

    // State management
    let currentView = 'list'; // 'list' or 'section'
    const allIconsMap = {};
    const flatIconList = [];

    // 1. Process Data
    for (const [name, data] of Object.entries(fontAwesomeMetadata)) {
        data.styles.forEach(style => {
            let prefix = 'fa-solid'; 
            if (style === 'brands') prefix = 'fa-brands';
            else if (style === 'regular') prefix = 'fa-regular';
            else if (style === 'light') prefix = 'fa-light';
            else if (style === 'thin') prefix = 'fa-thin';
            else if (style === 'duotone') prefix = 'fa-duotone';

            const iconObj = {
                name: name,
                style: style, 
                class: `${prefix} fa-${name}`,
                label: data.label,
                searchTerms: data.search ? data.search.terms : []
            };

            if (!allIconsMap[name]) allIconsMap[name] = [];
            allIconsMap[name].push(iconObj);
            flatIconList.push(iconObj);
        });
    }

    flatIconList.sort((a, b) => a.name.localeCompare(b.name));

    // 2. Setup View Toggle
    const viewBtn = document.getElementById('viewToggle');
    viewBtn.addEventListener('click', () => {
        currentView = currentView === 'list' ? 'section' : 'list';
        viewBtn.textContent = currentView === 'list' ? 'Switch to Section View' : 'Switch to List View';
        filterAndRender();
    });

    // 3. Initialize
    populateCategoryDropdown();
    setupInteractions();
    filterAndRender();

    function filterAndRender() {
        const query = document.getElementById('searchInput').value.toLowerCase();
        const selectedStyle = document.getElementById('styleFilter').value;
        const selectedCategory = document.getElementById('categoryFilter').value;
        const container = document.getElementById('iconContainer');
        
        container.innerHTML = '';
        container.className = currentView === 'list' ? 'list-view' : '';

        if (currentView === 'section') {
            renderSectionedView(container, query, selectedStyle, selectedCategory);
        } else {
            renderListView(container, query, selectedStyle, selectedCategory);
        }
    }

    function renderListView(container, query, style, category) {
        // Filter the flat list
        const filtered = flatIconList.filter(icon => {
            if (style !== 'all' && icon.style !== style) return false;
            
            // For category filter in List View, we check if the icon belongs to that category
            if (category !== 'all') {
                const catData = fontAwesomeCategories[category];
                if (!catData || !catData.icons.includes(icon.name)) return false;
            }

            return icon.name.includes(query) || 
                   icon.label.toLowerCase().includes(query) || 
                   (icon.searchTerms && icon.searchTerms.some(t => t.toLowerCase().includes(query)));
        });

        // Optimization: limit render to 5000 icons for performance in flat view
        const toRender = filtered.slice(0, 5000);
        const fragment = document.createDocumentFragment();
        toRender.forEach(icon => fragment.appendChild(createIconCard(icon)));
        container.appendChild(fragment);
        updateCounter(filtered.length);
    }

    function renderSectionedView(container, query, style, category) {
        let totalCount = 0;
        let cats = Object.entries(fontAwesomeCategories);
        if (category !== 'all') cats = [[category, fontAwesomeCategories[category]]];

        cats.forEach(([slug, data]) => {
            const validIcons = [];
            data.icons.forEach(name => {
                const variants = allIconsMap[name] || [];
                variants.forEach(v => {
                    if (style !== 'all' && v.style !== style) return;
                    const match = v.name.includes(query) || v.label.toLowerCase().includes(query) || 
                                (v.searchTerms && v.searchTerms.some(t => t.toLowerCase().includes(query)));
                    if (match) validIcons.push(v);
                });
            });

            if (validIcons.length > 0) {
                totalCount += validIcons.length;
                const section = document.createElement('div');
                section.className = 'category-section';
                section.innerHTML = `<div class="category-header">${data.label} <span class="category-count">${validIcons.length}</span></div>`;
                const grid = document.createElement('div');
                grid.className = 'icon-grid';
                validIcons.forEach(icon => grid.appendChild(createIconCard(icon)));
                section.appendChild(grid);
                container.appendChild(section);
            }
        });
        updateCounter(totalCount);
    }

    function createIconCard(icon) {
        const card = document.createElement('div');
        card.className = 'icon-card';
        card.innerHTML = `
            <i class="${icon.class}"></i>
            <span>${icon.name}</span>
            <div class="icon-detail-popup">
                <i class="${icon.class}"></i>
                <div class="icon-name">${icon.label}</div>
                <div class="icon-class">${icon.class}</div>
            </div>`;
        card.onclick = () => {
            navigator.clipboard.writeText(`<i class="${icon.class}"></i>`);
            showToast();
        };
        return card;
    }

    function setupInteractions() {
        ['searchInput', 'styleFilter', 'categoryFilter'].forEach(id => {
            document.getElementById(id).addEventListener('input', filterAndRender);
            document.getElementById(id).addEventListener('change', filterAndRender);
        });
    }

    function populateCategoryDropdown() {
        const select = document.getElementById('categoryFilter');
        Object.entries(fontAwesomeCategories).forEach(([slug, data]) => {
            const opt = document.createElement('option');
            opt.value = slug;
            opt.textContent = data.label;
            select.appendChild(opt);
        });
    }

    function updateCounter(count) {
        document.getElementById('counter').innerText = `Total Icons: ${count}`;
    }
});

function showToast() {
    const toast = document.getElementById('toast');
    toast.style.display = 'block';
    toast.style.opacity = '1';
    setTimeout(() => { toast.style.opacity = '0'; setTimeout(() => toast.style.display = 'none', 300); }, 2000);
}
