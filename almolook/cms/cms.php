<?php
// Configuration
define('DATA_FILE', '../menu/data/products.json');
define('IMAGE_DIR', '../menu/images/');

header('Content-Type: application/json');

// Check for required action
$action = $_REQUEST['action'] ?? null;

if (!$action) {
    http_response_code(400);
    echo json_encode(['success' => false, 'message' => 'No action specified.']);
    exit;
}

// --- Helper Functions ---

function readMenuData() {
    if (!file_exists(DATA_FILE)) {
        return [['section' => 'New Section', 'tag' => 'normal', 'products' => []]];
    }
    $json = file_get_contents(DATA_FILE);
    if ($json === false) return null;
    $data = json_decode($json, true) ?? [];
    
    foreach ($data as &$section) {
        if (!isset($section['tag'])) {
            $section['tag'] = 'normal';
        }
    }
    unset($section);
    return $data;
}

function writeMenuData(array $data): bool {
    $json = json_encode($data, JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE) . "\n";
    return file_put_contents(DATA_FILE, $json) !== false;
}

function getNextId(array $data, string $prefix = 'P'): string {
    $max_id_num = 0;
    $prefix = strtoupper($prefix);
    $regex_prefix = preg_quote($prefix);
    
    foreach ($data as $section) {
        foreach ($section['products'] as $product) {
            if (isset($product['id']) && preg_match('/^' . $regex_prefix . '(\d+)$/i', $product['id'], $matches)) {
                $id_num = (int)$matches[1];
                if ($id_num > $max_id_num) {
                    $max_id_num = $id_num;
                }
            }
        }
    }
    return $prefix . str_pad($max_id_num + 1, 3, '0', STR_PAD_LEFT);
}

/**
 * Robustly deletes an image file from the IMAGE_DIR based on its full relative path.
 * Used for specific deletions (e.g., when deleting a product or marking an image for deletion).
 */
function deleteImageByRelativePath(string $relativePath): bool {
    // Sanitize path: remove 'images/' prefix
    $filename = basename($relativePath);
    
    // Safety check: ensure file path doesn't contain directory traversal sequences
    if (strpos($filename, '..') !== false) {
        return true; 
    }
    
    $fullPath = IMAGE_DIR . $filename;

    if (file_exists($fullPath) && !is_dir($fullPath)) {
        return unlink($fullPath);
    }
    
    return true; // Treat as success if file is not found
}

/**
 * Deletes all files in the image directory that start with the given prefix (e.g., 'p001' or 'p001a').
 * Used for reliable cleanup when replacing an image with a new extension.
 */
function deleteImagesByPrefix(string $prefix): bool {
    $success = true;
    // Use glob to find all files matching the prefix followed by any extension
    $files = glob(IMAGE_DIR . $prefix . '.*');
    foreach ($files as $file) {
        if (is_file($file)) {
            if (!unlink($file)) {
                $success = false;
            }
        }
    }
    return $success;
}

/**
 * Handles image upload, deletes any existing file for the product/variant ID, 
 * and returns the new relative path.
 */
function uploadImage(array $fileData, string $productId, string $variantSuffix = ''): string {
    if ($fileData['error'] !== UPLOAD_ERR_OK) {
        return '';
    }
    
    // Get file extension from the uploaded file's original name
    $ext = pathinfo($fileData['name'], PATHINFO_EXTENSION);
    if (empty($ext) || !in_array(strtolower($ext), ['jpg', 'jpeg', 'png', 'gif'])) {
         return ''; // Reject if not a common image type
    }

    $productIdUpper = strtoupper($productId);
    $productNum = substr($productIdUpper, 1);
    
    // Base prefix (e.g., p001 or p001a)
    $prefix = strtolower($productIdUpper[0]) . $productNum . $variantSuffix;
    
    // *** FIX: Delete any old image with this prefix regardless of extension ***
    deleteImagesByPrefix($prefix);
    // **************************************************************************

    // New naming convention: p001.ext, p001a.ext, etc.
    $filename = $prefix . '.' . strtolower($ext);
    $targetFilePath = IMAGE_DIR . $filename;
    $imageRelativePath = 'images/' . $filename;
    
    // Check MIME type as a final safety step
    $finfo = finfo_open(FILEINFO_MIME_TYPE);
    $mimeType = finfo_file($finfo, $fileData['tmp_name']);
    finfo_close($finfo);
    
    if (strpos($mimeType, 'image/') !== 0) {
        return ''; // Reject if not an image MIME type
    }
    
    if (move_uploaded_file($fileData['tmp_name'], $targetFilePath)) {
        return $imageRelativePath;
    }
    
    return '';
}

