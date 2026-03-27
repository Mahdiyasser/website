// --- DOM Element References ---
const htmlElement = document.documentElement;
const themeToggle = document.getElementById('themeToggle');
const phoneInputField = document.querySelector("#phone");
const messageArea = document.getElementById('message');
const encodeButton = document.getElementById('encodeButton');
const copyButton = document.querySelector("#copyButton");
const copyStatus = document.querySelector("#copyStatus");
const modal = document.getElementById('resultModal');
const closeBtn = document.querySelector('.close-button');
const emojiTriggerBtn = document.getElementById('emojiTriggerBtn');
const emojiPicker = document.getElementById('emojiPicker');

// --- A. Theme Toggle Logic ---

// 0. Load Theme from LocalStorage on initial load
document.addEventListener('DOMContentLoaded', () => {
    const savedTheme = localStorage.getItem('whatsapp-link-theme');
    if (savedTheme) {
        htmlElement.setAttribute('data-theme', savedTheme);
        emojiPicker.classList.toggle('light', savedTheme === 'light');
        emojiPicker.classList.toggle('dark', savedTheme === 'dark');
    }
});

themeToggle.addEventListener('click', () => {
    const currentTheme = htmlElement.getAttribute('data-theme');
    const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
    
    // Set new theme and update localStorage
    htmlElement.setAttribute('data-theme', newTheme);
    localStorage.setItem('whatsapp-link-theme', newTheme);
    
    // Update emoji picker class
    emojiPicker.classList.toggle('light', newTheme === 'light');
    emojiPicker.classList.toggle('dark', newTheme === 'dark');
});

// --- B. Initialize the Country Code Selector ---
const phoneInput = window.intlTelInput(phoneInputField, {
    initialCountry: "auto", 
    geoIpLookup: function(callback) {
        fetch("https://ipapi.co/json/")
            .then(res => res.json())
            .then(data => callback(data.country_code))
            .catch(() => callback("us"));
    },
    utilsScript: "https://cdnjs.cloudflare.com/ajax/libs/intl-tel-input/17.0.19/js/utils.js"
});

// --- C. Encode Button Logic ---
encodeButton.addEventListener('click', function() {
    // Check if intlTelInputUtils is available before using it
    if (typeof intlTelInputUtils === 'undefined') {
        alert("The phone input utility script has not loaded yet. Please try again.");
        return;
    }
    
    const fullNumber = phoneInput.getNumber(intlTelInputUtils.numberFormat.E164);
    
    if (!fullNumber) {
        alert("Please enter a valid phone number.");
        return;
    }

    const cleanNumber = fullNumber.replace('+', '');
    const message = messageArea.value;
    const encodedMessage = encodeURIComponent(message);
    const whatsappUrl = `https://api.whatsapp.com/send?phone=${cleanNumber}&text=${encodedMessage}`;

    document.getElementById('generatedUrl').textContent = whatsappUrl;
    modal.style.display = 'block';
    
    copyButton.innerHTML = '📋';
    copyButton.style.backgroundColor = '';
    copyStatus.textContent = '';
});

// --- D. Copy Button Logic ---
copyButton.addEventListener('click', function() {
    const urlText = document.getElementById('generatedUrl').textContent;
    
    navigator.clipboard.writeText(urlText).then(function() {
        copyButton.innerHTML = '✅'; 
        copyButton.style.backgroundColor = 'var(--color-primary)'; 
        copyStatus.textContent = 'Copied!';
        
        setTimeout(function() {
            copyButton.innerHTML = '📋';
            copyButton.style.backgroundColor = ''; 
            copyStatus.textContent = '';
        }, 2000);

    }).catch(function(err) {
        console.error('Could not copy text: ', err);
        copyStatus.textContent = 'Error copying URL.';
    });
});

// --- E. Modal Close Functionality ---
closeBtn.addEventListener('click', () => { modal.style.display = 'none'; });
window.addEventListener('click', (event) => {
    if (event.target === modal) {
        modal.style.display = 'none';
    }
});

// --- F. Emoji Picker Logic ---

// 1. Toggle Picker
emojiTriggerBtn.addEventListener('click', (e) => {
    e.stopPropagation(); 
    
    const isVisible = emojiPicker.style.display === 'block';
    
    if (isVisible) {
        emojiPicker.style.display = 'none';
    } else {
        // Display first to get dimensions
        emojiPicker.style.display = 'block';
        positionEmojiPicker();
    }
});

// 2. Position Picker (Prevents going off screen)
function positionEmojiPicker() {
    const triggerRect = emojiTriggerBtn.getBoundingClientRect();
    const pickerRect = emojiPicker.getBoundingClientRect();
    
    const viewportWidth = window.innerWidth;
    const viewportHeight = window.innerHeight;

    // --- Vertical Positioning ---
    // Default: Place below the button
    let top = triggerRect.bottom + 5;
    
    // Check if it runs off the bottom of the screen
    if (top + pickerRect.height > viewportHeight) {
        // Flip to top of button
        top = triggerRect.top - pickerRect.height - 5;
    }
    
    // Safety check: if flipping to top goes off the TOP of the screen, force it to 10px
    if (top < 10) {
        top = 10;
    }

    // --- Horizontal Positioning ---
    // Default: Align left with the button
    let left = triggerRect.left;
    
    // Check if it runs off the right of the screen
    if (left + pickerRect.width > viewportWidth) {
        // Shift left to fit inside the screen
        left = viewportWidth - pickerRect.width - 20; 
    }
    
    // Safety check: if shifting goes off the LEFT of the screen, force it to 10px
    if (left < 10) {
        left = 10;
    }

    // Apply calculated positions
    emojiPicker.style.top = `${top}px`;
    emojiPicker.style.left = `${left}px`;
}

// 3. Close Picker when clicking outside
document.addEventListener('click', (e) => {
    if (!emojiPicker.contains(e.target) && e.target !== emojiTriggerBtn) {
        emojiPicker.style.display = 'none';
    }
});

// 4. Handle Emoji Selection
emojiPicker.addEventListener('emoji-click', event => {
    const emoji = event.detail.unicode;
    insertTextAtCursor(messageArea, emoji);
});

// --- Helper: Insert text at cursor ---
function insertTextAtCursor(input, text) {
    if (document.activeElement !== input) {
        input.focus();
    }
    const start = input.selectionStart;
    const end = input.selectionEnd;
    
    input.value = input.value.substring(0, start) + text + input.value.substring(end);
    input.selectionStart = input.selectionEnd = start + text.length;
}
