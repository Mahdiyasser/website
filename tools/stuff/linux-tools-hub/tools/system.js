// system.js

/**
 * Parses raw system information text output and converts it into a structured object.
 * @param {string} rawText - The raw text output from various system commands.
 * @returns {Object} - An object containing structured system information.
 */
function parseSystemInfo(rawText) {
    const info = {};
    const lines = rawText.trim().split('\n');
    
    // --- 1. General Key=Value Parsing (Resilient) ---
    lines.forEach(line => {
        // Pattern 1: KEY=VALUE (like OS-release)
        let match = line.match(/^(\w+)=["']?([^"']+)["']?$/);
        if (match) {
            const key = match[1].trim().toUpperCase().replace(/_/g, ' ');
            const value = match[2].trim();
            if (value) info[key] = value;
            return;
        }

        // Pattern 2: KEY: VALUE (like lscpu or hostnamectl)
        match = line.match(/^([^:\s]+):\s+(.*)$/);
        if (match) {
            const key = match[1].trim().toUpperCase().replace(/ /g, '_');
            const value = match[2].trim();
            if (value) info[key] = value;
            return;
        }
        
        // Pattern 3: LSB_RELEASE (Description, Release, etc.)
        match = line.match(/^(Distributor ID|Description|Release|Codename):\s+(.*)$/i);
        if (match) {
            const key = match[1].trim().toUpperCase().replace(/ /g, '_');
            const value = match[2].trim();
            if (value) info[key] = value;
            return;
        }
    });

    // --- 2. Specific Parsing for 'uname -a' (Fallback/Supplemental) ---
    const unameLine = lines.find(line => line.toLowerCase().includes('gnu/linux') || line.toLowerCase().includes('darwin'));
    if (unameLine) {
        const parts = unameLine.split(/\s+/).filter(Boolean); // Filter empty strings
        if (parts.length >= 2) {
            if (!info['SYSTEM_NAME'] && parts[0]) info['SYSTEM_NAME'] = parts[0];
            if (!info['KERNEL_VERSION'] && parts[2]) info['KERNEL_VERSION'] = parts[2];
            if (!info['ARCHITECTURE'] && parts[parts.length - 1]) info['ARCHITECTURE'] = parts[parts.length - 1];
        }
    }

    // --- 3. Specific Parsing for 'free -h' (Memory) ---
    const memLine = lines.find(line => line.match(/^Mem:\s+/));
    if (memLine) {
        const parts = memLine.split(/\s+/).filter(Boolean);
        if (parts.length >= 4) {
            if (parts[1]) info['MEMORY_TOTAL'] = parts[1];
            if (parts[2]) info['MEMORY_USED'] = parts[2];
        }
    }
    
    // --- 4. Specific Parsing for 'lshw -short' (Hardware) ---
    const hardware = {};
    lines.forEach(line => {
        const match = line.match(/^\/(\w+)\s+(.+)$/);
        if (match) {
            const type = match[1];
            // Extract description, which is the last part
            const description = match[2].trim().split(/\s{2,}/).pop(); 
            
            if (type === 'core' && description.includes('Motherboard')) {
                hardware['MOTHERBOARD'] = description;
            } else if (type === 'cpu') {
                hardware['CPU_SUMMARY'] = description;
            } else if (type === 'memory') {
                 if (!info['MEMORY_TOTAL']) hardware['MEMORY_SUMMARY'] = description;
            }
        }
    });
    Object.assign(info, hardware);
    
    // --- 5. Grouping, Prioritizing, and Filtering Empty Values (Final Output) ---
    const finalInfo = {};
    
    // Helper function to add a key/value to a category if the value exists
    const add = (categoryName, key, value) => {
        if (!value || value === 'N/A' || !value.trim()) return;
        if (!finalInfo[categoryName]) finalInfo[categoryName] = {};
        
        // Clean up the key for display
        const displayKey = key.replace(/[()]/g, '').replace(/_/g, ' '); 
        finalInfo[categoryName][displayKey] = value;
    };
    
    // --- OS/HOST Group ---
    const osName = info['NAME'] || info['DISTRIBUTOR_ID'] || info['OPERATING_SYSTEM_IS'];
    const osVersion = info['VERSION_ID'] || info['RELEASE'] || info['VERSION'];
    let osString = osName ? osName : '';
    if (osVersion && osVersion !== osName) {
        osString += osString ? ` (${osVersion})` : osVersion;
    }
    add('OS/HOST', 'OPERATING SYSTEM', osString);
    add('OS/HOST', 'HOSTNAME', info['HOSTNAME'] || info['STATIC_HOSTNAME']);
    add('OS/HOST', 'VIRTUALIZATION', info['VIRTUALIZATION']);
    add('OS/HOST', 'KERNEL VERSION', info['KERNEL_VERSION']);
    add('OS/HOST', 'ARCHITECTURE', info['ARCHITECTURE']);
    
    // --- CPU Group ---
    add('CPU', 'CPU MODEL (Hardware)', info['CPU_SUMMARY']);
    if (!info['CPU_SUMMARY']) add('CPU', 'CPU MODEL', info['MODEL_NAME']);
    add('CPU', 'LOGICAL CORES', info['CPU(S)']);
    add('CPU', 'PHYSICAL CORES', info['CORE(S)_PER_SOCKET']);
    add('CPU', 'VENDOR ID', info['VENDOR_ID']);
    add('CPU', 'CPU FLAGS (FEATURES)', info['FLAGS']);

    // --- MEMORY Group ---
    add('MEMORY', 'TOTAL RAM', info['MEMORY_TOTAL']);
    add('MEMORY', 'USED RAM', info['MEMORY_USED']);
    add('MEMORY', 'MEMORY HARDWARE', info['MEMORY_SUMMARY']);

    // --- HARDWARE Group ---
    add('HARDWARE', 'MOTHERBOARD', info['MOTHERBOARD']);

    // --- OTHER DETAILS Group (Catch-all for remaining clean data) ---
    const classifiedKeys = new Set(Object.values(finalInfo).flatMap(obj => Object.keys(obj).map(k => k.toUpperCase().replace(/ /g, '_'))));
    
    Object.keys(info).forEach(key => {
        const keyCleaned = key.toUpperCase().replace(/ /g, '_');
        const value = info[key];
        
        // Only add if the key is not already classified and the value is present
        if (!classifiedKeys.has(keyCleaned) && value.trim() && value !== 'N/A') {
             add('OTHER DETAILS', key, value);
        }
    });
    
    return finalInfo;
}