// --- Initialize Data ---

$menu = readMenuData();
if ($menu === null) {
    http_response_code(500);
    echo json_encode(['success' => false, 'message' => 'Failed to initialize menu data.']);
    exit;
}

if ($action === 'get_data') {
    echo json_encode($menu, JSON_UNESCAPED_UNICODE);
    exit;
}

// --- Reordering Actions ---

if ($action === 'reorder_sections') {
    $newOrder = json_decode($_POST['new_order'] ?? '[]', true);
    $orderedMenu = [];
    $sectionMap = array_column($menu, null, 'section');
    foreach ($newOrder as $sectionName) {
        if (isset($sectionMap[$sectionName])) {
            $orderedMenu[] = $sectionMap[$sectionName];
            unset($sectionMap[$sectionName]);
        }
    }
    $orderedMenu = array_merge($orderedMenu, $sectionMap);

    if (writeMenuData($orderedMenu)) {
        echo json_encode(['success' => true]);
    } else {
        http_response_code(500);
        echo json_encode(['success' => false, 'message' => 'Failed to write updated sections order to data file.']);
    }
    exit;
}

if ($action === 'reorder_products') {
    $sectionName = $_POST['section_name'] ?? '';
    $newOrder = json_decode($_POST['new_order'] ?? '[]', true);

    if (empty($sectionName) || empty($newOrder)) {
        echo json_encode(['success' => false, 'message' => 'Missing section name or new order data.']);
        exit;
    }

    $sectionFound = false;
    foreach ($menu as &$section) {
        if ($section['section'] === $sectionName) {
            $productMap = array_column($section['products'], null, 'id');
            $orderedProducts = [];
            foreach ($newOrder as $productId) {
                if (isset($productMap[$productId])) {
                    $orderedProducts[] = $productMap[$productId];
                    unset($productMap[$productId]);
                }
            }
            $section['products'] = array_merge($orderedProducts, $productMap);
            $sectionFound = true;
            break;
        }
    }
    unset($section);

    if (!$sectionFound) {
        echo json_encode(['success' => false, 'message' => 'Target section not found for reordering.']);
        exit;
    }

    if (writeMenuData($menu)) {
        echo json_encode(['success' => true]);
    } else {
        http_response_code(500);
        echo json_encode(['success' => false, 'message' => 'Failed to write updated products order to data file.']);
    }
    exit;
}

// --- CRUD Actions ---

if ($action === 'add_section') {
    $sectionName = trim($_POST['section_name'] ?? '');

    if (empty($sectionName)) {
        echo json_encode(['success' => false, 'message' => 'Section name cannot be empty.']);
        exit;
    }
    
    // Check for existing section name
    foreach ($menu as $section) {
        if ($section['section'] === $sectionName) {
            echo json_encode(['success' => false, 'message' => 'Section name already exists.']);
            exit;
        }
    }

    $newSection = [
        'section' => $sectionName,
        'tag' => 'normal',
        'products' => [],
    ];
    
    $menu[] = $newSection;

    if (writeMenuData($menu)) {
        echo json_encode(['success' => true]);
    } else {
        http_response_code(500);
        echo json_encode(['success' => false, 'message' => 'Failed to write to data file.']);
    }
    exit;
}

if ($action === 'edit_section') {
    $oldName = $_POST['old_name'] ?? '';
    $newName = trim($_POST['new_name'] ?? '');
    $newTag = $_POST['new_tag'] ?? 'normal';
    
    if (empty($oldName) || empty($newName)) {
        echo json_encode(['success' => false, 'message' => 'Section names cannot be empty.']);
        exit;
    }

    $found = false;
    foreach ($menu as &$section) {
        if ($section['section'] === $oldName) {
            $section['section'] = $newName;
            $section['tag'] = $newTag;
            $found = true;
            break;
        }
    }
    unset($section);
    
    if (writeMenuData($menu)) {
        echo json_encode(['success' => true]);
    } else {
        http_response_code(500);
        echo json_encode(['success' => false, 'message' => 'Failed to write to data file.']);
    }
    exit;
}

