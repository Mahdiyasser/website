<?php
// Post Maker - Absolute
// by Mahdi & ChatGPT
// Upgraded: Project/Tag Management, Project-based folder structure, Project CRUD.
// LATEST CHANGE: Dynamic "Back to Project" link using history.back()

ini_set('display_errors', 1);
error_reporting(E_ALL);
session_start();

$baseDir = realpath(__DIR__ . '/../');
$projectBaseDir = $baseDir . '/assets'; // NEW base for all projects
$jsonFile = $baseDir . '/posts.json';
$projectsJsonFile = $baseDir . '/projects.json'; // NEW
$locationDefault = 'Hosh Issa, Beheira, Egypt';

$baseUrl = '/projects'; // 🔥 Main prefix for all absolute URLs

$message = '';
$errors = [];

/* ---- AJAX helpers ---- */
function isAjaxReq(){
    return !empty($_POST['_ajax']) || (($_SERVER['HTTP_X_REQUESTED_WITH'] ?? '') === 'XMLHttpRequest');
}
function ajaxOk($msg, $extra = []){
    header('Content-Type: application/json');
    echo json_encode(array_merge(['ok'=>true,'message'=>$msg], $extra));
    exit;
}
function ajaxFail($errs){
    header('Content-Type: application/json');
    echo json_encode(['ok'=>false,'errors'=> (array)$errs]);
    exit;
}

// UTIL: slugify title
function slugify($text){
    $text = mb_strtolower(trim($text), 'UTF-8');
    $text = preg_replace('/[\s_]+/', '-', $text);
    $text = preg_replace('/[^a-z0-9\-]/', '', $text);
    $text = preg_replace('/-+/', '-', $text);
    return trim($text, '-');
}

// Ensure posts.json and projects.json exist
if(!file_exists($jsonFile)) file_put_contents($jsonFile, json_encode([], JSON_PRETTY_PRINT));
if(!file_exists($projectsJsonFile)) file_put_contents($projectsJsonFile, json_encode([], JSON_PRETTY_PRINT));

// Load posts array early
$postsArr = json_decode(file_get_contents($jsonFile), true);
if(!is_array($postsArr)) $postsArr = [];

// Load projects array early
$projectsArr = json_decode(file_get_contents($projectsJsonFile), true);
if(!is_array($projectsArr)) $projectsArr = [];

/**
 * Helper: find post index by slug (filename)
 */
function findPostIndexBySlug($arr, $slug){
    foreach($arr as $i => $p){
        $basename = pathinfo($p['file'] ?? '', PATHINFO_FILENAME);
        if($basename === $slug) return $i;
    }
    return false;
}

/**
 * Helper: find project index by tag slug
 */
function findProjectIndexBySlug($arr, $slug){
    foreach($arr as $i => $p){
        if(slugify($p['name'] ?? '') === $slug) return $i;
    }
    return false;
}

/**
 * Helper: Safely get project thumbnail path (web path) based on naming convention
 */
function getProjectThumbnailPath($projectBaseDir, $tagSlug, $baseUrl){
    $dir = rtrim($projectBaseDir, '/\\') . '/' . $tagSlug . '/images/';
    // Search for <tagSlug>-thumbnail.*
    $files = glob($dir . $tagSlug . '-thumbnail.*');
    if(!empty($files)){
        $web = str_replace('\\','/', $files[0]);
        $pos = strpos($web, '/assets/' . $tagSlug . '/images/');
        if($pos !== false){
            return rtrim($baseUrl, '/') . substr($web, $pos);
        }
    }
    return ''; // No thumbnail found
}

/**
 * Helper: read images list from images folder for a slug within a project
 * returns web paths prefixed with $baseUrl (e.g. /projects/assets/tag-slug/images/post-slug/filename)
 */
function getImagesForSlug($projectBaseDir, $tagSlug, $postSlug, $baseUrl){
    $dir = rtrim($projectBaseDir, '/\\') . '/' . $tagSlug . '/images/' . $postSlug; // NEW PATH
    $list = [];
    if(is_dir($dir)){
        $files = array_values(array_filter(glob($dir . '/*'), 'is_file'));
        sort($files);
        foreach($files as $f){
            // Skip the dedicated thumbnail file — it's handled separately
            if(preg_match('/^thumbnail\./i', basename($f))) continue;
            $web = str_replace('\\','/', $f);
            $pos = strpos($web, '/assets/' . $tagSlug . '/images/' . $postSlug);
            if($pos !== false){
                $rel = substr($web, $pos); // starts with /assets/tag-slug/images/post-slug/...
                $list[] = rtrim($baseUrl, '/') . $rel;
            } else {
                // Fallback
                $list[] = rtrim($baseUrl, '/') . '/assets/' . $tagSlug . '/images/' . $postSlug . '/' . basename($f);
            }
        }
    }
    return $list;
}

/**
 * Helper: make unique slug among posts (excluding $excludeIndex if provided)
 */
function makeUniqueSlug($postsArr, $base, $excludeIndex = null){
    $slug = $base;
    $suffix = 1;
    $exists = true;
    while($exists){
        $exists = false;
        foreach($postsArr as $i => $p){
            if($excludeIndex !== null && $i === $excludeIndex) continue;
            $basename = pathinfo($p['file'] ?? '', PATHINFO_FILENAME);
            if($basename === $slug){
                $exists = true;
                break;
            }
        }
        if($exists){
            $suffix++;
            $slug = $base . '-' . $suffix;
        }
    }
    return $slug;
}

/**
 * Helper: safely rename directory (handles cases where target exists)
 */
function safeRenameDir($old, $new){
    if($old === $new) return true;
    if(!is_dir($old)) return false;
    if(is_dir($new)){
        // merge contents to new then remove old
        $files = glob(rtrim($old, '/\\') . '/*');
        foreach($files as $f){
            $dest = rtrim($new, '/\\') . '/' . basename($f);
            if(is_file($f)){
                @rename($f, $dest);
            } elseif(is_dir($f)){
                // recursive move (simple)
                safeRenameDir($f, $dest);
            }
        }
        // attempt to remove old dir
        @rmdir($old);
        return true;
    } else {
        return @rename($old, $new);
    }
}

/**
 * Helper: update image paths inside HTML content when slug changes or tag changes
 */
function replaceSlugInHtml($htmlPath, $oldTagSlug, $newTagSlug, $oldPostSlug, $newPostSlug, $baseUrl){
    if(!file_exists($htmlPath)) return;
    $html = file_get_contents($htmlPath);

    // 1. Update image paths
    $oldPrefix = rtrim($baseUrl, '/') . '/assets/' . $oldTagSlug . '/images/' . $oldPostSlug . '/';
    $newPrefix = rtrim($baseUrl, '/') . '/assets/' . $newTagSlug . '/images/' . $newPostSlug . '/';
    $html = str_replace($oldPrefix, $newPrefix, $html);

    // 2. Update posts link (file path)
    $oldPostPath = rtrim($baseUrl, '/') . '/assets/' . $oldTagSlug . '/posts/' . $oldPostSlug . '.html';
    $newPostPath = rtrim($baseUrl, '/') . '/assets/' . $newTagSlug . '/posts/' . $newPostSlug . '.html';
    $html = str_replace($oldPostPath, $newPostPath, $html);

    file_put_contents($htmlPath, $html);
}

/**
 * Helper: rebuild images block HTML for a post from images folder and any manual URLs
 */
function buildImagesHTML($imagesList){
    $imagesHTML = '';
    foreach($imagesList as $imgRel){
        $imgRel = str_replace(' ', '-', $imgRel);
        $imagesHTML .= '<img src="' . htmlspecialchars($imgRel, ENT_QUOTES) . '" alt="Image">' . "\n";
    }
    return $imagesHTML;
}

