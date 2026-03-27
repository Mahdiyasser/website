// --- JAVASCRIPT LOGIC ---

// --- Configuration ---
// CHANGED: Now loading all posts from a directory of monthly archives
const ALL_POSTS_DIR = '../data/archive/'; // New directory for monthly archive files
const AUTHORS_FILE = '../data/authors.json';
// Removed ALL_POSTS_FILE as it is no longer used

// --- Global State ---
let allPosts = []; 
let authorDataMap = {}; // Global map to hold author data from authors.json
// NEW: Store all posts loaded from all archives (before month/year filtering)
let allArchivePosts = []; 
const POST_DETAIL_PAGE = document.getElementById('post-detail-page');

// State for Media Gallery/Lightbox
let currentPostMedia = []; 
let currentMediaIndex = 0; 

// --- Theme Management (KEPT AS IS) ---
const htmlElement = document.documentElement;

/**
 * Applies the selected theme based on localStorage or system preference.
 */
function applyTheme() {
    const sunIcon = document.getElementById('sun-icon');
    const moonIcon = document.getElementById('moon-icon');
    
    const isDarkMode = localStorage.getItem('theme') === 'dark' || 
                       (!('theme' in localStorage) && window.matchMedia('(prefers-color-scheme: dark)').matches);
    
    if (isDarkMode) {
        htmlElement.classList.add('dark');
        if (sunIcon) sunIcon.style.display = 'block'; 
        if (moonIcon) moonIcon.style.display = 'none'; 
    } else {
        htmlElement.classList.remove('dark');
        if (sunIcon) sunIcon.style.display = 'none'; 
        if (moonIcon) moonIcon.style.display = 'block'; 
    }
}

/**
 * Toggles between light and dark mode and saves the preference.
 */
window.toggleTheme = function() {
    if (htmlElement.classList.contains('dark')) {
        localStorage.setItem('theme', 'dark');
    } else {
        localStorage.setItem('theme', 'light');
    }
    applyTheme(); 
}


// --- Utility Functions (KEPT AS IS) ---

/**
 * Checks if a URL is likely a video based on common extensions.
 */
function isVideo(url) {
    return /\.(mp4|webm|ogg|mov)$/i.test(url);
}

/**
 * Truncates content to the first 10 words.
 */
function generateDescription(content) {
    if (!content) return 'No description available.';
    const words = content.split(/\s+/);
    const description = words.slice(0, 10).join(' ');
    return words.length > 10 ? description + '...' : description;
}

/**
 * Helper to ensure date string is interpreted as UTC before creating Date object.
 * This is crucial for correctly applying the user's local offset.
 * @param {string} dateString The date string from the post data.
 * @returns {Date} A Date object interpreted as UTC.
 */
function parseDateAsUtc(dateString) {
    // If it doesn't have a Z or a timezone offset, append 'Z' to treat it as UTC
    if (!dateString.match(/[Z+\-]\d{0,4}$/i)) {
        return new Date(dateString + 'Z');
    }
    return new Date(dateString);
}

/**
 * Formats a UTC-based Date object into the desired output format,
 * applying the user's local GMT offset to the time components.
 * Format: "Month Day, Year at HH:MM AM/PM GMT+X"
 * @param {Date} dateObj The Date object (created from a UTC string).
 * @returns {string} The manually formatted date string with local time.
 */
function formatLocalizedDate(dateObj) {
    // 1. Get Date components in the user's local timezone
    const year = dateObj.getFullYear();
    const day = dateObj.getDate();
    
    // Force English locale for month name to ensure "same language/text"
    const month = dateObj.toLocaleString('en-US', { month: 'long' }); 

    let hours = dateObj.getHours();
    const minutes = dateObj.getMinutes().toString().padStart(2, '0');
    
    // 2. 12-hour clock and AM/PM logic
    const ampm = hours >= 12 ? 'PM' : 'AM';
    hours = hours % 12;
    hours = hours ? hours : 12; // '0' hour is '12'
    hours = hours.toString().padStart(2, '0');

    // 3. The offset string was intentionally left blank in the original code, keeping it this way.
    const offsetString = ``;

    // 4. Reconstruct the string
    return `${month} ${day}, ${year} at ${hours}:${minutes} ${ampm} ${offsetString}`;
}