if ($action === 'delete_section') {
    $sectionName = $_POST['section_name'] ?? '';
    $indexToDelete = -1;
    $imagesToDelete = [];
    $isShortcutImage = false;

    foreach ($menu as $index => $section) {
        if ($section['section'] === $sectionName) {
            $indexToDelete = $index;
            foreach ($section['products'] as $product) {
                // Collect unique image paths for deletion
                if ($product['id'][0] !== 'S') { // Only delete Pxxx product images
                    if (isset($product['image']) && !empty($product['image'])) {
                        $imagesToDelete[] = $product['image'];
                    }
                    foreach ($product['variants'] ?? [] as $variant) {
                        if (isset($variant['image']) && !empty($variant['image']) && $variant['image'] !== $product['image']) {
                            $imagesToDelete[] = $variant['image'];
                        }
                    }
                } else {
                     // Collect Sxxx images separately as they are copies
                     if (isset($product['image']) && !empty($product['image'])) {
                        $imagesToDelete[] = $product['image'];
                    }
                }
            }
            break;
        }
    }

    if ($indexToDelete === -1) {
        echo json_encode(['success' => false, 'message' => 'Section not found.']);
        exit;
    }

    array_splice($menu, $indexToDelete, 1);
    
    $deletionErrors = false;
    // Delete the unique image paths collected
    $imagesToDelete = array_unique(array_filter($imagesToDelete)); 
    foreach ($imagesToDelete as $relativePath) {
        if (!deleteImageByRelativePath($relativePath)) {
            $deletionErrors = true;
        }
    }

    if (writeMenuData($menu)) {
        $message = 'Section and associated items deleted successfully.';
        if ($deletionErrors) {
            $message .= ' WARNING: Failed to delete one or more image files.';
        }
        echo json_encode(['success' => true, 'message' => $message]);
    } else {
        http_response_code(500);
        echo json_encode(['success' => false, 'message' => 'Failed to write to data file after section deletion.']);
    }
    exit;
}


if ($action === 'add_product') {
    $sectionName = $_POST['section_name'] ?? '';
    $name = trim($_POST['name'] ?? '');
    $basePrice = (float)($_POST['price'] ?? 0);
    $description = trim($_POST['description'] ?? '');
    // UPDATED FIELD NAME: 'base_size'
    $baseSize = trim($_POST['base_size'] ?? ''); 
    $imageFile = $_FILES['image'] ?? null;
    $newProductId = getNextId($menu, 'P'); 

    $baseImageRelativePath = '';
    
    // 1. Handle Base Image Upload (Deletes old Pxxx.* automatically)
    if ($imageFile && $imageFile['error'] === UPLOAD_ERR_OK && $imageFile['name'] !== '') {
        $baseImageRelativePath = uploadImage($imageFile, $newProductId);
        if (empty($baseImageRelativePath)) {
            echo json_encode(['success' => false, 'message' => 'Failed to upload base image or invalid file type.']);
            exit;
        }
    } 

    // 2. Process Variants
    $variants = [];
    $variantNames = $_POST['variant_name'] ?? [];
    $variantPrices = $_POST['variant_price'] ?? [];
    $variantDescriptions = $_POST['variant_description'] ?? [];
    $uploadedVariantFiles = $_FILES['variant_image_file']['tmp_name'] ?? [];
    $uploadedVariantFileError = $_FILES['variant_image_file']['error'] ?? [];

    $variantIndex = 0;
    foreach ($variantNames as $key => $size) {
        $size = trim($size);
        $price = (float)($variantPrices[$key] ?? 0);
        $desc = trim($variantDescriptions[$key] ?? '');

        if (!empty($size) && $price > 0) {
            $variantData = [
                'size' => $size,
                'price' => $price,
                'description' => $desc,
                'image' => $baseImageRelativePath, // Default to base image
            ];
            
            // Handle variant image upload if available (Deletes old Pxxxa.* automatically)
            if (isset($uploadedVariantFiles[$key]) && $uploadedVariantFileError[$key] === UPLOAD_ERR_OK) {
                // Construct file data array for a single variant image
                $variantFile = [
                    'tmp_name' => $_FILES['variant_image_file']['tmp_name'][$key],
                    'name' => $_FILES['variant_image_file']['name'][$key],
                    'size' => $_FILES['variant_image_file']['size'][$key],
                    'type' => $_FILES['variant_image_file']['type'][$key],
                    'error' => $_FILES['variant_image_file']['error'][$key],
                ];
                $suffix = chr(ord('a') + $variantIndex);
                $variantImagePath = uploadImage($variantFile, $newProductId, $suffix);
                if (!empty($variantImagePath)) {
                    $variantData['image'] = $variantImagePath;
                }
            }

            $variants[] = $variantData;
            $variantIndex++;
        }
    }
    
    // Final check for product validity
    if (empty($name) || ($basePrice <= 0 && empty($variants))) {
        // Clean up images only if the product fails to be saved
        deleteImagesByPrefix('p' . substr($newProductId, 1)); 
        deleteImagesByPrefix('p' . substr($newProductId, 1) . '[a-z]'); 
        echo json_encode(['success' => false, 'message' => 'Product must have a name, and either a base price or at least one variant.']);
        exit;
    }

    $newProduct = [
        'id' => $newProductId,
        'name' => $name,
        'price' => $basePrice,
        'description' => $description,
        'image' => $baseImageRelativePath,
        'variants' => $variants,
        'base_size' => $baseSize, // UPDATED FIELD NAME
    ];

    $sectionFound = false;
    foreach ($menu as &$section) {
        if ($section['section'] === $sectionName) {
            $section['products'][] = $newProduct;
            $sectionFound = true;
            break;
        }
    }
    unset($section);

    if (!$sectionFound) {
        // Clean up images if section not found
        deleteImagesByPrefix('p' . substr($newProductId, 1)); 
        deleteImagesByPrefix('p' . substr($newProductId, 1) . '[a-z]'); 
        echo json_encode(['success' => false, 'message' => 'Section not found. Uploaded images cleaned up.']);
        exit;
    }

    if (writeMenuData($menu)) {
        echo json_encode(['success' => true, 'product_id' => $newProductId]);
    } else {
        // Clean up images if writing to data file failed
        deleteImagesByPrefix('p' . substr($newProductId, 1)); 
        deleteImagesByPrefix('p' . substr($newProductId, 1) . '[a-z]'); 
        http_response_code(500);
        echo json_encode(['success' => false, 'message' => 'Failed to write to data file. Uploaded images cleaned up.']);
    }
    exit;
}

