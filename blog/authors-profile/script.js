let authorsData = [];
// Corrected path as requested
const JSON_FILE_PATH = '../data/authors.json';

const authorListContainer = document.getElementById('author-list');
const loadingMessage = document.getElementById('loading-message');
const errorMessageDiv = document.getElementById('error-message');
const profileView = document.getElementById('profile-view');
const profileContent = document.getElementById('profile-content');

let currentImageIndex = 0;
let authorMedia = []; // Stores the parsed images for the currently viewed author

// --- Dark Mode Logic ---
const htmlElement = document.documentElement;

/**
 * Applies the selected theme based on localStorage or system preference.
 */
function applyTheme() {
    // Check localStorage or system preference
    const isDarkMode = localStorage.getItem('theme') === 'dark' || 
                        (!('theme' in localStorage) && window.matchMedia('(prefers-color-scheme: dark)').matches);
    
    if (isDarkMode) {
        htmlElement.classList.add('dark');
    } else {
        htmlElement.classList.remove('dark');
    }
}
// --- End Dark Mode Logic ---


// --- Utility Functions ---

/**
 * Parses the author images string into an array of URLs.
 * @param {string} imagesString - Comma-separated string of image URLs.
 * @returns {string[]} An array of image URLs.
 */
function parseImages(imagesString) {
    if (!imagesString) return [];
    return imagesString.split(',').map(url => url.trim()).filter(url => url.length > 0);
}

/**
 * Preloads all media for the current author to ensure fast switching in the carousel.
 * @param {string[]} urls - Array of image URLs to preload.
 */
function preloadAuthorMedia(urls) {
    urls.forEach(url => {
        // Creating a new Image object forces the browser to download and cache the image.
        const img = new Image();
        img.src = url;
    });
    console.log(`Preloaded ${urls.length} images for author profile.`);
}


/**
 * Converts the database's ISO string ('YYYY-MM-DD HH:mm:ss') which is assumed 
 * to be in UTC/GMT to a user's local date, formatted as YYYY-MM-DD, excluding time.
 * @param {string} isoString - The date string from the JSON file.
 * @returns {string} The localized, formatted date string (YYYY-MM-DD).
 */
function localizeDateString(isoString) {
    // Treat the input string as UTC by replacing space with 'T' and appending 'Z'.
    const dateUTC = new Date(isoString.replace(' ', 'T') + 'Z');

    // Get date components, which are automatically adjusted to the user's local timezone.
    const year = dateUTC.getFullYear();
    // Months are 0-indexed, so add 1. Pad with '0' for single digits.
    const month = String(dateUTC.getMonth() + 1).padStart(2, '0');
    // Pad with '0' for single digits.
    const day = String(dateUTC.getDate()).padStart(2, '0');

    // Return the desired YYYY-MM-DD format.
    return `${year}-${month}-${day}`;
}


/**
 * Creates the HTML structure for a single, non-bloated author card.
 * @param {Object} author - The author object from the JSON file.
 * @returns {HTMLElement} The created card element.
 */
function createAuthorCard(author) {
    const card = document.createElement('div');
    card.className = 'author-card';
    
    // Fallback size adjusted for the larger PFP
    const avatarFallback = `https://placehold.co/112x112/4f46e5/ffffff?text=${author['author-name'].charAt(0)}`;
    const bioSnippet = author['author-bio'] || 'No brief bio available.';

    // Card content with new side-by-side header structure
    card.innerHTML = `
        <div class="card-content">
            <div class="card-header-flex">
                <img src="${author['author-avatar']}"
                     alt="${author['author-name']} Avatar"
                     class="author-avatar"
                     onerror="this.onerror=null; this.src='${avatarFallback}';"
                >
                <div class="card-info-text">
                    <h2 class="card-name">${author['author-name']}</h2>
                    <p class="card-id">ID: ${author['author-id']}</p>
                </div>
            </div>
            <p class="card-bio px-4">${bioSnippet}</p>
        </div>
        <div class="p-4 pt-0">
            <button class="btn-view-profile" data-author-id="${author['author-id']}">
                View Profile &rarr;
            </button>
        </div>
    `;
    
    card.querySelector('.btn-view-profile').addEventListener('click', () => showProfile(author));
    return card;
}

/**
 * Renders all author cards to the main view.
 * @param {Array} authors - The array of author objects.
 */
function renderAuthorList(authors) {
    authorListContainer.innerHTML = '';
    
    if (authors.length === 0) {
        authorListContainer.innerHTML = '<p class="col-span-full text-center text-xl text-gray-500 p-8" style="color: var(--text-secondary);">No authors found.</p>';
        return;
    }

    authors.forEach(author => {
        authorListContainer.appendChild(createAuthorCard(author));
    });
}

/**
 * Checks the URL for an author ID and Name parameter on load and attempts to show the profile.
 */