// --- Data Fetching ---

/**
 * Fetches JSON data from a given path.
 */
async function fetchJson(path) {
    try {
        const response = await fetch(path);
        if (!response.ok) {
            // Log error but return empty array/null to allow app to continue
            console.warn(`Could not load data from ${path}. Status: ${response.status}`);
            return null;
        }
        return response.json();
    } catch (error) {
        console.error(`Fetch error for ${path}:`, error);
        return null;
    }
}

// NEW: Function to generate the list of monthly archive file paths
/**
 * Generates an array of file paths for monthly archives 
 * from the start year/month (2025-01) up to the current month/year.
 */
function generateArchiveFilePaths() {
    const today = new Date();
    const currentYear = today.getFullYear();
    const currentMonth = today.getMonth(); // 0-11
    
    // ASSUME: The archive starts from the year 2025, as suggested by the user's example (2025-11.json).
    const startYear = 2025;
    const startMonth = 0; // January

    const filePaths = [];
    
    let year = startYear;
    let month = startMonth;

    while (year < currentYear || (year === currentYear && month <= currentMonth)) {
        // Format: YYYY-MM
        const monthStr = (month + 1).toString().padStart(2, '0'); 
        const fileName = `${year}-${monthStr}.json`;
        filePaths.push(ALL_POSTS_DIR + fileName);

        // Move to the next month
        month++;
        if (month > 11) {
            month = 0;
            year++;
        }
    }

    return filePaths;
}

/**
 * Loads all data from monthly archive files, merges author data from authors.json 
 * (prioritizing post-embedded data), filters future posts, sorts, and initiates rendering.
 */
async function loadData() {
    // 1. Load Authors List (for supplementary data)
    const authorsList = await fetchJson(AUTHORS_FILE);
    
    if (authorsList && Array.isArray(authorsList)) {
        authorsList.forEach(author => {
            // Use the author-id as the key
            authorDataMap[author['author-id']] = {
                'author-name': author['author-name'] || 'Unknown',
                'author-avatar': author['author-avatar'] || '',
                'author-bio': author['author-bio'] || 'No bio.',
            };
        });
    }

    // 2. Load All Posts from Archive Files
    const archivePaths = generateArchiveFilePaths();
    const fetchPromises = archivePaths.map(path => fetchJson(path));
    // Use Promise.all to fetch all files concurrently and wait for all to resolve
    const allArchiveData = await Promise.all(fetchPromises);
    
    let rawPosts = [];
    allArchiveData.forEach(data => {
        if (data && Array.isArray(data)) {
            // Merge posts from all successful fetches
            rawPosts.push(...data);
        }
    });

    if (rawPosts.length === 0) {
        console.error("Could not load any posts data or all archives are invalid/empty.");
        // Populate filter with just 'All Posts' if no data is found
        populateMonthFilter([]); 
        renderPosts([]);
        return;
    }
    
    // 3. Merge Author Data and Prepare Posts 
    // Save to allArchivePosts, which holds the master list
    allArchivePosts = rawPosts.map(post => { 
        const authorId = post['author-id'];
        const authorInfo = authorDataMap[authorId] || {};
        
        // Merge strategy: Post-embedded data takes priority if present, 
        // otherwise use data from authorDataMap.
        const name = post['author-name'] || authorInfo['author-name'] || 'Unknown';
        const avatar = post['author-avatar'] || authorInfo['author-avatar'] || 'https://storage.mahdiyasser.site/images/blog/unknown.png';
        const bio = post['author-bio'] || authorInfo['author-bio'] || 'No bio provided.';

        return {
            ...post,
            // Overwrite or ensure these fields are present and merged
            'author-name': name,
            'author-avatar': avatar,
            'author-bio': bio,
            'author-id': authorId || 'unknown' 
        };
    });
    
    // 4. Filter out future posts using the UTC-parsed date object
    const now = new Date();
    allArchivePosts = allArchivePosts.filter(post => {
        if (!post['post-date']) return false; 
        const postDate = parseDateAsUtc(post['post-date']); 
        return postDate <= now; 
    });

    // 5. Sort all posts by date (newest first)
    allArchivePosts.sort((a, b) => {
        const dateA = parseDateAsUtc(a['post-date']);
        const dateB = parseDateAsUtc(b['post-date']);
        return dateB - dateA;
    });

    // 6. Populate the Month Filter and Initial Render
    populateMonthFilter(allArchivePosts);
    // Initial render shows all posts (default filter value is 'all')
    allPosts = allArchivePosts;
    renderPosts(allPosts);
    
    // Check URL for deep link after data load
    checkUrlForDeepLink();
}