if ($action === 'edit_product') {
    $productId = strtoupper($_POST['product_id'] ?? '');
    $sectionName = $_POST['section_name'] ?? '';
    $name = trim($_POST['name'] ?? '');
    $basePrice = (float)($_POST['price'] ?? 0);
    $description = trim($_POST['description'] ?? '');
    // UPDATED FIELD NAME: 'base_size'
    $baseSize = trim($_POST['base_size'] ?? ''); 
    
    $deleteBaseImageFlag = ($_POST['delete_base_image'] ?? 'false') === 'true'; 
    $newImageFile = $_FILES['image'] ?? null;

    if (empty($productId) || empty($name)) {
        echo json_encode(['success' => false, 'message' => 'Invalid product details.']);
        exit;
    }

    $productFound = false;
    $originalSectionIndex = -1;
    $productIndex = -1;
    
    foreach ($menu as $secIndex => &$section) {
        foreach ($section['products'] as $prodIndex => &$product) {
            if (strtoupper($product['id']) === $productId) {
                if ($productId[0] === 'S') { 
                    echo json_encode(['success' => false, 'message' => 'Cannot edit a shortcut (Sxxx product).']);
                    exit;
                }
                
                $productFound = true;
                $originalSectionIndex = $secIndex;
                $productIndex = $prodIndex;

                $oldBaseImage = $product['image'] ?? '';
                $product['name'] = $name;
                $product['price'] = $basePrice;
                $product['description'] = $description;
                $product['base_size'] = $baseSize; // UPDATED FIELD NAME

                // 1. Handle Base Image Deletion/Replacement
                if ($deleteBaseImageFlag && $oldBaseImage) {
                    // Delete all files matching the Pxxx prefix for base image
                    deleteImagesByPrefix('p' . substr($productId, 1)); 
                    $product['image'] = ''; 
                    $oldBaseImage = ''; 
                }
                
                if ($newImageFile && $newImageFile['error'] === UPLOAD_ERR_OK && $newImageFile['name'] !== '') {
                    // uploadImage now handles pre-deletion of Pxxx.* automatically
                    $newImageRelativePath = uploadImage($newImageFile, $productId);
                    
                    if (!empty($newImageRelativePath)) {
                        $product['image'] = $newImageRelativePath;
                    } else {
                        echo json_encode(['success' => false, 'message' => 'Failed to upload new base image or invalid file type.']);
                        exit;
                    }
                }
                
                // 2. Process Variants
                $newVariants = [];
                $variantNames = $_POST['variant_name'] ?? [];
                $variantPrices = $_POST['variant_price'] ?? [];
                $variantDescriptions = $_POST['variant_description'] ?? [];
                $variantOldImages = $_POST['variant_old_image'] ?? [];
                $variantDeleteImageFlags = $_POST['variant_delete_image'] ?? [];
                $uploadedVariantFiles = $_FILES['variant_image_file']['tmp_name'] ?? [];
                $uploadedVariantFileError = $_FILES['variant_image_file']['error'] ?? [];

                
                $variantIndex = 0;
                foreach ($variantNames as $key => $size) {
                    $size = trim($size);
                    $price = (float)($variantPrices[$key] ?? 0);
                    $desc = trim($variantDescriptions[$key] ?? '');

                    if (!empty($size) && $price > 0) {
                        $oldVariantImage = $variantOldImages[$key] ?? '';
                        $currentVariantImage = $product['image']; // Default to updated base image
                        
                        // Check if previous variant image existed and wasn't the base one
                        if ($oldVariantImage && $oldVariantImage !== $product['image_path_old']) {
                            $currentVariantImage = $oldVariantImage;
                        }
                        
                        $suffix = chr(ord('a') + $variantIndex);
                        
                        // Handle variant image deletion
                        if (($variantDeleteImageFlags[$key] ?? 'false') === 'true') {
                            // Delete all files matching the Pxxxa prefix
                            deleteImagesByPrefix('p' . substr($productId, 1) . $suffix);
                            // Revert image path to current base image path
                            $currentVariantImage = $product['image']; 
                        }
                        
                        // Handle variant image replacement/upload
                        if (isset($uploadedVariantFiles[$key]) && $uploadedVariantFileError[$key] === UPLOAD_ERR_OK) {
                            $variantFile = [
                                'tmp_name' => $_FILES['variant_image_file']['tmp_name'][$key],
                                'name' => $_FILES['variant_image_file']['name'][$key],
                                'size' => $_FILES['variant_image_file']['size'][$key],
                                'type' => $_FILES['variant_image_file']['type'][$key],
                                'error' => $_FILES['variant_image_file']['error'][$key],
                            ];
                            
                            // uploadImage handles pre-deletion of Pxxxa.* automatically
                            $newVariantImagePath = uploadImage($variantFile, $productId, $suffix);
                            
                            if (!empty($newVariantImagePath)) {
                                $currentVariantImage = $newVariantImagePath;
                            }
                        }

                        $newVariants[] = [
                            'size' => $size,
                            'price' => $price,
                            'description' => $desc,
                            'image' => $currentVariantImage,
                        ];
                        $variantIndex++;
                    }
                }
                $product['variants'] = $newVariants;
                
                break 2;
            }
        }
    }
    unset($section, $product);

    if (!$productFound) {
        echo json_encode(['success' => false, 'message' => 'Original product (Pxxx) not found for editing.']);
        exit;
    }
    
    // Handle section move
    if ($menu[$originalSectionIndex]['section'] !== $sectionName) {
        $productToMove = $menu[$originalSectionIndex]['products'][$productIndex];
        array_splice($menu[$originalSectionIndex]['products'], $productIndex, 1);

        $targetSectionFound = false;
        foreach ($menu as &$section) {
            if ($section['section'] === $sectionName) {
                $section['products'][] = $productToMove;
                $targetSectionFound = true;
                break;
            }
        }
        unset($section);

        if (!$targetSectionFound) {
             echo json_encode(['success' => false, 'message' => 'Target section not found for product move.']);
             exit;
        }
    }

    if (writeMenuData($menu)) {
        echo json_encode(['success' => true]);
    } else {
        http_response_code(500);
        echo json_encode(['success' => false, 'message' => 'Failed to write to data file after product edit.']);
    }
    exit;
}