/**
 * Build a post HTML file from the post.html template (placeholders: {{KEY}})
 * Falls back to a minimal inline template if post.html is missing.
 */
function buildPostFromTemplate($tplPath, $vars){
    if(file_exists($tplPath)){
        $tpl = file_get_contents($tplPath);
    } else {
        // Minimal fallback so the CMS still works without post.html
        $tpl = '<!DOCTYPE html><html lang="en"><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>{{TITLE}}</title></head><body style="font-family:sans-serif;max-width:760px;margin:2rem auto;padding:0 1rem;background:#0c0c0f;color:#e8e8f0"><h1>{{TITLE}}</h1><p style="color:#7070a0">{{PROJECT_NAME}} &mdash; {{DATE}} {{TIME}} &mdash; {{LOCATION}}</p><blockquote style="border-left:3px solid #f0a500;padding:.5rem 1rem;color:#7070a0">{{BIO}}</blockquote><div>{{CONTENT}}</div><div>{{IMAGES}}</div></body></html>';
    }
    foreach($vars as $k => $v){
        $tpl = str_replace('{{' . $k . '}}', $v, $tpl);
    }
    return $tpl;
}

/**
 * If ?clear=1 was requested (JS clears form without reload), clear session and return JSON.
 */
if(isset($_GET['clear']) && $_GET['clear'] == '1'){
    unset($_SESSION['form_data']);
    header('Content-Type: application/json');
    echo json_encode(['ok'=>true]);
    exit;
}

/**
 * AJAX: return post data for edit mode (JS-driven, no page reload)
 */
if(isset($_GET['action']) && $_GET['action'] === 'get_post' && isset($_GET['slug'])){
    $slugEdit  = trim($_GET['slug']);
    $tagEdit   = trim($_GET['tag'] ?? '');
    $tagSlug   = slugify($tagEdit);
    $idx       = findPostIndexBySlug($postsArr, $slugEdit);
    if($idx === false){
        ajaxFail(['Post not found: ' . $slugEdit]);
    }
    $p = $postsArr[$idx];
    $tagEdit   = $p['tag'] ?? $tagEdit;
    $tagSlug   = slugify($tagEdit);
    $htmlPath  = $projectBaseDir . '/' . $tagSlug . '/posts/' . $slugEdit . '.html';
    $bio = $p['desc'] ?? '';
    $content = '';
    if(file_exists($htmlPath)){
        $html = file_get_contents($htmlPath);
        if(preg_match('#<div class="bio">(.*?)</div>#is', $html, $m)){
            $bio = strip_tags($m[1], '<br><br/>');
            $bio = str_replace(['<br/>','<br>'], "\n", $bio);
            $bio = trim($bio);
        }
        if(preg_match('#<div class="content">(.*?)</div>#is', $html, $m2)){
            $content = trim($m2[1]);
        }
    }
    $dateStr   = $p['date'] ?? '';
    $dateParts = explode(' ', $dateStr);
    $imgsList  = getImagesForSlug($projectBaseDir, $tagSlug, $slugEdit, $baseUrl);
    ajaxOk('ok', [
        'title'         => $p['title'] ?? '',
        'tag'           => $tagEdit,
        'tag_slug'      => $tagSlug,
        'date'          => $dateParts[0] ?? '',
        'time'          => $dateParts[1] ?? '',
        'location'      => $p['location'] ?? '',
        'bio'           => $bio,
        'content'       => $content,
        'thumbnail'     => $p['thumbnail'] ?? '',
        'images_list'   => $imgsList,
        'slug'          => $slugEdit,
        'orig_tag_slug' => $tagSlug,
    ]);
}

/**
 * AJAX: return project data for edit mode (JS-driven, no page reload)
 */
if(isset($_GET['action']) && $_GET['action'] === 'get_project' && isset($_GET['slug'])){
    $slugEdit = trim($_GET['slug']);
    $idx      = findProjectIndexBySlug($projectsArr, $slugEdit);
    if($idx === false){
        ajaxFail(['Project not found: ' . $slugEdit]);
    }
    $p = $projectsArr[$idx];
    $thumb = getProjectThumbnailPath($projectBaseDir, $slugEdit, $baseUrl);
    ajaxOk('ok', [
        'name'      => $p['name'] ?? '',
        'bio'       => $p['bio'] ?? '',
        'thumbnail' => $thumb,
        'slug'      => $slugEdit,
    ]);
}

// === PROJECT MANAGEMENT HANDLER (NEW) ===
if($_SERVER['REQUEST_METHOD'] === 'POST' && isset($_POST['project_action'])){
    $projectName = trim($_POST['project_name'] ?? '');
    $tagSlug = slugify($projectName);
    $bio = trim($_POST['project_bio'] ?? '');

    // Reload projects array inside POST logic
    $projectsArr = json_decode(file_get_contents($projectsJsonFile), true);
    if(!is_array($projectsArr)) $projectsArr = [];

    if($projectName === ''){
        $errors[] = "Project Name is required.";
    } elseif ($tagSlug === ''){
        $errors[] = "Project Name generates an empty slug.";
    }

    $idx = findProjectIndexBySlug($projectsArr, $tagSlug);
    $isEditing = ($idx !== false);

    if($_POST['project_action'] === 'save' && count($errors) === 0){
        $message = $isEditing ? "Project '$projectName' updated successfully." : "Project '$projectName' created successfully.";

        // Define paths
        $projectBaseDirForThumb = $projectBaseDir . '/' . $tagSlug;
        $projectImagesDir = $projectBaseDirForThumb . '/images';
        $projectPostsDir = $projectBaseDirForThumb . '/posts';

        // Ensure directories exist
        if(!is_dir($projectImagesDir)) mkdir($projectImagesDir, 0755, true);
        if(!is_dir($projectPostsDir)) mkdir($projectPostsDir, 0755, true);

        $thumbnailPathRel = $projectsArr[$idx]['thumbnail'] ?? '';

        // === Handle thumbnail deletion ===
        if($isEditing && isset($_POST['delete_thumbnail']) && $_POST['delete_thumbnail'] == '1'){
            if(!empty($thumbnailPathRel)){
                // Search for the file based on the required naming convention
                $filesToDelete = glob($projectImagesDir . '/' . $tagSlug . '-thumbnail.*');
                foreach($filesToDelete as $f) if(is_file($f)) @unlink($f);
                $thumbnailPathRel = '';
            }
        }

        // === Thumbnail upload/replace ===
        if(isset($_FILES['project_thumbnail']) && $_FILES['project_thumbnail']['name'] !== ''){
            $ext = strtolower(pathinfo($_FILES['project_thumbnail']['name'], PATHINFO_EXTENSION)) ?: 'jpg';
            $thumbTargetBase = $tagSlug . '-thumbnail';
            $thumbTarget = $projectImagesDir . '/' . $thumbTargetBase . '.' . $ext;

            // Clean up old thumbnail files in case the extension changed
            $oldFiles = glob($projectImagesDir . '/' . $thumbTargetBase . '.*');
            foreach($oldFiles as $f) if(is_file($f)) @unlink($f);

            if(move_uploaded_file($_FILES['project_thumbnail']['tmp_name'], $thumbTarget)){
                // Path must be /assets/<project-name>/images/<project-name>-thumbnail.ext
                $thumbnailPathRel = rtrim($baseUrl, '/') . '/assets/' . $tagSlug . '/images/' . $thumbTargetBase . '.' . $ext;
            } else {
                $errors[] = "Failed uploading project thumbnail.";
            }
        } else if ($isEditing && isset($_POST['delete_thumbnail']) && $_POST['delete_thumbnail'] == '0'){
            // If editing and no new upload, check if a file exists on disk based on naming rule
            $thumbnailPathRel = getProjectThumbnailPath($projectBaseDir, $tagSlug, $baseUrl);
        }

        $projectData = [
            "name" => $projectName,
            "bio" => $bio,
            "thumbnail" => $thumbnailPathRel,
            "slug" => $tagSlug // Store slug for easy lookup
        ];

        if($isEditing){
            $projectsArr[$idx] = $projectData;
        } else {
            // Only add if it doesn't exist (prevents adding if slug already matched)
            if(findProjectIndexBySlug($projectsArr, $tagSlug) === false){
                 $projectsArr[] = $projectData;
            } else {
                 $errors[] = "Project with name '$projectName' already exists.";
            }
        }

        if(count($errors) === 0){
            file_put_contents($projectsJsonFile, json_encode($projectsArr, JSON_PRETTY_PRINT));
            if(isAjaxReq()) ajaxOk($message, ['slug'=>$tagSlug]);
            header("Location: " . $_SERVER['PHP_SELF'] . "?msg=" . urlencode($message) . "&edit_project=" . urlencode($tagSlug));
            exit;
        }

    } elseif($_POST['project_action'] === 'delete' && count($errors) === 0){
        $origProjectName = $_POST['project_name'];
        if($idx === false){
            $errors[] = "Project not found for deletion.";
        } else {
            // Check for existing posts in this project
            $postsInProject = array_filter($postsArr, function($p) use ($origProjectName) {
                return ($p['tag'] ?? '') === $origProjectName;
            });
            if(!empty($postsInProject)){
                $errors[] = "Cannot delete project '$origProjectName'. It still contains " . count($postsInProject) . " posts.";
            } else {
                // Delete project directory structure
                $projectBaseDirForDelete = $projectBaseDir . '/' . $tagSlug;

                $deleteDirContents = function($dir) use (&$deleteDirContents) {
                    if (!is_dir($dir)) return;
                    $items = glob($dir . '/*');
                    foreach($items as $item) {
                        if (is_dir($item)) {
                            $deleteDirContents($item);
                            @rmdir($item);
                        } else {
                            @unlink($item);
                        }
                    }
                };

                // Delete contents and the main project folder
                $deleteDirContents($projectBaseDirForDelete);
                @rmdir($projectBaseDirForDelete);

                array_splice($projectsArr, $idx, 1);
                file_put_contents($projectsJsonFile, json_encode($projectsArr, JSON_PRETTY_PRINT));
                $message = "🗑️ Project '$origProjectName' deleted successfully!";
                if(isAjaxReq()) ajaxOk($message, ['deleted_slug'=>$tagSlug]);
                header("Location: " . $_SERVER['PHP_SELF'] . "?msg=" . urlencode($message));
                exit;
            }
        }
    }
}
// END PROJECT MANAGEMENT HANDLER