// NEW: Function to populate the month filter
function populateMonthFilter(posts) {
    const selectElement = document.getElementById('month-filter');
    // Clear existing options
    selectElement.innerHTML = ''; 

    // 1. Add 'All Posts' default option
    const allOption = document.createElement('option');
    allOption.value = 'all';
    allOption.textContent = 'All Posts';
    selectElement.appendChild(allOption);

    // 2. Identify unique Year-Month combinations (YYYY-MM)
    const dateMap = new Map(); // Key: 'YYYY-MM', Value: Date object

    posts.forEach(post => {
        const dateObj = parseDateAsUtc(post['post-date']);
        // Use UTC methods for consistency with the YYYY-MM file names
        const year = dateObj.getUTCFullYear(); 
        const month = (dateObj.getUTCMonth() + 1).toString().padStart(2, '0'); 
        const key = `${year}-${month}`;
        
        if (!dateMap.has(key)) {
            dateMap.set(key, dateObj);
        }
    });

    // 3. Sort the unique date keys (newest month first)
    const sortedKeys = Array.from(dateMap.keys()).sort((a, b) => {
        // Compare YYYY-MM strings for reverse chronological sort
        return b.localeCompare(a); 
    });

    // 4. Create month options
    sortedKeys.forEach(key => {
        const dateObj = dateMap.get(key);
        const option = document.createElement('option');
        
        option.value = key; // YYYY-MM (e.g., '2025-11')
        // Format for display: "November 2025". Force UTC for display label consistency.
        option.textContent = dateObj.toLocaleDateString('en-US', { 
            year: 'numeric', 
            month: 'long', 
            timeZone: 'UTC'
        });

        selectElement.appendChild(option);
    });
}


// --- Rendering and Filtering Logic ---

function renderPosts(postsToRender) {
    const container = document.getElementById('posts-container');
    container.innerHTML = '';

    if (postsToRender.length === 0) {
        container.innerHTML = '<p style="text-align: center; grid-column: 1 / -1; color: var(--text-secondary); margin-top: 40px;">No posts found matching your criteria. Please ensure your search have a title, content or author name.</p>';
        return;
    }

    postsToRender.forEach(post => {
        const card = document.createElement('div');
        card.className = 'post-card';
        card.onclick = () => openPostDetail(post);

        // Date on card is still simple, using the UTC-parsed date object for correct local representation
        const date = parseDateAsUtc(post['post-date']).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
        const postTitle = post['post-title'] || 'Untitled Post';
        const postDescription = generateDescription(post['post-content']);
        const thumbnailUrl = post['post-thumbnail'];

        card.innerHTML = `
            <div class="card-image-wrapper">
                <img src="${thumbnailUrl}" alt="Post Thumbnail" class="card-image" loading="lazy">
            </div>
            <div class="post-card-content">
                <h2>${postTitle}</h2>
                <p>${postDescription}</p>
                <div class="post-card-footer">
                    <span>${date}</span>
                    <span class="post-card-author">${post['author-name']}</span>
                </div>
            </div>
        `;
        container.appendChild(card);
    });
}

