document.addEventListener('DOMContentLoaded', () => {
    // --- DOM Elements ---
    const markdownInput = document.getElementById('markdown-input');
    const fileUpload = document.getElementById('file-upload');
    
    // Buttons
    const convertButton = document.getElementById('convert-button');
    const previewButton = document.getElementById('preview-button');
    const copyHtmlOutsideButton = document.getElementById('copy-html-outside-button');
    
    // Modals
    const outputModal = document.getElementById('html-output-modal');
    const previewModal = document.getElementById('preview-modal');
    const htmlOutputCode = document.getElementById('html-output-code');
    const previewDisplay = document.getElementById('preview-display');
    const copyHtmlModalButton = document.getElementById('copy-html-modal-button'); 
    const backToEditorButton = document.getElementById('back-to-editor-button'); // New back button

    // State to hold the last successful HTML conversion
    let lastConvertedHTML = '';
    
    // --- Initialization and Configuration ---

    // 1. Only hide the standard HTML output modal on load
    // The Preview Modal is hidden via CSS transform initially.
    outputModal.style.display = 'none';
    
    /**
     * Finds the global marked function and configures it.
     */
    function initializeMarked() {
        if (typeof marked === 'undefined') {
            console.error("CRITICAL: marked.js is not loaded or available globally.");
            alert("Markdown library not loaded. Please check your network connection.");
            return false;
        }
        
        try {
            // Configure marked.js to use modern GitHub Flavored Markdown (GFM)
            marked.setOptions({
                gfm: true, // Enable GitHub Flavored Markdown
                breaks: true, // Enable GFM line breaks (must be enabled for GFM)
                pedantic: false,
                sanitize: false,
                smartLists: true,
                xhtml: true, 
            });
            console.log("Marked.js initialized successfully.");
            return true;
        } catch (e) {
            console.error("Marked.js configuration error:", e);
            alert("Markdown engine configuration failed.");
            return false;
        }
    }

    // Initialize configuration on load
    const markedIsReady = initializeMarked();


    // --- Core Logic ---

    /**
     * Handles the core Markdown to HTML conversion logic.
     */
    function convertMarkdown() {
        const markdownText = markdownInput.value;
        
        if (!markdownText) {
            return; // Exit silently on empty input
        }

        if (!markedIsReady) {
            htmlOutputCode.textContent = 'CONVERSION ERROR: Markdown engine failed to initialize.';
            outputModal.style.display = 'flex';
            outputModal.classList.add('visible'); // Use class for transitions
            lastConvertedHTML = '';
            return;
        }

        try {
            const html = marked.parse(markdownText); 
            
            // Update state and output
            lastConvertedHTML = html;
            htmlOutputCode.textContent = html;
            
            // Show the HTML Code modal using the visible class
            outputModal.style.display = 'flex'; 
            // Give a moment for display:flex to apply before adding class for transition
            setTimeout(() => outputModal.classList.add('visible'), 10); 

        } catch (error) {
            htmlOutputCode.textContent = `CONVERSION FAILED: An unexpected error occurred during parsing.`;
            console.error("Conversion Runtime Error:", error);
            outputModal.style.display = 'flex';
            setTimeout(() => outputModal.classList.add('visible'), 10);
            lastConvertedHTML = '';
        }
    }
    
    /**
     * Copies the current HTML state to the clipboard.
     * @param {HTMLElement} buttonElement - The button that was clicked.
     */
    function copyHtml(buttonElement) {
        if (!lastConvertedHTML) {
            alert("Convert Markdown to HTML first.");
            return;
        }

        navigator.clipboard.writeText(lastConvertedHTML).then(() => {
            const originalText = buttonElement.textContent;
            buttonElement.textContent = 'Copied!';
            setTimeout(() => {
                buttonElement.textContent = originalText;
            }, 1500);
        }).catch(err => {
            console.error('Could not copy text: ', err);
            alert('Copying failed. Check browser permissions.'); 
        });
    }


    // --- Event Listeners ---

    // 1. Convert Button Click (Main action)
    convertButton.addEventListener('click', convertMarkdown);

    // 2. File Upload Change
    fileUpload.addEventListener('change', (event) => {
        const file = event.target.files[0];
        if (file) {
            const reader = new FileReader();
            reader.onload = (e) => {
                markdownInput.value = e.target.result;
                convertMarkdown(); // Convert automatically
            };
            reader.readAsText(file);
        }
    });
    
    // 3. Manual Input/Textarea Update: Clear file selection if manual input is used
    markdownInput.addEventListener('input', () => {
        if (fileUpload.value) {
             fileUpload.value = '';
        }
    });

    // 4. Show Preview Button (Uses the new slide-in animation)
    previewButton.addEventListener('click', () => {
        if (!lastConvertedHTML) {
            alert("Convert Markdown to HTML first to generate the preview.");
            return;
        }
        
        // Render the last converted HTML to the preview modal
        previewDisplay.innerHTML = lastConvertedHTML;
        
        // Show the preview modal using the 'visible' class
        previewModal.classList.add('visible');
    });
    
    // 5. Copy HTML Button (Outside the modal)
    copyHtmlOutsideButton.addEventListener('click', (e) => copyHtml(e.target));
    
    // 6. Copy HTML Button (Inside the modal)
    copyHtmlModalButton.addEventListener('click', (e) => copyHtml(e.target));


    // 7. Close Modals (HTML Output 'X' button only)
    document.querySelectorAll('.close-button').forEach(button => {
        button.addEventListener('click', (e) => {
            const modalId = e.target.getAttribute('data-modal');
            const modal = document.getElementById(modalId);
            if (modal) {
                // Remove the visible class for transition, then set display:none
                modal.classList.remove('visible');
                // Use a timeout to wait for the opacity transition to finish
                setTimeout(() => modal.style.display = 'none', 300); 
            }
        });
    });

    // 8. Close Modals (Click outside the HTML output modal only)
    window.addEventListener('click', (event) => {
        if (event.target === outputModal) {
            outputModal.classList.remove('visible');
            setTimeout(() => outputModal.style.display = 'none', 300);
        }
    });

    // 9. Close Preview Modal (New Back Button)
    backToEditorButton.addEventListener('click', () => {
        // Hide the preview modal by removing the 'visible' class
        previewModal.classList.remove('visible');
    });
});
