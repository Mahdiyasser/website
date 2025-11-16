<?php
// ====================================================================
// CONFIGURATION: SET THE PATHS HERE
// ====================================================================
// Path to the data file (relative to cms.php)
$data_file_path = '../data/data.json';
// Directory where images are stored (relative to cms.php). 
// e.g., if cms.php is in /cms and images are in /images, use '../images/'
$image_dir = '../img/'; 
// ====================================================================

// Set headers for JSON response and cross-origin requests (if needed)
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Authorization, X-Requested-With');

// Handle preflight OPTIONS request
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}

// --- UTILITY FUNCTIONS ---

/**
 * Normalizes a string for use as a file name (slugify).
 * @param string $text The text to slugify.
 * @param string $divider The word divider.
 * @return string The sanitized file name part.
 */
function slugify($text, $divider = '-')
{
    // Replace non letter or digits by divider
    $text = preg_replace('~[^\pL\d]+~u', $divider, $text);

    // Transliterate (e.g., á to a)
    $text = iconv('utf-8', 'us-ascii//TRANSLIT', $text);

    // Remove unwanted characters
    $text = preg_replace('~[^-\w]+~', '', $text);

    // Trim
    $text = trim($text, $divider);

    // Remove duplicate dividers
    $text = preg_replace('~-+~', $divider, $text);

    // Lowercase
    $text = strtolower($text);

    return empty($text) ? 'untitled-project' : $text;
}

/**
 * Reads the content of the JSON file.
 * @return array The decoded JSON data, or an empty array on failure.
 */
function read_data() {
    global $data_file_path;
    if (!file_exists($data_file_path)) {
        write_data([]); 
        return [];
    }
    $json_data = file_get_contents($data_file_path);
    if ($json_data === false) {
        error_log("Error reading file: " . $data_file_path);
        return [];
    }
    $data = json_decode($json_data, true);
    return is_array($data) ? $data : [];
}

/**
 * Writes the array data back to the JSON file.
 * @param array $data The data array to encode and save.
 * @return bool True on success, false on failure.
 */
function write_data($data) {
    global $data_file_path;
    $json_data = json_encode($data, JSON_PRETTY_PRINT);
    if ($json_data === false) {
        error_log("Error encoding data to JSON.");
        return false;
    }
    if (file_put_contents($data_file_path, $json_data) === false) {
        error_log("Error writing data to file: " . $data_file_path);
        return false;
    }
    return true;
}

/**
 * Deletes an image file from the server if it exists.
 * @param string $path The image path (e.g., '../images/photo.png').
 */
function delete_image_file($path) {
    if ($path && file_exists($path)) {
        // Ensure path is not just the directory itself to prevent accidental deletion
        if (basename($path) !== '') {
            if (!unlink($path)) {
                error_log("Failed to delete image file: " . $path);
            }
        }
    }
}

/**
 * Handles the file upload, saving it as [project-name].png.
 * @param array $file_data The item from the $_FILES array.
 * @param string $project_name The name of the project.
 * @param string|null $old_image_path The existing image path (from JSON) to delete.
 * @return string|null The new image file path to be stored in JSON (e.g., '../images/file.png') or null if no file uploaded/failure.
 */
function handle_image_upload($file_data, $project_name, $old_image_path = null) {
    global $image_dir;
    
    // Check if a file was actually uploaded without error
    if (!isset($file_data['error']) || $file_data['error'] !== UPLOAD_ERR_OK) {
        return null; // No file uploaded or upload error occurred
    }

    // 1. Determine the new file name (always PNG)
    $safe_name = slugify($project_name);
    $new_file_name = $safe_name . '.png';
    
    // Path relative to cms.php for file system operations
    $target_file_system_path = $image_dir . $new_file_name;
    // Path to be stored in JSON (relative to index.html for display)
    $new_json_path = $image_dir . $new_file_name;

    // 2. Ensure the upload directory exists
    if (!is_dir($image_dir)) {
        if (!mkdir($image_dir, 0777, true)) {
            error_log("Failed to create image directory: " . $image_dir);
            return null;
        }
    }

    // 3. Delete the old file if it exists and is different from the target
    if ($old_image_path && $old_image_path !== $new_json_path) {
        delete_image_file($old_image_path);
    }

    // 4. Move and save the uploaded file
    // NOTE: This simple move keeps the original file type but renames it to .png.
    // For true conversion, you'd use GD or Imagick library functions here.
    if (move_uploaded_file($file_data['tmp_name'], $target_file_system_path)) {
        // Return the path as it should be stored in the JSON
        return $new_json_path;
    }

    error_log("Failed to move uploaded file.");
    return null;
}

// --- MAIN API HANDLER ---

$method = $_SERVER['REQUEST_METHOD'];
$data = []; // Will hold final request data

if ($method === 'POST') {
    // For file uploads (Create or Update override), use $_POST
    $data = $_POST;
    // Check for method override
    if (isset($data['_method']) && $data['_method'] === 'PUT') {
        $method = 'PUT'; // Switch to PUT logic
    }
} else {
    // For GET, DELETE, or Reorder PUT, read JSON body
    $raw_input = file_get_contents('php://input');
    $data = json_decode($raw_input, true);
    $data = is_array($data) ? $data : []; 
}


