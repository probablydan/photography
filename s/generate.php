<?php

$root = "/web/sites/dtran.org/photography/";
$thumbHeight = 120;
$displayHeight = 720;


$source = $root."s/";
$dest = $root."d/";
$sourceDirs = opendir($source);

$collections = Array();

while (false !== ($entry = readdir($sourceDirs))) {
	if (filetype($entry) == "dir" && (preg_match('/^[0-9][0-9][0-9]-(.+)$/', $entry, $colBits))) {
		$collectionName = $colBits[1];
		$collection = opendir($entry);

		$collections['indexOrder'][$entry] = $collectionName;

		$destCollectionDir = $dest.$collectionName."/";	
		$destOriginalDir = $destCollectionDir."original/";
		$destDisplayDir = $destCollectionDir."display/";
		$destThumbDir = $destCollectionDir."thumb/";

		$makeSomeDirs = array($destCollectionDir, $destOriginalDir, $destDisplayDir, $destThumbDir);
		
		foreach($makeSomeDirs as $dir) {
			if (!file_exists($dir)) {
				$commands[] = "mkdir $dir";
			}
		}

		// Set up reverse flag
		$reverse = false;

		while (false !== ($photo = readdir($collection))) {
			$fullFilePath = $source.$entry."/".$photo;
			if ($photo == "description.txt") {
				$collections['collections'][$collectionName]['description'] = trim(file_get_contents($fullFilePath));
			} else if ($photo == "displayName.txt") {
				$collections['collections'][$collectionName]['displayName'] = trim(file_get_contents($fullFilePath));
			} else if ($photo == "reverse") {
				// We found the reverse file, set reverse flag
				$reverse = true;
			} else if (preg_match('/^([0-9][0-9])-?(.+)?.jpg$/', $photo, $matches)) {
				// We found a photo!
				$order = $matches[1];
				$name = $order;
				if (isset($matches[2])) {
					$name = $matches[2];
				}

				$destOriginalPath = $destOriginalDir.$name.".jpg";
				$destDisplayPath = $destDisplayDir.$name.".jpg";
				$destThumbPath = $destThumbDir.$name.".jpg";

				if (!file_exists($destOriginalPath)) {
					$commands[] = "cp $fullFilePath $destOriginalPath";
				}
				if (!file_exists($destDisplayPath)) {
					$commands[] = "convert -resize x$displayHeight $fullFilePath $destDisplayPath";
				}
				if (!file_exists($destThumbPath)) {
					$commands[] = "convert -resize x$thumbHeight $destDisplayPath $destThumbPath";
				}


				// Get caption data through IPTC
				getimagesize($fullFilePath, $info);
				$iptcData = iptcparse($info['APP13']);


				$collections['collections'][$collectionName]['indexOrder'][$order] = $name;
				if (array_key_exists('2#005', $iptcData)) {
					$collections['collections'][$collectionName]['photos'][$name]['caption'] = $iptcData['2#005'][0];
				} else {
					$collections['collections'][$collectionName]['photos'][$name]['caption'] = "";
				}
			}
		}


		closedir($collection);
		// Now sort, and reverse the collection if requested
		if ($reverse) {
			krsort($collections['collections'][$collectionName]['indexOrder']);
		} else {
			ksort($collections['collections'][$collectionName]['indexOrder']);
		}
		$collections['collections'][$collectionName]['indexOrder'] = array_values($collections['collections'][$collectionName]['indexOrder']);
	}
}
closedir($sourceDirs);

ksort($collections['indexOrder']);
$collections['indexOrder'] = array_values($collections['indexOrder']);

//print_r($collections);

$json = json_encode($collections);

echo $json."\n";

file_put_contents($dest."collections.json", $json);
foreach ($commands as $command) {
	echo "Executing $command\n";
	passthru($command);
}

?>