// === DELETE POST (full delete) ===
if($_SERVER['REQUEST_METHOD'] === 'POST' && isset($_POST['delete_post']) && !empty($_POST['delete_post']) && !isset($_POST['project_action'])){
    $slugToDelete = $_POST['delete_post'];
    $tagSlugToDelete = $_POST['delete_tag_slug']; // NEW

    $foundIndex = findPostIndexBySlug($postsArr, $slugToDelete);
    if($foundIndex === false){
        $errors[] = "Post not found: $slugToDelete";
    } else {
        // Delete HTML file
        $postFilePath = $projectBaseDir . '/' . $tagSlugToDelete . '/posts/' . $slugToDelete . '.html'; // UPDATED PATH
        if(file_exists($postFilePath)) @unlink($postFilePath);

        // Delete post images folder
        $postImagesDir = $projectBaseDir . '/' . $tagSlugToDelete . '/images/' . $slugToDelete; // UPDATED PATH
        if(is_dir($postImagesDir)){
            $files = glob($postImagesDir . '/*');
            foreach($files as $f) if(is_file($f)) @unlink($f);
            @rmdir($postImagesDir);
        }

        // Remove from posts.json
        array_splice($postsArr, $foundIndex, 1);
        file_put_contents($jsonFile, json_encode($postsArr, JSON_PRETTY_PRINT));

        if(isset($_POST['retain_form_after_action']) && $_POST['retain_form_after_action'] == '0'){
            unset($_SESSION['form_data']);
        }

        $message = "🗑️ Post '$slugToDelete' deleted successfully!";
        if(isAjaxReq()) ajaxOk($message, ['deleted_slug' => $slugToDelete]);
        header("Location: " . $_SERVER['PHP_SELF'] . "?msg=" . urlencode($message));
        exit;
    }
}

