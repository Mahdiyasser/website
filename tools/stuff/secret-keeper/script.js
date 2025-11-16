/*
    SCRIPT.JS
    Secret Keeper Application Logic with AES Encryption
*/

// --- CONSTANTS & GLOBAL STATE ---

const STORAGE_KEY_USER_ID = 'sk_userId';
const STORAGE_KEY_VAULT_DATA = 'sk_vaultData';
const STORAGE_KEY_AVATAR = 'sk_avatar';
const STORAGE_KEY_THEME = 'sk_theme';
const MAX_AVATAR_SIZE_KB = 512; // 512KB limit

let CURRENT_MASTER_KEY = null;
let VAULT_DATA = {}; // Structure: { userId: '...', entries: { accessId: { type: '...', encryptedData: '...' } } }
let CURRENT_USER_ID = 'USER';

// --- INITIALIZATION & UI SETUP ---

document.addEventListener('DOMContentLoaded', () => {
    loadAppTheme();
    initializeApp();
    setupNavigation();
    setupEntryTypeTabs();
});

function initializeApp() {
    // 1. Check for existing User ID
    const storedUserId = localStorage.getItem(STORAGE_KEY_USER_ID);
    if (storedUserId) {
        CURRENT_USER_ID = storedUserId;
        document.getElementById('vaultUsernameInput').value = storedUserId;
        // Update header/config view with initial/existing ID
        updateAvatarDisplay(CURRENT_USER_ID); 
        document.getElementById('updateUserID').value = CURRENT_USER_ID;
        // User ID is set, now user must enter the key to authenticate
    } else {
        // First run or data wiped. Set default placeholder.
        updateAvatarDisplay(CURRENT_USER_ID);
    }
    // Only show the login gate initially
    showView('loginGateView'); 
}

// --- ENCRYPTION/DECRYPTION UTILITIES ---

/**
 * Encrypts a plaintext string using the current master key.
 * @param {string} plaintext 
 * @returns {string} Encrypted string (CryptoJS format).
 */
function encryptData(plaintext) {
    if (!CURRENT_MASTER_KEY) throw new Error("Encryption failed: Master key not set.");
    return CryptoJS.AES.encrypt(plaintext, CURRENT_MASTER_KEY).toString();
}

/**
 * Decrypts an encrypted string using the current master key.
 * @param {string} encryptedText 
 * @returns {string|null} Decrypted plaintext or null if decryption fails.
 */
function decryptData(encryptedText) {
    if (!CURRENT_MASTER_KEY) return null;
    try {
        const bytes = CryptoJS.AES.decrypt(encryptedText, CURRENT_MASTER_KEY);
        if (!bytes || bytes.sigBytes === 0) {
            // Decryption failed (wrong key or invalid ciphertext)
            return null;
        }
        return bytes.toString(CryptoJS.enc.Utf8);
    } catch (e) {
        console.error("Decryption Error:", e);
        return null;
    }
}

// --- AUTHENTICATION & VAULT MANAGEMENT ---

/**
 * Handles the login/setup process.
 */
async function performAuthentication() {
    const userIdInput = document.getElementById('vaultUsernameInput').value.trim();
    const masterKeyInput = document.getElementById('masterSecurityKeyInput').value;

    if (!userIdInput || !masterKeyInput) {
        return showAppPopup('Error', 'User Identifier and Master Key are required.', false, false);
    }

    const isSetup = !localStorage.getItem(STORAGE_KEY_USER_ID);
    CURRENT_MASTER_KEY = masterKeyInput;
    
    if (isSetup) {
        // --- INITIAL SETUP ---
        await handleInitialSetup(userIdInput);
    } else {
        // --- LOGIN ATTEMPT ---
        await handleLoginAttempt(userIdInput);
    }
}

async function handleInitialSetup(userIdInput) {
    // Save new user ID and empty vault data
    localStorage.setItem(STORAGE_KEY_USER_ID, userIdInput);
    VAULT_DATA = { userId: userIdInput, entries: {} };
    // Encrypt the empty vault object for initial storage
    const encryptedVault = encryptData(JSON.stringify(VAULT_DATA));
    localStorage.setItem(STORAGE_KEY_VAULT_DATA, encryptedVault);

    CURRENT_USER_ID = userIdInput;
    updateAvatarDisplay(CURRENT_USER_ID);

    showAppPopup('Setup Complete', 'New Vault created successfully!', false, true);
    document.getElementById('masterSecurityKeyInput').value = ''; // Clear key input
    showAuthenticatedApp();
}

