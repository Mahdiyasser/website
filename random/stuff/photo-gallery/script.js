// --- Configuration for Image Loading (UPDATED) ---
const IMAGE_COUNT = 25; 
const IMAGE_EXTENSIONS = ['png', 'jpg', 'jpeg', 'webp']; // Order matters: it will try these in sequence
// ----------------------------------------

// --- Global Elements and State ---
const body = document.body;
const modal = document.getElementById("imageModal");
const modalImg = document.getElementById("img01");
const captionText = document.getElementById("caption");
const closeBtn = document.getElementById('close-btn');
const photoGallery = document.getElementById('photo-gallery');
const loadingMessage = document.getElementById('loading-message');

let galleryItems = []; 
let currentImageIndex = 0;

// --- Helper function to check if an image file exists ---
// This function uses Promise to handle image loading success/failure asynchronously
function checkImageExistence(num, extension) {
    return new Promise((resolve) => {
        const path = `images/${num}.${extension}`;
        const img = new Image();
        img.onload = () => resolve(path); // Resolve with path if successful
        img.onerror = () => resolve(null); // Resolve with null if failed
        img.src = path;
    });
}

// --- Image Generation Function (The Automation) ---
async function loadImagesDynamically() {
    let imagesLoadedCount = 0;
    
    for (let i = 1; i <= IMAGE_COUNT; i++) {
        let foundPath = null;
        
        // 1. Try each defined extension sequentially
        for (const ext of IMAGE_EXTENSIONS) {
            foundPath = await checkImageExistence(i, ext);
            if (foundPath) {
                break; // Stop and use this path if found
            }
        }

        // 2. If a path was found, generate and insert the HTML
        if (foundPath) {
            const index = galleryItems.length; // Use the current length for the 0-based index
            const alt = `Photo ${i} (${foundPath.split('.').pop().toUpperCase()})`;
            
            const imgHTML = `
                <img 
                    src="${foundPath}" 
                    alt="${alt}" 
                    class="gallery-item" 
                    data-index="${index}"
                >
            `;
            // Append the HTML string to the gallery container
            photoGallery.insertAdjacentHTML('beforeend', imgHTML);
            
            // Update the global galleryItems array (get the last added element)
            const newlyAddedItem = photoGallery.lastElementChild;
            galleryItems.push(newlyAddedItem);
            
            // Attach click listener to the newly created element
            newlyAddedItem.addEventListener('click', () => openModal(index));

            imagesLoadedCount++;
        }
        
        // 3. Update the loading message for feedback
        if (loadingMessage) {
             loadingMessage.textContent = `Loading... Found ${imagesLoadedCount} of ${i} checked.`;
        }
    }

    // 4. Hide the loading message when done and log final count
    if (loadingMessage) {
        loadingMessage.style.display = 'none';
    }
    console.log(`Finished loading. Total images found: ${imagesLoadedCount}`);
}


// --- Theme Switching Functions (Unchanged) ---
function setTheme(themeName) {
    body.className = 'theme-' + themeName;
    localStorage.setItem('galleryTheme', themeName); 
}

document.getElementById('light-btn').addEventListener('click', () => setTheme('light'));
document.getElementById('dark-btn').addEventListener('click', () => setTheme('dark'));
document.getElementById('mixed-btn').addEventListener('click', () => setTheme('mixed'));

// Load saved theme and load images on page load
document.addEventListener('DOMContentLoaded', () => {
    // 1. Load Images FIRST (This is now an asynchronous process)
    loadImagesDynamically();
    
    // 2. Load Theme
    const savedTheme = localStorage.getItem('galleryTheme') || 'light';
    setTheme(savedTheme);
});


// --- Modal (Lightbox) Functions with Navigation (Unchanged, relies on updated galleryItems array) ---

function openModal(index) {
    if (index === undefined || index < 0 || index >= galleryItems.length) return;
    
    currentImageIndex = index;
    const element = galleryItems[currentImageIndex];

    modal.classList.add('modal-active');
    modal.style.display = "flex"; 
    
    modalImg.src = element.src; 
    captionText.innerHTML = element.alt; 

    const borderColor = getComputedStyle(body).getPropertyValue('--modal-border');
    const accentColor = getComputedStyle(body).getPropertyValue('--accent-color');
    
    modalImg.style.borderColor = borderColor;
    document.getElementById('close-btn').style.color = accentColor;
}

function plusSlides(n) {
    let newIndex = currentImageIndex + n;
    
    if (newIndex < 0) {
        newIndex = galleryItems.length - 1;
    }
    if (newIndex >= galleryItems.length) {
        newIndex = 0;
    }
    
    openModal(newIndex);
}

function closeModal() {
    modal.classList.remove('modal-active');
    setTimeout(() => {
        modal.style.display = "none";
    }, 300); 
}

// Event listeners for closing and navigation
closeBtn.addEventListener('click', closeModal);

modal.addEventListener('click', (event) => {
    if (event.target === modal) {
        closeModal();
    }
});

document.addEventListener('keydown', (event) => {
    if (modal.classList.contains('modal-active')) {
        if (event.key === "ArrowRight") {
            plusSlides(1);
        } else if (event.key === "ArrowLeft") {
            plusSlides(-1);
        } else if (event.key === "Escape") {
            closeModal();
        }
    }
});
