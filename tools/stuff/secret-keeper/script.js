// script.js

const MASTER_KEY_CHECK = 'MASTER_KEY_CHECK';
const STORAGE_ORIGIN = 'https://storage.mahdiyasser.site';

// Iframe communication variables
const iframe = document.getElementById('storageFrame');
let isIframeReady = false;
let commandCounter = 0;
const pendingCommands = {};
let currentMasterPassphrase = '';

// DOM elements
const appContainer = document.getElementById('appContainer');
const masterPassphraseInput = document.getElementById('masterPassphrase');
const checkPassphraseBtn = document.getElementById('checkPassphraseBtn');
const messageElement = document.getElementById('message');


// --- Utility & Crypto Functions ---

function showMessage(type, text) {
    messageElement.textContent = text;
    messageElement.className = type === 'success' ? 'success' : 'error';
    messageElement.style.display = 'block';
    setTimeout(() => { messageElement.style.display = 'none'; }, 5000);
}

function encryptData(data, passphrase) {
    if (!CryptoJS) throw new Error("CryptoJS library not loaded.");
    return CryptoJS.AES.encrypt(data, passphrase).toString();
}

function decryptData(ciphertext, passphrase) {
    if (!CryptoJS) throw new Error("CryptoJS library not loaded.");
    try {
        const bytes = CryptoJS.AES.decrypt(ciphertext, passphrase);
        const decrypted = bytes.toString(CryptoJS.enc.Utf8);
        
        // Return null for failed decryption (empty string on non-empty ciphertext)
        if (decrypted === '' && ciphertext && ciphertext.length > 0) {
             return null;
        }
        return decrypted;
    } catch (e) {
        console.error("Decryption failed:", e);
        return null;
    }
}

// --- Iframe Communication Functions ---

// Listens for responses from the storage iframe
window.addEventListener('message', (event) => {
    if (event.origin !== STORAGE_ORIGIN) return;

    const response = event.data;

    if (response.command === 'READY') {
        isIframeReady = true;
        // Check for existing master key item *within the iframe's storage*
        // We'll trust the user to enter the right key based on the stored check value.
        checkPassphraseInStorage(); 
        showMessage('success', 'Storage frame connected and ready.');
        return;
    }

    // Look up the pending command by its ID
    const resolver = pendingCommands[response.id];
    if (resolver) {
        if (response.success) {
            resolver.resolve(response);
        } else {
            resolver.reject(new Error(response.message || 'Storage operation failed.'));
        }
        delete pendingCommands[response.id];
    }
});


// Posts a message to the iframe and returns a promise for the response
function postToStorage(command, payload) {
    return new Promise((resolve, reject) => {
        if (!isIframeReady) {
            return reject(new Error("Storage frame not ready. Please wait a moment."));
        }
        
        const id = commandCounter++;
        pendingCommands[id] = { resolve, reject };

        iframe.contentWindow.postMessage({
            command: command,
            payload: payload,
            id: id // Include command ID for tracking response
        }, STORAGE_ORIGIN);
    });
}

// --- Master Passphrase Logic ---

async function checkPassphraseInStorage() {
    try {
        // 1. Check if the master key check item exists in the iframe's storage
        const response = await postToStorage('RETRIEVE', { key: MASTER_KEY_CHECK });
        const storedCheck = response.data;

        if (storedCheck) {
            // Passphrase exists, prompt the user to unlock
            checkPassphraseBtn.textContent = 'Unlock Secrets';
            showMessage('success', 'Master Passphrase is required to unlock your secrets.');
        } else {
            // First-time use, ask user to create a passphrase
            checkPassphraseBtn.textContent = 'Create and Verify Passphrase';
            showMessage('error', 'Welcome! Please set a Master Passphrase to secure your secrets.');
        }
    } catch (error) {
        showMessage('error', 'Error checking storage status. Reload if needed.');
    }
}

