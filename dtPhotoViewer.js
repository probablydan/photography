var state = {
	curCollectionId: null,
	curDisplayName: null,
	curPhotoName: null,
	beforePhotoName: null,
	afterPhotoName: null
};
var collections;

// We can't do anything until we have the JSON...
$.getJSON('d/collections.json', function(json) {
	collections = json;
	init();
});

if ("onhashchange" in window) { // event supported?
	window.onhashchange = function () {
		refresh();
	}
}

if ("onresize" in window) {
	var resizeTimeout;
	window.onresize = function () {
		moveFooterImmediately(0);
		clearTimeout(resizeTimeout);
		resizeTimeout = setTimeout(function() {
			calculatePlacement();
			moveImage();
			refreshFooter();
			$('#menu_info').text($(window).width() + "x" + $(window).height());
		}, 100);
	}
}

// This function requires we know about photo dimensions first
function calculatePlacement() {
	d('calculatePlacement()');
	var percentDisplayableArea = 0.90;
	var photo = $('#photo');
	var photoBox = $('#photoBox');

	var viewableHeight = $(window).height() - $('#breadcrumbContainer').outerHeight();// - $('#caption').outerHeight();
	var viewableWidth = $(window).width();

	// Determine if photo needs to be scaled
	var heightRatio = state.curPhotoHeight / viewableHeight;
	var widthRatio = state.curPhotoWidth / viewableWidth;

	var maxRatio = Math.max(heightRatio, widthRatio);
	d('Window WxH: ' + $(window).width() + 'x' + $(window).height());
	d('Viewable WxH: ' + viewableWidth + 'x' + viewableHeight);
	d('Photo WxH: ' + state.curPhotoWidth + 'x' + state.curPhotoHeight);
	d('Max set displayable: ' + percentDisplayableArea);
	d('Max photo/viewable: ' + maxRatio);
	d('Caption height: ' + $('#caption').outerHeight());
	
	var scaleTo = 1.0;

	// If needs scaling
	if (maxRatio > percentDisplayableArea) {
		scaleTo = percentDisplayableArea / maxRatio;
		d('Need to scale to: ' + scaleTo);
	}

	state.curPhotoScaledHeight = scaleTo * state.curPhotoHeight;
	
	// Don't include the caption in margin calculations
	state.curPhotoBoxMarginTop = (($(window).height() - $('#breadcrumbContainer').outerHeight() - state.curPhotoScaledHeight)/2);
	
	if (state.curPhotoCaption != "") {
		// Give the caption some space, man
		state.curPhotoScaledHeight -= $('#caption').outerHeight();
	}
}

function moveImage() {
	var photo = $('#photo');
	var photoBox = $('#photoBox');
	photo.animate({height: state.curPhotoScaledHeight + 'px'});
	photoBox.animate({marginTop: state.curPhotoBoxMarginTop + 'px'});
}

function placeImage() {
	var photo = $('#photo');
	var photoBox = $('#photoBox');
	photo.animate({height: state.curPhotoScaledHeight + 'px'}, 0);
	photoBox.animate({marginTop: state.curPhotoBoxMarginTop + 'px'}, 0);
}

function showImage() {
	var photoBox = $('#photoBox');
	photoBox.animate({opacity: '1.0'},'slow');	
}

function hideImage() {
	var photoBox = $('#photoBox');
	photoBox.animate({opacity: '0'},'fast');
}

function d(text) {
	//console.log(text);
	//var debug = $('#debug');
	//debug.append(text + '<br />');
}


// Do these things only once on page load
function init() {
	generateCollectionList();
	refresh();
}

// Do these on hash changes
function refresh() {
	populateState();
	if (state.collectionChanged) {
		generateTitleDescription();
		generateFilmstrip();
		initFooter();
	}
	changePhoto();
}


function changePhoto() {
	d('changePhoto()');
	var photo = $('#photo');
	var photoBox = $('#photoBox');
	var pDURL = getPhotoDisplayUrl(state.curCollectionId, state.curPhotoName);
	
	// Set timeout for loading hint, will be cancelled if load is fast
	var loadingHintTimeout = setTimeout(function() {
		showLoadingHint();
	}, 500);

	// Start pulling the image down now
	prefetchPhoto(pDURL);

	// Set up the callback so when previous image is faded out
	// We do the magic
	var img = new Image();
	img.onload = function() {
		// Determine image height/width
		state.curPhotoWidth = this.width;
		state.curPhotoHeight = this.height;
		d('Photo WxH:' + state.curPhotoWidth + 'x' + state.curPhotoHeight);
		
		// Now we know image dimensions
		// Determine how to center the image
		calculatePlacement();

		// Place the image immediately
		placeImage();

		// Change the DOM
		$('#photo').attr('src', pDURL);

		// Cancel/hide the loading hint
		clearTimeout(loadingHintTimeout);
		hideLoadingHint();

		// Show the image
		showImage();
	}
	
	// Change of image data needs to be while hidden
	photoBox.animate({opacity: '0'},'fast', function() {
		// Likely done by now, as we prefetched at the beginning of this call
		// Here to trigger callback
		img.src = pDURL;
		
		// Show caption
		$('#caption').text(state.curPhotoCaption);
	});


	var photoBox = $('#photoBox');

	var bPL = $('#beforePhotoLink');
	var aPL = $('#afterPhotoLink');
	bPL.hide();
	aPL.hide();

	var beforeThumbUrl = "";
	var afterThumbUrl = "";
	var beforePhotoUrl = "";
	var afterPhotoUrl = "";

	var beforeDisplayUrl = "";
	var afterDisplayUrl = "";


	if (state.beforePhotoName != null) {
		beforeThumbUrl = "d/" + state.curCollectionId + "/thumb/" + state.beforePhotoName + ".jpg";
		beforeDisplayUrl = "d/" + state.curCollectionId + "/display/" + state.beforePhotoName + ".jpg";
		beforePhotoUrl = "#/collection/" + state.curCollectionId + "/photo/" + state.beforePhotoName;
		prefetchPhoto(beforeDisplayUrl);
		bPL.attr('href', beforePhotoUrl);
		bPL.show();
	}
	if (state.afterPhotoName != null) {
		afterThumbUrl = "d/" + state.curCollectionId + "/thumb/" + state.afterPhotoName + ".jpg";
		afterDisplayUrl = "d/" + state.curCollectionId + "/display/" + state.afterPhotoName + ".jpg";
		afterPhotoUrl = "#/collection/" + state.curCollectionId + "/photo/" + state.afterPhotoName;
		prefetchPhoto(afterDisplayUrl);
		aPL.attr('href', afterPhotoUrl);
		aPL.show();

	}
	
}

