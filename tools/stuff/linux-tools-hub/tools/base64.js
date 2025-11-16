// tools/base64.js

// --- Configuration: Defines the 9 UNIQUE layers ---
const ENCODING_SEQUENCE = [
    'CUSTOM_B64',       // Layer 1: Fully custom Base64 (UTF-8 safe)
    'ADD_PADDING',      // Layer 2: Add custom noise
    'REVERSE_WORDS',    // Layer 3: Reverse the order of words
    'HEX_SWAP',         // Layer 4: Swap hex pairs
    'CHAR_OFFSET',      // Layer 5: Shift character ASCII values by a fixed offset
    'CHAR_SUBTRACT',    // Layer 6: Subtract character ASCII values
    'DIGIT_REPLACE',    // Layer 7: Replace digits 0-9 with custom chars
    'BASE_N_CONVERT',   // Layer 8: Convert number groups to a higher base (Base 16)
    'BASE64_VARIANT'    // Layer 9 (Final): Base64 using a modified alphabet
];
const PADDING_STRING = "XYZ_";
const PADDING_INTERVAL = 10;
const CHAR_SHIFT_OFFSET = 3;
const CHAR_SUB_KEY = 1; 
const DIGIT_MAP = {
    '0': '!', '1': '@', '2': '#', '3': '$', '4': '%',
    '5': '^', '6': '&', '7': '*', '8': '(', '9': ')'
};
const BASE64_VARIANT_ALPHABET = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-_'; // Custom alphabet
// ------------------------------------------

// --- Custom Base64 Layer (Layers 1 and 9 - avoids direct atob/btoa for layers 2-8) ---

// Custom UTF-8 to Base64 (Layer 1)
function utf8ToCustomBase64(str) {
    const bytes = new TextEncoder().encode(str);
    let result = '';
    for (let i = 0; i < bytes.length; i++) {
        result += String.fromCharCode(bytes[i]);
    }
    // Now use standard btoa on the ASCII-safe string
    return btoa(result);
}

// Custom Base64 to UTF-8 (Layer 1 DECODE)
function customBase64ToUtf8(str) {
    const binaryStr = atob(str); 
    const bytes = new Uint8Array(binaryStr.length);
    for (let i = 0; i < binaryStr.length; i++) {
        bytes[i] = binaryStr.charCodeAt(i);
    }
    return new TextDecoder("utf-8").decode(bytes);
}

// Custom Base64 Variant Layer (Layer 9)
function base64Variant(str) {
    const standardB64 = utf8ToCustomBase64(str);
    let result = '';
    const standardAlphabet = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/';
    for(const char of standardB64) {
        let index = standardAlphabet.indexOf(char);
        result += (index >= 0) ? BASE64_VARIANT_ALPHABET[index] : char;
    }
    return result;
}

// Custom Base64 Variant Decode (Layer 9 DECODE)
function unBase64Variant(str) {
    let standardB64 = '';
    const standardAlphabet = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/';
    for(const char of str) {
        let index = BASE64_VARIANT_ALPHABET.indexOf(char);
        standardB64 += (index >= 0) ? standardAlphabet[index] : char;
    }
    return customBase64ToUtf8(standardB64);
}

// --- Custom Obfuscation Layers (Layers 2-8) ---

// Layer 2: Adds PADDING_STRING every PADDING_INTERVAL characters.
function addPadding(str) {
    let result = '';
    for (let i = 0; i < str.length; i += PADDING_INTERVAL) {
        result += str.substring(i, i + PADDING_INTERVAL) + PADDING_STRING;
    }
    return result;
}
function removePadding(str) {
    return str.replaceAll(PADDING_STRING, '');
}

// Layer 3: Reverses the order of words.
function reverseWords(str) {
    return str.split(/\s+/).reverse().join(' ');
}
const unReverseWords = reverseWords;