async function handleLoginAttempt(userIdInput) {
    const storedEncryptedVault = localStorage.getItem(STORAGE_KEY_VAULT_DATA);
    const storedUserId = localStorage.getItem(STORAGE_KEY_USER_ID);

    if (storedUserId !== userIdInput) {
        // User ID mismatch - potential security issue or simple typo
        return showAppPopup('Error', 'User Identifier does not match the stored ID.', false, false);
    }

    if (!storedEncryptedVault) {
        // Vault data missing but ID exists (corrupted state)
        return showAppPopup('Error', 'Vault data not found. Please contact support or try "Wipe All Data".', false, false);
    }

    // Attempt decryption
    const decryptedVaultString = decryptData(storedEncryptedVault);

    if (decryptedVaultString === null) {
        // Decryption failed: WRONG KEY
        return showAppPopup('Authentication Failed', 'Invalid Master Security Key.', false, false);
    }

    try {
        VAULT_DATA = JSON.parse(decryptedVaultString);
        CURRENT_USER_ID = userIdInput; // Re-confirm
        updateAvatarDisplay(CURRENT_USER_ID);
        
        showAppPopup('Authentication Success', 'Vault unlocked.', false, true);
        document.getElementById('masterSecurityKeyInput').value = ''; // Clear key input
        showAuthenticatedApp();
    } catch (e) {
        console.error("Vault Parse Error:", e);
        showAppPopup('Error', 'Vault data corrupted. Cannot parse JSON.', false, false);
    }
}

/**
 * Persists the current VAULT_DATA object to localStorage (encrypted).
 */
function saveVaultData() {
    try {
        const jsonString = JSON.stringify(VAULT_DATA);
        const encryptedData = encryptData(jsonString);
        localStorage.setItem(STORAGE_KEY_VAULT_DATA, encryptedData);
        return true;
    } catch (e) {
        console.error("Save Vault Error:", e);
        showAppPopup('Save Error', 'Could not save vault data. Encryption failed or storage limit reached.', false, false);
        return false;
    }
}

/**
 * Displays the main app grid and updates the decoded key list.
 */
function showAuthenticatedApp() {
    showView('authenticatedAppGrid');
    updateAccessKeyList();
    // Pre-select the first tab in Store Data View
    const firstTab = document.querySelector('#storeDataView .type-tab-btn');
    if(firstTab) firstTab.click(); 
}

// --- NAVIGATION & UI FLOW ---

/**
 * Toggles visibility between the Login Gate and the main App Grid.
 * @param {string} viewId The ID of the view to show ('loginGateView' or 'authenticatedAppGrid')
 */
function showView(viewId) {
    document.getElementById('loginGateView').classList.add('app-hidden');
    document.getElementById('authenticatedAppGrid').classList.add('app-hidden');
    
    const targetElement = document.getElementById(viewId);
    if (targetElement) {
        targetElement.classList.remove('app-hidden');
        if (viewId === 'authenticatedAppGrid') {
            // Default to 'Decode Data' view upon successful login
            document.querySelector('.nav-link-btn').click();
        }
    }
}

/**
 * Sets up sidebar navigation to toggle view panels.
 */
function setupNavigation() {
    document.querySelectorAll('.nav-link-btn').forEach(button => {
        button.addEventListener('click', (e) => {
            // Remove 'active' from all links
            document.querySelectorAll('.nav-link-btn').forEach(btn => btn.classList.remove('active'));
            // Hide all content panels
            document.querySelectorAll('.view-panel-area').forEach(panel => panel.classList.add('app-hidden'));

            // Show target panel and set link as active
            const targetId = e.target.dataset.target;
            document.getElementById(targetId).classList.remove('app-hidden');
            e.target.classList.add('active');

            // Specific updates for views
            if (targetId === 'decodeDataView') {
                updateAccessKeyList();
            } else if (targetId === 'settingsConfigView') {
                updateConfigView();
            }
        });
    });
}

/**
 * Sets up the tabs on the 'Store Data' view.
 */