// === CREATE OR UPDATE POST ===
if($_SERVER['REQUEST_METHOD'] === 'POST' && !isset($_POST['delete_post']) && !isset($_POST['project_action']) && count($errors) === 0){
    // collect inputs
    $title = trim($_POST['title'] ?? '');
    $date = trim($_POST['date'] ?? date('Y-m-d'));
    $time = trim($_POST['time'] ?? date('H:i'));
    $location = trim($_POST['location'] ?? $locationDefault);
    $bio = trim($_POST['bio'] ?? '');
    $content = trim($_POST['content'] ?? '');
    $imagesurls = trim($_POST['images'] ?? '');
    $imagesUrlList = array_filter(array_map('trim', explode(',', $imagesurls)));

    // Project tag inputs (NEW)
    $tag = trim($_POST['tag_hidden'] ?? ''); // Use the hidden field
    if($tag === '') $errors[] = "Project Tag is required for the post.";
    $tagSlug = slugify($tag); // Slugify the final tag

    // Save form inputs into session so they persist after redirect and the form doesn't auto-clear
    $_SESSION['form_data'] = [
        'title' => $title,
        'date' => $date,
        'time' => $time,
        'location' => $location,
        'bio' => $bio,
        'content' => $content,
        'images' => $imagesurls,
        'tag' => $tag
    ];

    if($title === '') $errors[] = "Title is required.";

    if(count($errors) === 0){
        // Load posts array fresh
        $postsArr = json_decode(file_get_contents($jsonFile), true);
        if(!is_array($postsArr)) $postsArr = [];

        // === UPDATE EXISTING POST ===
        if(isset($_POST['edit_slug']) && $_POST['edit_slug'] !== ''){
            $origSlug = $_POST['edit_slug'];
            $origTagSlug = $_POST['orig_tag_slug']; // NEW
            $idx = findPostIndexBySlug($postsArr, $origSlug);

            if($idx === false){
                $errors[] = "Post not found for editing: $origSlug";
            } else {
                // determine new slug from new title (unique)
                $newBase = slugify($title);
                if($newBase === '') $newBase = 'post';
                $newSlug = makeUniqueSlug($postsArr, $newBase, $idx);

                // Define NEW file paths based on new tag and slug
                $newTagSlug = $tagSlug;

                $oldPostFilePath = $projectBaseDir . '/' . $origTagSlug . '/posts/' . $origSlug . '.html';
                $oldImagesDir = $projectBaseDir . '/' . $origTagSlug . '/images/' . $origSlug;
                $newPostFilePath = $projectBaseDir . '/' . $newTagSlug . '/posts/' . $newSlug . '.html';
                $newImagesDir = $projectBaseDir . '/' . $newTagSlug . '/images/' . $newSlug;
                $newPostsDir = $projectBaseDir . '/' . $newTagSlug . '/posts';
                $newProjectImagesDir = $projectBaseDir . '/' . $newTagSlug . '/images';

                // If slug or tag changed, handle file movement
                if($newSlug !== $origSlug || $newTagSlug !== $origTagSlug){
                    // Ensure new project folders exist
                    if(!is_dir($newPostsDir)) mkdir($newPostsDir, 0755, true);
                    if(!is_dir($newProjectImagesDir)) mkdir($newProjectImagesDir, 0755, true);

                    // rename images dir (safe)
                    if(is_dir($oldImagesDir)){
                        safeRenameDir($oldImagesDir, $newImagesDir);
                    } else {
                        if(!is_dir($newImagesDir)) mkdir($newImagesDir, 0755, true);
                    }

                    // rename post html (if exists) and patch image paths inside
                    if(file_exists($oldPostFilePath)){
                        // first update paths inside old file to new slug AND new tag
                        replaceSlugInHtml($oldPostFilePath, $origTagSlug, $newTagSlug, $origSlug, $newSlug, $baseUrl);
                        // then rename/move html file
                        @rename($oldPostFilePath, $newPostFilePath);
                    }

                    // Update postsArr entry paths for this item
                    $postsArr[$idx]['tag'] = $tag;
                    $postsArr[$idx]['file'] = rtrim($baseUrl, '/') . '/assets/' . $newTagSlug . '/posts/' . $newSlug . '.html';
                    // update thumbnail path if exists
                    if(!empty($postsArr[$idx]['thumbnail'])){
                        $oldThumbPrefix = '/assets/' . $origTagSlug . '/images/' . $origSlug . '/';
                        $newThumbPrefix = '/assets/' . $newTagSlug . '/images/' . $newSlug . '/';
                        $postsArr[$idx]['thumbnail'] = str_replace($oldThumbPrefix, $newThumbPrefix, $postsArr[$idx]['thumbnail']);
                    }
                } else {
                    // slug and tag didn't change — ensure images dir exists
                    $newImagesDir = $oldImagesDir;
                    $newPostFilePath = $oldPostFilePath;
                    if(!is_dir($newImagesDir)) mkdir($newImagesDir, 0755, true);
                }

                // Load current uploaded images (after potential rename)
                $existingImages = getImagesForSlug($projectBaseDir, $newTagSlug, $newSlug, $baseUrl);

                // === Handle deletion of selected existing images ===
                if(isset($_POST['delete_images']) && is_array($_POST['delete_images'])){
                    foreach($_POST['delete_images'] as $delRel){
                        $delRel = trim($delRel);
                        if($delRel === '') continue;
                        $fname = basename(parse_url($delRel, PHP_URL_PATH));
                        $localPath = rtrim($newImagesDir, '/\\') . '/' . $fname;
                        if(file_exists($localPath)) @unlink($localPath);
                    }
                    $existingImages = getImagesForSlug($projectBaseDir, $newTagSlug, $newSlug, $baseUrl);
                }

                // === Handle thumbnail deletion ===
                $thumbnailPathRel = $postsArr[$idx]['thumbnail'] ?? '';
                if(isset($_POST['delete_thumbnail']) && $_POST['delete_thumbnail'] == '1'){
                    if(!empty($thumbnailPathRel)){
                        $thumbName = basename(parse_url($thumbnailPathRel, PHP_URL_PATH));
                        $thumbLocal = rtrim($newImagesDir, '/\\') . '/' . $thumbName;
                        if(file_exists($thumbLocal)) @unlink($thumbLocal);
                        $thumbnailPathRel = '';
                    }
                }

                // === Thumbnail upload (replace if new uploaded) ===
                if(isset($_FILES['thumbnail']) && isset($_FILES['thumbnail']['name']) && $_FILES['thumbnail']['name'] !== ''){
                    $ext = strtolower(pathinfo($_FILES['thumbnail']['name'], PATHINFO_EXTENSION)) ?: 'jpg';
                    $thumbTarget = $newImagesDir . '/thumbnail.' . $ext;
                    if(move_uploaded_file($_FILES['thumbnail']['tmp_name'], $thumbTarget)){
                        $thumbnailPathRel = rtrim($baseUrl, '/') . '/assets/' . $newTagSlug . '/images/' . $newSlug . '/thumbnail.' . $ext;
                    } else {
                        $errors[] = "Failed uploading thumbnail.";
                    }
                }

                // === Multiple image uploads (append new images) ===
                if(isset($_FILES['upload_images'])){
                    $names = $_FILES['upload_images']['name'];
                    $tmps = $_FILES['upload_images']['tmp_name'];
                    for($i=0;$i<count($names);$i++){
                        $n = $names[$i]; $t = $tmps[$i];
                        if(empty($n) || empty($t)) continue;
                        $ext = strtolower(pathinfo($n, PATHINFO_EXTENSION)) ?: 'jpg';
                        $existingFiles = array_values(array_filter(glob($newImagesDir . '/image*')));
                        $nextIndex = count($existingFiles) + 1;
                        $imgTarget = $newImagesDir . '/image' . $nextIndex . '.' . $ext;
                        $k = 1;
                        while(file_exists($imgTarget)){
                            $k++;
                            $imgTarget = $newImagesDir . '/image' . $nextIndex . '-' . $k . '.' . $ext;
                        }
                        if(move_uploaded_file($t, $imgTarget)){
                            $existingImages[] = rtrim($baseUrl, '/') . '/assets/' . $newTagSlug . '/images/' . $newSlug . '/' . basename($imgTarget);
                        } else {
                            $errors[] = "Failed uploading image: $n";
                        }
                    }
                }

                // === Image URLs appended ===
                foreach($imagesUrlList as $url){
                    if($url === '') continue;
                    if(!preg_match('#^https?://#', $url)){
                        $url = rtrim($baseUrl, '/') . '/' . ltrim($url, '/');
                    }
                    $existingImages[] = str_replace(' ', '-', $url);
                }

                // Rebuild imagesHTML from actual folder images and manual URLs
                $folderImages = getImagesForSlug($projectBaseDir, $newTagSlug, $newSlug, $baseUrl);
                $allImages = $folderImages;
                foreach($imagesUrlList as $url){
                    if($url === '') continue;
                    $u = $url;
                    if(!preg_match('#^https?://#', $u)){
                        $u = rtrim($baseUrl, '/') . '/' . ltrim($u, '/');
                    }
                    if(!in_array($u, $allImages, true)){
                        $allImages[] = $u;
                    }
                }

                

                $imagesHTML = buildImagesHTML($allImages);

                // Update or rebuild post HTML file
                $postFilePath = $newPostFilePath;
                $displayTitle = htmlspecialchars($title);
                $displayDate = htmlspecialchars($date);
                $displayTime = htmlspecialchars($time);
                $displayLocation = htmlspecialchars($location);
                $displayBio = nl2br(htmlspecialchars($bio));
                $displayContent = $content;

                // ** New Footer Variables **
                $displayProjectName = htmlspecialchars($tag); // The Project Name

                if(file_exists($postFilePath)){
                    $html = file_get_contents($postFilePath);
                    $html = preg_replace('#<h1>.*?</h1>#is', '<h1>' . htmlspecialchars($title) . '</h1>', $html);
                    $html = preg_replace('#<span id="date">.*?</span>#is', '<span id="date">'.htmlspecialchars($date).'</span>', $html);
                    $html = preg_replace('#<span id="time">.*?</span>#is', '<span id="time">'.htmlspecialchars($time).'</span>', $html);
                    $html = preg_replace('#<span id="location">.*?</span>#is', '<span id="location">'.htmlspecialchars($location).'</span>', $html);
                    $html = preg_replace('#<div class="bio">.*?</div>#is', '<div class="bio">'.nl2br(htmlspecialchars($bio)).'</div>', $html);
                    $html = preg_replace('#<div class="content">.*?</div>#is', '<div class="content">'.$content.'</div>', $html);
                    $html = preg_replace('#<div class="images">.*?</div>#is', '<div class="images">'.$imagesHTML.'</div>', $html);
                    // 💥 UPDATE FOOTER LINK TEXT AND HREF (Patching for existing file)
                    $html = preg_replace(
                        '#<footer>.*?</footer>#is',
                        '<footer><a href="javascript:history.back()" class="back">← Back to ' . $displayProjectName . '</a></footer>',
                        $html
                    );
                    file_put_contents($postFilePath, $html);
                } else {
                    // create fresh post html based on template
                    // === BUILD POST FROM TEMPLATE FILE ===
                    $postHTML = buildPostFromTemplate(__DIR__ . '/post.html', [
                        'TITLE'        => $displayTitle,
                        'PROJECT_NAME' => $displayProjectName,
                        'DATE'         => $displayDate,
                        'TIME'         => $displayTime,
                        'LOCATION'     => $displayLocation,
                        'BIO'          => $displayBio,
                        'CONTENT'      => $displayContent,
                        'IMAGES'       => $imagesHTML,
                    ]);
                    // === END BUILD FROM TEMPLATE 1/2 ===
                    file_put_contents($postFilePath, $postHTML);
                }

                // Update postsArr entry
                $postsArr[$idx]['tag'] = $tag;
                $postsArr[$idx]['title'] = $title;
                $postsArr[$idx]['date'] = $date . ' ' . $time;
                $postsArr[$idx]['desc'] = $bio;
                $postsArr[$idx]['location'] = $location;
                if(!empty($thumbnailPathRel)) $postsArr[$idx]['thumbnail'] = $thumbnailPathRel;
                else $postsArr[$idx]['thumbnail'] = $postsArr[$idx]['thumbnail'] ?? '';

                $postsArr[$idx]['file'] = rtrim($baseUrl, '/') . '/assets/' . $newTagSlug . '/posts/' . $newSlug . '.html';

                // Save posts.json
                file_put_contents($jsonFile, json_encode($postsArr, JSON_PRETTY_PRINT));

                $message = "✏️ Post '" . ($newSlug) . "' updated successfully!";
                if(isAjaxReq()) ajaxOk($message, ['slug'=>$newSlug,'tag'=>$tag,'editUrl'=>$_SERVER['PHP_SELF'].'?edit='.urlencode($newSlug).'&tag='.urlencode($tag)]);
                header("Location: " . $_SERVER['PHP_SELF'] . "?msg=" . urlencode($message) . "&edit=" . urlencode($newSlug) . "&tag=" . urlencode($tag));
                exit;
            }
        } // end edit branch

        // === CREATE NEW POST ===
        else {
            $slugBase = slugify($title);
            if($slugBase === '') $slugBase = 'post';
            $slug = makeUniqueSlug($postsArr, $slugBase, null);

            $postImagesDir = $projectBaseDir . '/' . $tagSlug . '/images/' . $slug; // UPDATED PATH
            $postPostsDir = $projectBaseDir . '/' . $tagSlug . '/posts'; // UPDATED PATH

            if(!is_dir($postImagesDir)) mkdir($postImagesDir, 0755, true);
            if(!is_dir($postPostsDir)) mkdir($postPostsDir, 0755, true);

            $uploadedImages = [];
            $thumbnailPathRel = '';

            // === Thumbnail upload ===
            if(isset($_FILES['thumbnail']) && isset($_FILES['thumbnail']['name']) && $_FILES['thumbnail']['name'] !== ''){
                $ext = strtolower(pathinfo($_FILES['thumbnail']['name'], PATHINFO_EXTENSION)) ?: 'jpg';
                $thumbTarget = $postImagesDir . '/thumbnail.' . $ext;
                if(move_uploaded_file($_FILES['thumbnail']['tmp_name'], $thumbTarget)){
                    $thumbnailPathRel = rtrim($baseUrl, '/') . '/assets/' . $tagSlug . '/images/' . $slug . '/thumbnail.' . $ext;
                } else {
                    $errors[] = "Failed uploading thumbnail.";
                }
            }

            // === Multiple image uploads ===
            if(isset($_FILES['upload_images'])){
                $names = $_FILES['upload_images']['name'];
                $tmps = $_FILES['upload_images']['tmp_name'];
                for($i=0;$i<count($names);$i++){
                    $n = $names[$i]; $t = $tmps[$i];
                    if(empty($n) || empty($t)) continue;
                    $ext = strtolower(pathinfo($n, PATHINFO_EXTENSION)) ?: 'jpg';
                    $existingFiles = array_values(array_filter(glob($postImagesDir . '/image*')));
                    $nextIndex = count($existingFiles) + 1;
                    $imgTarget = $postImagesDir . '/image' . $nextIndex . '.' . $ext;
                    $k = 1;
                    while(file_exists($imgTarget)){
                        $k++;
                        $imgTarget = $postImagesDir . '/image' . $nextIndex . '-' . $k . '.' . $ext;
                    }
                    if(move_uploaded_file($t, $imgTarget)){
                        $uploadedImages[] = rtrim($baseUrl, '/') . '/assets/' . $tagSlug . '/images/' . $slug . '/' . basename($imgTarget);
                    } else {
                        $errors[] = "Failed uploading image: $n";
                    }
                }
            }

            // === Use first image as thumbnail if none uploaded ===
            if($thumbnailPathRel === '' && count($uploadedImages) > 0){
                $firstImgAbs = $baseDir . '/' . str_replace($baseUrl . '/', '', $uploadedImages[0]);
                $ext = strtolower(pathinfo($firstImgAbs, PATHINFO_EXTENSION));
                $thumbTargetAbs = $postImagesDir . '/thumbnail.' . $ext;
                if(@copy($firstImgAbs, $thumbTargetAbs)){
                    $thumbnailPathRel = rtrim($baseUrl, '/') . '/assets/' . $tagSlug . '/images/' . $slug . '/thumbnail.' . $ext;
                } else {
                    $thumbnailPathRel = $uploadedImages[0];
                }
            }

            // === Image URLs (external or manual) ===
            foreach($imagesUrlList as $url){
                if($url === '') continue;
                if(!preg_match('#^https?://#', $url)){
                    $url = rtrim($baseUrl, '/') . '/' . ltrim($url, '/');
                }
                $uploadedImages[] = str_replace(' ', '-', $url);
            }

            
            $imagesHTML = buildImagesHTML($uploadedImages);

            // Build post HTML
            $postFileName = $slug . '.html';
            $postFilePath = $postPostsDir . '/' . $postFileName;
            $displayDate = htmlspecialchars($date);
            $displayTime = htmlspecialchars($time);
            $displayLocation = htmlspecialchars($location);
            $displayTitle = htmlspecialchars($title);
            $displayBio = nl2br(htmlspecialchars($bio));
            $displayContent = $content;

            // ** New Footer Variables **
            $displayProjectName = htmlspecialchars($tag); // The Project Name

            // === BUILD POST FROM TEMPLATE FILE ===
            $postHTML = buildPostFromTemplate(__DIR__ . '/post.html', [
                'TITLE'        => $displayTitle,
                'PROJECT_NAME' => $displayProjectName,
                'DATE'         => $displayDate,
                'TIME'         => $displayTime,
                'LOCATION'     => $displayLocation,
                'BIO'          => $displayBio,
                'CONTENT'      => $displayContent,
                'IMAGES'       => $imagesHTML,
            ]);
            // === END BUILD FROM TEMPLATE 2/2 ===

            if(file_put_contents($postFilePath, $postHTML)){
                $postsArr[] = [
                    "tag" => $tag,
                    "title" => $title,
                    "date" => $date . ' ' . $time,
                    "thumbnail" => $thumbnailPathRel ?: ($uploadedImages[0] ?? ''),
                    "file" => rtrim($baseUrl, '/') . '/assets/' . $tagSlug . '/posts/' . $postFileName,
                    "desc" => $bio,
                    "location" => $location
                ];
                file_put_contents($jsonFile, json_encode($postsArr, JSON_PRETTY_PRINT));
                $message = "✅ Post created successfully: " . rtrim($baseUrl, '/') . "/assets/{$tagSlug}/posts/{$postFileName}";
                if(isAjaxReq()) ajaxOk($message, ['created'=>true]);
                header("Location: " . $_SERVER['PHP_SELF'] . "?msg=" . urlencode($message));
                exit;
            } else {
                $errors[] = "Failed writing post file.";
            }
        } // end create
    } // end if no errors
} // end POST handling

