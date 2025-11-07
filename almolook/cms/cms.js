document.addEventListener('DOMContentLoaded', () => {
    const API_URL = 'cms.php';
    
    // UI elements
    const sectionsList = document.getElementById('sections-list');
    const productsDisplay = document.getElementById('products-display');
    const productSectionSelect = document.getElementById('product-section');
    const shortcutTargetSectionSelect = document.getElementById('shortcut-target-section');
    const addSectionForm = document.getElementById('add-section-form');
    const addProductForm = document.getElementById('add-product-form');
    const addShortcutForm = document.getElementById('add-shortcut-form');
    const saveSectionsOrderBtn = document.getElementById('save-sections-order-btn'); 
    
    const addVariantBtn = document.getElementById('add-variant-btn');
    const variantBuilderContainer = document.getElementById('variant-builder-container');
    let variantCounter = 0;

    // Modal elements
    const modal = document.getElementById('edit-modal');
    const closeBtn = document.querySelector('.close-btn');
    const modalTitle = document.getElementById('modal-title');
    const modalBody = document.getElementById('modal-body');
    const saveEditBtn = document.getElementById('save-edit-btn');

    let currentMenuData = [];
    let currentEditType = null;
    let currentEditItem = null;

    // Helper for non-intrusive notifications
    function showNotification(message, isError = false) {
        if (isError) {
            alert(message);
        } else {
            console.log(`[CMS Notification]: ${message}`);
        }
    }

    // --- Core Data Loading and Rendering ---

    async function loadMenu() {
        try {
            const response = await fetch(`${API_URL}?action=get_data`);
            if (!response.ok) throw new Error('Failed to fetch data');
            currentMenuData = await response.json();
            
            renderSections(currentMenuData);         
            renderProducts(currentMenuData);         
            populateSectionSelects(currentMenuData); 
            
            initDragAndDrop(); 
            initAccordion();
        } catch (error) {
            console.error('Error loading menu:', error);
            showNotification('Could not load menu data. Check server connection.', true);
        }
    }

    function renderSections(data) {
        sectionsList.innerHTML = '';
        data.forEach(section => {
            const tagClass = `tag-${section.tag.replace(' ', '-')}`;
            const div = document.createElement('div');
            div.className = 'section-item';
            div.setAttribute('data-id', section.section); 
            div.innerHTML = `
                <div class="section-info">
                    <span class="tag ${tagClass}">${section.tag.toUpperCase()}</span>
                    <strong>${section.section}</strong> (${section.products.length} items)
                </div>
                <div class="section-actions">
                    <button data-section="${section.section}" class="edit-section-btn">Edit</button>
                    <button data-section="${section.section}" class="delete-section-btn">Delete</button>
                </div>
            `;
            sectionsList.appendChild(div);
        });
        attachSectionListeners();
    }

    function populateSectionSelects(data) {
        productSectionSelect.innerHTML = '';
        shortcutTargetSectionSelect.innerHTML = '';
        
        data.forEach(section => {
            const optionProd = document.createElement('option');
            optionProd.value = section.section;
            optionProd.textContent = section.section;
            productSectionSelect.appendChild(optionProd);

            const optionShort = document.createElement('option');
            optionShort.value = section.section;
            optionShort.textContent = section.section;
            shortcutTargetSectionSelect.appendChild(optionShort);
        });
    }

    function renderProducts(data) {
        productsDisplay.innerHTML = '';
        
        const mainTitle = document.createElement('h3');
        mainTitle.textContent = 'Current Products';
        productsDisplay.appendChild(mainTitle);

        data.forEach(section => {
            const sectionHeader = document.createElement('div');
            sectionHeader.className = 'section-accordion-header';
            sectionHeader.innerHTML = `
                <span>${section.section} (${section.products.length} items)</span>
                <span class="tag tag-${section.tag.replace(' ', '-')}">${section.tag.toUpperCase()}</span>
            `;
            productsDisplay.appendChild(sectionHeader);

            const contentPanel = document.createElement('div');
            contentPanel.className = 'product-accordion-content';
            
            const productList = document.createElement('div');
            productList.className = 'product-list sortable-products';
            productList.setAttribute('data-section-name', section.section); 
            
            section.products.forEach(product => {
                const isShortcut = product.id.startsWith('S');
                const originalId = product.shortcut_to || '';
                const tagHtml = isShortcut ? `<span class="tag tag-shortcut">Shortcut (Original: ${originalId})</span>` : '';
                
                // Handle variant display for the list view
                // Uses 'product.base_size' which is the base price's optional size name
                const baseSizeName = product.base_size || 'Base Price'; 
                const variants = product.variants && product.variants.length > 0 ? product.variants : 
                    (product.price && product.price > 0 ? [{ size: baseSizeName, price: product.price }] : []);
                
                const priceInfo = variants.map(v => `${v.size}: $${v.price.toFixed(2)}`).join(' | ');

                // --- START Image Display Fix (Relative Path) ---
                const imagePath = product.image || ''; 
                // Fix: Replace the stored path prefix ('./images/' or 'images/') with the correct browser-relative prefix ('../images/')
                const displayImagePath = imagePath.replace(/^(\.\/)?images\//, '../menu/images/');
                const imageHtml = displayImagePath && displayImagePath !== '../menu/images/' ? `<img src="${displayImagePath}" alt="${product.name}" class="product-thumb">` : ''; 
                // --- END Image Display Fix (Relative Path) ---
                
                const div = document.createElement('div');
                div.className = 'product-item';
                div.setAttribute('data-id', product.id); 
                div.innerHTML = `
                    ${imageHtml}
                    <div class="product-info">
                        ${tagHtml}
                        <strong>${product.name} (ID: ${product.id})</strong>
                        <p>${priceInfo}</p>
                    </div>
                    <div class="product-actions">
                        <button data-id="${product.id}" class="edit-product-btn">Edit</button>
                        <button data-id="${product.id}" class="delete-product-btn">${isShortcut ? 'Delete Shortcut' : 'Delete Product'}</button>
                    </div>
                `;
                productList.appendChild(div);
            });
            
            contentPanel.appendChild(productList);
            productsDisplay.appendChild(contentPanel);
        });
        
        attachProductListeners();
    }
    
    // --- Utility Functions ---

    function findProduct(id) {
        const searchId = id.toUpperCase();
        for (const section of currentMenuData) {
            for (const product of section.products) {
                if (product.id.toUpperCase() === searchId) {
                    return JSON.parse(JSON.stringify(product));
                }
            }
        }
        return null;
    }

    function findSection(name) {
        return currentMenuData.find(s => s.section === name);
    }
    
    // --- Accordion Logic ---
    function initAccordion() {
        document.querySelectorAll('.section-accordion-header').forEach(header => {
            header.removeEventListener('click', toggleAccordion);
            header.addEventListener('click', toggleAccordion);
        });
    }

    function toggleAccordion(e) {
        e.stopPropagation();
        const header = e.currentTarget;
        const content = header.nextElementSibling;
        
        header.classList.toggle('active');
        content.classList.toggle('open');
    }


    // --- Drag-and-Drop and Reordering Logic ---

    function initDragAndDrop() {
        // Requires SortableJS library
        if (sectionsList.sortable) sectionsList.sortable.destroy();
        sectionsList.sortable = new Sortable(sectionsList, {
            animation: 150,
            ghostClass: 'sortable-ghost',
            handle: '.section-item',
        });
        
        saveSectionsOrderBtn.removeEventListener('click', saveSectionsOrder);
        saveSectionsOrderBtn.addEventListener('click', saveSectionsOrder);
        
        document.querySelectorAll('.sortable-products').forEach(list => {
            if (list.sortable) list.sortable.destroy(); 
            list.sortable = new Sortable(list, {
                group: 'products',
                animation: 150,
                ghostClass: 'sortable-ghost',
                handle: '.product-item',
                onEnd: function (evt) {
                    saveProductOrder(evt.to.dataset.sectionName);
                }
            });
        });
    }

    async function saveSectionsOrder() {
        const newOrder = Array.from(sectionsList.children).map(item => item.dataset.id);
        const formData = new FormData();
        formData.append('action', 'reorder_sections');
        formData.append('new_order', JSON.stringify(newOrder));
        try {
            const response = await fetch(API_URL, { method: 'POST', body: formData });
            const result = await response.json();
            if (result.success) {
                showNotification('Sections order saved successfully!');
                loadMenu();
            } else {
                showNotification(`Error saving sections order: ${result.message}`, true);
            }
        } catch (error) {
            console.error('Error:', error);
            showNotification('An error occurred while saving the sections order.', true);
        }
    }
    
    async function saveProductOrder(sectionName) {
        const listElement = document.querySelector(`.product-list[data-section-name="${sectionName}"]`);
        if (!listElement) return;
        const newOrder = Array.from(listElement.children).map(item => item.dataset.id);
        const formData = new FormData();
        formData.append('action', 'reorder_products');
        formData.append('section_name', sectionName);
        formData.append('new_order', JSON.stringify(newOrder));
        try {
            const response = await fetch(API_URL, { method: 'POST', body: formData });
            const result = await response.json();
            if (result.success) {
                showNotification(`Products in section "${sectionName}" order saved.`);
            } else {
                showNotification(`Error saving products order in "${sectionName}": ${result.message}`, true);
            }
        } catch (error) {
            console.error('Error:', error);
            showNotification('An error occurred while saving the products order.', true);
        }
    }


    // --- Dynamic Variant Builder ---

    function createVariantField(size = '', price = '', description = '', oldImagePath = '', index = variantCounter) {
        const field = document.createElement('div');
        field.className = 'variant-field';
        field.setAttribute('data-index', index);
        
        // Apply image path fix for variant display
        const displayImagePath = oldImagePath.replace(/^(\.\/)?images\//, '../menu/images/');
        const hasImage = oldImagePath && oldImagePath.length > 0;
        
        // Extract filename for display
        const filename = oldImagePath.split('/').pop();
        
        field.innerHTML = `
            <label>Size Name:</label>
            <input type="text" name="variant_name[${index}]" value="${size}" placeholder="e.g. Small, XL" required>
            
            <label>Price:</label>
            <input type="number" step="0.01" name="variant_price[${index}]" value="${price}" placeholder="Price" required>
            
            <label>Description (Optional):</label>
            <textarea name="variant_description[${index}]" placeholder="Description">${description}</textarea>
            
            <label>Variant Image (Optional, overrides base product image):</label>
            
            <div class="image-management-container">
                <input type="hidden" name="variant_old_image[${index}]" value="${oldImagePath}">
                <input type="hidden" name="variant_delete_image[${index}]" value="false" class="variant-delete-flag">

                ${hasImage ? `
                    <div class="image-preview-container">
                        <img src="${displayImagePath}" alt="Variant Image">
                        <p style="font-size:14px;">Current Image: ${filename}</p>
                        <button type="button" class="delete-image-btn" data-target="variant">Delete Variant Image</button>
                    </div>` : ''}
                
                <input type="file" name="variant_image_file[${index}]" accept="image/*" style="margin-top: 10px;">
            </div>
            
            <button type="button" class="remove-variant-btn">Remove Size</button>
        `;

        field.querySelector('.remove-variant-btn').onclick = () => field.remove();
        
        const deleteBtn = field.querySelector('.delete-image-btn');
        if (deleteBtn) {
            deleteBtn.onclick = () => {
                const container = field.querySelector('.image-management-container');
                container.querySelector('.variant-delete-flag').value = 'true';
                container.querySelector('.image-preview-container').innerHTML = `<p style="color:red; font-weight:bold;">Image marked for deletion. (Old file: ${filename})</p>`;
                showNotification('Variant image marked for deletion on save.');
            };
        }

        variantCounter = index + 1;
        return field;
    }

    // Attach to the Add Product Form
    if (addVariantBtn) {
        addVariantBtn.addEventListener('click', () => {
            variantBuilderContainer.appendChild(createVariantField());
        });
    }


    // --- Modal and Editing Handlers ---

    function attachSectionListeners() {
        document.querySelectorAll('.edit-section-btn').forEach(button => {
            button.onclick = (e) => {
                e.stopPropagation();
                const sectionName = e.target.dataset.section;
                currentEditItem = findSection(sectionName);
                if (currentEditItem) showEditModal('section');
            };
        });
        document.querySelectorAll('.delete-section-btn').forEach(button => {
            button.onclick = handleDeleteSection;
        });
    }

    function attachProductListeners() {
        document.querySelectorAll('.edit-product-btn').forEach(button => {
            button.onclick = (e) => {
                e.stopPropagation();
                const productId = e.target.dataset.id;
                currentEditItem = findProduct(productId);
                if (currentEditItem) showEditModal('product');
            };
        });
        document.querySelectorAll('.delete-product-btn').forEach(button => {
            button.onclick = handleDeleteProduct;
        });
    }

    function showEditModal(type) {
        currentEditType = type;
        modalBody.innerHTML = ''; 
        variantCounter = 0;

        if (type === 'section') {
            modalTitle.textContent = `Edit Section: ${currentEditItem.section}`;
            modalBody.innerHTML = `
                <form id="edit-item-form" enctype="multipart/form-data">
                    <input type="hidden" name="action" value="edit_section">
                    <input type="hidden" name="old_name" value="${currentEditItem.section}">
                    
                    <label for="edit-section-name">Section Name:</label>
                    <input type="text" id="edit-section-name" name="new_name" value="${currentEditItem.section}" required>
                    
                    <label for="edit-section-tag">Section Tag:</label>
                    <select id="edit-section-tag" name="new_tag" required>
                        <option value="normal">normal</option>
                        <option value="special">special</option>
                        <option value="best seller">best seller</option>
                    </select>
                </form>
            `;
            document.getElementById('edit-section-tag').value = currentEditItem.tag;

        } else if (type === 'product') {
            if (currentEditItem.id.toUpperCase().startsWith('S')) {
                showNotification(`You cannot edit a shortcut (ID: ${currentEditItem.id}). Edit the original product (ID: ${currentEditItem.shortcut_to}).`, true);
                return;
            }

            modalTitle.textContent = `Edit Product: ${currentEditItem.name} (ID: ${currentEditItem.id})`;

            let currentSectionName = '';
            for (const section of currentMenuData) {
                if (section.products.some(p => p.id === currentEditItem.id)) {
                    currentSectionName = section.section;
                    break;
                }
            }

            let sectionOptions = currentMenuData.map(section => 
                `<option value="${section.section}" ${section.section === currentSectionName ? 'selected' : ''}>${section.section}</option>`
            ).join('');
            
            // Apply path fix for modal image display
            const hasBaseImage = currentEditItem.image && currentEditItem.image.length > 0;
            const displayBaseImage = currentEditItem.image.replace(/^(\.\/)?images\//, '../menu/images/');
            const baseFilename = currentEditItem.image.split('/').pop();

            let formHtml = `
                <form id="edit-item-form" enctype="multipart/form-data">
                    <input type="hidden" name="action" value="edit_product">
                    <input type="hidden" name="product_id" value="${currentEditItem.id}">

                    <label for="edit-product-section">Move to Section:</label>
                    <select id="edit-product-section" name="section_name">${sectionOptions}</select>

                    <label for="edit-product-name">Product Name:</label>
                    <input type="text" id="edit-product-name" name="name" value="${currentEditItem.name}" required>
                    
                    <label for="edit-product-description">Description:</label>
                    <textarea id="edit-product-description" name="description">${currentEditItem.description}</textarea>

                    <hr>
                    <h4>Base Image Management</h4>
                    <input type="hidden" name="image_path_old" value="${currentEditItem.image || ''}">
                    <input type="hidden" id="delete-base-image-flag" name="delete_base_image" value="false">
                    
                    ${hasBaseImage ? `
                        <div class="image-preview-container" id="base-image-preview">
                            <img src="${displayBaseImage}" alt="Current Base Image">
                            <p style="font-size:14px;">Current Base Image: ${baseFilename}</p>
                            <button type="button" id="delete-base-image-btn" class="delete-image-btn">Delete Base Image</button>
                        </div>` : ''}
                    
                    <label for="edit-image-file">Replace Base Image (Any Type):</label>
                    <input type="file" id="edit-image-file" name="image" accept="image/*">

                    <hr>
                    <h4>Base Price (if no sizes are used)</h4>
                    <label for="edit-product-base-size">Size Name for Base Price:</label>
                    <input type="text" id="edit-product-base-size" name="base_size" value="${currentEditItem.base_size || ''}" placeholder="Regular">

                    <input type="number" step="0.01" id="edit-product-price" name="price" value="${currentEditItem.price || 0}" placeholder="Base Price">

                    <hr>
                    <h4>Sizes / Variants</h4>
                    <div id="edit-variant-builder-container"></div>
                    <button type="button" id="edit-add-variant-btn">Add New Size/Variant</button>
                </form>
            `;
            modalBody.innerHTML = formHtml;
            
            // Populate and re-enable variant creation
            const editVariantContainer = document.getElementById('edit-variant-builder-container');
            const variants = currentEditItem.variants || [];
            
            variants.forEach(v => {
                const imagePath = v.image || ''; 
                editVariantContainer.appendChild(
                    createVariantField(v.size, v.price.toFixed(2), v.description || '', imagePath, variantCounter)
                );
            });

            document.getElementById('edit-add-variant-btn').onclick = () => {
                editVariantContainer.appendChild(createVariantField('', '', '', currentEditItem.image || '', variantCounter));
            };
            
            // Attach Base Image Deletion Listener
            const deleteBaseBtn = document.getElementById('delete-base-image-btn');
            if (deleteBaseBtn) {
                deleteBaseBtn.onclick = () => {
                    if (confirm(`Are you sure you want to delete the base product image? (File: ${baseFilename})`)) {
                        document.getElementById('delete-base-image-flag').value = 'true';
                        document.getElementById('base-image-preview').innerHTML = `<p style="color:red; font-weight:bold;">Base image marked for deletion. (Old file: ${baseFilename})</p>`;
                        showNotification('Base image marked for deletion on save.');
                    }
                };
            }
        }

        modal.style.display = 'block';
    }

    closeBtn.onclick = () => modal.style.display = 'none';
    window.onclick = (event) => {
        if (event.target === modal) modal.style.display = 'none';
    }

    saveEditBtn.onclick = async () => {
        const form = document.getElementById('edit-item-form');
        if (form) {
             const formData = new FormData(form);
             
             if (currentEditType === 'product') {
                const variantContainers = document.querySelectorAll('#edit-variant-builder-container .variant-field');
                
                variantContainers.forEach(container => {
                    const index = container.dataset.index;
                    container.querySelectorAll('input, textarea').forEach(input => {
                        if (input.type === 'file' && input.files.length > 0) {
                            formData.append(input.name, input.files[0]);
                        } else if (input.type !== 'file') {
                            formData.append(input.name, input.value);
                        }
                    });
                });
             }
             
             await handleEdit(formData);
        }
    }

    async function handleEdit(formData) {
        try {
            const response = await fetch(API_URL, { method: 'POST', body: formData });
            const result = await response.json();

            if (result.success) {
                showNotification(currentEditType === 'section' ? 'Section updated successfully.' : 'Product updated successfully.');
                modal.style.display = 'none';
                loadMenu();
            } else {
                showNotification(`Error updating ${currentEditType}: ${result.message}`, true);
            }
        } catch (error) {
            console.error('Error:', error);
            showNotification('An error occurred during editing.', true);
        }
    }


    // --- Form Submissions (for Add Forms) ---
    
    addSectionForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const sectionName = document.getElementById('new-section-name').value.trim();
        const formData = new FormData();
        formData.append('action', 'add_section');
        formData.append('section_name', sectionName);
        try {
            const response = await fetch(API_URL, { method: 'POST', body: formData });
            const result = await response.json();
            if (result.success) {
                showNotification('Section added successfully!');
                addSectionForm.reset();
                loadMenu();
            } else {
                showNotification(`Error adding section: ${result.message}`, true);
            }
        } catch (error) {
            console.error('Error:', error);
            showNotification('An error occurred while adding the section.', true);
        }
    });

    addProductForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const formData = new FormData(addProductForm);
        formData.append('action', 'add_product');
        
        // Manually append variant files and fields from the dynamic container
        const variantContainers = document.querySelectorAll('#variant-builder-container .variant-field');
        variantContainers.forEach(container => {
             const index = container.dataset.index;
             container.querySelectorAll('input, textarea').forEach(input => {
                if (input.type === 'file' && input.files.length > 0) {
                    formData.append(`variant_image_file[${index}]`, input.files[0]);
                } else if (input.type !== 'file') {
                    formData.append(input.name, input.value);
                }
             });
        });

        if (!formData.get('image').name && variantContainers.length === 0 && (parseFloat(formData.get('price')) <= 0 || isNaN(parseFloat(formData.get('price'))))) {
             showNotification('Please select a base image/price or add variants.', true);
             return;
        }
        
        try {
            const response = await fetch(API_URL, { method: 'POST', body: formData });
            const result = await response.json();
            if (result.success) {
                showNotification(`Product added successfully with ID: ${result.product_id}`);
                addProductForm.reset();
                variantBuilderContainer.innerHTML = '';
                variantCounter = 0;
                loadMenu();
            } else {
                showNotification(`Error adding product: ${result.message}`, true);
            }
        } catch (error) {
            console.error('Error:', error);
            showNotification('An error occurred while adding the product.', true);
        }
    });
    
    addShortcutForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const targetId = document.getElementById('shortcut-product-id').value.trim().toUpperCase();
        const targetSection = document.getElementById('shortcut-target-section').value;

        if (!targetId.startsWith('P')) {
            showNotification('Shortcut target must be an original product ID (starts with P).', true);
            return;
        }

        const originalProduct = findProduct(targetId);
        if (!originalProduct) {
             showNotification('Original product ID not found. Ensure it exists and starts with P.', true);
             return;
        }
        
        const formData = new FormData();
        formData.append('action', 'add_shortcut');
        formData.append('target_product_id', targetId);
        formData.append('target_section_name', targetSection);

        try {
            const response = await fetch(API_URL, { method: 'POST', body: formData });
            const result = await response.json();

            if (result.success) {
                showNotification(`Shortcut created successfully with ID: ${result.shortcut_id}.`);
                addShortcutForm.reset();
                loadMenu();
            } else {
                showNotification(`Error creating shortcut: ${result.message}`, true);
            }
        } catch (error) {
            console.error('Error:', error);
            showNotification('An error occurred while creating the shortcut.', true);
        }
    });

    // --- Deletion Handlers ---

    async function handleDeleteSection(e) {
        e.stopPropagation();
        const sectionName = e.target.dataset.section;
        if (!confirm(`Are you sure you want to delete the section: "${sectionName}" and ALL its products? This action is irreversible.`)) return;

        const formData = new FormData();
        formData.append('action', 'delete_section');
        formData.append('section_name', sectionName);

        try {
            const response = await fetch(API_URL, { method: 'POST', body: formData });
            const result = await response.json();

            if (result.success) {
                showNotification('Section and associated items deleted successfully.');
                loadMenu();
            } else {
                showNotification(`Error: ${result.message}`, true);
            }
        } catch (error) {
            console.error('Error:', error);
            showNotification('An error occurred during section deletion.', true);
        }
    }

    async function handleDeleteProduct(e) {
        e.stopPropagation();
        const productId = e.target.dataset.id;
        
        const isShortcut = productId.toUpperCase().startsWith('S'); 
        
        const confirmMsg = isShortcut 
            ? `Are you sure you want to delete this shortcut (ID: ${productId})? The original product will remain.`
            : `Are you sure you want to delete product ID: ${productId} and all associated images?`;

        if (!confirm(confirmMsg)) return;

        const formData = new FormData();
        formData.append('action', 'delete_product');
        formData.append('product_id', productId);

        try {
            const response = await fetch(API_URL, { method: 'POST', body: formData });
            const result = await response.json();

            if (result.success) {
                showNotification(result.message || 'Item deleted successfully.');
                loadMenu();
            } else {
                showNotification(`Error: ${result.message}`, true);
            }
        } catch (error) {
            console.error('Error:', error);
            showNotification('An error occurred during item deletion.', true);
        }
    }


    // Initial load of the menu
    loadMenu();
});