function setupEntryTypeTabs() {
    document.querySelectorAll('.type-tab-btn').forEach(button => {
        button.addEventListener('click', (e) => {
            // Remove 'active' from all tabs
            document.querySelectorAll('.type-tab-btn').forEach(btn => btn.classList.remove('active'));
            // Hide all content blocks
            document.querySelectorAll('.entry-data-tab').forEach(block => block.classList.add('app-hidden'));

            // Show target block and set tab as active
            const entryType = e.target.dataset.entryType;
            document.getElementById(`entry-content-${entryType}`).classList.remove('app-hidden');
            e.target.classList.add('active');
        });
    });
}


// --- VIEW SPECIFIC FUNCTIONS: STORE DATA ---

/**
 * Gathers, encrypts, and stores a new vault entry.
 * @param {string} type The type of entry ('credentials', 'memo', 'link').
 */
function storeNewEntry(type) {
    let entryData = { type: type, timestamp: Date.now() };
    let entryIdInput;

    switch (type) {
        case 'credentials':
            entryIdInput = document.getElementById('credEntryID');
            entryData.user = document.getElementById('credEntryUser').value.trim();
            entryData.pass = document.getElementById('credEntryPass').value;
            entryData.notes = document.getElementById('credEntryNotes').value.trim();
            break;
        case 'memo':
            entryIdInput = document.getElementById('memoEntryID');
            entryData.content = document.getElementById('memoEntryContent').value.trim();
            break;
        case 'link':
            entryIdInput = document.getElementById('linkEntryID');
            entryData.address = document.getElementById('linkEntryAddress').value.trim();
            entryData.notes = document.getElementById('linkEntryNotes').value.trim();
            break;
        default:
            return showAppPopup('Error', 'Invalid entry type.', false, false);
    }

    const accessId = entryIdInput.value.trim();

    if (!accessId || (type === 'memo' && !entryData.content)) {
        return showAppPopup('Error', 'ID/Title and all required fields must be filled.', false, false);
    }
    
    if (VAULT_DATA.entries[accessId]) {
        return showAppPopup('Error', `Entry with ID '${accessId}' already exists. Please choose a different ID.`, false, false);
    }
    
    // Encrypt the full entry data object
    const encryptedData = encryptData(JSON.stringify(entryData));

    VAULT_DATA.entries[accessId] = { type: type, encryptedData: encryptedData };

    if (saveVaultData()) {
        showAppPopup('Success', `New entry '${accessId}' stored securely!`, false, true);
        entryIdInput.value = ''; // Clear ID input
        // Clear other fields based on type
        document.querySelector(`#entry-content-${type} form`)?.reset(); // If form was used
        if(type === 'credentials') {
            document.getElementById('credEntryUser').value = '';
            document.getElementById('credEntryPass').value = '';
            document.getElementById('credEntryNotes').value = '';
        } else if (type === 'memo') {
            document.getElementById('memoEntryContent').value = '';
        } else if (type === 'link') {
            document.getElementById('linkEntryAddress').value = '';
            document.getElementById('linkEntryNotes').value = '';
        }
    }
}

// --- VIEW SPECIFIC FUNCTIONS: DECODE DATA ---

/**
 * Updates the list of access keys available for retrieval.
 */
function updateAccessKeyList() {
    const listContainer = document.getElementById('accessKeyList');
    listContainer.innerHTML = '';
    const entries = VAULT_DATA.entries || {};
    const accessIds = Object.keys(entries).sort();

    if (accessIds.length === 0) {
        listContainer.innerHTML = '<p>No keys found.</p>';
        document.getElementById('selectedAccessID').value = '';
        document.getElementById('decodedDataOutput').innerHTML = '<p>Data will appear here upon retrieval.</p>';
        return;
    }

    let selectedId = document.getElementById('selectedAccessID').value;
    let selectedTagFound = false;

    accessIds.forEach(id => {
        const tag = document.createElement('span');
        tag.className = 'key-tag';
        tag.textContent = id;
        tag.dataset.id = id;
        tag.onclick = () => selectAccessKey(id);

        if (id === selectedId) {
            tag.classList.add('selected');
            selectedTagFound = true;
        }

        listContainer.appendChild(tag);
    });

    // If the currently selected key was deleted or is null, clear the selection
    if (!selectedTagFound || !selectedId) {
        document.getElementById('selectedAccessID').value = '';
    }
}

/**
 * Selects an access key ID from the list to prepare for retrieval/deletion.
 * @param {string} id The access ID to select.
 */
