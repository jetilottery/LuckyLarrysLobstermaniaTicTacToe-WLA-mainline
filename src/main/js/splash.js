define([
	'skbJet/component/resourceLoader/resourceLib',
	'skbJet/componentCRDC/splash/splashLoadController',
	'skbJet/componentCRDC/splash/splashUIController'
], function(resLib, splashLoadController, splashUIController){
	
	var progressBarDiv, progressDiv, gameImgDiv, loadDiv;
	var gameImgDivWidth, progressBarDivWidth = '628px', progressBarDivHeight = '88px';
	var softId = window.location.search.match(/&?softwareid=(\d+.\d+.\d+)?/);
	var showCopyRight = false;
	if(softId){
		if(softId[1].split('-')[2].charAt(0) !== '0'){
			showCopyRight = true;
		}
	}  

	function checkScreenMode() {
		var winW = Math.floor(Number(window.innerWidth));
		var winH = Math.floor(Number(window.innerHeight));
		return winW >= winH ? "landScape" : "portrait";
	}

	function updateLayoutRelatedByScreenMode() {
		var scaleX = 1;
		var winW = Math.floor(Number(window.innerWidth));
		if (checkScreenMode() === 'landScape') {
			loadDiv.style.backgroundImage = 'url(' + resLib.splash.landscapeLoading.src + ')';
			gameImgDivWidth = '60%';
			scaleX = (winW * 0.8) / 628;
			scaleX = scaleX > 1 ? 1 : scaleX;
			progressBarDiv.style.transform = 'scale(' +scaleX+ ',1)';
		} else {
			loadDiv.style.backgroundImage = 'url(' + resLib.splash.portraitLoading.src + ')';
			gameImgDivWidth = '80%';
			scaleX = (winW * 0.8) / 628;
			scaleX = scaleX > 1 ? 1 : scaleX;
			progressBarDiv.style.transform = 'scale(' +scaleX+ ',1)';
		}
	}

	function onLoadDone() {
		//updateLayoutRelatedByScreenMode();
		loadDiv = document.getElementById("loadDiv");
		gameImgDiv = document.getElementById("gameImgDiv");
		progressBarDiv = document.getElementById("progressBarDiv");
		progressDiv = document.getElementById("progressDiv");
		if(showCopyRight){
			var copyRightDiv = document.getElementById('copyRightDiv');
			copyRightDiv.innerHTML = resLib.i18n.splash.splashScreen.footer.shortVersion;
			copyRightDiv.style.color = '#131b4f';
		}
		gameImgDiv.style.display = 'none';
		progressBarDiv.style.display = 'none';
		progressDiv.style.display = 'none';
		
		onWindowResized();
		
		loadDiv.style.width = '100%';
		loadDiv.style.height = '100%';
		loadDiv.style.top = 0;
		loadDiv.style.left = 0;
		loadDiv.style.backgroundSize = '100% 100%';
		
		gameImgDiv.style.position = 'relative';
		gameImgDiv.style.margin = 'auto';
		gameImgDiv.style.height = '72%';
		gameImgDiv.style.backgroundSize = '90%';
		gameImgDiv.style.backgroundPosition = 'center center';
		
		progressBarDiv.style.position = 'absoulte';
		progressBarDiv.style.backgroundImage = 'url(' + resLib.splash.loadingBarBack.src + ')';
		progressBarDiv.style.marginLeft = '-314px';
		progressBarDiv.style.left= '50%';
		progressBarDiv.style.top= '72%';
		progressBarDiv.style.backgroundRepeat = 'no-repeat';

		progressDiv.style.position = 'absolute';
		progressDiv.style.marginLeft = '41px';
		progressDiv.style.top = '12px';
		progressDiv.style.backgroundImage = 'url(' + resLib.splash.loadingBarFront.src + ')';
		progressDiv.style.backgroundRepeat = 'no-repeat';
		progressDiv.style.height = '100%';
		progressDiv.style.backgroundSize = 'auto';
		
		gameImgDiv.style.display = 'block';
		progressBarDiv.style.display = 'block';
		progressDiv.style.display = 'block';

		splashUIController.onSplashLoadDone();

		window.addEventListener('resize', onWindowResized);
		window.postMessage('splashLoaded', window.location.origin);
	}

	function onWindowResized() {
		updateLayoutRelatedByScreenMode();
		loadDiv.style.width = '100%';
		loadDiv.style.height = '100%';
		loadDiv.style.top = 0;
		loadDiv.style.left = 0;
		gameImgDiv.style.width = gameImgDivWidth;
		gameImgDiv.style.height = '72%';
		progressBarDiv.style.width = progressBarDivWidth;
		progressBarDiv.style.height = progressBarDivHeight;
		progressBarDiv.style.marginLeft = '-314px';
		progressBarDiv.style.left= '50%';
		progressBarDiv.style.top= '72%';
	}
	
	function init(){
		splashUIController.init({layoutType: 'IW'});
		splashLoadController.load(onLoadDone);
	}
	init();
	return {};
});