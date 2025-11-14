// script.js
const toolContentDiv = document.getElementById('tool-content');
const navContainer = document.getElementById('nav-container');

// NOTE: The rendering functions (renderBase64Tool, performBase64Action, etc.)
// are defined in their respective /tools/*.js files, which are loaded before this script.

// Global state mapping tool names to their rendering functions
const TOOLS = {
    'base64 Encoder/Decoder': renderBase64Tool,
    'Super Hash Generator': renderHashGenerator,
    'Disk Space Calculator ': renderDiskTool,
    'System Info Loader': renderSystemInfoLoader,
    'Fast Quiz': renderFastquiz, 
    'Real Quiz': renderRealquiz, 
};

// Utility function to clear content and set title - accessible globally
function resetToolContent(title, description) {
    toolContentDiv.innerHTML = `
        <h2 class="text-2xl font-bold text-green-400 mb-2">${title}</h2>
        <p class="text-gray-400 mb-6 border-b border-gray-700 pb-3">${description}</p>
    `;
}

function navigateTo(toolName) {
    // Get the function mapped to the tool name
    const toolFunction = TOOLS[toolName];
    if (toolFunction) {
        // Execute the function to render the tool UI
        toolFunction();

        // Update active state in navigation
        document.querySelectorAll('.tool-button-nav').forEach(button => {
            if (button.dataset.tool === toolName) {
                button.classList.add('active');
                button.classList.remove('bg-gray-700/50', 'hover:bg-gray-700');
            } else {
                button.classList.remove('active');
                button.classList.add('bg-gray-700/50', 'hover:bg-gray-700');
            }
        });
    } else {
        toolContentDiv.innerHTML = `<h2 class="text-xl text-red-500">Error: Tool '${toolName}' not found.</h2>`;
    }
}

function initializeNavigation() {
    let firstToolName = '';
    for (const name in TOOLS) {
        if (!firstToolName) firstToolName = name; // Capture the first tool name for default loading

        const button = document.createElement('button');
        button.textContent = name;
        button.className = 'tool-button-nav tool-button bg-gray-700/50 hover:bg-gray-700 text-left font-medium p-3 rounded-lg w-full';
        button.dataset.tool = name;
        button.onclick = () => navigateTo(name);
        navContainer.appendChild(button);
    }

    // Load the first tool by default
    if (firstToolName) {
        navigateTo(firstToolName);
    }
}

// Start the application when the window loads
window.onload = initializeNavigation;