function selectAccessKey(id) {
    document.getElementById('selectedAccessID').value = id;
    
    // Update visual selection
    document.querySelectorAll('.key-tag').forEach(tag => {
        tag.classList.remove('selected');
        if (tag.dataset.id === id) {
            tag.classList.add('selected');
        }
    });

    // Clear previous output
    document.getElementById('decodedDataOutput').innerHTML = '<p>Key selected. Click "Retrieve Data" to decrypt.</p>';
}

/**
 * Decrypts and displays the data for the currently selected key.
 */
function retrieveSelectedData() {
    const accessId = document.getElementById('selectedAccessID').value;
    const outputArea = document.getElementById('decodedDataOutput');

    if (!accessId) {
        return outputArea.innerHTML = '<p style="color: var(--color-action-danger);">Please select an Access Key ID first.</p>';
    }

    const entry = VAULT_DATA.entries[accessId];
    if (!entry) {
        return outputArea.innerHTML = `<p style="color: var(--color-action-danger);">Error: Key ID '${accessId}' not found in vault.</p>`;
    }

    const decryptedString = decryptData(entry.encryptedData);

    if (decryptedString === null) {
        // This should not happen if key is correct, but serves as a failsafe
        return outputArea.innerHTML = `<p style="color: var(--color-action-critical);">Decryption failed! Master key may be incorrect or data corrupted.</p>`;
    }

    let displayOutput = '';
    try {
        const data = JSON.parse(decryptedString);
        
        switch(data.type) {
            case 'credentials':
                displayOutput = `--- Credentials: ${accessId} ---\n` +
                                `User: ${data.user}\n` +
                                `Password: ${data.pass}\n` +
                                `Notes: ${data.notes || 'None'}`;
                break;
            case 'memo':
                displayOutput = `--- Secure Memo: ${accessId} ---\n` +
                                `${data.content}`;
                break;
            case 'link':
                displayOutput = `--- Web Link: ${accessId} ---\n` +
                                `URL: ${data.address}\n` +
                                `Notes: ${data.notes || 'None'}`;
                break;
            default:
                displayOutput = `--- RAW DATA: ${accessId} ---\n${decryptedString}`;
        }
        
    } catch (e) {
        // Fallback for non-JSON content (e.g. from an old version or corrupted data)
        displayOutput = `--- RAW/CORRUPTED DATA: ${accessId} ---\n${decryptedString}`;
    }

    outputArea.textContent = displayOutput;
}

/**
 * Deletes the currently selected access key after confirmation.
 */
function deleteSelectedData() {
    const accessId = document.getElementById('selectedAccessID').value;

    if (!accessId) {
        return showAppPopup('Error', 'Please select a key to delete.', false, false);
    }

    showAppPopup('Confirm Deletion', 
                 `Are you sure you want to PERMANENTLY delete the key: **${accessId}**? This cannot be undone.`, 
                 true, // Requires Confirmation
                 false, // Is not a success message
                 () => { // Confirmation Callback
                    if (VAULT_DATA.entries[accessId]) {
                        delete VAULT_DATA.entries[accessId];
                        if (saveVaultData()) {
                            showAppPopup('Success', `Key '${accessId}' deleted.`, false, true);
                            document.getElementById('selectedAccessID').value = '';
                            document.getElementById('decodedDataOutput').innerHTML = '<p>Data will appear here upon retrieval.</p>';
                            updateAccessKeyList();
                        }
                    } else {
                        showAppPopup('Error', `Key '${accessId}' not found.`, false, false);
                    }
                 });
}

// --- VIEW SPECIFIC FUNCTIONS: SETTINGS ---

/**
 * Updates the user ID display in the settings view.
 */
function updateConfigView() {
    // Ensure the latest user ID is reflected
    document.getElementById('updateUserID').value = CURRENT_USER_ID;
    updateAvatarDisplay(CURRENT_USER_ID);
}

/**
 * Updates the main User Identifier for the vault.
 */
function updateAccountIdentifier() {
    const newId = document.getElementById('updateUserID').value.trim();
    if (!newId) {
        return showAppPopup('Error', 'New User Identifier cannot be empty.', false, false);
    }
    if (newId === CURRENT_USER_ID) {
        return showAppPopup('Info', 'User ID is already set to that value.', false, true);
    }

    showAppPopup('Confirm Update', 
                 `Change User ID from **${CURRENT_USER_ID}** to **${newId}**? This is the ID required for login.`, 
                 true, // Requires Confirmation
                 false, // Is not a success message
                 () => { // Confirmation Callback
                    localStorage.setItem(STORAGE_KEY_USER_ID, newId);
                    CURRENT_USER_ID = newId;
                    updateAvatarDisplay(CURRENT_USER_ID);
                    showAppPopup('Success', `User ID successfully updated to **${CURRENT_USER_ID}**.`, false, true);
                 });
}