async function handleCheckPassphrase() {
    const passphrase = masterPassphraseInput.value.trim();

    if (!passphrase) {
        return showMessage('error', 'Please enter a Master Passphrase.');
    }

    try {
        const response = await postToStorage('RETRIEVE', { key: MASTER_KEY_CHECK });
        const storedCheck = response.data;
        
        if (!storedCheck) {
            // First-time creation
            const checkValue = "SECRET_KEEPER_READY";
            const encryptedCheck = encryptData(checkValue, passphrase);
            
            // Save the check value to storage
            await postToStorage('SAVE', { key: MASTER_KEY_CHECK, value: encryptedCheck });
            
            currentMasterPassphrase = passphrase;
            appContainer.classList.remove('hidden');
            masterPassphraseInput.disabled = true;
            checkPassphraseBtn.disabled = true;
            showMessage('success', 'Master Passphrase created and verified. App is unlocked!');
            masterPassphraseInput.value = ''; // Clear input for security
        } else {
            // Subsequent login/unlock
            const decryptedCheck = decryptData(storedCheck, passphrase);
            
            if (decryptedCheck === "SECRET_KEEPER_READY") {
                currentMasterPassphrase = passphrase;
                appContainer.classList.remove('hidden');
                masterPassphraseInput.disabled = true;
                checkPassphraseBtn.disabled = true;
                showMessage('success', 'Passphrase verified. App is unlocked!');
                masterPassphraseInput.value = ''; // Clear input for security
            } else {
                showMessage('error', 'Invalid Master Passphrase. Please try again.');
            }
        }
    } catch (error) {
        showMessage('error', `Passphrase check failed: ${error.message}`);
    }
}


// --- Main Application Logic (SAVE/RETRIEVE/DELETE) ---

async function handleSaveSecret() {
    const secretId = document.getElementById('saveSecretId').value.trim();
    const content = document.getElementById('secretContent').value;
    
    if (!currentMasterPassphrase) {
        return showMessage('error', 'App is locked. Please enter and verify the Master Passphrase first.');
    }

    if (!secretId || !content) {
        return showMessage('error', 'Please fill in the Secret Title/ID and Content.');
    }
    
    try {
        // 1. Encrypt the data locally using the Master Passphrase
        const encryptedData = encryptData(content, currentMasterPassphrase);

        // 2. Post the encrypted data to the storage iframe
        await postToStorage('SAVE', { 
            key: secretId, 
            value: encryptedData 
        });

        showMessage('success', `Secret successfully encrypted and stored under ID: ${secretId}`);
        
        // Clear inputs
        document.getElementById('saveSecretId').value = '';
        document.getElementById('secretContent').value = '';

    } catch (error) {
        showMessage('error', `Save failed: ${error.message}`);
    }
}

async function handleRetrieveSecret() {
    const secretId = document.getElementById('retrieveSecretId').value.trim();
    document.getElementById('decryptedContent').value = '';

    if (!currentMasterPassphrase) {
        return showMessage('error', 'App is locked. Please enter and verify the Master Passphrase first.');
    }

    if (!secretId) {
        return showMessage('error', 'Please enter the Secret Title/ID to retrieve.');
    }

    try {
        // 1. Retrieve the encrypted data from the storage iframe
        const response = await postToStorage('RETRIEVE', { key: secretId });
        const encryptedData = response.data;
        
        if (!encryptedData) {
            return showMessage('error', `No secret found for ID: ${secretId}`);
        }

        // 2. Decrypt the data locally
        const decryptedContent = decryptData(encryptedData, currentMasterPassphrase);

        if (decryptedContent === null || decryptedContent === '') {
            return showMessage('error', 'Decryption failed. The data might be corrupted.');
        }

        // 3. Display the result
        document.getElementById('decryptedContent').value = decryptedContent;
        showMessage('success', 'Secret successfully retrieved and decrypted.');

    } catch (error) {
        showMessage('error', `Retrieve failed: ${error.message}`);
    }
}

