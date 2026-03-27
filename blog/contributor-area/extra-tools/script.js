document.addEventListener('DOMContentLoaded', () => {
    const toggleButton = document.getElementById('theme-toggle');
    const body = document.body;
    const toggleIcon = document.getElementById('toggle-icon');

    // Modal elements
    const storyModalOverlay = document.getElementById('storyModalOverlay');
    const closeStoryModalButton = document.getElementById('closeStoryModal');
    const modalProjectName = document.getElementById('modalProjectName');
    const modalStoryContent = document.getElementById('modalStoryContent');


    // --- Theme Toggle Script ---
    const savedTheme = localStorage.getItem('theme');
    
    const applyTheme = (theme) => {
        if (theme === 'light') {
            body.classList.add('light-theme');
            toggleIcon.textContent = '🌙'; 
        } else {
            body.classList.remove('light-theme');
            toggleIcon.textContent = '💡'; 
        }
    };

    if (savedTheme) {
        applyTheme(savedTheme);
    } else {
        if (window.matchMedia && window.matchMedia('(prefers-color-scheme: light)').matches) {
            applyTheme('light');
        } else {
            applyTheme('dark');
        }
    }

    toggleButton.addEventListener('click', () => {
        const currentTheme = body.classList.contains('light-theme') ? 'light' : 'dark';
        const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
        
        applyTheme(newTheme);
        
        localStorage.setItem('theme', newTheme);
    });


    // --- Dynamic Card Loading Script ---

    const cardsContainer = document.getElementById('project-cards-container');
    const DATA_URL = './data/data.json'; // Path based on your folder structure

    /**
     * Converts URLs in a string to clickable HTML anchor tags.
     * @param {string} text - The text content possibly containing URLs.
     * @returns {string} The text with URLs converted to links.
     */
    function linkify(text) {
        // Regex to find URLs (http, https, ftp, file, www.)
        const urlRegex = /(https?:\/\/[^\s]+)|(www\.[^\s]+)/g;
        return text.replace(urlRegex, (url) => {
            let displayUrl = url;
            let href = url;

            // Prepend 'http://' if it's a www. link without protocol
            if (url.startsWith('www.')) {
                href = 'http://' + url;
            }
            
            return `<a href="${href}" target="_blank" rel="noopener noreferrer">${displayUrl}</a>`;
        });
    }

    /**
     * Creates the HTML structure for a single card based on the project data.
     * @param {Object} project - The project object from the JSON.
     * @returns {string} The HTML string for the card.
     */
    function createCardHTML(project) {
        const adjustedImagePath = project.image.replace('../', ''); 
        
        // 1. Conditional tag rendering (Top Left)
        const hasTag = project.tag && project.tag.trim().length > 0;
        const tagHTML = hasTag
            ? `<div class="card-tag">${project.tag}</div>`
            : '';

        // 2. Conditional story button rendering (Top Right)
        const hasStory = project.story && project.story.trim().length > 0;
        const storyButtonHTML = hasStory
            ? `<button class="card-button show-story-btn" data-project-name="${project.name}" data-project-story="${encodeURIComponent(project.story)}">Show Story</button>`
            : '';
        
        // 3. Conditional description rendering (Bottom Overlay)
        const hasDescription = project.description && project.description.trim().length > 0;
        const descriptionHTML = hasDescription
            ? `<p style="margin-top: 8px; font-size: 0.9rem; font-weight: normal; color: var(--text-primary); text-shadow: none;">${project.description}</p>`
            : '';

        // 4. Determine if the card should be clickable
        const isClickable = project.path !== "";
        const wrapperTag = isClickable ? 'a' : 'div';
        const wrapperClass = isClickable ? 'link-card' : 'non-clickable-card';
        const hrefAttribute = isClickable ? `href="${project.path}"` : '';
        
        // 5. Determine project name for display
        const displayName = (project.name && project.name.trim().length > 0) ? project.name : 'No Name';


        return `<${wrapperTag} ${hrefAttribute} class="${wrapperClass} card-${project.id}">` +
                    `<img src="${adjustedImagePath}" alt="${displayName} preview">` +
                    tagHTML +         /* Top Left */
                    storyButtonHTML + /* Top Right */
                    '<div class="overlay">' + 
                        displayName +
                        descriptionHTML +
                    '</div>' +
               `</${wrapperTag}>`;
    }

    // Fetch the JSON data and build the cards
    fetch(DATA_URL)
        .then(response => {
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            return response.json();
        })
        .then(data => {
            if (Array.isArray(data)) {
                const cardsHTML = data.map(createCardHTML).join('');
                cardsContainer.innerHTML = cardsHTML;

                // Attach event listeners to all "Show Story" buttons after they are in the DOM
                document.querySelectorAll('.show-story-btn').forEach(button => {
                    button.addEventListener('click', (event) => {
                        // IMPORTANT: Check if modal elements were successfully retrieved
                        if (!modalProjectName || !modalStoryContent || !storyModalOverlay) {
                            console.error("Modal elements not found. Check HTML IDs.");
                            return;
                        }

                        event.preventDefault();
                        event.stopPropagation();

                        const projectName = button.dataset.projectName;
                        const projectStoryEncoded = button.dataset.projectStory;
                        const projectStory = decodeURIComponent(projectStoryEncoded);

                        // Conditionally set modal project name
                        if (projectName && projectName.trim().length > 0) {
                            modalProjectName.textContent = projectName;
                            modalProjectName.style.display = '';
                        } else {
                            modalProjectName.textContent = '';
                            modalProjectName.style.display = 'none';
                        }
                        
                        modalStoryContent.innerHTML = '<p>' + linkify(projectStory) + '</p>'; 
                        storyModalOverlay.classList.add('active');
                        document.body.style.overflow = 'hidden';
                    });
                });

            } else {
                console.error('Fetched data is not an array:', data);
                cardsContainer.innerHTML = '<p>Error loading projects: Data format is incorrect.</p>';
            }
        })
        .catch(error => {
            console.error('Error fetching project data:', error);
            cardsContainer.innerHTML = '<p>Error loading projects. Please check the console for details.</p>';
        });


    // --- Modal Close Logic ---
    
    if (closeStoryModalButton) {
        closeStoryModalButton.addEventListener('click', () => {
            storyModalOverlay.classList.remove('active');
            document.body.style.overflow = '';
        });
    }

    if (storyModalOverlay) {
        // Close modal if user clicks outside the story-modal content
        storyModalOverlay.addEventListener('click', (event) => {
            if (event.target === storyModalOverlay) {
                storyModalOverlay.classList.remove('active');
                document.body.style.overflow = '';
            }
        });
    }

    // Close modal with Escape key
    document.addEventListener('keydown', (event) => {
        if (storyModalOverlay && event.key === 'Escape' && storyModalOverlay.classList.contains('active')) {
            storyModalOverlay.classList.remove('active');
            document.body.style.overflow = '';
        }
    });

});