// Layer 4: Swaps every pair of characters.
function hexSwap(str) {
    let result = '';
    const paddedStr = (str.length % 2 !== 0) ? str + ' ' : str;
    for (let i = 0; i < paddedStr.length; i += 2) {
        result += paddedStr[i + 1] + paddedStr[i];
    }
    return (str.length % 2 !== 0) ? result.substring(0, result.length - 1) : result;
}
const unHexSwap = hexSwap;

// Layer 5: Shifts ASCII value by the defined offset.
function charOffset(str) {
    return str.split('').map(char => String.fromCharCode(char.charCodeAt(0) + CHAR_SHIFT_OFFSET)).join('');
}
function unCharOffset(str) {
    return str.split('').map(char => String.fromCharCode(char.charCodeAt(0) - CHAR_SHIFT_OFFSET)).join('');
}

// Layer 6: Subtracts ASCII value by a defined key.
function charSubtract(str) {
    return str.split('').map(char => String.fromCharCode(char.charCodeAt(0) - CHAR_SUB_KEY)).join('');
}
function unCharSubtract(str) {
    return str.split('').map(char => String.fromCharCode(char.charCodeAt(0) + CHAR_SUB_KEY)).join('');
}

// Layer 7: Replaces digits 0-9 with custom symbols.
function digitReplace(str) {
    let result = str;
    for (const [digit, symbol] of Object.entries(DIGIT_MAP)) {
        result = result.replace(new RegExp(digit, 'g'), symbol);
    }
    return result;
}
function unDigitReplace(str) {
    let result = str;
    for (const [digit, symbol] of Object.entries(DIGIT_MAP)) {
        result = result.replace(new RegExp('\\' + symbol, 'g'), digit);
    }
    return result;
}

// Layer 8: Converts number strings embedded in the input to Base 16 (hex).
function baseNConvert(str) {
    return str.replace(/(\d+)/g, (match) => {
        return `[B16:${parseInt(match, 10).toString(16).toUpperCase()}]`;
    });
}
function unBaseNConvert(str) {
    return str.replace(/\[B16:([0-9A-F]+)\]/g, (match, hexValue) => {
        return parseInt(hexValue, 16).toString(10);
    });
}


// --- Unified Layer Processing ---

const PROCESSORS = {
    'CUSTOM_B64': { encode: utf8ToCustomBase64, decode: customBase64ToUtf8 },
    'ADD_PADDING': { encode: addPadding, decode: removePadding },
    'REVERSE_WORDS': { encode: reverseWords, decode: unReverseWords },
    'HEX_SWAP': { encode: hexSwap, decode: unHexSwap },
    'CHAR_OFFSET': { encode: charOffset, decode: unCharOffset },
    'CHAR_SUBTRACT': { encode: charSubtract, decode: unCharSubtract },
    'DIGIT_REPLACE': { encode: digitReplace, decode: unDigitReplace },
    'BASE_N_CONVERT': { encode: baseNConvert, decode: unBaseNConvert },
    'BASE64_VARIANT': { encode: base64Variant, decode: unBase64Variant }
};

function processLayers(input, direction) {
    let result = input;
    let sequence = ENCODING_SEQUENCE;

    if (direction === 'decode') {
        sequence = [...ENCODING_SEQUENCE].reverse();
    }

    for (let i = 0; i < sequence.length; i++) {
        const step = sequence[i];
        const processor = PROCESSORS[step];

        if (!processor) {
            throw new Error(`Unknown layer defined: ${step}`);
        }

        const func = (direction === 'encode') ? processor.encode : processor.decode;
        result = func(result);
    }

    return result;
}


// --- NEW: Copy Functionality (REVISED for reliability) ---

