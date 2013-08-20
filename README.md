### Unnamed Photography Package
Dan Tran ([@probablydan](https://twitter.com/probablydan))  
{photography|github}@dtran.org  
[dtran.org](http://dtran.org/)

#### ABOUT

This is the code powering my photography website. For years I had been frustrated with bloated full service packages (Gallery), outdated photoblog packages (Pixelpost), and paid subscription services (Flickr, Smugmug). I wanted a self-hosted solution to showcase my best work without the headaches of package maintenance or paid services that would change for worse.

My requirements were:

- **Clean, artistic presentation**: as much as I like to know about camera settings or other info, what matters is the canvas and the photo, period. Show the photo beautifully.
- **Simple collections**: no nesting, no time-based separation. It's a portfolio site - here is a set of collections, with title, description, and ordered photos (with optional captions).
- **Encourage viewing as the artist intended**: instead of album-style thumbnails, I wanted to guide people through a collection in the order I chose. So single photo view is first-class.
- **Minimal server-side dependencies**: I'm mostly talking about RDBMSes here. For my purposes, flatfiles and folder structures work just fine for the scale this photo site will become.

Typical features I found in other solutions that I did not need:

- Social integration, comment systems
- Web upload/administration
- Integration into photography workflow software (nice when working, but these ALWAYS break every release)


#### THE STACK

This project consists of two parts:

- a front-end, made up of HTML5/CSS3/JS/AJAX/jQuery files
	
 This collection of files contains all the UI/UX logic, AJAX calls to grab the collection structure, prefetching to allow smoother image browsing, keyboard navigation (thanks @umbrant), and handles persistent URLs and browser navigation correctly.

- a backend PHP generation script

 This script is run by the user once per update (after adding photos, reordering photos) to push out changes. It:
 - generates a JSON file that describes the collection/photo structure;
 - determines which photos are new and needs to have derivatives generated; and
 - generates a set for each photo via ImageMagick (original size, display size, and thumbnail size).


#### PREREQUISITES

To run this, you'll need a Web server that has the following components:

- PHP (let's say 5, but I'm sure it would be fine with older PHP)
- ImageMagick (we use `convert` to generate various resized photo derivatives)

At browser load, everything is completely client-side, so no server-side processing is needed. Just serving up the photos is all.


#### HOW TO USE

This section is going to be written someday. For now, you can infer how things work by looking at a sample source directory layout:

	s/
	-- 000-hello (an uncompleted set, reversed so new photos show up first)
	---- 01-alcatraz.jpg
	---- 02-road.jpg
	---- 03-toronto.jpg
	---- description.txt
	---- displayName.txt
	---- reverse

	-- 005-europe (a completed set, with no intention of adding items)
	---- 01-london.jpg
	---- 02-stpancras.jpg
	---- 03-paris.jpg
	---- description.txt
	---- displayName.txt

	-- 010-aliceplusbob (a photoshoot, for example, with unnamed photos and no captions)
	---- 01.jpg
	---- 02.jpg
	---- 03.jpg
	---- description.txt
	---- displayName.txt

The only hidden feature here is that (optional) captions are pulled from embedded IPTC titles in the photo.
