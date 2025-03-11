define([
    'skbJet/component/gameMsgBus/GameMsgBus',
    'skbJet/component/howlerAudioPlayer/howlerAudioSpritePlayer',
    'skbJet/component/gladPixiRenderer/gladPixiRenderer',
    'skbJet/component/pixiResourceLoader/pixiResourceLoader',
    'skbJet/componentCRDC/gladRenderer/gladButton',
    'skbJet/component/SKBeInstant/SKBeInstant',
    'skbJet/componentCRDC/IwGameControllers/gameUtils',
    'game/tutorialController',
    'game/configController'
], function(msgBus, audio, gr, loader, gladButton, SKBeInstant, gameUtils, tutorial, config) {
    var scaleType;
    var continueButton, warningExitButton, errorExitButton, winBoxErrorButton;
    var resultPlaque = null;
    var showWarn = false;
    var warnMessage = null;
    var inGame = false;
    var gameError = false;
    var hasWin = false;
    var sessionShown = false;
    
    function onGameParametersUpdated() {
        scaleType = { 'scaleXWhenClick': 0.92, 'scaleYWhenClick': 0.92, 'avoidMultiTouch': true };
        continueButton = new gladButton(gr.lib._warningContinueButton, config.gladButtonImgName.warningContinueButton, scaleType);
        warningExitButton = new gladButton(gr.lib._warningExitButton, config.gladButtonImgName.warningExitButton, scaleType);
        errorExitButton = new gladButton(gr.lib._errorExitButton, config.gladButtonImgName.errorExitButton, scaleType);
		winBoxErrorButton = new gladButton(gr.lib._winBoxErrorExitButton, config.gladButtonImgName.warningExitButton, scaleType);
        if (gr.lib._warningAndError){
            gr.lib._warningAndError.show(false);
        }       
        if (config.style.warningExitText) {
            gameUtils.setTextStyle(gr.lib._warningExitText, config.style.warningExitText);
        }
        if (config.textAutoFit.warningExitText) {
            gr.lib._warningExitText.autoFontFitText = config.textAutoFit.warningExitText.isAutoFit;
        }

        gr.lib._warningExitText.setText(loader.i18n.Game.warning_button_exitGame);
        if (config.style.warningContinueText) {
            gameUtils.setTextStyle(gr.lib._warningContinueText, config.style.warningContinueText);
        }
        if (config.textAutoFit.warningContinueText) {
            gr.lib._warningContinueText.autoFontFitText = config.textAutoFit.warningContinueText.isAutoFit;
        }
        gr.lib._warningContinueText.setText(loader.i18n.Game.warning_button_continue);
        if (config.style.warningText) {
            gameUtils.setTextStyle(gr.lib._warningText, config.style.warningText);
        }
        if (config.textAutoFit.warningText) {
            gr.lib._warningText.autoFontFitText = config.textAutoFit.warningText.isAutoFit;
        }
        if (config.dropShadow) {
            gameUtils.setTextStyle(gr.lib._warningContinueText, {
                padding: config.dropShadow.padding,
                dropShadow: config.dropShadow.dropShadow,
                dropShadowDistance: config.dropShadow.dropShadowDistance
            });
            gameUtils.setTextStyle(gr.lib._warningExitText, {
                padding: config.dropShadow.padding,
                dropShadow: config.dropShadow.dropShadow,
                dropShadowDistance: config.dropShadow.dropShadowDistance
            });
        }
        if (config.style.errorExitText) {
            gameUtils.setTextStyle(gr.lib._errorExitText, config.style.errorExitText);
            gameUtils.setTextStyle(gr.lib._winBoxErrorExitText, config.style.errorExitText);
        }
        if (config.textAutoFit.errorExitText) {
            gr.lib._errorExitText.autoFontFitText = config.textAutoFit.errorExitText.isAutoFit;
            gr.lib._winBoxErrorExitText.autoFontFitText = config.textAutoFit.errorExitText.isAutoFit;
        }
        gr.lib._errorExitText.setText(loader.i18n.Game.error_button_exit);
        gr.lib._errorTitle.show(true);
        if (config.style.errorTitle) {
            gameUtils.setTextStyle(gr.lib._errorTitle, config.style.errorTitles);
        }
        if (config.textAutoFit.errorTitle) {
            gr.lib._errorTitle.autoFontFitText = config.textAutoFit.errorTitle.isAutoFit;
        }
        gr.lib._errorTitle.setText(loader.i18n.Game.error_title);
        if (config.style.errorText) {
            gameUtils.setTextStyle(gr.lib._errorText, config.style.errorText);
        }
        if (config.textAutoFit.errorText) {
            gr.lib._errorText.autoFontFitText = config.textAutoFit.errorText.isAutoFit;
        }
        if (config.dropShadow) {
            gameUtils.setTextStyle(gr.lib._errorExitText, {
                padding: config.dropShadow.padding,
                dropShadow: config.dropShadow.dropShadow,
                dropShadowDistance: config.dropShadow.dropShadowDistance
            });
        }

        if(gr.lib._winBoxError){
            gr.lib._winBoxError.show(false);
        }
        errorExitButton.click(function() {
            msgBus.publish('jLotteryGame.playerWantsToExit');
            audio.play("UiClick", 9);
        });
        continueButton.click(closeErrorWarn);
        warningExitButton.click(function() {
            msgBus.publish('jLotteryGame.playerWantsToExit');
            audio.play("UiClick", 9);
        });
		// Add win Box feature for fixing bug of this game
		// 1 Dece 2020
		//gr.lib._winBoxErrorText.setText(loader.i18n.Error.error29000);
		gr.lib._winBoxErrorExitText.setText(loader.i18n.Game.error_button_exit);  
		winBoxErrorButton.click(function() {
            msgBus.publish('jLotteryGame.playerWantsToExit');
            audio.play("UiClick", 9);
        });
    }

    function onWarn(warning) {
        if (gr.lib._warningAndError){
            gr.lib._warningAndError.show(true);
        }
        
        gr.lib._buttonInfo.show(false);
        gr.lib._BG_dim.show(true);      
        if (tutorial.getTutorialVisible()) {
            gr.lib._tutorial.show(false);
        }
        
        if(gr.lib._MessagePlaque){ 
            if(gr.lib._MessagePlaque.pixiContainer.visible){
                resultPlaque = true;
                gr.lib._MessagePlaque.show(false);
            }else{
                resultPlaque = false;
            }
        }

        msgBus.publish('tutorialIsShown');
        gr.lib._errorText.show(false);
        gr.lib._warningText.show(true);
        gr.lib._warningText.setText(warning.warningMessage);
        gr.lib._warningExitButton.show(true);
        gr.lib._warningContinueButton.show(true);
        gr.lib._errorExitButton.show(false);

        gr.lib._errorTitle.show(false);

    }

    function closeErrorWarn() {
        if (gr.lib._warningAndError){
            gr.lib._warningAndError.show(false);
        }
        
        if (tutorial.getTutorialVisible() || resultPlaque) {
            if (tutorial.getTutorialVisible()) {
                gr.lib._tutorial.show(true);
            }else{
                gr.lib._MessagePlaque.show(true);
                resultPlaque = false;
                msgBus.publish('tutorialIsHide');
            }
        } else {
            gr.lib._BG_dim.show(false);
            msgBus.publish('tutorialIsHide');
        }
        audio.play("UiClick", 9);
        if(gameError){
            gameError = false;
        }
    }

    function destroyBypassGameExit(){
        var targetDiv = document.getElementById(SKBeInstant.config.targetDivId);
		if (targetDiv){
           targetDiv.innerHTML = "";
           targetDiv.style.background = '';
           targetDiv.style.backgroundSize = '';
           targetDiv.style.webkitUserSelect = '';
           targetDiv.style.webkitTapHighlightColor = '';
        }
        //clear require cache
        if (window.loadedRequireArray) {
            for (var i = window.loadedRequireArray.length - 1; i >= 0; i--) {
                requirejs.undef(window.loadedRequireArray[i]);
            }
        }
    }

    function onError(error) {
        gameError = true;
        if (gr.lib._warningAndError){
            gr.lib._warningAndError.show(true);
        }
        gr.lib._errorTitle.show(true);
        gr.lib._buttonInfo.show(false);
        gr.lib._BG_dim.show(true);      

        if (tutorial.getTutorialVisible()) {
            gr.lib._tutorial.show(false);
        }
        msgBus.publish('tutorialIsShown');

		gr.lib._warningText.show(false);
		gr.lib._errorText.show(true);
		gr.lib._errorText.setText(error.errorCode + ": " + error.errorDescriptionSpecific + "\n" + error.errorDescriptionGeneric);
        //When error happend, Sound must be silenced.
        audio.stopAllChannel();
        gr.lib._warningExitButton.show(false);
        gr.lib._warningContinueButton.show(false);
        gr.lib._errorExitButton.show(true);
        if (error.errorCode === '00000' || error.errorCode === '66605'){
            destroyBypassGameExit();
            return;
        }
    }

    function onWinBoxError(error){
		audio.stopAllChannel();
		gr.lib._BG_dim.show(true);
		msgBus.publish('tutorialIsShown');
		if(error.errorCode === '29000'){
            if (gr.lib._winBoxError) {
                gr.lib._winBoxError.show(true);
            }
			if(SKBeInstant.isSKB() && !SKBeInstant.isWLA()){
                winBoxErrorButton.show(false);
            }else{
                winBoxErrorButton.show(true);
            }
			gr.lib._winBoxErrorText.setText(error.errorCode);
			if (config.style.errorText) {
				gameUtils.setTextStyle(gr.lib._winBoxErrorText, config.style.errorText);
			}
		}
	} 

    function onRecoverAfterErrorShow(){
        if (gr.lib._warningAndError.pixiContainer.visible){
            gr.lib._warningAndError.show(false);
            if(gameError){
                gameError = false;
            }
            gr.lib._BG_dim.show(false);
            showWarn = true;
            msgBus.publish('tutorialIsHide');
        }
    }

    function onEnterResultScreenState(){
        inGame = false;
        if (showWarn) {
            showWarn = false;
            gr.getTimer().setTimeout(function () {
                onWarn(warnMessage);
                sessionShown = true;
            }, (Number(SKBeInstant.config.compulsionDelayInSeconds) + 0.3) * 1000);
        }
    }
    
    msgBus.subscribe('jLottery.reInitialize', function () {
        inGame = true;
        onRecoverAfterErrorShow();
    });
    msgBus.subscribe('SKBeInstant.gameParametersUpdated', onGameParametersUpdated);
    msgBus.subscribe('jLottery.error', onError);
    msgBus.subscribe('winboxError', onWinBoxError);
    msgBus.subscribe('playerWantsPlayAgain', function(){
        inGame = true;
        onRecoverAfterErrorShow();
    });
    msgBus.subscribe('jLottery.playingSessionTimeoutWarning', function (warning) {
        if(SKBeInstant.config.jLotteryPhase === 1 || gameError || sessionShown){
            return;
        }
        if (inGame) {
            warnMessage = warning;
            showWarn = true;
        } else {
            onWarn(warning);
        }
    });

    function onStartUserInteraction(data){
		inGame = true;// gameType is ticketReady
        hasWin = (data.playResult === 'WIN');
    }

    function onReStartUserInteraction(data){
        onStartUserInteraction(data);
    }

    function onBuyOrTryHaveClicked(){
        sessionShown = false;
    }
    
    msgBus.subscribe('jLottery.enterResultScreenState', onEnterResultScreenState);
    msgBus.subscribe('jLottery.reStartUserInteraction', onReStartUserInteraction);
    msgBus.subscribe('jLottery.startUserInteraction', onStartUserInteraction);
    msgBus.subscribe('buyOrTryHaveClicked',onBuyOrTryHaveClicked);
    
    return {};
});