if ($action === 'add_shortcut') {
    $targetProductId = strtoupper($_POST['target_product_id'] ?? '');
    $targetSectionName = $_POST['target_section_name'] ?? '';

    if (empty($targetProductId) || $targetProductId[0] !== 'P') {
        echo json_encode(['success' => false, 'message' => 'Invalid or missing original product ID (must start with P).']);
        exit;
    }

    $originalProduct = null;
    foreach ($menu as $section) {
        foreach ($section['products'] as $product) {
            if (strtoupper($product['id']) === $targetProductId) {
                $originalProduct = $product;
                break 2;
            }
        }
    }

    if (!$originalProduct) {
        echo json_encode(['success' => false, 'message' => 'Original product not found.']);
        exit;
    }
    
    // Generate new shortcut ID
    $newShortcutId = getNextId($menu, 'S'); 

    // Handle image copying for shortcut
    $imageRelativePath = $originalProduct['image'] ?? '';
    $copiedImageRelativePath = '';
    $targetImagePath = '';
    
    // Copy the image file to a new Sxxx filename
    if (!empty($imageRelativePath)) {
        $originalFilename = basename($imageRelativePath);
        $originalImagePath = IMAGE_DIR . $originalFilename;
        
        // New shortcut filename (e.g., s001.jpg)
        $shortcutFilename = strtolower($newShortcutId[0]) . substr($originalFilename, 1);
        $targetImagePath = IMAGE_DIR . $shortcutFilename;
        $copiedImageRelativePath = 'images/' . $shortcutFilename;

        if (!file_exists($originalImagePath)) {
            $copiedImageRelativePath = ''; 
        } elseif (!copy($originalImagePath, $targetImagePath)) {
             echo json_encode(['success' => false, 'message' => 'Failed to copy the original image to the shortcut image path. Check write permissions on ' . IMAGE_DIR]);
             exit;
        }
    }

    $newShortcut = [
        'id' => $newShortcutId,
        'name' => $originalProduct['name'],
        'price' => $originalProduct['price'],
        'description' => $originalProduct['description'],
        'image' => $copiedImageRelativePath, 
        'shortcut_to' => $targetProductId,
        // Copy the variants array to the new shortcut product
        'variants' => $originalProduct['variants'] ?? [],
        'base_size' => $originalProduct['base_size'] ?? '', // UPDATED FIELD NAME
    ];

    $sectionFound = false;
    foreach ($menu as &$section) {
        if ($section['section'] === $targetSectionName) {
            $section['products'][] = $newShortcut;
            $sectionFound = true;
            break;
        }
    }
    unset($section);

    if (!$sectionFound) {
        if (!empty($targetImagePath) && file_exists($targetImagePath)) unlink($targetImagePath);
        echo json_encode(['success' => false, 'message' => 'Target section not found.']);
        exit;
    }

    if (writeMenuData($menu)) {
        echo json_encode(['success' => true, 'shortcut_id' => $newShortcutId]);
    } else {
        if (!empty($targetImagePath) && file_exists($targetImagePath)) unlink($targetImagePath);
        http_response_code(500);
        echo json_encode(['success' => false, 'message' => 'Failed to write to data file. Copied image cleaned up.']);
    }
    exit;
}