/**
 * Updates the Master Security Key by re-encrypting the entire vault.
 */
function updateMasterSecurityKey() {
    const newKey = document.getElementById('updateSecurityKeyInput').value;
    if (!newKey) {
        return showAppPopup('Error', 'New Master Security Key cannot be empty.', false, false);
    }
    if (newKey === CURRENT_MASTER_KEY) {
        return showAppPopup('Info', 'The new key is the same as the current key.', false, true);
    }

    showAppPopup('Confirm Key Change', 
                 'Are you sure you want to change your Master Security Key? The entire vault will be RE-ENCRYPTED. Do not proceed if you are unsure of the new key.', 
                 true, // Requires Confirmation
                 false, // Is not a success message
                 () => { // Confirmation Callback
                    // Temporarily store the old key and set the new one
                    const oldKey = CURRENT_MASTER_KEY;
                    CURRENT_MASTER_KEY = newKey; 

                    try {
                        // 1. Re-encrypt the entire VAULT_DATA object with the new key
                        if (saveVaultData()) {
                            showAppPopup('Success', 'Master Security Key updated and vault successfully re-encrypted!', false, true);
                            document.getElementById('updateSecurityKeyInput').value = ''; // Clear input
                        } else {
                             // Re-encryption failed, revert to old key
                            CURRENT_MASTER_KEY = oldKey; 
                            // Try to re-save with old key for consistency
                            saveVaultData(); 
                            showAppPopup('Failure', 'Key update failed. Master Key has NOT been changed.', false, false);
                        }
                    } catch (e) {
                        // In case of a critical error during re-encryption
                        CURRENT_MASTER_KEY = oldKey;
                        saveVaultData();
                        console.error('Key update critical failure:', e);
                        showAppPopup('Critical Error', 'Key update failed critically. Reverted to previous key.', false, false);
                    }
                 });
}

/**
 * Wipes all application data from localStorage.
 */
function wipeAllVaultData() {
    showAppPopup('DANGER ZONE', 
                 '**WARNING:** This will PERMANENTLY WIPE all encrypted vault data, User ID, and Avatar image. The application will be reset to its initial state. Are you ABSOLUTELY sure?', 
                 true, // Requires Confirmation
                 false, // Is not a success message
                 () => { // Confirmation Callback
                    localStorage.removeItem(STORAGE_KEY_USER_ID);
                    localStorage.removeItem(STORAGE_KEY_VAULT_DATA);
                    localStorage.removeItem(STORAGE_KEY_AVATAR);
                    
                    CURRENT_MASTER_KEY = null;
                    VAULT_DATA = {};
                    CURRENT_USER_ID = 'USER';

                    showAppPopup('Vault Wiped', 'All data has been wiped. Please setup a new vault.', false, true);
                    
                    // Reset UI
                    document.getElementById('vaultUsernameInput').value = '';
                    document.getElementById('masterSecurityKeyInput').value = '';
                    initializeApp();
                    showView('loginGateView');
                 });
}

// --- AVATAR MANAGEMENT ---

/**
 * Updates all avatar displays with the initial or image.
 * @param {string} userId The current user ID for initial generation.
 */
function updateAvatarDisplay(userId) {
    const avatarData = localStorage.getItem(STORAGE_KEY_AVATAR);
    const initial = userId.charAt(0).toUpperCase();

    // Elements to update: Header and Config views
    const elements = [
        { initial: document.getElementById('headerAvatarInitial'), img: document.getElementById('headerAvatarImage') },
        { initial: document.getElementById('configAvatarInitial'), img: document.getElementById('configAvatarImage') }
    ];

    if (avatarData) {
        // Show image, hide initial
        elements.forEach(el => {
            el.img.src = decryptData(avatarData); // Decrypt base64 data URL
            el.img.classList.remove('app-hidden');
            el.initial.classList.add('app-hidden');
        });
    } else {
        // Show initial, hide image
        elements.forEach(el => {
            el.initial.textContent = initial;
            el.initial.classList.remove('app-hidden');
            el.img.classList.add('app-hidden');
            el.img.src = '';
        });
    }
}

let pendingAvatarBase64 = null;