/**
 * Renders the analyzed data into an HTML list with a vertical, block-style layout,
 * grouped by category (Host, CPU, Memory, etc.) using pseudo-headings.
 * @param {Object} info - The structured system information (now nested).
 * @returns {string} - The HTML string for the list.
 */
function renderSystemInfoList(info) {
    if (Object.keys(info).length === 0) {
        return '<p class="text-yellow-400">No core system information found. Please ensure the full output of the suggested commands was copied.</p>';
    }

    let html = '<div class="space-y-6">'; // Main container
    
    const categoryOrder = ['OS/HOST', 'CPU', 'MEMORY', 'HARDWARE', 'OTHER DETAILS'];

    // Sort categories
    const categories = Object.keys(info).sort((a, b) => {
        const indexA = categoryOrder.indexOf(a);
        const indexB = categoryOrder.indexOf(b);
        if (indexA !== -1 && indexB !== -1) return indexA - indexB;
        if (indexA !== -1) return -1;
        if (indexB !== -1) return 1;
        return a.localeCompare(b);
    });

    categories.forEach(category => {
        const details = info[category];
        
        // Skip category if it's empty after filtering
        if (Object.keys(details).length === 0) return;

        // Category Heading
        html += `<h4 class="text-xl text-yellow-500 border-b border-gray-700 pb-1 mb-3">${category.replace('/', ' / ')}:</h4>`;

        // Item List (Block format)
        Object.keys(details).forEach(key => {
            const value = details[key];
            
            html += `
                <div class="block pl-2">
                    <p class="text-purple-400 font-bold mb-0 uppercase tracking-wide text-sm">${key}:</p>
                    <p class="text-white font-mono text-sm pl-4 whitespace-pre-wrap break-all">${value}</p>
                </div>
            `;
        });
        html += '<hr class="border-gray-800">'; // Separator between groups
    });

    html += '</div>';

    return html;
}


/**
 * Main handler function to process input and display output.
 */
function processSystemInfo() {
    const rawInput = document.getElementById('system-info-input').value;
    const outputElement = document.getElementById('system-info-output-container');

    if (!rawInput.trim()) {
        outputElement.innerHTML = '<p class="text-gray-400">Please paste the output from a system command above.</p>';
        return;
    }

    const systemInfo = parseSystemInfo(rawInput);
    outputElement.innerHTML = renderSystemInfoList(systemInfo);
}


