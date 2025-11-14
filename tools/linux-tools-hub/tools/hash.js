// tools/hash.js

// NOTE: This file assumes CryptoJS core and PBKDF2 component are loaded in index.html
// It also assumes that resetToolContent() and the global UI structure exist.

// --- Configuration for Secure Hashing ---
const ITERATION_COUNT = 600000;
const KEY_LENGTH_WORDS = 256 / 32; // 256 bits for derived key
const SALT_LENGTH_BYTES = 16;       // 16 bytes for salt
// ----------------------------------------

// --- Helper Functions ---

/**
 * Generates a cryptographically secure random salt (hex string).
 */
function generateRandomSalt(lengthBytes) {
    const saltWords = CryptoJS.lib.WordArray.random(lengthBytes);
    return saltWords.toString(CryptoJS.enc.Hex);
}

/**
 * Copies the hash output to the clipboard using a reliable method.
 */
function copyHashOutput() {
    const outputElement = document.getElementById('hash-output');
    const notification = document.getElementById('hash-copy-notification');
    const textToCopy = outputElement.textContent;

    if (!textToCopy.trim() || textToCopy.startsWith('ERROR:') || textToCopy.startsWith('Calculating...')) {
        alert('Nothing valid to copy.');
        return;
    }
    
    const tempTextArea = document.createElement('textarea');
    tempTextArea.value = textToCopy;
    tempTextArea.style.position = 'fixed';
    tempTextArea.style.top = '0';
    tempTextArea.style.left = '-9999px';
    
    document.body.appendChild(tempTextArea);
    tempTextArea.focus();
    tempTextArea.select();
    document.execCommand('copy');
    document.body.removeChild(tempTextArea);

    // Show notification
    notification.classList.remove('opacity-0', 'hidden');
    notification.classList.add('opacity-100');
    
    setTimeout(() => {
        notification.classList.remove('opacity-100');
        notification.classList.add('opacity-0');
    }, 1500);
}

/**
 * Copies the generated verification code to the clipboard.
 */
function copyVerificationCode() {
    const codeOutput = document.getElementById('verification-code-output');
    const notification = document.getElementById('code-copy-notification');
    const textToCopy = codeOutput.textContent;

    if (!textToCopy.trim()) return;

    const tempTextArea = document.createElement('textarea');
    tempTextArea.value = textToCopy;
    tempTextArea.style.position = 'fixed';
    tempTextArea.style.top = '0';
    tempTextArea.style.left = '-9999px';
    
    document.body.appendChild(tempTextArea);
    tempTextArea.focus();
    tempTextArea.select();
    document.execCommand('copy');
    document.body.removeChild(tempTextArea);

    // Show notification
    notification.classList.remove('opacity-0', 'hidden');
    notification.classList.add('opacity-100');
    setTimeout(() => {
        notification.classList.remove('opacity-100');
        notification.classList.add('opacity-0');
    }, 1500);
}


/**
 * Toggles the loading state, showing/hiding the button and spinner.
 */
function toggleLoadingState(isLoading) {
    const button = document.getElementById('hash-button');
    const spinner = document.getElementById('hash-spinner');
    
    if (isLoading) {
        button.classList.add('hidden');
        spinner.classList.remove('hidden');
        // Clear previous output while loading
        document.getElementById('hash-output').textContent = 'Calculating... This may take a moment...';
        document.getElementById('hash-output').classList.remove('text-red-500');
    } else {
        button.classList.remove('hidden');
        spinner.classList.add('hidden');
    }
}

/**
 * Generates and displays the verification code block.
 * @param {string} finalHash - The full generated hash string.
 */
function generateVerificationCode(finalHash) {
    const codeSection = document.getElementById('verification-code-section');
    const codeOutput = document.getElementById('verification-code-output');

    // This is the functional, copy-paste block
    const verificationCode = `
// --- PASSWORD VERIFICATION LOGIC ---
// Requires CryptoJS core and PBKDF2 component loaded!

// IMPORTANT: Replace this placeholder with the hash retrieved from your database 
const STORED_HASH = "${finalHash}"; 

function verifyPassword(inputPassword, storedSecureHash) {
    const parts = storedSecureHash.split(':');
    if (parts.length !== 3) {
        return false; // Invalid format
    }
    
    const iterations = parseInt(parts[0]);
    const saltHex = parts[1];
    const storedDerivedKey = parts[2];
    
    // Config: 256 bits / 32 bits per word
    const KEY_LENGTH_WORDS = 8; 

    try {
        // Convert the stored salt (hex string) back into a WordArray
        const saltWords = CryptoJS.enc.Hex.parse(saltHex);

        // Re-calculate the hash (must use the same iterations and salt)
        const reCalculatedKey = CryptoJS.PBKDF2(
            inputPassword,
            saltWords,
            {
                keySize: KEY_LENGTH_WORDS,
                iterations: iterations,
                hasher: CryptoJS.algo.SHA256
            }
        );
        
        const reCalculatedKeyHex = reCalculatedKey.toString(CryptoJS.enc.Hex);

        // Compare the new key with the stored key
        return reCalculatedKeyHex === storedDerivedKey;

    } catch (e) {
        console.error("Verification failed:", e);
        return false;
    }
}
    `.trim();

    codeOutput.textContent = verificationCode;
    codeSection.classList.remove('hidden');
}


// --- Main Hashing Logic ---

/**
 * Handles the secure PBKDF2-SHA256 hashing process using CryptoJS.
 */
