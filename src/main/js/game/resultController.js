/**
 * @module game/resultDialog
 * @description result dialog control
 */
define([
    'skbJet/component/gameMsgBus/GameMsgBus',
    'skbJet/component/gladPixiRenderer/gladPixiRenderer',
    'skbJet/component/pixiResourceLoader/pixiResourceLoader',
    'skbJet/component/SKBeInstant/SKBeInstant',
    'skbJet/componentCRDC/gladRenderer/gladButton',
	'../game/prizeTableController',
    'skbJet/componentCRDC/IwGameControllers/gameUtils',
	'skbJet/component/howlerAudioPlayer/howlerAudioSpritePlayer'
], function(msgBus, gr, loader, SKBeInstant, gladButton, prizeTable, gameUtils, audio) {
    var messageButtonClosed = true;
	var resPlaque;
    var starSpeed = 0.8;
    var winDetailBox;
	var boughtTicket = false;
	var MTMReinitial = false;

    function onGameParametersUpdated() {
        winDetailBox = new prizeTable.WinningBox(gr.lib._winDetails);
		winDetailBox.symbolTemplate = gr.lib._winDetails_gems;
		winDetailBox.multiValueTemplate = gr.lib._winDetails_txt_multi;
        gameUtils.fontFitWithAutoWrap(winDetailBox.multiValueTemplate,20);
		winDetailBox.winTextTemplate = gr.lib._winDetails_txt_win;
		winDetailBox.prizeValueTemplate = gr.lib._winDetails_txt_prize;      
        winDetailBox.shadow = gr.lib._winDetails_shadow;
		resPlaque = new ResultPlaque();
		resPlaque.wagerType = SKBeInstant.config.wagerType;
		resPlaque.init();
		resPlaque.hide();
        winUpToShowOrDisable(true);
    }
    
    function winUpToShowOrDisable(flag){
        gr.lib._winUpTo.show(flag);
    }
    
    function starAnimation(){
        gr.lib._starMessage.gotoAndPlay('star',starSpeed,true);
    }
    
    function stopStarAnimation(){
        if(gr.lib._starMessage.pixiContainer.$sprite.gotoAndStop){
            gr.lib._starMessage.gotoAndStop(0);
        }
    }

	function ResultPlaque(){
		this.plaqueContainer = gr.lib._MessagePlaque;
		var buttonParam = {'scaleXWhenClick': 0.92, 'scaleYWhenClick': 0.92, 'avoidMultiTouch': true};
		this.closeButton = new gladButton(gr.lib._buttonMessageClose, "buttonMeter", buttonParam);
		this.winPlaque = null;
		this.nonWinPlaque = new NonWinPlaque(gr.lib._nonWinPlaque, gr.lib._nonWinText);
		this.wagerType = null;
		this.playResult = null;
	}
	ResultPlaque.prototype.init = function(){
        this.wagerType = SKBeInstant.config.wagerType;
		if(this.wagerType === 'BUY'){
			this.winPlaque = new WinPlaque(gr.lib._winPlaque, gr.lib._winTitle, gr.lib._winDetails, gr.lib._winText);
			this.winPlaque.title = loader.i18n.Game.message_buyWinTitle;
			this.winPlaque.winText = loader.i18n.Game.message_buyWin;
		}else{
			this.winPlaque = new WinPlaque(gr.lib._winPlaque, gr.lib._winTryTitle, gr.lib._winDetails, gr.lib._winTryText);
			this.winPlaque.title = loader.i18n.Game.message_tryWinTitle;
			this.winPlaque.winText = loader.i18n.Game.message_tryWin;
		}
		this.winPlaque.fillFixedContent();
		this.nonWinPlaque.fill();
		var _THIS = this;
		gr.lib._buttonMessageCloseText.setText(loader.i18n.Game.message_close);
		this.closeButton.click(function(){
			messageButtonClosed = true;
			gr.lib._BG_dim.show(false);
			_THIS.hide();
			audio.stopChannel(5);
            audio.play('UiClick',9);
		});
	};
	ResultPlaque.prototype.show = function(){
		gr.lib._BG_dim.show(true);
        starAnimation();
		this.plaqueContainer.show(true);
        gr.lib._buntingBG.show(false);
        gr.lib._winPlayAnim.show(false);
		if(this.playResult === 'WIN'){
			this.winPlaque.show(true);
            gr.lib._buntingBG.show(true);
            gr.lib._winPlayAnim.show(true);
            gr.lib._winPlayAnim.gotoAndPlay('win',0.3,false);
		}else{
			this.nonWinPlaque.show(true);
		}
	};
	ResultPlaque.prototype.hide = function(){
		this.plaqueContainer.show(false);
        stopStarAnimation();
		this.winPlaque.show(false);
		this.nonWinPlaque.show(false);
	};
	ResultPlaque.prototype.fillWinDetails = function(){
		var resultData = prizeTable.getWinBoxData();
		var parsedData = {};
		for(var symbolCode in resultData){
			parsedData[symbolCode] = resultData[symbolCode].winLineNum;
		}
		winDetailBox.update(parsedData);
	};
	ResultPlaque.prototype.clearWinDetails = function(){
		this.winPlaque.plaqueDetails.pixiContainer.removeChildren();
	};
	ResultPlaque.prototype.fillWinValue = function(data){
		gr.lib._winValue.setText(SKBeInstant.formatCurrency(data.prizeValue).formattedAmount);
	};
	function WinPlaque(plaqueSpr, titleSpr, detailSpr, textSpr){
		this.plaqueSprite = plaqueSpr;
		this.plaqueTitle = titleSpr;
		this.plaqueTitle.autoFontFitText = true;
		this.plaqueText = textSpr;
		this.plaqueDetails = detailSpr;
		this.plaqueText.autoFontFitText = true;
		this.title = null;
		this.winText = null;
	}
	WinPlaque.prototype.show = function(visibility){
		this.plaqueSprite.show(visibility);
		this.plaqueTitle.show(visibility);
		this.plaqueText.show(visibility);
	};
	WinPlaque.prototype.fillFixedContent = function(){
		this.plaqueTitle.setText(this.title);
		this.plaqueText.setText(this.winText);
	};
	
	function NonWinPlaque(plaqueSpr, textSpr){
		this.plaqueSprite = plaqueSpr;
		this.plaqueText = textSpr;
		this.plaqueText.autoFontFitText = true;
	}
	NonWinPlaque.prototype.fill = function(){
		this.plaqueText.setText(loader.i18n.Game.message_nonWin);		
	};
	NonWinPlaque.prototype.show = function(visibility){
		this.plaqueSprite.show(visibility);
	};
	
    function onStartUserInteraction(data) {
        resPlaque.hide();
		resPlaque.playResult = data.playResult;
		resPlaque.clearWinDetails();
        winDetailBox.clearWinningBox();
		resPlaque.fillWinValue(data);
		boughtTicket = true;
        winUpToShowOrDisable(false);
    }

    function onEnterResultScreenState() {
        messageButtonClosed = false;
		if(resPlaque.playResult === 'WIN'){
			resPlaque.fillWinDetails();
		}
        resPlaque.show();
		audio.stopChannel(3);
        audio.stopChannel(6);
    }

    function onReStartUserInteraction(data) {
        messageButtonClosed = true;
        onStartUserInteraction(data);
    }

    function onReInitialize() {
        messageButtonClosed = true;
		resPlaque.init();
        resPlaque.hide();
		if(MTMReinitial){
			boughtTicket = false;
            winUpToShowOrDisable(false);
			MTMReinitial = false;
		}
    }

    function onPlayerWantsPlayAgain() {
        messageButtonClosed = true;
		boughtTicket = false;
        gr.lib._BG_dim.show(false);
        resPlaque.hide();
        audio.stopChannel(5);
        winUpToShowOrDisable(true);
		MTMReinitial = true;
    }

    function onTutorialIsShown() {
        if (gr.lib._MessagePlaque.pixiContainer.visible) {
            resPlaque.hide();
            gr.lib._BG_dim.show(true);
        }
		if(!boughtTicket){
			winUpToShowOrDisable(false);
        }       
    }

    function onTutorialIsHide() {
        if (!messageButtonClosed) {
            resPlaque.show();
        } else {
            gr.lib._BG_dim.show(false);
        }
		if(!boughtTicket){
            winUpToShowOrDisable(true);
        }     
    }

	function onReset(){
		boughtTicket = false;
        winUpToShowOrDisable(true);
	}

    msgBus.subscribe('tutorialIsShown', onTutorialIsShown);
    msgBus.subscribe('tutorialIsHide', onTutorialIsHide);
    msgBus.subscribe('jLottery.reInitialize', onReInitialize);
    msgBus.subscribe('jLottery.reStartUserInteraction', onReStartUserInteraction);   
    msgBus.subscribe('playerWantsPlayAgain', onPlayerWantsPlayAgain);
    msgBus.subscribe('jLottery.startUserInteraction', onStartUserInteraction);
    msgBus.subscribe('jLottery.enterResultScreenState', onEnterResultScreenState);
    msgBus.subscribe('SKBeInstant.gameParametersUpdated', onGameParametersUpdated);
	msgBus.subscribe('jLotterySKB.reset', onReset);

    return {};
});