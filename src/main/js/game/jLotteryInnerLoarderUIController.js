define([
        'skbJet/component/gameMsgBus/GameMsgBus',
        'skbJet/component/SKBeInstant/SKBeInstant',
		'skbJet/component/deviceCompatibility/windowSize',
		'skbJet/component/resourceLoader/resourceLib'
    ], function(msgBus, SKBeInstant, windowSize, resLib){
	
	var loadDiv = document.createElement('div');
	var gameImgDiv = document.createElement('div');
	var progressBarDiv = document.createElement('div');
	var progressDiv = document.createElement('div');
	var copyRightDiv = document.createElement('div');
	var orientation = 'landscape';
	var gce;
	var scaleX;

	var predefinedStyle = {
		landscape:{
			loadDiv:{
				position:'absolute',
				top:0,
				left:0,
				width:'100%',
				height:'100%',
				backgroundSize:'100% 100%'
			},
			gameImgDiv:{
				width: '60%',
				height: '70%',
				backgroundPosition:'center center',
				backgroundSize:'90%',
				backgroundRepeat:'no-repeat',
				margin:'auto'
			},
			progressBarDiv:{
				width:628,
				height:88,
				backgroundRepeat:'no-repeat',
                marginLeft:-314,
                position:'absolute',
                left:'50%'
			},
			progressDiv:{
				height:'100%',
				width:"0%",
                marginLeft:41,
                top:12,
                position:'absolute',
				backgroundRepeat:'no-repeat'
			},
			copyRightDiv:{
				width:'100%',
				textAlign:'center',
				bottom:20,
				fontSize:20,
				fontFamily: '"Roboto Condenced"',
				position:'absolute'
			}
		},
		portrait:{
			loadDiv:{
				position:'absolute',
				top:0,
				left:0,
				width:'100%',
				height:'100%',
				backgroundSize:'100% 100%'
			},
			gameImgDiv:{
				width:'80%',
				height:'72%',
				backgroundPosition:'center center',
				backgroundSize:'90%',
				backgroundRepeat:'no-repeat',
				margin:'auto'
			},
			progressBarDiv:{
				width:628,
				height:88,
				backgroundRepeat:'no-repeat',
                position:'absolute',
                marginLeft:-314,
                left:'50%'
			},
			progressDiv:{
				height:'100%',
				width:"0%",
                marginLeft:41,
                top:12,
                position:'absolute',
				backgroundRepeat:'no-repeat'
			},
			copyRightDiv:{
				width:'100%',
				textAlign:'center',
				bottom:20,
				fontSize:20,
				fontFamily: '"Roboto Condenced"',
				position:'absolute'
			}
		}
	};

	function applyStyle(elem, styleData){
		for(var s in styleData){
			if(typeof styleData[s] === 'number'){
				elem.style[s] = styleData[s]+'px';
			}else{
				elem.style[s] = styleData[s];
			}
		}
	}
	function setBgImageFromResLib(elem, imgName){
		if(resLib&&resLib.splash&&resLib.splash[imgName]){
			var bgImgUrl = resLib.splash[imgName].src;
			if(bgImgUrl){
				elem.style.backgroundImage = 'url('+bgImgUrl+')';
			}
		}
	}
	function onWindowResized(){
		var gameHeight = 0, gameWidth = 0;
		if(SKBeInstant.config.assetPack === 'desktop'){
			gameHeight = SKBeInstant.config.revealHeightToUse;
			gameWidth = SKBeInstant.config.revealWidthToUse;
		}else{
			var targetDiv = document.getElementById(SKBeInstant.config.targetDivId);
			gameWidth = targetDiv.clientWidth;
			gameHeight = targetDiv.clientHeight;
			var parentElem = targetDiv.parentElement;
			if(parentElem !== document.body){
				var parentWidth = parentElem.clientWidth;
				var parentHeight = parentElem.clientHeight;
				gameWidth = gameWidth > parentWidth ? parentWidth : gameWidth;
				gameHeight = gameHeight > parentHeight ? parentHeight : gameHeight;
			}
		}
		gce.style.width = gameWidth + 'px';
        gce.style.height = gameHeight + 'px';
		if(gameHeight>gameWidth){
			orientation = 'portrait';
			scaleX = (gameWidth * 0.8)/628;
		}else{
			orientation = 'landscape';
			scaleX = (gameWidth * 0.8)/628;
		}
		scaleX = scaleX > 1 ? 1 : scaleX;
		var pdd = predefinedStyle[orientation];
		applyStyle(loadDiv, pdd.loadDiv);
		progressBarDiv.style.transform = 'scale(' + scaleX + ', 1)';
	}
	function onSplashLoadDone(){
        if(SKBeInstant.isSKB()){
			return;
		}
        setBgImageFromResLib(gce, orientation+'Loading');
		setBgImageFromResLib(progressBarDiv, 'loadingBarBack');
		setBgImageFromResLib(progressDiv, 'loadingBarFront');
	}

	function initUI(){
		gce = SKBeInstant.getGameContainerElem();
		loadDiv.appendChild(gameImgDiv);
		loadDiv.appendChild(progressBarDiv);
		progressBarDiv.appendChild(progressDiv);
		loadDiv.appendChild(copyRightDiv);
		
		onWindowResized();
		var pdd = predefinedStyle[orientation];
		applyStyle(loadDiv, pdd.loadDiv);
		applyStyle(gameImgDiv, pdd.gameImgDiv);
		applyStyle(progressBarDiv, pdd.progressBarDiv);
		applyStyle(progressDiv, pdd.progressDiv);
		applyStyle(copyRightDiv, pdd.copyRightDiv);
		
		/*if(SKBeInstant.config.assetPack !== 'desktop'){
			window.addEventListener('resize', onWindowResized);
		}*/
		gce.style.backgroundSize = '100% 100%';
		gce.style.backgroundPosition = 'center';
		gce.style.backgroundRepeat = 'repeat';
		gce.style.position = "relative";
		gce.appendChild(loadDiv);
	}

    function onStartAssetLoading(){
		if(SKBeInstant.isSKB()){
			return;
		}
		initUI();
	}
	
	function updateLoadingProgress(data){
		if(SKBeInstant.isSKB()){
			return;
		}
		progressDiv.style.width = (data.current / data.items) * 100 + "%";
	}
	function onAssetsLoadedAndGameReady(){
		if(SKBeInstant.config.assetPack !== 'desktop'&& !SKBeInstant.isSKB()){
			window.removeEventListener('resize', onWindowResized);
		}
	}
	msgBus.subscribe('jLottery.startAssetLoading', onStartAssetLoading);
	msgBus.subscribe('jLotteryGame.updateLoadingProgress', updateLoadingProgress);
	msgBus.subscribe('jLotteryGame.assetsLoadedAndGameReady', onAssetsLoadedAndGameReady);
	msgBus.subscribe('loadController.jLotteryEnvSplashLoadDone', onSplashLoadDone);
    return {};
});