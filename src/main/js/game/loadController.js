define([
        'com/pixijs/pixi',
		'skbJet/component/gameMsgBus/GameMsgBus',
        'skbJet/component/SKBeInstant/SKBeInstant',
        'skbJet/component/gladPixiRenderer/gladPixiRenderer',
        'skbJet/component/pixiResourceLoader/pixiResourceLoader',
        'skbJet/component/howlerAudioPlayer/HowlerAudioSubLoader',
        'skbJet/component/resourceLoader/ResourceLoader',
		'skbJet/component/resourceLoader/resourceLib',
        'skbJet/componentCRDC/splash/splashLoadController',
		'skbJet/componentManchester/webfontLoader/FontSubLoader'
    ], function(PIXI, msgBus, SKBeInstant, gr, pixiResourceLoader, HowlerAudioSubLoader, ResourceLoader, resLib, splashLoadController, FontSubLoader){
    var gameFolder;

    function startLoadGameRes(){
        if(!SKBeInstant.isSKB()){ msgBus.publish('loadController.jLotteryEnvSplashLoadDone'); }
        pixiResourceLoader.load(gameFolder+'assetPacks/'+SKBeInstant.config.assetPack, SKBeInstant.config.locale, SKBeInstant.config.siteId);
        ResourceLoader.getDefault().addSubLoader('sounds', new HowlerAudioSubLoader({type:'sounds'}));
		ResourceLoader.getDefault().addSubLoader('fonts', new FontSubLoader());
		if(SKBeInstant.isSKB()){//add heart beat to avoid load asset timeout.
			ResourceLoader.getDefault().addHeartBeat(onResourceLoadProgress);
		}
    }
    
    function onStartAssetLoading(){
        gameFolder = SKBeInstant.config.urlGameFolder;
        if(!SKBeInstant.isSKB()){
            var splashLoader = new ResourceLoader(gameFolder+'assetPacks/'+SKBeInstant.config.assetPack, SKBeInstant.config.locale, SKBeInstant.config.siteId);
            splashLoadController.loadByLoader(startLoadGameRes, splashLoader);
        }else{
            startLoadGameRes();
       }
    }
        
    function onAssetsLoadedAndGameReady(){
        var gce = SKBeInstant.getGameContainerElem();
        var orientation = SKBeInstant.getGameOrientation();
		
        var imgUrl = orientation+'BG';
		//get imgUrl from PIXI cache, or generate base64 image object from pixiResourceLoader
		var cacheImg = PIXI.utils.TextureCache[imgUrl];
		if(cacheImg&&cacheImg.baseTexture.imageUrl.match(imgUrl+'.jpg')){
			imgUrl = cacheImg.baseTexture.imageUrl;
		}else{
			imgUrl = pixiResourceLoader.getImgObj(imgUrl).src;
		}
        //avoid blank background between two background switch.
		gce.style.backgroundImage = gce.style.backgroundImage+', url('+imgUrl+')';
		setTimeout(function(){
			gce.style.backgroundImage = 'url('+imgUrl+')';
		}, 100);
        gce.style.backgroundRepeat= 'repeat';
 
        gce.innerHTML='';
        
        var gladData;
        if(orientation === "landscape"){
            gladData = window._gladLandscape;
        }else{
            gladData = window._gladPortrait;
        }
        gr.init(gladData, SKBeInstant.getGameContainerElem());
        gr.showScene('_GameScene');
        msgBus.publish('jLotteryGame.assetsLoadedAndGameReady');
    }
    
    function onResourceLoadProgress(data){
		msgBus.publish('jLotteryGame.updateLoadingProgress', {items:(data.total), current:data.current});
        
        if(data.complete){
            if(!SKBeInstant.isSKB()){
                setTimeout(onAssetsLoadedAndGameReady,500);
            }else{
                onAssetsLoadedAndGameReady();           
            }
        }
    }

    msgBus.subscribe('jLottery.startAssetLoading', onStartAssetLoading);
    msgBus.subscribe('resourceLoader.loadProgress', onResourceLoadProgress);
    return {};
});