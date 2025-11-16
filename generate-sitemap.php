<?php
// Simple PHP Web Crawler with Basic UI
// NOTE: This is a demo-level crawler, not production secure.

function fetchPage($url) {
    $context = stream_context_create([
        'http' => [
            'method' => 'GET',
            'header' => "User-Agent: SimpleCrawler/1.0\r\n"
        ]
    ]);

    $html = @file_get_contents($url, false, $context);
    return $html ? $html : null;
}

function extractLinks($html, $baseUrl) {
    $dom = new DOMDocument();
    @$dom->loadHTML($html);

    $links = [];
    foreach ($dom->getElementsByTagName('a') as $node) {
        $href = $node->getAttribute('href');
        if (!$href) continue;

        // Basic normalization
        if (!preg_match('/^https?:\/\//', $href)) {
            $href = rtrim($baseUrl, '/') . '/' . ltrim($href, '/');
        }

        $links[] = $href;
    }

    return array_unique($links);
}
?>
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Mini PHP Crawler</title>
    <style>
        body {
            background: #0d1117;
            color: #e6edf3;
            font-family: Arial, sans-serif;
            padding: 40px;
        }
        .container {
            max-width: 600px;
            margin: 0 auto;
            background: #161b22;
            padding: 20px;
            border-radius: 10px;
            box-shadow: 0 0 10px rgba(0,0,0,0.5);
        }
        input {
            width: 100%;
            padding: 12px;
            border: none;
            border-radius: 8px;
            margin-bottom: 10px;
            background: #21262d;
            color: #fff;
        }
        button {
            width: 100%;
            padding: 12px;
            border: none;
            border-radius: 8px;
            background: #238636;
            color: #fff;
            cursor: pointer;
        }
        button:hover {
            background: #2ea043;
        }
        .result {
            margin-top: 20px;
            padding: 15px;
            background: #0d1117;
            border-radius: 8px;
        }
        a { color: #58a6ff; }
    </style>
</head>
<body>

<div class="container">
    <h2>Mini PHP Crawler</h2>
    <form method="POST">
        <input type="text" name="url" placeholder="Enter URL (https://...)" required>
        <button type="submit">Crawl</button>
    </form>

    <?php if (!empty($_POST['url'])):
        $url = $_POST['url'];
        $html = fetchPage($url);
    ?>
        <div class="result">
            <h3>Results for: <?php echo htmlspecialchars($url); ?></h3>
            <?php if (!$html): ?>
                <p>⚠️ Could not fetch page.</p>
            <?php else: ?>
                <h4>Found Links:</h4>
                <ul>
                    <?php
                        $links = extractLinks($html, $url);
                        foreach ($links as $link):
                    ?>
                        <li><a href="<?php echo $link; ?>" target="_blank"><?php echo $link; ?></a></li>
                    <?php endforeach; ?>
                </ul>
            <?php endif; ?>
        </div>
    <?php endif; ?>
</div>

</body>
</html>