/**
 * Handles the file input change event for avatar upload.
 * @param {Event} event 
 */
function handleAvatarFile(event) {
    const file = event.target.files[0];
    pendingAvatarBase64 = null; // Clear previous

    if (!file) return;

    if (file.size > MAX_AVATAR_SIZE_KB * 1024) {
        event.target.value = ''; // Clear file input
        return showAppPopup('Error', `File size exceeds the limit of ${MAX_AVATAR_SIZE_KB}KB.`, false, false);
    }

    const reader = new FileReader();
    reader.onload = (e) => {
        pendingAvatarBase64 = e.target.result;
        showAppPopup('Avatar Ready', 'Image uploaded successfully. Click **Save Avatar** to store it securely.', false, true);
    };
    reader.readAsDataURL(file);
}

/**
 * Encrypts and saves the pending avatar to localStorage.
 */
function saveUserAvatar() {
    if (!pendingAvatarBase64) {
        return showAppPopup('Error', 'Please select a file to upload first.', false, false);
    }

    try {
        const encryptedAvatar = encryptData(pendingAvatarBase64);
        localStorage.setItem(STORAGE_KEY_AVATAR, encryptedAvatar);
        updateAvatarDisplay(CURRENT_USER_ID);
        showAppPopup('Success', 'New avatar saved and encrypted.', false, true);
        pendingAvatarBase64 = null;
        document.getElementById('avatarFileInput').value = ''; // Clear file input
    } catch (e) {
        showAppPopup('Save Error', 'Could not encrypt/save avatar. Is the Master Key correct?', false, false);
    }
}

/**
 * Removes the saved avatar from localStorage.
 */
function removeUserAvatar() {
    showAppPopup('Confirm Removal', 
                 'Are you sure you want to remove the stored Avatar image?', 
                 true, 
                 false, 
                 () => {
                    localStorage.removeItem(STORAGE_KEY_AVATAR);
                    updateAvatarDisplay(CURRENT_USER_ID);
                    showAppPopup('Success', 'Avatar removed.', false, true);
                    pendingAvatarBase64 = null;
                    document.getElementById('avatarFileInput').value = '';
                 });
}

// --- DATA IMPORT/EXPORT ---

/**
 * Exports the entire encrypted vault as a JSON file.
 */