// === LOAD EDIT MODE PRE-FILL from GET param ?edit=slug ===
$editData = null;
if(isset($_GET['edit']) && $_GET['edit'] !== ''){
    $slugEdit = $_GET['edit'];

    $idx = findPostIndexBySlug($postsArr, $slugEdit);
    if($idx !== false){
        $p = $postsArr[$idx];
        $editData = $p;

        // Get tag from JSON or URL (if editing an older post)
        $tagEdit = $p['tag'] ?? (isset($_GET['tag']) ? $_GET['tag'] : 'default');
        $tagSlug = slugify($tagEdit);

        $editData['tag'] = $tagEdit;
        $editData['orig_tag_slug'] = $tagSlug;

        // read HTML to get bio and content if available
        $htmlPath = $projectBaseDir . '/' . $tagSlug . '/posts/' . $slugEdit . '.html';
        if(file_exists($htmlPath)){
            $html = file_get_contents($htmlPath);
            if(preg_match('#<div class="bio">(.*?)</div>#is', $html, $m)) {
                $bioRaw = strip_tags($m[1], '<br><br/>');
                $bioRaw = str_replace(['<br/>','<br>'], "\n", $bioRaw);
                $editData['desc'] = trim($bioRaw);
            }
            if(preg_match('#<div class="content">(.*?)</div>#is', $html, $m2)){
                $editData['content'] = trim($m2[1]);
            } else {
                $editData['content'] = '';
            }
        } else {
            $editData['desc'] = $p['desc'] ?? '';
            $editData['content'] = '';
        }

        // load images list & thumbnail from folder
        $editData['images_list'] = getImagesForSlug($projectBaseDir, $tagSlug, $slugEdit, $baseUrl);
        $editData['thumbnail'] = $p['thumbnail'] ?? '';
    }
}