switch ($method) {
    case 'GET':
        // READ operation
        $projects = read_data();
        echo json_encode(['success' => true, 'data' => $projects]);
        break;

    case 'POST':
        // CREATE operation
        if (empty($data) || empty($data['name'])) {
            http_response_code(400);
            echo json_encode(['success' => false, 'message' => 'No project name or data provided for creation.']);
            break;
        }

        $projects = read_data();
        $new_id = empty($projects) ? 1 : max(array_column($projects, 'id')) + 1;

        // Handle image upload
        $image_path = '';
        if (!empty($_FILES['image_file'])) {
            $image_path = handle_image_upload($_FILES['image_file'], $data['name']);
            if ($image_path === null && $_FILES['image_file']['error'] !== UPLOAD_ERR_NO_FILE) {
                 http_response_code(500);
                 echo json_encode(['success' => false, 'message' => 'Image upload failed.']);
                 break;
            }
        }

        // Structure the new project data
        $new_project = [
            'id' => $new_id,
            'name' => $data['name'],
            'path' => $data['path'] ?? '',
            'image' => $image_path,
            'tag' => $data['tag'] ?? '',
            'style' => $data['style'] ?? '',
            'description' => $data['description'] ?? '',
            'story' => $data['story'] ?? '',
        ];

        array_unshift($projects, $new_project);

        if (write_data($projects)) {
            echo json_encode(['success' => true, 'message' => 'Project created successfully.', 'data' => $new_project]);
        } else {
            http_response_code(500);
            echo json_encode(['success' => false, 'message' => 'Failed to save data.']);
        }
        break;

    case 'PUT':
        // UPDATE or REORDER operation
        if (isset($data['reorder']) && $data['reorder'] === true) {
            // REORDER logic (uses JSON body)
            if (!isset($data['new_order']) || !is_array($data['new_order'])) {
                http_response_code(400);
                echo json_encode(['success' => false, 'message' => 'Invalid data for reordering.']);
                break;
            }

            $original_projects = read_data();
            $id_map = array_column($original_projects, null, 'id');

            $new_projects = [];
            foreach ($data['new_order'] as $id) {
                if (isset($id_map[$id])) {
                    $new_projects[] = $id_map[$id];
                }
            }
            
            if (write_data($new_projects)) {
                echo json_encode(['success' => true, 'message' => 'Projects reordered successfully.']);
            } else {
                http_response_code(500);
                echo json_encode(['success' => false, 'message' => 'Failed to save reordered data.']);
            }

        } else {
            // STANDARD UPDATE logic (uses $_POST via POST override)
            if (!isset($data['id'])) {
                http_response_code(400);
                echo json_encode(['success' => false, 'message' => 'Project ID is missing for update.']);
                break;
            }

            $projects = read_data();
            $updated = false;

            foreach ($projects as $key => $project) {
                if ((int)$project['id'] === (int)$data['id']) {
                    $old_image_path = $project['image'];

                    // 1. Handle explicit image deletion
                    if (isset($data['delete_image']) && $data['delete_image'] === 'true' && $old_image_path) {
                        delete_image_file($old_image_path);
                        $projects[$key]['image'] = '';
                        $old_image_path = ''; 
                    }

                    // 2. Handle new image upload/replacement
                    $new_image_path = null;
                    if (!empty($_FILES['image_file'])) {
                        $new_image_path = handle_image_upload($_FILES['image_file'], $data['name'], $old_image_path);
                        if ($new_image_path === null && $_FILES['image_file']['error'] !== UPLOAD_ERR_NO_FILE) {
                             http_response_code(500);
                             echo json_encode(['success' => false, 'message' => 'Image upload failed.']);
                             break 2;
                        }
                    }
                    
                    // Update image path: only if a new one was uploaded
                    if ($new_image_path !== null) {
                        $projects[$key]['image'] = $new_image_path;
                    } 
                    // If no new image and not deleted, the old image path remains.

                    // Update other fields
                    $projects[$key]['name'] = $data['name'] ?? $project['name'];
                    $projects[$key]['path'] = $data['path'] ?? $project['path'];
                    $projects[$key]['tag'] = $data['tag'] ?? $project['tag'];
                    $projects[$key]['style'] = $data['style'] ?? $project['style'];
                    $projects[$key]['description'] = $data['description'] ?? $project['description'];
                    $projects[$key]['story'] = $data['story'] ?? $project['story'];

                    $updated = true;
                    $updated_project = $projects[$key];
                    break;
                }
            }

            if ($updated && write_data($projects)) {
                echo json_encode(['success' => true, 'message' => 'Project updated successfully.', 'data' => $updated_project]);
            } elseif (!$updated) {
                http_response_code(404);
                echo json_encode(['success' => false, 'message' => 'Project not found.']);
            } else {
                http_response_code(500);
                echo json_encode(['success' => false, 'message' => 'Failed to save updated data.']);
            }
        }
        break;

    case 'DELETE':
        // DELETE operation (uses JSON body)
        $id = $data['id'] ?? null;
        if (!$id) {
            http_response_code(400);
            echo json_encode(['success' => false, 'message' => 'Project ID is missing for deletion.']);
            break;
        }

        $projects = read_data();
        $image_to_delete = null;
        
        // Find the image path before filtering
        foreach ($projects as $project) {
            if ((int)$project['id'] === (int)$id) {
                $image_to_delete = $project['image'];
                break;
            }
        }
        
        $initial_count = count($projects);
        
        // Filter out the project with the given ID
        $projects = array_filter($projects, function($project) use ($id) {
            return (int)$project['id'] !== (int)$id;
        });
        
        $projects = array_values($projects);
        $final_count = count($projects);

        if ($final_count < $initial_count) {
            if (write_data($projects)) {
                delete_image_file($image_to_delete);
                echo json_encode(['success' => true, 'message' => 'Project and associated image deleted successfully.']);
            } else {
                http_response_code(500);
                echo json_encode(['success' => false, 'message' => 'Failed to save data after deletion.']);
            }
        } elseif ($final_count === $initial_count) {
            http_response_code(404);
            echo json_encode(['success' => false, 'message' => 'Project not found or already deleted.']);
        }
        break;

    default:
        http_response_code(405);
        echo json_encode(['success' => false, 'message' => 'Method not allowed.']);
        break;
}