// --- UI Rendering ---

/**
 * Renders the System Info Loader UI by generating its own HTML.
 * NOTE: This function relies on resetToolContent defined in script.js
 */
function renderSystemInfoLoader() {
    resetToolContent('💻 System Information Loader', 'Paste the output from common system commands (Linux/macOS) to view key details clearly.');

    // Updated command list
    const COMMANDS_TO_RUN = `uname -a
cat /etc/os-release
hostnamectl
lscpu
free -h
lshw -short`;

    const PLACEHOLDER_TEXT = "Paste the raw output from ALL of these commands together: 'uname -a', 'cat /etc/os-release', 'hostnamectl', 'lscpu', 'free -h', and 'lshw -short'.";
    
    // Legacy copy logic to be embedded in onclick (Reusing the guaranteed fix logic)
    const legacyCopyHandler = `
        var button = this;
        var originalContent = button.innerHTML;
        var command = '${COMMANDS_TO_RUN.replace(/\n/g, '\\n')}'; // Escape newlines for use in JS string
        
        // 1. Copy Logic
        var tempArea = document.createElement('textarea');
        tempArea.value = command;
        document.body.appendChild(tempArea);
        tempArea.select();
        document.execCommand('copy');
        document.body.removeChild(tempArea);

        // 2. Feedback Logic
        button.innerHTML = 'Copied!';
        button.style.width = '70px'; 
        button.style.padding = '0.125rem 0.5rem'; 
        
        setTimeout(function() {
            button.innerHTML = originalContent;
            button.style.width = 'auto'; 
            button.style.padding = '0.125rem'; 
        }, 1200);
    `;
    
    // Copy icon HTML (Minified)
    const copyIconHtml = `<svg style="width: 1rem; height: 1rem;" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 5H6a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2v-1M8 5a2 2 0 002 2h2a2 2 0 002-2M8 5a2 2 0 012-2h2a2 2 0 012 2m0 0h2a2 2 0 012 2v2M9 17v-6"></path></svg>`;

    document.getElementById('tool-content').innerHTML += `
        
        <style>
            .command-box-container {
                background-color: #1F2937; /* bg-gray-900 */
                border-radius: 0.5rem;      /* rounded-lg */
                margin-bottom: 1.5rem;      /* mb-6 */
                display: flex;
                justify-content: space-between;
                align-items: center;
                padding: 0.5rem 0.75rem; 
            }
            .copy-button {
                margin-left: 0.5rem; 
                padding: 0.125rem;   
                background-color: rgba(75, 85, 99, 0.5); 
                color: white;
                border-radius: 0.25rem; 
                border: none;
                cursor: pointer;
                font-weight: bold; 
                opacity: 0;
                transition: opacity 200ms ease-in-out;
            }
            .command-box-container:hover .copy-button {
                opacity: 1;
            }
        </style>
        
        <h3 class="text-lg font-semibold mb-2 text-green-400">1. Run These Commands in Your Terminal (Linux/macOS)</h3>
        
        <div class="command-box-container">
            <code id="system-command-code" style="font-size: 0.875rem; color: #68D391; user-select: all; white-space: pre;">${COMMANDS_TO_RUN}</code>
            <button onclick="${legacyCopyHandler}" 
                    class="copy-button"
                    title="Copy Commands">
                ${copyIconHtml}
            </button>
        </div>
        
        <label for="system-info-input" class="block text-sm font-medium text-gray-300 mb-1">
            <span style="font-weight: bold;">2. Paste the full output of the command(s) here (all outputs together):</span>
        </label>
        
        <textarea id="system-info-input" rows="7" 
                  class="input-style w-full p-3 font-mono text-sm rounded-lg focus:ring-purple-500 focus:border-purple-500 mb-4"
                  placeholder="${PLACEHOLDER_TEXT}"></textarea>

        <button onclick="processSystemInfo()" 
                class="tool-button bg-purple-600 hover:bg-purple-700 text-white font-semibold py-2 px-4 rounded-lg shadow-md w-full mb-6">
            Analyze System Information
        </button>

        <h3 class="text-xl font-semibold mb-3 text-purple-400">3. Structured System Details</h3>
        
        <div id="system-info-output-container" class="terminal-box p-4 rounded-lg overflow-x-auto mb-6">
            <p class="text-gray-400">The analyzed system data will appear here after you click the button.</p>
        </div>
    `;
    
    document.getElementById('system-info-input').value = ''; 
}