function generateSecureHash() {
    const input = document.getElementById('hash-input').value;
    const outputElement = document.getElementById('hash-output');

    if (!input.trim()) {
        outputElement.textContent = 'Please enter text to hash.';
        outputElement.classList.add('text-red-500');
        return;
    }
    
    // START LOADING
    toggleLoadingState(true);

    // Yield control to the browser to display the spinner before blocking
    setTimeout(() => {
        try {
            const saltHex = generateRandomSalt(SALT_LENGTH_BYTES);
            const saltWords = CryptoJS.enc.Hex.parse(saltHex);

            // Perform PBKDF2 hashing (The blocking, secure part)
            const derivedKey = CryptoJS.PBKDF2(
                input,          // Password/Input
                saltWords,      // Salt
                {
                    keySize: KEY_LENGTH_WORDS,
                    iterations: ITERATION_COUNT,
                    hasher: CryptoJS.algo.SHA256
                }
            );
            
            const derivedKeyHex = derivedKey.toString(CryptoJS.enc.Hex);
            const finalHash = `${ITERATION_COUNT}:${saltHex}:${derivedKeyHex}`;
            outputElement.textContent = finalHash;

            // Generate the verification code block based on the result
            generateVerificationCode(finalHash);

        } catch (e) {
            console.error("Hashing Error:", e);
            outputElement.textContent = 'ERROR: Could not generate secure hash. Check console and index.html for CryptoJS links.';
            outputElement.classList.add('text-red-500');
        } finally {
            // STOP LOADING
            toggleLoadingState(false);
        }
    }, 50); 
}

// --- UI Rendering ---

/**
 * Renders the Secure Hash Generator UI by generating its own HTML.
 * NOTE: This function relies on resetToolContent defined in script.js
 */
function renderHashGenerator() {
    const title = 'Secure Hash Generator (PBKDF2 via CryptoJS)';
    const description = 'Generates a secure, salted, and stretched key using PBKDF2, making it highly resistant to cracking.';

    // Reset content first
    resetToolContent(title, description);

    // Instead of overwriting, append the rest of the tool HTML
    document.getElementById('tool-content').innerHTML += `
        <textarea id="hash-input" class="input-style w-full p-3 rounded-lg focus:ring-purple-500 focus:border-purple-500 mb-4" rows="3" placeholder="Enter password or secret text to hash..."></textarea>
        
        <div class="mb-4 text-sm text-gray-400">
            <p>Algorithm: PBKDF2-SHA256 (via CryptoJS)</p>
            <p>Iterations: ${ITERATION_COUNT.toLocaleString()} (High security cost)</p>
            <p>Salt: Randomly generated for every hash</p>
        </div>

        <div class="relative mb-6 w-full sm:w-auto">
            <button id="hash-button" onclick="generateSecureHash()" class="tool-button bg-purple-600 hover:bg-purple-700 text-white font-semibold py-2 px-4 rounded-lg shadow-md w-full">Generate Secure Hash</button>
            
            <button id="hash-spinner" disabled class="tool-button bg-purple-800 text-white font-semibold py-2 px-4 rounded-lg shadow-md w-full flex items-center justify-center hidden">
                <svg class="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                    <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Processing...
            </button>
        </div>

        <div class="terminal-box p-4 rounded-lg border border-purple-500/50 relative group">
            <span class="text-purple-500 font-mono">$ SECURE HASH OUTPUT (HEX):</span>
            <pre id="hash-output" class="text-sm text-gray-200 mt-1">Output Format: [Iterations]:[Salt]:[DerivedKey]</pre>

            <button onclick="copyHashOutput()" 
                    class="absolute top-1 right-1 p-2 bg-gray-600/50 text-white rounded-md opacity-0 group-hover:opacity-100 transition-opacity duration-200 focus:opacity-100"
                    title="Copy to Clipboard">
                <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 5H6a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2v-1M8 5a2 2 0 002 2h2a2 2 0 002-2M8 5a2 2 0 012-2h2a2 2 0 012 2m0 0h2a2 2 0 012 2v2M9 17v-6"></path>
                </svg>
            </button>
            
            <div id="hash-copy-notification" 
                 class="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 bg-green-500 text-white text-xs px-3 py-1 rounded-full opacity-0 hidden transition-opacity duration-300 pointer-events-none">
                Copied!
            </div>
        </div>
        
        <div id="verification-code-section" class="mt-6 hidden">
            <h3 class="text-lg font-semibold mb-2 text-green-400">Verification Logic (For Login/Server)</h3>
            <p class="text-sm text-gray-400 mb-2">Copy this function into your JS/server code to check a password against the hash you just generated.</p>
            
            <div class="terminal-box p-4 rounded-lg relative">
                <pre id="verification-code-output" class="text-xs text-gray-200 overflow-x-auto break-all"></pre>
                
                <button onclick="copyVerificationCode()" 
                        class="absolute top-2 right-2 p-2 bg-gray-600/50 text-white rounded-md transition-opacity duration-200"
                        title="Copy Code to Clipboard">
                    <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 5H6a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2v-1M8 5a2 2 0 002 2h2a2 2 0 002-2M8 5a2 2 0 012-2h2a2 2 0 012 2m0 0h2a2 2 0 012 2v2M9 17v-6"></path>
                    </svg>
                </button>
                <div id="code-copy-notification" class="hidden absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 bg-green-500 text-white text-xs px-3 py-1 rounded-full opacity-0 transition-opacity duration-300 pointer-events-none">Copied!</div>
            </div>
        </div>
    `;
}