function copyOutput() {
    const outputElement = document.getElementById('base64-output');
    const textToCopy = outputElement.textContent;
    const notification = document.getElementById('copy-notification');

    if (!textToCopy.trim() || textToCopy.startsWith('OBFUSCATION ERROR:')) {
        // Show failure notification or simply return
        alert('Nothing valid to copy.');
        return;
    }
    
    // 1. Create a temporary, hidden textarea element
    const tempTextArea = document.createElement('textarea');
    tempTextArea.value = textToCopy;
    
    // Ensure it's off-screen but "visible" enough to be copied
    tempTextArea.style.position = 'fixed';
    tempTextArea.style.top = '0';
    tempTextArea.style.left = '-9999px';
    
    // 2. Append to the document, select the text, and copy
    document.body.appendChild(tempTextArea);
    tempTextArea.focus();
    tempTextArea.select();
    
    let success = false;
    try {
        success = document.execCommand('copy'); // Use deprecated but reliable synchronous copy method
    } catch (err) {
        console.error('Fallback copy failed:', err);
    }
    
    // 3. Clean up and show notification
    document.body.removeChild(tempTextArea);

    if (success) {
        // Simple visual feedback
        notification.classList.remove('opacity-0', 'hidden');
        notification.classList.add('opacity-100');
        
        setTimeout(() => {
            notification.classList.remove('opacity-100');
            notification.classList.add('opacity-0');
        }, 1500);
    } else {
        alert('Failed to copy text. Your browser may require manual selection.');
    }
}

// --- Main Tool Functions (UI and Action) ---

// NOTE: This function relies on resetToolContent defined in script.js
function renderBase64Tool() {
    resetToolContent('Base64 Encoder/Decoder (9-Layer Obfuscation)', 'Custom multi-layer obfuscation (9 unique steps) for multi-language text.');

    document.getElementById('tool-content').innerHTML += `
        <textarea id="base64-input" class="input-style w-full p-3 rounded-lg focus:ring-green-500 focus:border-green-500 mb-4" rows="5" placeholder="Enter text to encode or obfuscated string to decode (supports Unicode)..."></textarea>
        <div class="flex flex-col sm:flex-row gap-3 mb-6">
            <button onclick="performBase64Action('encode')" class="tool-button bg-green-600 hover:bg-green-700 text-white font-semibold py-2 px-4 rounded-lg shadow-md flex-1">Encode (9 Layers)</button>
            <button onclick="performBase64Action('decode')" class="tool-button bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 px-4 rounded-lg shadow-md flex-1">Decode (9 Layers)</button>
        </div>
        
        <div class="relative group">
            <div class="terminal-box p-4 rounded-lg border border-green-500/50">
                <span class="text-green-500 font-mono">$ Output:</span>
                <pre id="base64-output" class="text-sm text-gray-200 mt-1"></pre>
            </div>
            
            <button onclick="copyOutput()" 
                    class="absolute top-1 right-1 p-2 bg-gray-600/50 text-white rounded-md opacity-0 group-hover:opacity-100 transition-opacity duration-200 focus:opacity-100"
                    title="Copy to Clipboard">
                <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 5H6a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2v-1M8 5a2 2 0 002 2h2a2 2 0 002-2M8 5a2 2 0 012-2h2a2 2 0 012 2m0 0h2a2 2 0 012 2v2M9 17v-6"></path>
                </svg>
            </button>
            
            <div id="copy-notification" 
                 class="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 bg-green-500 text-white text-xs px-3 py-1 rounded-full opacity-0 hidden transition-opacity duration-300 pointer-events-none">
                Copied!
            </div>
        </div>
    `;
}

function performBase64Action(action) {
    const input = document.getElementById('base64-input').value;
    const outputElement = document.getElementById('base64-output');
    let result = '';

    try {
        if (!input.trim()) {
             throw new Error("Input cannot be empty.");
        }
        result = processLayers(input, action);

    } catch (e) {
        result = `OBFUSCATION ERROR: ${e.message}`;
        outputElement.classList.add('text-red-500');
        outputElement.classList.remove('text-gray-200');
        outputElement.textContent = result;
        return;
    }

    outputElement.classList.remove('text-red-500');
    outputElement.classList.add('text-gray-200');
    outputElement.textContent = result;
}