async function handleDeleteSecret() {
    const secretId = document.getElementById('retrieveSecretId').value.trim();

    if (!currentMasterPassphrase) {
        return showMessage('error', 'App is locked. Please enter and verify the Master Passphrase first.');
    }

    if (!secretId) {
        return showMessage('error', 'Please enter the Secret Title/ID to delete.');
    }

    if (!confirm(`Are you sure you want to permanently delete the secret with ID: ${secretId}?`)) {
        return;
    }

    try {
        // Delete from storage iframe
        await postToStorage('DELETE', { key: secretId });
        
        showMessage('success', `Secret ID: ${secretId} has been successfully deleted from storage.`);
        
        // Clear inputs/output
        document.getElementById('retrieveSecretId').value = '';
        document.getElementById('decryptedContent').value = '';
        
    } catch (error) {
        showMessage('error', `Deletion failed: ${error.message}`);
    }
}

// --- Export/Import Logic ---

async function handleExportData() {
    if (!currentMasterPassphrase) {
        return showMessage('error', 'App is locked. Please enter and verify the Master Passphrase first.');
    }

    try {
        // Request ALL keys/values from the iframe's storage
        // NOTE: This assumes the storage.mahdiyasser.site page has a 'GET_ALL' command handler
        const response = await postToStorage('GET_ALL', {});
        const exportedSecrets = response.data || {};
        
        let secretsFound = Object.keys(exportedSecrets).length;

        if (secretsFound === 0) {
            return showMessage('error', 'No secrets found to export.');
        }

        // The data returned from GET_ALL is the raw encrypted data/key pairs (including MASTER_KEY_CHECK)
        const dataToExport = {
            version: "SecretKeeper-1.1-IframeStorage",
            encryptedData: exportedSecrets, // All secrets, including the MASTER_KEY_CHECK item
        };

        const jsonString = JSON.stringify(dataToExport, null, 2);
        const blob = new Blob([jsonString], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        
        // Create a temporary link element for download
        const a = document.createElement('a');
        a.href = url;
        a.download = `secret_keeper_export_${new Date().toISOString().slice(0, 10)}.json`;
        document.body.appendChild(a);
        a.click();
        
        // Clean up
        document.body.removeChild(a);
        URL.revokeObjectURL(url);

        showMessage('success', `${secretsFound} total items (secrets + key check) prepared and download initiated.`);

    } catch (error) {
        showMessage('error', `Export failed: ${error.message}. (Requires 'GET_ALL' command support in storage iframe)`);
    }
}

function handleImportData(event) {
    if (!currentMasterPassphrase) {
        return showMessage('error', 'App is locked. Please enter and verify the Master Passphrase first.');
    }
    
    const file = event.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    
    reader.onload = async function(e) {
        try {
            const jsonText = e.target.result;
            const importObj = JSON.parse(jsonText);
            
            if (!importObj.version || !importObj.encryptedData) {
                return showMessage('error', 'Invalid Secret Keeper export file format.');
            }

            const importedSecrets = importObj.encryptedData;
            
            // Critical check: Verify the imported MASTER_KEY_CHECK item
            const importedCheck = importedSecrets[MASTER_KEY_CHECK];
            if (importedCheck) {
                const testDecryption = decryptData(importedCheck, currentMasterPassphrase);
                if (testDecryption !== "SECRET_KEEPER_READY") {
                    return showMessage('error', 'Import failed: The file seems to be encrypted with a different Master Passphrase. Aborting.');
                }
            } else {
                return showMessage('error', 'Import failed: MASTER_KEY_CHECK not found in file. This indicates data corruption or an invalid format.');
            }

            // Send all imported key/value pairs to the iframe storage for bulk saving
            // NOTE: This assumes the storage.mahdiyasser.site page has a 'BULK_SAVE' command handler
            await postToStorage('BULK_SAVE', { data: importedSecrets });
            
            const importedCount = Object.keys(importedSecrets).length;

            showMessage('success', `${importedCount} items successfully imported and saved to storage.mahdiyasser.site (existing secrets with the same ID were overwritten).`);

        } catch (error) {
            showMessage('error', `Import processing failed: ${error.message}. (Requires 'BULK_SAVE' command support in storage iframe)`);
        }
    };

    reader.readAsText(file);
    // Clear the file input after reading
    event.target.value = '';
}


// --- Initialization ---

// Check for iframe readiness when the script loads
// The event listener will call checkPassphraseInStorage when 'READY' is received.