function populateState() {
	// Get current collection
	var hashSplit = window.location.hash.split('/');

	var prevCollectionId = state.curCollectionId;

	if (hashSplit[0] != '#') {
		state.curCollectionId = collections.indexOrder[0];
	} else {
		state.curCollectionId = hashSplit[2];
	}

	if (prevCollectionId == state.curCollectionId) {
		state.collectionChanged = false;
	} else {
		state.collectionChanged = true;
	}
	
	var colObj = collections.collections[state.curCollectionId];

	// Get display name
	state.curDisplayName = colObj.displayName;
	// Get description
	state.curDescription = colObj.description;
	// Get current photo

	if (hashSplit[3] == null) {
		// Collection loaded, no photo
		state.curPhotoName = colObj.indexOrder[0];
	}
	else if (hashSplit[3] == 'photo') {
		// Photo requested
		state.curPhotoName = hashSplit[4];
	}

	state.curPhotoCaption = colObj.photos[state.curPhotoName].caption;
	
	setBeforeAfterPhotoNames(state.curCollectionId, state.curPhotoName);

}

function getPhotoDisplayUrl(collectionId, photoName) {
	return 'd/' + collectionId + '/display/' + photoName + '.jpg' ;

}

function generateTitleDescription() {
	// Show display name
	$('#breadcrumb').hide();
	$('#breadcrumb').text(state.curDisplayName);
	$('#breadcrumb').fadeIn();
	
	// Show description
	$('#description').hide();
	$('#description').text(state.curDescription);
	$('#description').fadeIn();
}

function setBeforeAfterPhotoNames(collectionId, photoName) {
	state.beforePhotoName = null;
	state.afterPhotoName = null;
	var indexOrder = collections.collections[collectionId].indexOrder;
	var index = $.inArray(photoName, indexOrder);
	if (index > 0) {
		state.beforePhotoName = indexOrder[index-1];
	}
	if (index < indexOrder.length - 1) {
		state.afterPhotoName = indexOrder[index+1];
	}
}

function lightswitch(percentage) {
	var i = Math.floor(0.01 * percentage * 256);
	$('body').animate({backgroundColor: 'rgb(' + i + ',' + i + ',' + i + ')'}, 250);
}



function generateFilmstrip() {
	var f = $('#filmstrip');
	f.empty();
	var indexOrder = collections.collections[state.curCollectionId].indexOrder;
	for (var i = 0; i < indexOrder.length; i++) {
		var photoThumbName = indexOrder[i];
		var photoThumbImg = $('<img>').addClass('shaded').attr('src', "d/" + state.curCollectionId + "/thumb/" + photoThumbName + ".jpg");
		var photoThumbLink = $('<a>')	.addClass('filmstripThumb')
										.attr('href', '#/collection/' + state.curCollectionId + "/photo/"+ photoThumbName)
										.append(photoThumbImg);
		f.append(photoThumbLink);
	}

}

function prefetchPhoto(url) {
	var im = new Image();
	im.src = url;
}

function generateCollectionList() {
	$('#collections > .collection').remove();
	for (var i = 0; i < collections.indexOrder.length; i++) {
		var collectionName = collections.indexOrder[i];
		var collectionDisplayName = collections.collections[collectionName].displayName;
		var collectionLink = $('<a>').attr('href', '#/collection/' + collectionName).text(collectionDisplayName);
		var collectionDiv = $('<div>').addClass('collection').append(collectionLink);
		$('#collections').append(collectionDiv);
	}
}

function showLoadingHint() {
	var loadingHint = $('#loadingHint');

	// Kick off the animation
	animateLoadingHint(0);

	// Show it!
	loadingHint.show();
}

function animateLoadingHint(index) {
	var cycleTime = 250;
	var lhOpacity = 0.3;

	// Grab the unit in question
	var curUnit = $('.lhUnit').get(index);

	// Fade in, fade out
	$(curUnit).animate({opacity: lhOpacity}, 'fast', function() {
		$(curUnit).animate({opacity: 1.0}, 'fast');
	});

	// Add a timeout to execute on the next unit
	if (index >= $('.lhUnit').size()) {	index = -1; }
	state.loadingHintAnimateTimeout = setTimeout(function() {
		animateLoadingHint(index+1);
	}, cycleTime);

}

function hideLoadingHint() {
	var loadingHint = $('#loadingHint');

	// Stop the madness!
	clearTimeout(state.loadingHintAnimateTimeout);

	// Now hide it!
	loadingHint.hide();
}