function checkUrlForAuthorId() {
    const urlParams = new URLSearchParams(window.location.search);
    const authorId = urlParams.get('author');
    const urlName = urlParams.get('name'); // Get the name parameter

    if (authorId && authorsData.length > 0) {
        
        // MODIFIED: Search by both ID and (optionally) by URL-encoded Name
        const author = authorsData.find(a => {
            const matchesId = String(a['author-id']) === authorId;
            
            // For robustness, find the match based on ID.
            // If the name is also in the URL, confirm it matches the stored name's safe format.
            if (urlName) {
                const authorSafeName = a['author-name'].replace(/\s+/g, '-');
                const matchesName = authorSafeName === urlName;
                
                // If both parameters exist, require both to match for a deep-link
                return matchesId && matchesName;
            }
            
            // If only ID exists (e.g., old shared link), rely only on ID
            return matchesId;
        });

        if (author) {
            console.log(`Found author ID ${authorId} in URL. Opening profile.`);
            // IMPORTANT: showProfile will immediately update the URL to include the name if it was missing
            showProfile(author); 
        } else {
            console.warn(`Author with ID ${authorId} (and name ${urlName}) not found.`);
        }
    }
}


/**
 * Fetches the JSON data and renders the author list.
 */
async function loadAuthors() {
    try {
        // Fetch using the corrected relative path
        const response = await fetch(JSON_FILE_PATH); 

        if (!response.ok) {
            throw new Error(`Failed to fetch data. Status: ${response.status} ${response.statusText}`);
        }

        const authors = await response.json();
        if (!Array.isArray(authors)) {
             throw new Error('Data structure error: Expected an array of authors.');
        }

        authorsData = authors; // Store data globally
        renderAuthorList(authors);
        
        // NEW: Check URL for deep link after data load 
        checkUrlForAuthorId(); 

    } catch (error) {
        console.error('Error in loadAuthors:', error);
        errorMessageDiv.classList.remove('hidden');
        errorMessageDiv.innerHTML = `<strong>Error loading data:</strong> Could not load or parse <code>${JSON_FILE_PATH}</code>. Details: ${error.message}`;
        authorListContainer.innerHTML = '';
    } finally {
        loadingMessage.classList.add('hidden');
    }
}

// --- Profile View Logic ---

/**
 * Shows the full profile view with a sliding animation.
 * @param {Object} author - The author object to display.
 */
function showProfile(author) {
    // 1. Store media and reset index for the new author
    authorMedia = parseImages(author['author-images']);
    currentImageIndex = 0;
    
    // 2. Preload media immediately after getting the URLs
    if (authorMedia.length > 0) {
        preloadAuthorMedia(authorMedia);
    }

    // 3. Render content and show profile
    renderProfileContent(author);
    profileView.classList.add('is-active');
    document.body.classList.add('overflow-hidden'); // Prevent main page scroll
    profileView.scrollTo(0, 0); // Scroll profile to top
    
    // MODIFIED: Update URL with both ID and URL-encoded Name 
    const safeName = author['author-name'].replace(/\s+/g, '-'); // Replace spaces with hyphens for readability
    
    const newUrl = new URL(window.location.href);
    newUrl.searchParams.set('author', author['author-id']);
    newUrl.searchParams.set('name', safeName);
    
    // Use both ID and Name in the state object
    history.pushState({ authorId: author['author-id'], authorName: safeName }, '', newUrl.toString());
}

/**
 * Hides the full profile view.
 */
function hideProfile() {
    profileView.classList.remove('is-active');
    document.body.classList.remove('overflow-hidden');
    profileContent.innerHTML = ''; // Clear content
    
    // MODIFIED: Remove both author ID and Name from URL on close
    const newUrl = new URL(window.location.href);
    newUrl.searchParams.delete('author');
    newUrl.searchParams.delete('name'); // Remove the name parameter
    
    history.pushState({}, '', newUrl.toString());
}

// --- Single Image Viewer Logic ---

/**
 * Updates the single image element to display the current image URL.
 */
function showCurrentMedia() {
    const imageContainer = document.getElementById('single-image-viewer');
    const url = authorMedia[currentImageIndex];
    
    // Clear old image and load new one (instant replacement)
    imageContainer.innerHTML = '';
    
    if (url) {
        const img = document.createElement('img');
        img.id = 'current-media-image';
        img.src = url;
        img.alt = `Author media ${currentImageIndex + 1}`;
        // Fallback for image load error
        img.setAttribute('onerror', `this.onerror=null; this.src='https://placehold.co/800x400/374151/e5e7eb?text=Image+Load+Error'`);
        img.addEventListener('click', () => showImageModal(url));
        imageContainer.appendChild(img);
    }
    
    // Update button visibility (using Tailwind classes for hidden/flex)
    const prevButton = document.getElementById('prev-image');
    const nextButton = document.getElementById('next-image');

    if (authorMedia.length > 1) {
        prevButton.style.display = 'flex';
        nextButton.style.display = 'flex';
    } else {
        prevButton.style.display = 'none';
        nextButton.style.display = 'none';
    }
}

/**
 * Navigates the single image viewer by a given delta.
 * @param {number} delta - The direction of movement (1 for next, -1 for previous).
 */
function navigateMedia(delta) {
    if (authorMedia.length === 0) return;

    let newIndex = currentImageIndex + delta;

    // Loop logic (wraps around)
    if (newIndex < 0) {
        newIndex = authorMedia.length - 1;
    } else if (newIndex >= authorMedia.length) {
        newIndex = 0;
    }

    currentImageIndex = newIndex;
    showCurrentMedia(); // Instantly load the new, hopefully cached, image
}


