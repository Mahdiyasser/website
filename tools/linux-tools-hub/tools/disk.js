// tools/disk.js

/**
 * Parses raw df -h terminal output text and converts it into a structured array for analysis.
 * @param {string} rawText - The raw text output from a command like 'df -h'.
 * @returns {Object} - An object containing headers and data.
 */
function analyzeTerminalOutput(rawText) {
    const lines = rawText.trim().split('\n');
    if (lines.length < 2) return { headers: [], data: [] }; 

    const headers = ["Filesystem", "Size", "Used", "Avail", "Use%", "Mounted on"];
    const data = [];

    for (let i = 1; i < lines.length; i++) {
        const line = lines[i].trim();
        if (!line) continue;

        const values = line.split(/\s+/);
        
        if (values.length < headers.length) {
            console.warn(`Skipping line ${i + 1}: Column count mismatch.`);
            continue; 
        }

        const row = {};
        for (let j = 0; j < headers.length; j++) {
            row[headers[j]] = values[j] || 'N/A';
        }
        data.push(row);
    }

    return { headers, data };
}

/**
 * Renders the analyzed data into an HTML table with terminal styling.
 * @param {Array<string>} headers - The column headers.
 * @param {Array<Object>} data - The parsed row data.
 * @returns {string} - The HTML string for the table.
 */
function renderTerminalTable(headers, data) {
    if (data.length === 0) {
        return '<p class="text-yellow-400">No valid data lines found after analysis. Please ensure the full `df -h` output was copied correctly.</p>';
    }

    let html = '<table class="w-full text-left border-collapse">';
    
    // Header Row
    html += '<thead><tr class="text-purple-400 border-b border-gray-600">';
    for (const header of headers) {
        const alignment = (header === 'Size' || header === 'Used' || header === 'Avail' || header === 'Use%') ? 'text-right' : 'text-left';
        html += `<th class="p-2 ${alignment} font-bold">${header}</th>`;
    }
    html += '</tr></thead>';

    // Data Rows
    html += '<tbody>';
    data.forEach((row, rowIndex) => {
        const rowClass = rowIndex % 2 === 0 ? 'bg-gray-800/50' : 'bg-gray-700/50';
        html += `<tr class="${rowClass}">`;
        
        for (const header of headers) {
            const value = row[header] || '';
            let valueClass = 'text-white';
            let alignment = 'text-left';

            // Special handling and color-coding for the "Use%" column
            if (header === 'Use%') {
                alignment = 'text-right';
                const percent = parseInt(value.slice(0, -1));
                if (!isNaN(percent)) {
                    if (percent >= 90) {
                        valueClass = 'text-red-400 font-bold';
                    } else if (percent >= 75) {
                        valueClass = 'text-yellow-400';
                    } else {
                        valueClass = 'text-green-400';
                    }
                }
            } else if (header === 'Size' || header === 'Used' || header === 'Avail') {
                 alignment = 'text-right';
            }
            
            html += `<td class="p-2 ${alignment} ${valueClass}">${value}</td>`;
        }
        html += '</tr>';
    });
    html += '</tbody></table>';

    return html;
}


/**
 * Main handler function to process input and display output.
 */
function processDfOutput() {
    const rawInput = document.getElementById('df-input').value;
    const outputElement = document.getElementById('df-output-table-container');

    if (!rawInput.trim()) {
        outputElement.innerHTML = '<p class="text-gray-400">Please paste the output from your terminal command above.</p>';
        return;
    }

    const { headers, data } = analyzeTerminalOutput(rawInput);
    outputElement.innerHTML = renderTerminalTable(headers, data);
}


// --- UI Rendering ---

/**
 * Renders the Disk Output Analyzer UI by generating its own HTML.
 * NOTE: This function relies on resetToolContent defined in script.js
 */