if ($action === 'delete_product') {
    $productId = strtoupper($_POST['product_id'] ?? '');
    if (empty($productId)) {
        echo json_encode(['success' => false, 'message' => 'Product ID is missing.']);
        exit;
    }

    $productFound = false;
    $isShortcut = false;
    $imagesToDelete = [];

    foreach ($menu as &$section) {
        foreach ($section['products'] as $index => $product) {
            if (strtoupper($product['id']) === $productId) {
                $productFound = true;
                $isShortcut = $productId[0] === 'S';

                if (!$isShortcut) {
                    // Collect all unique image paths for Pxxx deletion
                    $basePrefix = 'p' . substr($productId, 1);
                    deleteImagesByPrefix($basePrefix);
                    deleteImagesByPrefix($basePrefix . '[a-z]');
                    
                } elseif ($isShortcut && isset($product['image']) && !empty($product['image'])) {
                    // Only delete the single Sxxx image file (which is a copy)
                    deleteImageByRelativePath($product['image']);
                }

                array_splice($section['products'], $index, 1);
                break 2; 
            }
        }
    }
    unset($section);

    if (!$productFound) {
        echo json_encode(['success' => false, 'message' => 'Product not found.']);
        exit;
    }
    
    if (writeMenuData($menu)) {
        $message = $isShortcut ? 'Shortcut deleted successfully.' : 'Product and all associated images deleted successfully.';
        echo json_encode(['success' => true, 'message' => $message]);
    } else {
        http_response_code(500);
        echo json_encode(['success' => false, 'message' => 'Failed to write to data file after product deletion.']);
    }
    exit;
}


// Fallback for unknown action
http_response_code(400);
echo json_encode(['success' => false, 'message' => 'Unknown action.']);
?>
