document.addEventListener('DOMContentLoaded', () => {
    // --- DOM Elements ---
    const htmlCode = document.getElementById('html-code');
    const cssCode = document.getElementById('css-code');
    const jsCode = document.getElementById('js-code');
    // Removed: const jsonCode
    
    const checkHtml = document.getElementById('check-html');
    const checkCss = document.getElementById('check-css');
    const checkJs = document.getElementById('check-js');
    // Removed: const checkJson

    const editorHtml = document.getElementById('editor-html');
    const editorCss = document.getElementById('editor-css');
    const editorJs = document.getElementById('editor-js');
    // Removed: const editorJson

    const viewButton = document.getElementById('view-button');
    const closeButton = document.getElementById('close-preview');
    const previewOverlay = document.getElementById('preview-overlay');
    const livePreview = document.getElementById('live-preview');

    // --- State & Initial Setup ---
    
    htmlCode.value = `<h1>Hello World!</h1>\n<p>This is a live code editor.</p>`;
    cssCode.value = `body { font-family: sans-serif; padding: 20px; background-color: #f0f0f0; }\nh1 { color: steelblue; }`;
    jsCode.value = `console.log('JavaScript is running!');\n`;


    // --- Core Functions ---

    /**
     * Updates the visibility of the code panels based on checkbox state.
     */
    function updatePanelVisibility() {
        editorHtml.classList.toggle('hidden', !checkHtml.checked);
        editorCss.classList.toggle('hidden', !checkCss.checked);
        editorJs.classList.toggle('hidden', !checkJs.checked);
        // Removed: editorJson logic

        // Adjust editor container layout 
        const allEditors = [editorHtml, editorCss, editorJs];
        const activeEditors = allEditors.filter(e => !e.classList.contains('hidden'));
        activeEditors.forEach(editor => editor.style.flex = `1 1 ${100 / activeEditors.length}%`);
    }

    /**
     * Enforces the CSS rule: CSS must be checked with HTML or JS.
     * @param {Event} e 
     */
    function enforceCssRule(e) {
        if (e.target === checkCss) {
            // If the user tries to uncheck CSS
            if (!checkCss.checked) {
                // If neither HTML nor JS is checked, re-check CSS and alert the user.
                if (!checkHtml.checked && !checkJs.checked) {
                    checkCss.checked = true; // Revert the change
                    alert("Rule: CSS must be viewed with either HTML or JavaScript to have any visible effect.");
                }
            }
        }

        // If user tries to uncheck HTML or JS, but CSS is checked
        if ((e.target === checkHtml || e.target === checkJs) && checkCss.checked) {
            if (!checkHtml.checked && !checkJs.checked) {
                // If they uncheck the *last* dependency for CSS, uncheck CSS too.
                checkCss.checked = false;
            }
        }
        
        updatePanelVisibility();
    }

    /**
     * Generates the final output and displays it in the iframe.
     */
    function showLivePreview() {
        // 1. Get the code from the active text areas
        const html = checkHtml.checked ? htmlCode.value : '';
        const css = checkCss.checked ? cssCode.value : '';
        const js = checkJs.checked ? jsCode.value : ''; 
        
        // Removed: JSON/Blob URL logic and string manipulation
        
        // 2. Construct the full HTML document
        const sourceCode = `
            <!DOCTYPE html>
            <html>
            <head>
                <style>
                    ${css}
                </style>
            </head>
            <body>
                ${html}
                <script>
                    // Execute the JS code. 
                    try {
                        ${js}
                    } catch (error) {
                        console.error('Error executing JavaScript in preview:', error);
                        document.body.innerHTML += '<div style="color: red; padding: 10px; border: 1px solid red;">JS Error: Check Console for details.</div>';
                    }
                </script>
            </body>
            </html>
        `;

        // 3. Write the code to the iframe
        livePreview.srcdoc = sourceCode;

        // 4. Show the overlay
        previewOverlay.classList.remove('hidden');
        setTimeout(() => {
            previewOverlay.classList.add('active');
        }, 10);
    }

    /**
     * Hides the full-screen preview.
     */
    function hideLivePreview() {
        previewOverlay.classList.remove('active');
        
        // Removed: Blob URL cleanup logic
        
        setTimeout(() => {
            previewOverlay.classList.add('hidden');
            livePreview.srcdoc = ''; // Clear iframe content
        }, 300);
    }


    // --- Event Listeners ---

    // Listener for checkbox changes
    [checkHtml, checkCss, checkJs].forEach(checkbox => { // Removed checkJson
        checkbox.addEventListener('change', enforceCssRule); 
    });

    // Listener for the View button
    viewButton.addEventListener('click', showLivePreview);

    // Listener for the Close (Circular X) button
    closeButton.addEventListener('click', hideLivePreview);

    // --- Initial Call ---
    updatePanelVisibility(); // Set the initial layout
});