/**
 * Filter function updated to use both search text and the new month/year selection.
 */
function filterAndSearchPosts() {
    const searchText = document.getElementById('search-input').value.toLowerCase();
    // NEW: Get the selected month/year filter value (e.g., 'all' or '2025-11')
    const monthFilter = document.getElementById('month-filter').value;
    
    // Start with all the posts loaded from the archives (which are already sorted and filtered for future posts)
    let postsToFilter = allArchivePosts; 
    
    // 1. Filter by Month/Year
    if (monthFilter !== 'all') {
        postsToFilter = postsToFilter.filter(post => {
            const dateObj = parseDateAsUtc(post['post-date']);
            // Use UTC methods to generate the YYYY-MM key, consistent with the filter value
            const year = dateObj.getUTCFullYear();
            const month = (dateObj.getUTCMonth() + 1).toString().padStart(2, '0');
            const postMonthKey = `${year}-${month}`;
            
            return postMonthKey === monthFilter;
        });
    }

    // 2. Filter by Search Text (applied to the subset from step 1)
    const filteredPosts = postsToFilter.filter(post => {
        const searchFields = [post['post-title'], post['post-content'], post['author-name']]
            .filter(s => s)
            .map(s => s.toLowerCase());

        const matchesSearch = searchFields.some(field => field.includes(searchText));

        return matchesSearch; 
    });

    // Update the global state for the currently displayed posts
    allPosts = filteredPosts;
    renderPosts(filteredPosts);
}


// ***************************************************************
// * NEW FUNCTION: Checks URL for six deep-link parameters on page load *
// ***************************************************************

/**
 * Checks the URL for Post ID, Title, Author ID, Author Name, Month, and Year 
 * on load and attempts to show the detail view.
 */
function checkUrlForDeepLink() {
    const urlParams = new URLSearchParams(window.location.search);
    const postId = urlParams.get('post');
    const urlTitle = urlParams.get('title'); 
    const authorId = urlParams.get('author'); 
    const urlAuthorName = urlParams.get('author_name'); 
    const urlMonth = urlParams.get('month'); 
    const urlYear = urlParams.get('year'); 

    if (postId && allArchivePosts.length > 0) {
        
        // Search in the master list of all loaded posts
        const post = allArchivePosts.find(p => { 
            const matchesId = String(p['post-id']) === postId;
            
            // Construct slugs for comparison
            const postSafeTitle = p['post-title'] ? p['post-title'].replace(/[^\w\s-]/g, '').replace(/\s+/g, '-') : '';
            const authorSafeName = p['author-name'] ? p['author-name'].replace(/[^\w\s-]/g, '').replace(/\s+/g, '-') : '';

            // Match Post ID (required)
            if (!matchesId) return false;

            // Match Post Title (optional but preferred for deep links)
            const matchesTitle = !urlTitle || postSafeTitle === urlTitle;
            
            // Match Author ID (optional but preferred)
            const matchesAuthorId = !authorId || String(p['author-id']) === authorId;

            // Match Author Name (optional but preferred)
            const matchesAuthorName = !urlAuthorName || authorSafeName === urlAuthorName;
            
            // Match Month and Year (optional but preferred)
            let matchesDate = true;
            if (urlMonth || urlYear) {
                const dateObj = parseDateAsUtc(p['post-date']);
                // Use padded month string for URL comparison (01-12)
                const postMonth = (dateObj.getUTCMonth() + 1).toString().padStart(2, '0');
                const postYear = dateObj.getUTCFullYear().toString();
                
                const matchesMonth = !urlMonth || postMonth === urlMonth;
                const matchesYear = !urlYear || postYear === urlYear;
                matchesDate = matchesMonth && matchesYear;
            }

            // Require post ID to match, but check all others if present for validity
            return matchesId && matchesTitle && matchesAuthorId && matchesAuthorName && matchesDate;
        });

        if (post) {
            console.log(`Found post ID ${postId} in URL. Opening detail view.`);
            // openPostDetail will immediately update the URL to include missing slug parameters
            openPostDetail(post); 
        } else {
            console.warn(`Post with ID ${postId} (and context) not found.`);
        }
    }
}