/**
 * Renders the full profile content including the single media viewer.
 * @param {Object} author - The author object.
 */
function renderProfileContent(author) {
    const avatarFallback = 'https://placehold.co/288x288/4f46e5/ffffff?text=AV'; // Fallback size adjusted
    
    // Use the new localization function for the date (YYYY-MM-DD, no time)
    const formattedDate = localizeDateString(author['created-at']); 

    // --- Media Viewer HTML generation ---
    let mediaViewerHTML = '';
    if (authorMedia.length > 0) {
        mediaViewerHTML = `
            <h2 class="text-2xl font-bold mb-4 mt-8" style="color: var(--text-heading);">Attached Media</h2>
            <div class="image-viewer-container">
                <div id="single-image-viewer">
                    </div>
                <button id="prev-image" class="carousel-nav-btn">
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" class="w-6 h-6">
                        <path stroke-linecap="round" stroke-linejoin="round" d="M15 19l-7-7 7-7" />
                    </svg>
                </button>
                <button id="next-image" class="carousel-nav-btn">
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" class="w-6 h-6">
                        <path stroke-linecap="round" stroke-linejoin="round" d="M9 5l7 7-7 7" />
                    </svg>
                </button>
            </div>
        `;
    } else {
        mediaViewerHTML = `
            <h2 class="text-2xl font-bold mb-4 mt-8" style="color: var(--text-heading);">Attached Media</h2>
            <div class="no-images-message">
                <p>No images provided for this author.</p>
            </div>
        `;
    }

    // --- Full Profile HTML: Using the new combined block structure ---
    profileContent.innerHTML = `
        <div class="profile-top-wrapper">
            <div class="profile-main-info-block">
                <img src="${author['author-avatar']}" 
                     onerror="this.onerror=null; this.src='${avatarFallback}'"
                     alt="Avatar of ${author['author-name']}" 
                     class="profile-avatar">

                <div class="profile-info space-y-2">
                    <h1 class="profile-name">${author['author-name']}</h1>
                    <p class="profile-id">ID: ${author['author-id']}</p>
                    <p class="profile-date">Created: ${formattedDate}</p>
                </div>
            </div>
        </div>

        <div class="profile-bio-box">
            <h2 class="text-xl font-bold mb-2" style="color: var(--primary-color);">Bio</h2>
            <p class="profile-text">${author['author-bio'] || 'No brief bio available.'}</p>
            
            <h3 class="text-xl font-bold mt-6 mb-2" style="color: var(--primary-color);">Description</h3>
            <p class="profile-text">${author['author-description'] || 'No detailed description available.'}</p>
        </div>

        ${mediaViewerHTML}

        <div style="height: 4rem;"></div>
    `;
    
    // Setup media viewer and listeners
    if (authorMedia.length > 0) {
        showCurrentMedia();
        document.getElementById('prev-image').onclick = () => navigateMedia(-1);
        document.getElementById('next-image').onclick = () => navigateMedia(1);
    }
}

// --- Full-Screen Image Modal Logic ---

const imageModal = document.getElementById('image-modal');
const modalImage = document.getElementById('modal-image');
const closeModalButton = document.getElementById('close-modal');

/**
 * Shows the full-screen image modal.
 * @param {string} url - The URL of the image to display.
 */
function showImageModal(url) {
    modalImage.src = url;
    imageModal.classList.add('is-active');
    document.body.classList.add('overflow-hidden'); 
}

/**
 * Hides the full-screen image modal.
 */
function hideImageModal() {
    imageModal.classList.remove('is-active');
    document.body.classList.remove('overflow-hidden');
    modalImage.src = ''; 
}


// --- Initialization and Event Listeners ---

document.addEventListener('DOMContentLoaded', () => {
    // Apply theme on load before loading data
    applyTheme();
    loadAuthors();

    document.getElementById('back-button').addEventListener('click', hideProfile);
    closeModalButton.addEventListener('click', hideImageModal);

    // Close modal/profile on escape key
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') {
            if (profileView.classList.contains('is-active')) {
                hideProfile();
            }
            if (imageModal.classList.contains('is-active')) {
                hideImageModal();
            }
        }
    });
    
    // NEW: Handle Browser Back/Forward buttons (PopState)
    window.addEventListener('popstate', (e) => {
        // This fires when the user hits the browser's back button.
        const urlParams = new URLSearchParams(window.location.search);
        const authorId = urlParams.get('author');

        if (authorId) {
            // If an author ID is present, we need to show the profile
            checkUrlForAuthorId(); // Reuse the existing check logic
        } else if (profileView.classList.contains('is-active')) {
            // If no ID is present, and the profile is currently open, close it
            hideProfile();
        }
    });

    // Close modal by clicking outside the image
    imageModal.addEventListener('click', (e) => {
        // If the click target is the modal background or the close button itself
        if (e.target.id === 'image-modal' || e.target.id === 'close-modal') {
            hideImageModal();
        }
    });
});