/**
 * @module game/revealAllButton
 * @description reveal all button control
 */
define([
    'skbJet/component/gameMsgBus/GameMsgBus',
    'skbJet/component/howlerAudioPlayer/howlerAudioSpritePlayer',
    'skbJet/component/gladPixiRenderer/gladPixiRenderer',
    'skbJet/component/pixiResourceLoader/pixiResourceLoader',
    'skbJet/component/SKBeInstant/SKBeInstant',
    'skbJet/componentCRDC/gladRenderer/gladButton'/*,
    'skbJet/componentCRDC/IwGameControllers/gameUtils'*/
], function (msgBus, audio, gr, loader, SKBeInstant, gladButton/*, gameUtils*/) {

    var autoPlay,stop,stopMTM;
	var tutorialVisible, resultScreen = false;
    var autoRevealEnabled;
    var lastRevealed = false;
	
    function revealAll() {
		gr.lib._buttonStop.show(true);
		msgBus.publish('disableUI');
		msgBus.publish('startRevealAll');
    }

    function stopRevealAll() {
        if(lastRevealed){return;}
        gr.lib._buttonAutoPlay.show(true);
		msgBus.publish('stopRevealAll');
        msgBus.publish('enableUI');
    }

    function onGameParametersUpdated() {
        autoPlay = new gladButton(gr.lib._buttonAutoPlay, 'buttonMeter', {'scaleXWhenClick': 0.92,'scaleYWhenClick': 0.92,'avoidMultiTouch':true});
        autoPlay.click(function () {
            gr.lib._buttonAutoPlay.show(false);
            audio.play('RevealAll',4);
            revealAll();
        });
		gr.lib._autoPlayText.autoFontFitText = true;
        var autoPlayText;
        if(SKBeInstant.isWLA()){
			autoPlayText = loader.i18n.MenuCommand.WLA.button_autoPlay;
		}else{
			autoPlayText = loader.i18n.MenuCommand.Commercial.button_autoPlay;
		}
		gr.lib._autoPlayText.setText(autoPlayText);

        stop = new gladButton(gr.lib._buttonStop, 'buttonMeter', {'scaleXWhenClick': 0.92,'scaleYWhenClick': 0.92,'avoidMultiTouch':true});
        stop.click(function () {
            gr.lib._buttonStop.show(false);
            stopRevealAll();
            audio.play('UiClick',9);
        });
		gr.lib._stopText.autoFontFitText = true;
        gr.lib._stopText.setText(loader.i18n.Game.button_stop);

        stopMTM = new gladButton(gr.lib._buttonStopMTM, 'buttonMeter', {'scaleXWhenClick': 0.92,'scaleYWhenClick': 0.92,'avoidMultiTouch':true});
        stopMTM.click(function () {
            gr.lib._buttonStopMTM.show(false);
            stopRevealAll();
            audio.play('UiClick',9);
        });
		gr.lib._stopMTMText.autoFontFitText = true;
        gr.lib._stopMTMText.setText(loader.i18n.Game.button_stop);

        gr.lib._buttonAutoPlay.show(false);
        gr.lib._buttonStop.show(false);
        gr.lib._buttonStopMTM.show(false);
		
	}

	function onStartUserInteraction(data) {
		if(!data.scenario){
			return;
		}
		resultScreen = false;
		autoRevealEnabled = SKBeInstant.config.autoRevealEnabled === false? false: true;
		if(autoRevealEnabled){
			if(!tutorialVisible){
				gr.lib._buttonAutoPlay.show(true);
			}
		}else{
			gr.lib._buttonAutoPlay.show(false);
		}
        lastRevealed = false;
    }

    function onReStartUserInteraction(data) {
        onStartUserInteraction(data);
    }

    function onReInitialize() {
		resultScreen = false;
        gr.lib._buttonAutoPlay.show(false);
		gr.lib._buttonStop.show(false);
    }

    function onReset() {
        onReInitialize();
    }
    
    function onEnterResultScreenState(){
		resultScreen = true;
    }
    function onAllRevealed(){
        lastRevealed = true;
		gr.lib._buttonAutoPlay.show(false);
		gr.lib._buttonStop.show(false);
	}
	function onTutorialIsHide(){
		tutorialVisible = false;
		if(SKBeInstant.config.gameType === 'ticketReady' && !resultScreen){
			gr.lib._buttonAutoPlay.show(true);
		}
        if(!autoRevealEnabled){
            gr.lib._buttonAutoPlay.show(false);
        }
	}
	function onTutorialIsShown(){
		tutorialVisible = true;
	}
    msgBus.subscribe('jLottery.reInitialize', onReInitialize);
    msgBus.subscribe('jLottery.reStartUserInteraction', onReStartUserInteraction);
    msgBus.subscribe('jLottery.startUserInteraction', onStartUserInteraction);
    msgBus.subscribe('SKBeInstant.gameParametersUpdated', onGameParametersUpdated);
    msgBus.subscribe('reset', onReset);
	msgBus.subscribe('revealTheLastCover', onAllRevealed);
    msgBus.subscribe('jLottery.enterResultScreenState', onEnterResultScreenState);
    msgBus.subscribe('tutorialIsShown', onTutorialIsShown);
    msgBus.subscribe('tutorialIsHide', onTutorialIsHide);

    return {};
});