function exportVaultData() {
    const encryptedData = localStorage.getItem(STORAGE_KEY_VAULT_DATA);
    if (!encryptedData) {
        return showAppPopup('Error', 'No vault data found to export.', false, false);
    }

    const exportObject = {
        userId: CURRENT_USER_ID,
        vaultData: encryptedData,
        timestamp: new Date().toISOString()
    };
    
    const jsonStr = JSON.stringify(exportObject, null, 2);
    const blob = new Blob([jsonStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    
    const a = document.createElement('a');
    a.href = url;
    a.download = `SecretKeeper_Vault_Backup_${CURRENT_USER_ID}_${Date.now()}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    
    showAppPopup('Export Complete', 'Encrypted vault backup downloaded.', false, true);
}

/**
 * Imports vault data from a JSON file.
 * @param {Event} event 
 */
function importVaultData(event) {
    const file = event.target.files[0];
    if (!file) return;

    showAppPopup('Confirm Import', 
                 'Importing a vault backup will **OVERWRITE** your current vault data. Proceed?', 
                 true, 
                 false, 
                 () => {
                    const reader = new FileReader();
                    reader.onload = (e) => {
                        try {
                            const importedObject = JSON.parse(e.target.result);
                            
                            if (!importedObject.vaultData || !importedObject.userId) {
                                return showAppPopup('Error', 'Invalid backup file structure.', false, false);
                            }

                            // Attempt to decrypt the data with the CURRENT_MASTER_KEY
                            // This ensures the key matches the imported data
                            const testDecryption = decryptData(importedObject.vaultData);
                            if (testDecryption === null) {
                                return showAppPopup('Import Failed', 'The current Master Key is INCORRECT for the imported vault data. Import aborted.', false, false);
                            }

                            // Decryption worked, proceed with overwrite
                            localStorage.setItem(STORAGE_KEY_USER_ID, importedObject.userId);
                            localStorage.setItem(STORAGE_KEY_VAULT_DATA, importedObject.vaultData);
                            
                            // Load the newly imported vault data
                            VAULT_DATA = JSON.parse(testDecryption);
                            CURRENT_USER_ID = importedObject.userId;
                            updateAvatarDisplay(CURRENT_USER_ID);
                            
                            showAppPopup('Import Success', 'Vault data successfully imported and loaded!', false, true);
                            updateAccessKeyList();
                        } catch (err) {
                            console.error('Import Error:', err);
                            showAppPopup('Error', 'File is not a valid JSON or data is corrupted.', false, false);
                        } finally {
                            document.getElementById('importDataFile').value = ''; // Clear file input
                        }
                    };
                    reader.readAsText(file);
                 });
}

// --- THEME & VISIBILITY TOGGLES ---

/**
 * Toggles the visibility of a password input field.
 * @param {HTMLElement} toggleElement The <span> element clicked.
 */
function toggleKeyVisibility(toggleElement) {
    const targetId = toggleElement.dataset.target;
    const targetInput = document.getElementById(targetId);

    if (targetInput.type === 'password') {
        targetInput.type = 'text';
        toggleElement.textContent = '🙈';
    } else {
        targetInput.type = 'password';
        toggleElement.textContent = '👁️';
    }
}

/**
 * Toggles between 'dark' and 'light' themes.
 */
function toggleAppTheme() {
    const currentTheme = document.body.parentElement.getAttribute('data-theme');
    const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
    
    document.body.parentElement.setAttribute('data-theme', newTheme);
    localStorage.setItem(STORAGE_KEY_THEME, newTheme);
    
    // Update the icon
    document.getElementById('modeToggleIcon').textContent = newTheme === 'dark' ? '☀️' : '🌙';
}

/**
 * Loads the saved theme on startup.
 */
function loadAppTheme() {
    const savedTheme = localStorage.getItem(STORAGE_KEY_THEME) || 'dark';
    document.body.parentElement.setAttribute('data-theme', savedTheme);
    document.getElementById('modeToggleIcon').textContent = savedTheme === 'dark' ? '☀️' : '🌙';
}

// --- POPUP MODAL CONTROL ---

let popupResolve = null;

/**
 * Shows a custom application popup modal.
 * @param {string} title Popup title.
 * @param {string} message Popup message (supports basic HTML/bolding).
 * @param {boolean} needsConfirmation True for a "Proceed/Cancel" dialog.
 * @param {boolean} isSuccess True if the popup confirms success (affects color/tone).
 * @param {function} onConfirm Callback function for confirmation.
 */
function showAppPopup(title, message, needsConfirmation, isSuccess, onConfirm = null) {
    const overlay = document.getElementById('popupOverlay');
    document.getElementById('popupTitle').textContent = title;
    document.getElementById('popupMessage').innerHTML = message.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
    
    const confirmBtn = document.querySelector('#popupControls .action-confirm');
    const cancelBtn = document.querySelector('#popupControls .action-cancel');
    
    confirmBtn.onclick = () => closeAppPopup(true);

    if (needsConfirmation) {
        cancelBtn.classList.remove('app-hidden');
    } else {
        cancelBtn.classList.add('app-hidden');
    }

    if (isSuccess) {
        // Optional: change title color based on success
        document.getElementById('popupTitle').style.color = 'var(--color-action-secondary)';
    } else {
        document.getElementById('popupTitle').style.color = needsConfirmation ? 'var(--color-action-danger)' : 'var(--color-action-main)';
    }

    overlay.classList.remove('app-hidden');
    
    // Return a promise that resolves when the user closes the popup
    return new Promise(resolve => {
        popupResolve = resolve;
        if (onConfirm) {
            // Overwrite the confirm button action to execute the callback
            confirmBtn.onclick = () => {
                closeAppPopup(true);
                if (onConfirm) onConfirm();
            };
        }
    });
}

/**
 * Closes the custom application popup modal.
 * @param {boolean} confirmed True if the user clicked "Proceed/Confirm".
 */
function closeAppPopup(confirmed) {
    const overlay = document.getElementById('popupOverlay');
    overlay.classList.add('app-hidden');
    if (popupResolve) {
        popupResolve(confirmed);
        popupResolve = null;
    }
}

/**
 * Simple logout function.
 */
function processVaultLogout() {
    CURRENT_MASTER_KEY = null;
    VAULT_DATA = {}; // Clear sensitive data from memory
    document.getElementById('masterSecurityKeyInput').value = ''; // Clear key input
    showAppPopup('Signed Out', 'You have securely signed out. Master Key has been cleared from memory.', false, true);
    showView('loginGateView');
}