// If there's saved form_data in session and we're NOT in edit mode, prefill form with that
$formData = [
    'title' => '',
    'date' => date('Y-m-d'),
    'time' => date('H:i'),
    'location' => $locationDefault,
    'bio' => '',
    'content' => '',
    'images' => '',
    'tag' => '' // NEW
];
if(!isset($editData) || $editData === null){
    if(isset($_SESSION['form_data']) && is_array($_SESSION['form_data'])){
        $sd = $_SESSION['form_data'];
        $formData = array_merge($formData, $sd);
    }
}

// Load any message from GET (after PRG)
if(isset($_GET['msg'])) $message = htmlspecialchars($_GET['msg']);

// Load projects list for the dropdown
$projectsList = [];
foreach($projectsArr as $p){
    $projectsList[slugify($p['name'])] = $p['name'];
}
$currentTag = htmlspecialchars($editData['tag'] ?? ($formData['tag'] ?? ''));
$currentTagSlug = slugify($currentTag);

// Start HTML output
if(isAjaxReq() && count($errors)>0) ajaxFail($errors);
?>

<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>Projects CMS — Mahdi Yasser</title>
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Syne:wght@400;600;700;800&family=JetBrains+Mono:wght@300;400;600&display=swap" rel="stylesheet">
<link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.5.1/css/all.min.css">
<link rel="stylesheet" href="cms.css">
</head>
<body>