// --- Post Detail View (Full Page) Logic ---

/**
 * Renders the media gallery section (excluding the thumbnail).
 */
function renderMediaGallery(mediaUrls) {
    if (mediaUrls.length === 0) return '';
    
    const mediaItemsHtml = mediaUrls.map((url) => {
        let mediaElement;
        const totalIndex = currentPostMedia.indexOf(url); 

        if (isVideo(url)) {
            mediaElement = `<div class="media-item" data-index="${totalIndex}" onclick="openLightbox(${totalIndex})">
                                <video controls loop preload="none">
                                    <source src="${url}" type="video/mp4">
                                    Your browser does not support the video tag.
                                </video>
                            </div>`;
        } else {
            mediaElement = `<div class="media-item" data-index="${totalIndex}" onclick="openLightbox(${totalIndex})">
                                <img src="${url}" alt="Post Media" loading="lazy">
                            </div>`;
        }
        return mediaElement;
    }).join('');
    
    return `
        <div class="post-media-gallery">
            <h3>Media Gallery (${mediaUrls.length})</h3>
            <div class="media-viewer">
                ${mediaItemsHtml}
                <button id="prev-media" class="gallery-nav" onclick="galleryNav(-1)">&#10094;</button>
                <button id="next-media" class="gallery-nav" onclick="galleryNav(1)">&#10095;}</button>
            </div>
        </div>
    `;
}

/**
 * Updates the media gallery display based on currentMediaIndex (master index).
 */
function showMedia() {
    const items = document.querySelectorAll('#post-detail-content .media-viewer .media-item');
    
    if (!items || items.length === 0) return;

    const localIndex = currentMediaIndex - 1; 

    items.forEach((item, index) => {
        const isActive = index === localIndex;
        item.classList.toggle('active', isActive);
        const video = item.querySelector('video');
        if (video) {
            if (isActive) {
                video.currentTime = 0; 
                video.play();
            } else {
                video.pause();
            }
        }
    });
}

/**
 * Navigates the media gallery (circular loop for media items 1 to N-1).
 */
window.galleryNav = function(direction) {
    const mediaLength = currentPostMedia.length;
    if (mediaLength <= 1) return;

    let newIndex = currentMediaIndex + direction;

    if (newIndex < 1) {
        newIndex = mediaLength - 1; 
    } else if (newIndex >= mediaLength) {
        newIndex = 1; 
    }
    
    currentMediaIndex = newIndex;
    showMedia();
}


/**
 * Opens the post detail full page view with a slide-in animation.
 */