function renderDiskTool() {
    resetToolContent('🖥️ Disk Output Analyzer (df -h)', 'Paste the output from your terminal’s `df -h` command to analyze and color-code your disk usage.');

    const COMMAND_TO_RUN = 'df -h';
    const PLACEHOLDER_TEXT = "Paste the raw output of 'df -h' here (including the header row). Example: Filesystem Size Used Avail Use% Mounted on";
    
    // The copy icon HTML to be displayed after the 'Copied!' message disappears.
    const copyIconHtml = `
        <svg style="width: 1rem; height: 1rem;" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 5H6a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2v-1M8 5a2 2 0 002 2h2a2 2 0 002-2M8 5a2 2 0 012-2h2a2 2 0 012 2m0 0h2a2 2 0 012 2v2M9 17v-6"></path>
        </svg>
    `.replace(/\n\s*/g, ''); // Minify the SVG HTML to keep the embedded script cleaner

    // Legacy copy logic with visual feedback
    const legacyCopyHandler = `
        var button = this;
        var originalContent = button.innerHTML;
        var command = '${COMMAND_TO_RUN}';
        
        // 1. Copy Logic
        var tempArea = document.createElement('textarea');
        tempArea.value = command;
        document.body.appendChild(tempArea);
        tempArea.select();
        document.execCommand('copy');
        document.body.removeChild(tempArea);

        // 2. Feedback Logic
        button.innerHTML = 'Copied!';
        button.style.width = '70px'; // Give it room for text
        button.style.padding = '0.125rem 0.5rem'; // Adjusted padding for text
        
        setTimeout(function() {
            button.innerHTML = originalContent;
            button.style.width = 'auto'; // Revert width
            button.style.padding = '0.125rem'; // Revert padding for icon
        }, 1200);
    `;
    
    // Using template literals for safety.
    document.getElementById('tool-content').innerHTML += `
        
        <style>
            /* Ensure the command box has space for content and is tight */
            .command-box-container {
                background-color: #1F2937; /* bg-gray-900 */
                border-radius: 0.5rem;      /* rounded-lg */
                margin-bottom: 1.5rem;      /* mb-6 */
                
                /* Display and padding for content */
                display: flex;
                justify-content: space-between;
                align-items: center;
                padding: 0.5rem 0.75rem; /* px-3 py-2, minimal vertical padding */
            }

            .copy-button {
                /* Mimics the button's style */
                margin-left: 0.5rem; /* ml-2 */
                padding: 0.125rem;   /* p-0.5 */
                background-color: rgba(75, 85, 99, 0.5); /* bg-gray-600/50 */
                color: white;
                border-radius: 0.25rem; /* rounded-md */
                border: none;
                cursor: pointer;
                font-weight: bold; /* For the 'Copied!' text */
                
                /* Opacity and transition control */
                opacity: 0;
                transition: opacity 200ms ease-in-out;
            }

            /* Simulating the group-hover:opacity-100 effect */
            .command-box-container:hover .copy-button {
                opacity: 1;
            }
        </style>
        
        <h3 class="text-lg font-semibold mb-2 text-green-400">1. Run This Command in Your Terminal (Linux/macOS)</h3>
        
        <div class="command-box-container">
            <code id="df-command-code" style="font-size: 0.875rem; color: #68D391; user-select: all;">${COMMAND_TO_RUN}</code>
            <button onclick="${legacyCopyHandler}" 
                    class="copy-button"
                    title="Copy Command">
                ${copyIconHtml}
            </button>
        </div>
        
        <label for="df-input" class="block text-sm font-medium text-gray-300 mb-1">
            <span style="font-weight: bold;">2. Paste the full output result here:</span>
        </label>
        
        <textarea id="df-input" rows="7" 
                  class="input-style w-full p-3 font-mono text-sm rounded-lg focus:ring-purple-500 focus:border-purple-500 mb-4"
                  placeholder="${PLACEHOLDER_TEXT}"></textarea>

        <button onclick="processDfOutput()" 
                class="tool-button bg-purple-600 hover:bg-purple-700 text-white font-semibold py-2 px-4 rounded-lg shadow-md w-full mb-6">
            Analyze Output and Generate Table
        </button>

        <h3 class="text-xl font-semibold mb-3 text-purple-400">3. Analyzed Disk Usage Table</h3>
        
        <div id="df-output-table-container" class="terminal-box p-4 rounded-lg overflow-x-auto mb-6">
            <p class="text-gray-400">The analyzed disk data will appear here after you click the button.</p>
        </div>

        <details class="mb-4 bg-gray-800 rounded-lg">
            <summary class="text-xl font-semibold p-4 text-purple-400 cursor-pointer hover:bg-gray-700 rounded-lg">
                4. Detailed Explanation of File Systems and Columns
            </summary>
            <div class="p-4 pt-0 text-sm text-gray-300">
                <h4 class="text-lg text-white mt-2 mb-2">Column Meanings (The Headers)</h4>
                <ul class="list-disc list-inside space-y-2 ml-4 mb-4">
                    <li><span style="font-weight: bold;">Filesystem</span>: The identifier for the storage source.</li>
                    <li><span style="font-weight: bold;">Size</span>: The <span style="font-weight: bold;">total capacity</span> of the file system.</li>
                    <li><span style="font-weight: bold;">Used</span>: The amount of space currently <span style="font-weight: bold;">occupied</span> by data.</li>
                    <li><span style="font-weight: bold;">Avail (Available)</span>: The amount of space <span style="font-weight: bold;">free</span> for new files to be written.</li>
                    <li><span style="font-weight: bold;">Use%</span>: The <span style="font-weight: bold;">percentage</span> of the total space that is Used (Color-coded: Red >90%, Yellow >75%).</li>
                    <li><span style="font-weight: bold;">Mounted on</span>: The <span style="font-weight: bold;">directory path</span> where the file system is attached. (e.g., &#x2F; is the root directory).</li>
                </ul>

                <h4 class="text-lg text-white mt-2 mb-2">Common Filesystem Types Explained</h4>
                <ul class="list-disc list-inside space-y-2 ml-4">
                    <li><span style="font-weight: bold;">&#x2F;dev&#x2F;sdaX (or &#x2F;dev&#x2F;root)</span>: These represent partitions on a physical hard drive (SATA or SCSI Disk A, partition X). This is where your <span style="font-weight: bold;">main operating system files</span> and large data usually reside (e.g., &#x2F; for root, &#x2F;boot for kernel files).</li>
                    <li><span style="font-weight: bold;">tmpfs</span>: A <span style="font-weight: bold;">temporary file system</span> that resides entirely in <span style="font-weight: bold;">RAM (memory)</span>. This is used by the system for speed, often mounted on directories like &#x2F;dev&#x2F;shm (shared memory) or &#x2F;run. Data here is <span style="font-weight: bold;">lost on reboot</span>.</li>
                    <li><span style="font-weight: bold;">&#x2F;dev&#x2F;mapper&#x2F;...</span>: Typically indicates a <span style="font-weight: bold;">Logical Volume Management (LVM)</span> or encrypted volume. The physical disk is abstracted by a volume group.</li>
                    <li><span style="font-weight: bold;">&#x2F;dev&#x2F;loopX</span>: Represents a <span style="font-weight: bold;">loop device</span>, allowing a file to be mounted as a block device. This is commonly used for mounting <span style="font-weight: bold;">Snap packages</span> in modern Linux distributions.</li>
                    <li><span style="font-weight: bold;">&#x2F;media&#x2F;user&#x2F;...</span>: Represents <span style="font-weight: bold;">removable media</span> or <span style="font-weight: bold;">user-mounted devices</span>, like USB drives, external HDDs, or partitions that are not part of the main system.</li>
                </ul>
            </div>
        </details>
    `;
    
    document.getElementById('df-input').value = ''; 
}
