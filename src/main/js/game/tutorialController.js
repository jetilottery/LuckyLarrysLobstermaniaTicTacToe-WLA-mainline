/**
 * @module game/tutorialController
 * @description result dialog control
 */
define([
	'com/pixijs/pixi',
	'skbJet/component/gameMsgBus/GameMsgBus',
	'skbJet/component/SKBeInstant/SKBeInstant',
	'skbJet/component/howlerAudioPlayer/howlerAudioSpritePlayer',
	'skbJet/component/gladPixiRenderer/gladPixiRenderer',
	'skbJet/component/pixiResourceLoader/pixiResourceLoader',
	'skbJet/componentCRDC/gladRenderer/gladButton'
], function (PIXI, msgBus, SKBeInstant, audio, gr, loader, gladButton) {
	var buttonInfo, buttonClose;
	var left, right;
	var index = 0, lastIconIndex = 0, minIndex = 0, maxIndex = 2;
	var resultIsShown = false, tutorialVisible = false;
	var channelNum = 3;
    var downChannelIndex = 0;
	var upChannelIndex = 0;
	var betUpChannel = [11,12,13];
	var betDownChannel = [0,1,2];
	var shouldShowTutorialWhenReinitial = false;
	var showTutorialAtBeginning = true;
	var tutorialIcons = [];
    var starSpeed = 0.4;
	var showButtonInfoTimer = null;

	function showTutorial() {
		tutorialVisible = true;
		if(gr.lib._warningAndError.pixiContainer.visible){
			return;
		}
		gr.lib._BG_dim.off('click');
		buttonInfo.show(false);
		gr.lib._BG_dim.show(true);
        gr.lib._tutorial.show(true);		
		index = minIndex;
		if (gr.lib._winPlaque.pixiContainer.visible || gr.lib._nonWinPlaque.pixiContainer.visible) {
            resultIsShown = true;
        }
		gr.animMap._tutorialAnim.play();
		msgBus.publish('tutorialIsShown');
	}

	function hideTutorial() {
		index = minIndex;
		gr.animMap._tutorialUP._onComplete = function(){
			tutorialVisible = false;
			gr.lib._tutorial.show(false);
            for (var i = minIndex; i <= maxIndex; i++) {
                if (i === minIndex) {
                    gr.lib['_tutorialPage_0' + i].show(true);                  
                    tutorialIcons[i].enable(false);
                } else {
                    gr.lib['_tutorialPage_0' + i].show(false);
                    tutorialIcons[i].enable(true);
                }
            }
			if(gr.lib._warningAndError.pixiContainer.visible){return;}
            buttonInfo.show(true);
            if (!resultIsShown) {
                gr.lib._BG_dim.show(false);
            }else{
                resultIsShown = false;
            }
			msgBus.publish('tutorialIsHide');
		};
		gr.animMap._tutorialUP.play();
	}
	function showHideInfoButton(visible){
		if(visible){
			if(tutorialVisible){
				buttonInfo.show(false);
			}else{
				buttonInfo.show(true);
			}
		}else{
			buttonInfo.show(false);
		}
	}
    
    function starAnimationStart(){
        gr.animMap._tutorialAnim._onComplete = function(){
            gr.lib._star.gotoAndPlay('star',starSpeed,true);
        };
        gr.animMap._tutorialUP._onComplete = function(){
            gr.lib._star.gotoAndStop(0);
        };
    }
    
	function fillSimpleText(){
		gr.lib._versionText.autoFontFitText = true;
        gr.lib._versionText.setText(window._cacheFlag.gameVersion);
		
		gr.lib._tutorialTitleText.autoFontFitText = true;
		gr.lib._tutorialTitleText.setText(loader.i18n.Game.tutorial_title);
		gr.lib._closeTutorialText.autoFontFitText = true;
		gr.lib._closeTutorialText.setText(loader.i18n.Game.message_close);
	}
	function fillTutorialContent(){
		var tutorialContent = SKBeInstant.isWLA()?loader.i18n.Game.tutorial.WLA:loader.i18n.Game.tutorial.Commercial;
		var orientation = SKBeInstant.getGameOrientation();
		var lineH = 26;
		if(orientation === 'portrait'){
			lineH = 20;
		}
		var txtStyle = {align: 'center', fontWeight: 600, wordWrap: true, fill:'#08421e',fontFamily:"Oswald,arial,helvetica,sans-serif"};
		for (var i = minIndex; i <= maxIndex; i++) {
			if(i !== 0){
				gr.lib['_tutorialPage_0' + i].show(false);
			}
			var obj = gr.lib['_tutorialPage_0' + i + '_Text'];
			obj.pixiContainer.removeChildren();
			var size = obj._currentStyle._font._size;
			txtStyle.fontSize = size;
			txtStyle.wordWrapWidth = obj._currentStyle._width;
			var txt = tutorialContent['tutorial_0' + i];
			var txtSprite = new PIXI.Text(txt, txtStyle);
			while(txtSprite.height > obj._currentStyle._height){
				size--;
				if(size < 16){
					break;
				}
				txtStyle.fontSize = size;
				txtSprite = new PIXI.Text(txt, txtStyle);
			}
			while(txtSprite.height > obj._currentStyle._height){
				txtStyle.lineHeight--;
				if(txtStyle.lineHeight < 16){
					break;
				}
				txtSprite = new PIXI.Text(txt, txtStyle);
			}
			txtSprite.x = (obj._currentStyle._width - txtSprite.width)/2;
			txtSprite.y = (obj._currentStyle._height - txtSprite.height)/2;
			obj.pixiContainer.addChild(txtSprite);
		}
	}
	function bindButtonEvent(){
		gr.lib._BG_dim.on('click', function(event){
            event.stopPropagation();
        });		
		buttonInfo = new gladButton(gr.lib._buttonInfo, "buttonInfo",{'scaleXWhenClick': 0.92,'scaleYWhenClick': 0.92,'avoidMultiTouch':true});
		buttonInfo.click(function () {
			showTutorial();
			audio.play('UiClick',9);
	
		});

		buttonClose = new gladButton(gr.lib._buttonCloseTutorial, "buttonMeter",{'scaleXWhenClick': 0.92,'scaleYWhenClick': 0.92,'avoidMultiTouch':true});
		buttonClose.click(function () {
			hideTutorial();
			audio.play('UiClickConfirm',7);
		});

		left = new gladButton(gr.lib._buttonTutorialArrowLeft, "buttonTutorialArrow",{'avoidMultiTouch':true});
		left.click(function () {
			lastIconIndex = index;
			index--;
			if(index < minIndex){
				index = maxIndex;
			}
			showTutorialPageByIndex(index);
			audio.play('BetDown', (betDownChannel[downChannelIndex % channelNum]));
			downChannelIndex++;
		});
		
		right = new gladButton(gr.lib._buttonTutorialArrowRight, "buttonTutorialArrowB",{'avoidMultiTouch':true});
		right.click(function () {
			lastIconIndex = index;
			index++;
			if(index > maxIndex){
				index = minIndex;
			}
			showTutorialPageByIndex(index);
			audio.play('BetUp', (betUpChannel[upChannelIndex % channelNum]));
			upChannelIndex++;
		});
		
		for(var i = minIndex; i <= maxIndex; i++){
			(function(idx){
				var tutorialIconBtn = new gladButton(gr.lib['_tutorialPageIcon_0' + idx], 'tutorialPageIcon', {'avoidMultiTouch':true});
				if(idx === index){
					tutorialIconBtn.enable(false);
				}else{
					tutorialIconBtn.enable(true);
				}
				tutorialIconBtn.click(function(){
					audio.play('UiClick', 9);
					lastIconIndex = index;
					index = idx;
					showTutorialPageByIndex(index);
				});
				tutorialIcons.push(tutorialIconBtn);
			})(i);
		}
	}
	function hideTutorialAtBegin(){
		if(SKBeInstant.config.customBehavior){
            if(SKBeInstant.config.customBehavior.showTutorialAtBeginning === false){
                showTutorialAtBeginning = false;
                gr.lib._buttonInfo.show(true);
                gr.lib._BG_dim.show(false);
                gr.lib._tutorial.show(false);
				tutorialVisible = false;
            }
        }
	}
	function onGameParametersUpdated() {
		bindButtonEvent();
		fillSimpleText();
		fillTutorialContent();
		hideTutorialAtBegin();
        starAnimationStart();
		gr.lib._buttonInfo.show(false);
        gr.lib._tutorialTitleText.pixiContainer.$text.style.padding=3;
	}
	function showTutorialPageByIndex(index){
		for (var i = 0; i <= maxIndex; i++){
			if(i === index){
				gr.lib['_tutorialPage_0' + i].show(true);	
			}else{
				gr.lib['_tutorialPage_0' + i].show(false);
			}       
		}
		tutorialIcons[lastIconIndex].enable(true);
		tutorialIcons[index].enable(false);
	}

	function onReInitialize() {
		if(shouldShowTutorialWhenReinitial){
			shouldShowTutorialWhenReinitial = false;
			if(showTutorialAtBeginning){
				showTutorial();
			}else{
				msgBus.publish('tutorialIsHide');
			}
		}else{
			gr.lib._tutorial.show(false);
			tutorialVisible = false;
            buttonInfo.show(true);
		}
	}

	function onDisableUI() {
		showHideInfoButton(false);
	}
	
	function onEnableUI() {
		showHideInfoButton(true);
	}
	function showTutorialOnInitial(){
		buttonInfo.show(false);
		gr.lib._BG_dim.show(true);
		gr.lib._tutorial.show(true);
		tutorialVisible = true;
        gr.lib._star.gotoAndPlay('star',starSpeed,true);
		msgBus.publish('tutorialIsShown');
	}
	function onInitialize(){
		 if(showTutorialAtBeginning){
			showTutorialOnInitial();
		}else{
			msgBus.publish('tutorialIsHide');
		}
	}
	function onReStartUserInteraction(){
		if(showButtonInfoTimer){
			gr.getTimer().clearTimeout(showButtonInfoTimer);
			showButtonInfoTimer = null;
		}
		buttonInfo.show(true);
	}
	function onStartUserInteraction(){
		downChannelIndex = 0;
		upChannelIndex = 0;
		if(SKBeInstant.config.gameType === 'ticketReady'){
			if (showTutorialAtBeginning) {
				showTutorialOnInitial();
			} else {
				msgBus.publish('tutorialIsHide');
			}
		}else{
			gr.lib._tutorial.show(false);
			tutorialVisible = false;
			buttonInfo.show(true);
		}
	}
    
    function onEnterResultScreenState() {
        showButtonInfoTimer = gr.getTimer().setTimeout(function () {
			gr.getTimer().clearTimeout(showButtonInfoTimer);
			showButtonInfoTimer = null;
            if(!gr.lib._warningAndError.pixiContainer.visible){
                buttonInfo.show(true);
            }           
        }, Number(SKBeInstant.config.compulsionDelayInSeconds) * 1000);
	}

	function onPlayerWantsToMoveToMoneyGame(){
		if(showButtonInfoTimer){
			gr.getTimer().clearTimeout(showButtonInfoTimer);
			showButtonInfoTimer = null;
		}
        shouldShowTutorialWhenReinitial = true;
    }
	function onTutorialIsHide(){
		if(!showButtonInfoTimer){
            buttonInfo.show(true);
        }
	}

	function onWinBoxError(){
		buttonInfo.show(false);
		gr.lib._buttonHome.show(false);
	}
    
    function onAllRevealed(){
        buttonInfo.show(false);
    }

	function getTutorialVisible(){
		return tutorialVisible;
	}
    
	msgBus.subscribe('enableUI', onEnableUI);
	msgBus.subscribe('disableUI', onDisableUI);
	msgBus.subscribe('jLotterySKB.reset', onEnableUI);
	msgBus.subscribe('jLottery.initialize', onInitialize);
	msgBus.subscribe('jLottery.reInitialize', onReInitialize);
	msgBus.subscribe('SKBeInstant.gameParametersUpdated', onGameParametersUpdated);
	msgBus.subscribe('jLottery.reStartUserInteraction', onReStartUserInteraction);
	msgBus.subscribe('jLottery.startUserInteraction', onStartUserInteraction);
    msgBus.subscribe('jLottery.enterResultScreenState', onEnterResultScreenState);
	msgBus.subscribe('jLotteryGame.playerWantsToMoveToMoneyGame',onPlayerWantsToMoveToMoneyGame);
	msgBus.subscribe('tutorialIsHide', onTutorialIsHide);
    msgBus.subscribe('revealTheLastCover', onAllRevealed);
	msgBus.subscribe('winboxError',onWinBoxError);

	return {
		getTutorialVisible:getTutorialVisible
	};
});