function openPostDetail(post) {
    const content = document.getElementById('post-detail-content');
    
    const postTitle = post['post-title'] || 'Untitled Post';
    const postContent = post['post-content'] || 'Full post content not available.';
    const thumbnail = post['post-thumbnail'];
    
    // Use the helper function to ensure the date is interpreted as UTC
    const dateObj = parseDateAsUtc(post['post-date']); 
    
    // Use the new custom formatter to get the localized time string
    const formattedDate = formatLocalizedDate(dateObj);
    
    // NEW: Get month and year for deep-linking (using UTC components)
    const year = dateObj.getUTCFullYear();
    // getUTCMonth() is 0-indexed (0=Jan, 11=Dec), so add 1 and pad with zero for URL
    const month = (dateObj.getUTCMonth() + 1).toString().padStart(2, '0'); 

    currentPostMedia = (post['post-images'] ? post['post-images'].split(',').map(url => url.trim()).filter(url => url) : []);
    
    if (thumbnail) {
        currentPostMedia.unshift(thumbnail);
    }
    currentMediaIndex = 0; 

    const thumbnailMediaTag = isVideo(thumbnail) ? 
        `<div class="thumbnail-image" onclick="openLightbox(0)">
            <video controls loop preload="none" poster="${thumbnail.replace(/\.[^/.]+$/, "")}.png">
                <source src="${thumbnail}" type="video/mp4">
                Your browser does not support the video tag.
            </video>
        </div>` :
        `<img src="${thumbnail}" alt="Post Thumbnail" class="thumbnail-image" onclick="openLightbox(0)" loading="lazy">`;

    // The post object now contains all necessary merged author data
    const authorName = post['author-name'];
    const authorAvatar = post['author-avatar'];
    const authorBio = post['author-bio'];
    
    const galleryMedia = currentPostMedia.slice(1);
    const mediaGalleryHtml = galleryMedia.length > 0 ? renderMediaGallery(galleryMedia) : ''; 

    content.innerHTML = `
        <h1>${postTitle}</h1>
        
        <div class="meta-container">
            <img src="${authorAvatar}" alt="${authorName}'s profile picture">
            <div class="meta-info">
                <h3>${authorName}</h3>
                <p>${authorBio}</p>
                <p>Published on:<br> ${formattedDate}</p> 
            </div>
        </div>

        ${thumbnailMediaTag}

        <div class="post-body">
            ${postContent}
        </div>
        
        ${mediaGalleryHtml}
    `;

    // Set display: block immediately to prepare for transition
    POST_DETAIL_PAGE.style.display = 'block';
    // Add 'active' class after a slight delay to trigger CSS transition
    setTimeout(() => {
        POST_DETAIL_PAGE.classList.add('active');
        document.body.style.overflow = 'hidden'; 
    }, 10); 
    
    POST_DETAIL_PAGE.scrollTop = 0; 
    
    if (galleryMedia.length > 0) {
        currentMediaIndex = 1; 
        setTimeout(showMedia, 100); 
    }
    
    // *********************************************************
    // * NEW: Update URL with all six parameters *
    // *********************************************************
    const postID = post['post-id'];
    const authorID = post['author-id'];
    const postTitleForSlug = post['post-title'] || 'Untitled Post';
    const authorNameForSlug = post['author-name'] || 'Unknown Author';
    
    // Create safe slugs
    const safeTitle = postTitleForSlug.replace(/[^\w\s-]/g, '').replace(/\s+/g, '-');
    const safeAuthorName = authorNameForSlug.replace(/[^\w\s-]/g, '').replace(/\s+/g, '-');
    
    const newUrl = new URL(window.location.href);
    newUrl.searchParams.set('post', postID);
    newUrl.searchParams.set('title', safeTitle);
    newUrl.searchParams.set('author', authorID); 
    newUrl.searchParams.set('author_name', safeAuthorName); 
    newUrl.searchParams.set('month', month.toString()); // NEW
    newUrl.searchParams.set('year', year.toString()); // NEW
    
    // Use all parameters in the state object
    history.pushState({ 
        postId: postID, 
        postTitle: safeTitle, 
        authorId: authorID, 
        authorName: safeAuthorName,
        month: month.toString(),
        year: year.toString()
    }, postTitleForSlug, newUrl.toString());
}

/**
 * Closes the post detail full page view with a slide-out animation.
 */
window.closePostDetail = function() {
    POST_DETAIL_PAGE.classList.remove('active');
    document.body.style.overflow = ''; 

    // Pause any video on the detail page when closing
    document.querySelectorAll('#post-detail-content video').forEach(v => v.pause());

    // ********************************************
    // * NEW: Remove all six parameters from URL *
    // ********************************************
    const newUrl = new URL(window.location.href);
    newUrl.searchParams.delete('post');
    newUrl.searchParams.delete('title'); 
    newUrl.searchParams.delete('author'); 
    newUrl.searchParams.delete('author_name'); 
    newUrl.searchParams.delete('month'); 
    newUrl.searchParams.delete('year'); 
    
    // Push a new state with no parameters
    history.pushState({}, '', newUrl.toString());


    const transitionDuration = 400; 
    setTimeout(() => {
        if (!POST_DETAIL_PAGE.classList.contains('active')) {
             POST_DETAIL_PAGE.style.display = 'none';
        }
    }, transitionDuration);
}