<div id="app">

    <!-- ======================================================
         SIDEBAR
         ====================================================== -->
    <aside class="sidebar">
        <div class="sidebar-top">
            <div class="sidebar-logo">
                <span class="sidebar-logo-text">CMS</span>
                <span class="sidebar-logo-badge">v11</span>
            </div>
            <nav class="sidebar-nav">
                <button class="snav-item active" data-tab="post-form">
                    <i class="fa-solid fa-pen-nib"></i>
                    <span><?php echo isset($_GET['edit']) ? 'Edit Post' : 'New Post'; ?></span>
                </button>
                <button class="snav-item" data-tab="posts-list">
                    <i class="fa-solid fa-list"></i>
                    <span>All Posts</span>
                </button>
                <button class="snav-item" data-tab="projects">
                    <i class="fa-solid fa-folder-tree"></i>
                    <span>Projects</span>
                </button>
            </nav>
        </div>
        <div class="sidebar-bottom">
            <a href="/" class="sidebar-home-link">
                <i class="fa-solid fa-arrow-left"></i>
                <span>Back to site</span>
            </a>
        </div>
    </aside>

    <!-- ======================================================
         MAIN CONTENT
         ====================================================== -->
    <main class="main">

        <!-- FLASH MESSAGES -->
        <?php if(count($errors) > 0): ?>
        <div class="flash flash-error">
            <i class="fa-solid fa-circle-exclamation"></i>
            <div>
                <strong>Errors</strong>
                <ul><?php foreach($errors as $e) echo '<li>'.htmlspecialchars($e).'</li>'; ?></ul>
            </div>
        </div>
        <?php elseif($message !== ''): ?>
        <div class="flash flash-success">
            <i class="fa-solid fa-circle-check"></i>
            <span><?php echo htmlspecialchars($message); ?></span>
        </div>
        <?php endif; ?>

        <!-- ====================================================
             TAB: POST FORM (new / edit)
             ==================================================== -->
        <section class="tab-panel active" id="tab-post-form">

            <div class="panel-header">
                <div class="panel-header-left">
                    <p class="panel-label" id="post-form-label">
                        <i class="fa-solid <?php echo $editData ? 'fa-pen' : 'fa-pen-nib'; ?>"></i>
                        <?php echo $editData ? 'Editing Post' : 'Create Post'; ?>
                    </p>
                    <h2 class="panel-title" id="post-form-title">
                        <?php echo $editData ? htmlspecialchars($editData['title']) : 'New Post'; ?>
                    </h2>
                </div>
                <button type="button" id="cancel-edit-btn" class="btn btn-ghost btn-sm"
                        onclick="cancelEditPost()"
                        style="<?php echo $editData ? '' : 'display:none'; ?>">
                    <i class="fa-solid fa-xmark"></i> Cancel Edit
                </button>
            </div>

            <form method="POST" enctype="multipart/form-data" id="postForm">
                <input type="hidden" name="_ajax" value="1">
                <input type="hidden" name="edit_slug" id="edit_slug"
                       value="<?php echo $editData ? htmlspecialchars(pathinfo($editData['file'], PATHINFO_FILENAME)) : ''; ?>">
                <input type="hidden" name="orig_tag_slug" id="orig_tag_slug_hidden"
                       value="<?php echo $editData ? htmlspecialchars($editData['orig_tag_slug'] ?? $currentTagSlug) : ''; ?>">

                <div class="form-card">
                    <div class="form-card-title"><i class="fa-solid fa-circle-info"></i> Basic Info</div>

                    <div class="form-field">
                        <label for="f-title">Post Title</label>
                        <input type="text" id="f-title" name="title" required
                               placeholder="My amazing post title"
                               value="<?php echo htmlspecialchars($editData['title'] ?? $formData['title']); ?>">
                    </div>

                    <div class="form-field">
                        <label for="tag_select">Project</label>
                        <select name="tag_select" id="tag_select"
                                onchange="(function(s){ var ti=document.getElementById('tag_new'); ti.style.display=(s.value==='new'||s.value==='')?'block':'none'; if(s.value!=='new'&&s.value!=='') ti.value=''; })(this)">
                            <option value="">— Select Existing Project —</option>
                            <?php foreach($projectsList as $slug => $name): ?>
                                <option value="<?php echo htmlspecialchars($slug); ?>" <?php if($currentTagSlug===$slug) echo 'selected'; ?>>
                                    <?php echo htmlspecialchars($name); ?>
                                </option>
                            <?php endforeach; ?>
                            <option value="new" <?php if($currentTag===''||(!empty($currentTag)&&!isset($projectsList[$currentTagSlug]))) echo 'selected'; ?>>— New Project —</option>
                        </select>
                        <input type="text" name="tag_new" id="tag_new"
                               placeholder="Type new project name"
                               value="<?php echo htmlspecialchars($currentTag); ?>"
                               style="margin-top:8px;<?php if($currentTag===''||!isset($projectsList[$currentTagSlug])) echo 'display:block;'; else echo 'display:none;'; ?>">
                        <input type="hidden" name="tag_hidden" id="tag_hidden" value="<?php echo htmlspecialchars($currentTag); ?>">
                    </div>

                    <script>
                    document.addEventListener('DOMContentLoaded',function(){
                        var sel=document.getElementById('tag_select');
                        var ti=document.getElementById('tag_new');
                        if(sel.value&&sel.value!=='new'&&sel.value!=='') ti.style.display='none';
                        else ti.style.display='block';
                        document.getElementById('postForm').addEventListener('submit',function(){
                            var h=document.getElementById('tag_hidden');
                            if(sel.value==='new'||sel.value==='') h.value=ti.value;
                            else h.value=sel.options[sel.selectedIndex].text;
                        });
                    });
                    </script>

                    <div class="form-row-2">
                        <div class="form-field">
                            <label for="f-date">Date</label>
                            <input type="date" id="f-date" name="date" required
                                   value="<?php echo htmlspecialchars($editData['date'] ? explode(' ',$editData['date'])[0] : $formData['date']); ?>">
                        </div>
                        <div class="form-field">
                            <label for="f-time">Time</label>
                            <input type="time" id="f-time" name="time" required
                                   value="<?php echo htmlspecialchars($editData['date'] ? (explode(' ',$editData['date'])[1]??$formData['time']) : $formData['time']); ?>">
                        </div>
                    </div>

                    <div class="form-field">
                        <label for="f-location">Location</label>
                        <input type="text" id="f-location" name="location" required
                               placeholder="e.g. Hosh Issa, Beheira, Egypt"
                               value="<?php echo htmlspecialchars($editData['location']??$formData['location']); ?>">
                    </div>
                </div>

                <div class="form-card">
                    <div class="form-card-title"><i class="fa-solid fa-align-left"></i> Content</div>

                    <div class="form-field">
                        <label for="f-bio">Summary / Bio <span class="field-hint">Shown as the italic intro quote</span></label>
                        <textarea id="f-bio" name="bio" rows="3" required
                                  placeholder="Short summary displayed as the intro quote on the post"><?php echo htmlspecialchars($editData['desc']??$formData['bio']); ?></textarea>
                    </div>

                    <div class="form-field">
                        <label for="f-content">Post Content <span class="field-hint">HTML allowed</span></label>
                        <textarea id="f-content" name="content" rows="10"
                                  placeholder="Full post body — HTML tags are supported"><?php echo htmlspecialchars($editData['content']??$formData['content']); ?></textarea>
                    </div>
                </div>

                <div class="form-card">
                    <div class="form-card-title"><i class="fa-solid fa-images"></i> Media</div>

                    <!-- JS populates this when loading an edit via AJAX; PHP pre-populates on server-side edit load -->
                    <div id="edit-media-section">
                    <?php if(isset($editData) && $editData !== null): ?>
                        <div class="media-subsection">
                            <p class="media-sub-label">Current Thumbnail</p>
                            <?php if(!empty($editData['thumbnail'])): ?>
                                <div class="thumb-wrap">
                                    <img src="<?php echo htmlspecialchars($editData['thumbnail']); ?>" class="thumb-preview" alt="thumbnail">
                                    <label class="delete-toggle">
                                        <input type="checkbox" name="delete_thumbnail" value="1">
                                        Delete this thumbnail
                                    </label>
                                </div>
                            <?php else: ?>
                                <p class="no-media-msg">No thumbnail set</p>
                            <?php endif; ?>
                        </div>

                        <?php if(!empty($editData['images_list'])): ?>
                        <div class="media-subsection">
                            <p class="media-sub-label">Existing Images <span class="field-hint">Check to delete</span></p>
                            <div class="images-preview">
                                <?php foreach($editData['images_list'] as $img):?>
                                    <div class="img-item">
                                        <img src="<?php echo htmlspecialchars($img); ?>" alt="">
                                        <label class="delete-check">
                                            <input type="checkbox" name="delete_images[]" value="<?php echo htmlspecialchars($img); ?>">
                                            Delete
                                        </label>
                                    </div>
                                <?php endforeach; ?>
                            </div>
                        </div>
                        <?php else: ?>
                        <p class="no-media-msg">No images uploaded yet</p>
                        <?php endif; ?>
                    <?php endif; ?>
                    </div><!-- /#edit-media-section -->

                    <div class="form-row-2">
                        <div class="form-field">
                            <label>Upload Thumbnail</label>
                            <input type="file" name="thumbnail" accept="image/*">
                        </div>
                        <div class="form-field">
                            <label>Upload Images <span class="field-hint">Multiple</span></label>
                            <input type="file" name="upload_images[]" accept="image/*" multiple>
                        </div>
                    </div>

                    <div class="form-field">
                        <label>Image URLs <span class="field-hint">Optional, comma separated</span></label>
                        <input type="text" name="images" placeholder="/projects/assets/...jpg, https://..."
                               value="<?php echo htmlspecialchars($formData['images']??''); ?>">
                    </div>
                </div>

                <div class="form-actions">
                    <button type="submit" id="post-submit-btn" class="btn btn-primary">
                        <i class="fa-solid <?php echo $editData ? 'fa-floppy-disk' : 'fa-plus'; ?>"></i>
                        <?php echo $editData ? 'Update Post' : 'Create Post'; ?>
                    </button>
                    <button type="button" class="btn btn-ghost" onclick="clearForm()">
                        <i class="fa-solid fa-rotate-left"></i>
                        Clear Form
                    </button>
                </div>
            </form>
        </section>

        <!-- ====================================================
             TAB: ALL POSTS
             ==================================================== -->
        <section class="tab-panel" id="tab-posts-list">
            <div class="panel-header">
                <div class="panel-header-left">
                    <p class="panel-label"><i class="fa-solid fa-list"></i> Posts</p>
                    <h2 class="panel-title">All Posts</h2>
                </div>
            </div>
            <?php
            $postsArrDisplay = json_decode(file_get_contents($jsonFile), true);
            if(is_array($postsArrDisplay) && count($postsArrDisplay) > 0):
                $grouped = [];
                foreach($postsArrDisplay as $p){
                    $t = $p['tag'] ?? 'Untagged';
                    $grouped[$t][] = $p;
                }
                foreach($grouped as $gTag => $gposts):
            ?>
                <div class="posts-group">
                    <div class="posts-group-label">
                        <i class="fa-solid fa-folder"></i>
                        <?php echo htmlspecialchars($gTag); ?>
                        <span class="posts-group-count"><?php echo count($gposts); ?></span>
                    </div>
                    <div class="posts-table">
                        <?php foreach($gposts as $p):
                            $slug    = pathinfo($p['file'], PATHINFO_FILENAME);
                            $ptag    = htmlspecialchars($p['tag']??'Untagged');
                            $tslug   = slugify($p['tag']??'Untagged');
                            $ptitle  = htmlspecialchars($p['title']);
                            $pdate   = htmlspecialchars($p['date']??'');
                        ?>
                        <div class="post-row" id="post-<?php echo $slug; ?>">
                            <div class="post-row-info">
                                <?php if(!empty($p['thumbnail'])): ?>
                                    <img src="<?php echo htmlspecialchars($p['thumbnail']); ?>" class="post-row-thumb" alt="">
                                <?php else: ?>
                                    <div class="post-row-thumb post-row-thumb-empty"><i class="fa-solid fa-image"></i></div>
                                <?php endif; ?>
                                <div class="post-row-text">
                                    <span class="post-row-title"><?php echo $ptitle; ?></span>
                                    <span class="post-row-date"><i class="fa-solid fa-calendar-days"></i> <?php echo $pdate; ?></span>
                                </div>
                            </div>
                            <div class="post-row-actions">
                                <button type="button" class="btn btn-sm btn-accent"
                                        onclick="loadEditPost('<?php echo $slug; ?>', '<?php echo addslashes($ptag); ?>')">
                                    <i class="fa-solid fa-pen"></i> Edit
                                </button>
                                <form method="POST" style="display:inline;" class="delete-post-form" data-title="<?php echo addslashes($ptitle); ?>" data-row-id="post-<?php echo $slug; ?>">
                                    <input type="hidden" name="_ajax" value="1">
                                    <input type="hidden" name="delete_post" value="<?php echo $slug; ?>">
                                    <input type="hidden" name="delete_tag_slug" value="<?php echo $tslug; ?>">
                                    <button type="submit" class="btn btn-sm btn-danger">
                                        <i class="fa-solid fa-trash"></i> Delete
                                    </button>
                                </form>
                            </div>
                        </div>
                        <?php endforeach; ?>
                    </div>
                </div>
            <?php
                endforeach;
            else:
                echo '<div class="empty-state"><i class="fa-solid fa-inbox"></i><p>No posts yet. Create your first one!</p></div>';
            endif;
            ?>
        </section>

        <!-- ====================================================
             TAB: PROJECT MANAGEMENT
             ==================================================== -->
        <section class="tab-panel" id="tab-projects">
            <?php
            $projectEditData = null;
            if(isset($_GET['edit_project']) && $_GET['edit_project'] !== ''){
                $slugEdit = $_GET['edit_project'];
                $idx = findProjectIndexBySlug($projectsArr, $slugEdit);
                if($idx !== false){
                    $p = $projectsArr[$idx];
                    $projectEditData = $p;
                    $projectEditData['thumbnail'] = getProjectThumbnailPath($projectBaseDir, $slugEdit, $baseUrl);
                }
            }
            $pFormData = ['name'=>'','bio'=>''];
            if($projectEditData){ $pFormData['name']=$projectEditData['name']; $pFormData['bio']=$projectEditData['bio']; }
            ?>
            <div class="panel-header">
                <div class="panel-header-left">
                    <p class="panel-label"><i class="fa-solid fa-folder-tree"></i> Projects</p>
                    <h2 class="panel-title"><?php echo $projectEditData ? 'Edit Project' : 'Manage Projects'; ?></h2>
                </div>
            </div>

            <form method="POST" enctype="multipart/form-data" id="projectForm">
                <input type="hidden" name="_ajax" value="1">
                <input type="hidden" name="project_action" value="save">
                <input type="hidden" id="project_edit_slug" value="">
                <div class="form-card">
                    <div class="form-card-title" id="project-form-card-title">
                        <i class="fa-solid <?php echo $projectEditData ? 'fa-pen' : 'fa-plus'; ?>"></i>
                        <?php echo $projectEditData ? 'Edit: '.htmlspecialchars($projectEditData['name']) : 'Create New Project'; ?>
                    </div>

                    <div class="form-field">
                        <label for="p-name">Project Name</label>
                        <input type="text" id="p-name" name="project_name" required
                               placeholder="My Amazing Project"
                               value="<?php echo htmlspecialchars($pFormData['name']); ?>">
                    </div>

                    <div class="form-field">
                        <label for="p-bio">Bio / Summary</label>
                        <textarea id="p-bio" name="project_bio" rows="2" required
                                  placeholder="Short description"><?php echo htmlspecialchars($pFormData['bio']); ?></textarea>
                    </div>

                    <!-- JS or server-side populates this for edit mode -->
                    <div id="project-thumb-section">
                    <?php if(isset($projectEditData) && $projectEditData !== null && !empty($projectEditData['thumbnail'])): ?>
                        <div class="media-subsection">
                            <p class="media-sub-label">Current Thumbnail</p>
                            <div class="thumb-wrap">
                                <img src="<?php echo htmlspecialchars($projectEditData['thumbnail']); ?>" class="thumb-preview" alt="">
                                <label class="delete-toggle">
                                    <input type="checkbox" name="delete_thumbnail" value="1">
                                    Delete this thumbnail
                                </label>
                            </div>
                        </div>
                    <?php endif; ?>
                    </div><!-- /#project-thumb-section -->

                    <div class="form-field">
                        <label>Project Thumbnail</label>
                        <input type="file" name="project_thumbnail" accept="image/*">
                    </div>

                    <div class="form-actions">
                        <button type="submit" id="project-submit-btn" class="btn btn-primary">
                            <i class="fa-solid <?php echo $projectEditData ? 'fa-floppy-disk' : 'fa-plus'; ?>"></i>
                            <?php echo $projectEditData ? 'Update Project' : 'Create Project'; ?>
                        </button>
                        <button type="button" id="cancel-project-btn" class="btn btn-ghost"
                                onclick="cancelEditProject()"
                                style="<?php echo $projectEditData ? '' : 'display:none'; ?>">
                            <i class="fa-solid fa-xmark"></i> Cancel
                        </button>
                    </div>
                </div>
            </form>

            <?php
            $projectsArr = json_decode(file_get_contents($projectsJsonFile), true);
            $postsCount  = json_decode(file_get_contents($jsonFile), true) ?? [];
            if(is_array($projectsArr) && count($projectsArr) > 0):
            ?>
            <div class="projects-grid">
                <?php foreach($projectsArr as $p):
                    $ptag   = htmlspecialchars($p['name']);
                    $pslug  = slugify($p['name']);
                    $pthumb = getProjectThumbnailPath($projectBaseDir, $pslug, $baseUrl);
                    $pcount = count(array_filter($postsCount, function($post) use ($ptag){ return ($post['tag']??'') === $ptag; }));
                ?>
                <div class="project-card-cms" id="proj-<?php echo $pslug; ?>">
                    <?php if($pthumb): ?>
                        <div class="project-card-cms-img">
                            <img src="<?php echo htmlspecialchars($pthumb); ?>" alt="">
                        </div>
                    <?php else: ?>
                        <div class="project-card-cms-img project-card-cms-img-empty">
                            <i class="fa-solid fa-folder"></i>
                        </div>
                    <?php endif; ?>
                    <div class="project-card-cms-body">
                        <span class="project-card-cms-name"><?php echo $ptag; ?></span>
                        <span class="project-card-cms-count"><?php echo $pcount; ?> post<?php echo $pcount!==1?'s':''; ?></span>
                        <p class="project-card-cms-bio"><?php echo htmlspecialchars($p['bio']); ?></p>
                    </div>
                    <div class="project-card-cms-actions">
                        <button type="button" class="btn btn-sm btn-accent"
                                onclick="loadEditProject('<?php echo $pslug; ?>')">
                            <i class="fa-solid fa-pen"></i> Edit
                        </button>
                        <form method="POST" class="delete-project-form" data-title="<?php echo addslashes($ptag); ?>" data-card-id="proj-<?php echo $pslug; ?>">
                            <input type="hidden" name="_ajax" value="1">
                            <input type="hidden" name="project_action" value="delete">
                            <input type="hidden" name="project_name" value="<?php echo $ptag; ?>">
                            <button type="submit" class="btn btn-sm btn-danger">
                                <i class="fa-solid fa-trash"></i> Delete
                            </button>
                        </form>
                    </div>
                </div>
                <?php endforeach; ?>
            </div>
            <?php else: ?>
            <div class="empty-state">
                <i class="fa-solid fa-folder-open"></i>
                <p>No projects yet.</p>
            </div>
            <?php endif; ?>
        </section>

    </main>
</div>

<script src="cms.js"></script>
</body>
</html>
