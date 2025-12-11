document.addEventListener('DOMContentLoaded', () => {
    // --- DOM Elements ---
    const htmlCodeArea = document.getElementById('html-code');
    const cssCodeArea = document.getElementById('css-code');
    const jsCodeArea = document.getElementById('js-code');
    
    const checkHtml = document.getElementById('check-html');
    const checkCss = document.getElementById('check-css');
    const checkJs = document.getElementById('check-js');

    const editorHtml = document.getElementById('editor-html');
    const editorCss = document.getElementById('editor-css');
    const editorJs = document.getElementById('editor-js');

    const viewButton = document.getElementById('view-button');
    const closeButton = document.getElementById('close-preview');
    const previewOverlay = document.getElementById('preview-overlay');
    const livePreview = document.getElementById('live-preview');

    // --- CodeMirror Initialization ---
    
    const baseOptions = {
        lineNumbers: true, 
        theme: 'monokai',
        tabSize: 4,
        indentUnit: 4,
        autoCloseBrackets: true, // For brackets in JS/CSS
    };

    const htmlEditor = CodeMirror.fromTextArea(htmlCodeArea, {
        ...baseOptions,
        mode: 'htmlmixed',
        autoCloseTags: true, // Specific for HTML
        value: `<h1>Hello World!</h1>\n<p>This is a live code editor.</p>`,
    });

    const cssEditor = CodeMirror.fromTextArea(cssCodeArea, {
        ...baseOptions,
        mode: 'css',
        value: `body { font-family: sans-serif; padding: 20px; background-color: #f0f0f0; }\nh1 { color: steelblue; }`,
    });

    const jsEditor = CodeMirror.fromTextArea(jsCodeArea, {
        ...baseOptions,
        mode: 'javascript',
        value: `console.log('JavaScript is running!');\n`,
    });
    
    // --- Core Functions ---

    /**
     * Updates the visibility and max-width of the code panels based on checkbox state.
     */
    function updatePanelVisibility() {
        editorHtml.classList.toggle('hidden', !checkHtml.checked);
        editorCss.classList.toggle('hidden', !checkCss.checked);
        editorJs.classList.toggle('hidden', !checkJs.checked);

        // Collect all panels to apply the width rules
        const allEditors = [editorHtml, editorCss, editorJs];
        const activeEditors = allEditors.filter(e => !e.classList.contains('hidden'));
        
        const numActive = activeEditors.length;
        // Calculates 100, 50, or 33.333...
        const widthPercentage = `${100 / numActive}%`; 

        allEditors.forEach(editor => {
            if (editor.classList.contains('hidden')) {
                // When hidden, reset properties to ensure proper hiding/showing
                editor.style.flex = '0 0 auto';
                editor.style.maxWidth = '0';
            } else {
                // 1. Set the max-width as explicitly requested.
                editor.style.maxWidth = widthPercentage;
                
                // 2. Set flex-grow to 0 so the panels do NOT grow beyond their max-width,
                //    but set flex-basis to 0 so they shrink correctly when needed.
                //    This combination enforces the max-width as the effective size.
                editor.style.flex = `0 0 ${widthPercentage}`;
            }
        });

        // Crucial: CodeMirror must be refreshed when its container changes size/visibility
        setTimeout(() => {
            htmlEditor.refresh();
            cssEditor.refresh();
            jsEditor.refresh();
        }, 0); 
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
        // 1. Get the code from the CodeMirror instances (using getValue())
        const html = checkHtml.checked ? htmlEditor.getValue() : '';
        const css = checkCss.checked ? cssEditor.getValue() : '';
        const js = checkJs.checked ? jsEditor.getValue() : ''; 
        
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
        
        setTimeout(() => {
            previewOverlay.classList.add('hidden');
            livePreview.srcdoc = ''; // Clear iframe content
        }, 300);
    }


    // --- Event Listeners ---

    // Listener for checkbox changes
    [checkHtml, checkCss, checkJs].forEach(checkbox => { 
        checkbox.addEventListener('change', enforceCssRule); 
    });

    // Listener for the View button
    viewButton.addEventListener('click', showLivePreview);

    // Listener for the Close (Circular X) button
    closeButton.addEventListener('click', hideLivePreview);

    // --- Initial Call ---
    updatePanelVisibility(); // Set the initial layout (and refresh CM)
});