// --- Lightbox Logic (Circular Loop) (KEPT AS IS) ---

/**
 * Opens the lightbox modal to full-view media, starting at the specified index.
 */
window.openLightbox = function(index) {
    document.querySelectorAll('#post-detail-content video').forEach(v => v.pause());

    currentMediaIndex = index;
    const modal = document.getElementById('lightbox-modal');
    modal.style.display = "flex"; 
    updateLightboxContent();
}

/**
 * Closes the lightbox modal.
 */
window.closeLightbox = function() {
    const modal = document.getElementById('lightbox-modal');
    modal.style.display = "none";
    
    const video = document.querySelector('#lightbox-content video');
    if (video) video.pause();
}

/**
 * Updates the content and navigation of the lightbox.
 */
function updateLightboxContent() {
    const content = document.getElementById('lightbox-content');
    const mediaUrl = currentPostMedia[currentMediaIndex];
    
    let mediaHtml;
    if (isVideo(mediaUrl)) {
        mediaHtml = `<video controls autoplay loop>
                        <source src="${mediaUrl}" type="video/mp4">
                        Your browser does not support the video tag.
                    </video>`;
    } else {
        mediaHtml = `<img src="${mediaUrl}" alt="Full view media">`;
    }
    
    content.innerHTML = mediaHtml;

    const showNav = currentPostMedia.length > 1;
    document.getElementById('lightbox-prev').style.display = showNav ? 'block' : 'none';
    document.getElementById('lightbox-next').style.display = showNav ? 'block' : 'none';
}

/**
 * Navigates the lightbox media circularly.
 */
window.lightboxNav = function(direction) {
    const mediaLength = currentPostMedia.length;
    if (mediaLength <= 1) return;

    let newIndex = currentMediaIndex + direction;

    if (newIndex < 0) {
        newIndex = mediaLength - 1;
    } else if (newIndex >= mediaLength) {
        newIndex = 0;
    }
    
    currentMediaIndex = newIndex;
    updateLightboxContent();
}


// --- Event Listeners and Initialization ---

document.addEventListener('DOMContentLoaded', () => {
    // Controls
    document.getElementById('search-input').addEventListener('input', filterAndSearchPosts);
    // NEW: Add event listener for the new month/year filter
    document.getElementById('month-filter').addEventListener('change', filterAndSearchPosts);
    
    // Theme Toggle
    document.getElementById('theme-toggle').addEventListener('click', toggleTheme);

    // Close lightbox on escape key
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape' && document.getElementById('lightbox-modal').style.display === "flex") {
            closeLightbox();
        }
    });

    // Initial setup
    applyTheme();
    loadData();
    
    // *******************************************************
    // * NEW: Handle Browser Back/Forward buttons (PopState) *
    // *******************************************************
    window.addEventListener('popstate', (e) => {
        // This fires when the user hits the browser's back button.
        const urlParams = new URLSearchParams(window.location.search);
        const postId = urlParams.get('post');
        const transitionDuration = 400; 

        if (postId) {
            // If a post ID is present, we need to show the detail view
            checkUrlForDeepLink(); // Function name updated
        } else if (POST_DETAIL_PAGE.classList.contains('active')) {
            // If no ID is present, and the detail page is currently open, close it.
            // Visually close the detail page without changing the URL history again
            POST_DETAIL_PAGE.classList.remove('active');
            document.body.style.overflow = ''; 
            document.querySelectorAll('#post-detail-content video').forEach(v => v.pause());
            
            // Hide after transition
            setTimeout(() => {
                if (!POST_DETAIL_PAGE.classList.contains('active')) {
                    POST_DETAIL_PAGE.style.display = 'none';
                }
            }, transitionDuration); 
        }
    });
});