/**
 * @module game/resultDialog
 * @description result dialog control
 */
define([
    'com/pixijs/pixi',
    'skbJet/component/gameMsgBus/GameMsgBus',
    'skbJet/component/gladPixiRenderer/gladPixiRenderer',
    'skbJet/component/pixiResourceLoader/pixiResourceLoader',
    'skbJet/component/SKBeInstant/SKBeInstant',
    'skbJet/componentCRDC/IwGameControllers/gameUtils',
	'skbJet/component/howlerAudioPlayer/howlerAudioSpritePlayer'
], function(PIXI, msgBus, gr, loader, SKBeInstant, gameUtils, audio) {

	var symbolCode = ['A','B','C','D','E','F'];
	var winBoxActive = false;
	var symbolImgs = {
		'A': 'KRound_0000',
		'B': 'QRound_0000',
		'C': 'JRound_0000',
		'D': 'TenRound_0000',
		'E': 'NineRound_0000',
		'F': 'EightRound_0000'
	};
	var prizeMap, prizeNumMap;
	var inactiveTimer;
	var maxWinlineNum = 3;
	var winningBox;
	var prizeTableTxtStyle = {fill:['#fe7001','#fee601','#fe7001'], stroke:'#442e19', strokeThickness:2};
    var tableImage = ["K","Q","J","Ten","Nine","Eight"];
    var ropeArray = ['Rope','RopeB'];
    var shadImg = 'shadow';
    var prizeSum = 0;
	var curPrize = 0;
	var lastPrice;
	var resultData;
	var rollOverChannel = [7,8,9];
	var rollOverIndex;
	var lastActiveSymbol;
    var winBoxFlag = false;

	function displaySpecifiedTable(name){
		gr.lib._winningBox.show(false);
		gr.lib._inactiveHint.show(false);
		gr.lib._prizeTableBox.show(true);
		var tables = gr.lib._prizeTableBody.getChildren();
		for(var key in tables){  
            var index = parseInt(key.match(/(\d+)/))-1;
			if(key === name){
				tables[key].show(true);   
                var aniName = tableImage[parseInt(name.match(/(\d+)$/)[0])-1];
                gr.animMap[aniName].start();
			}else{
				tables[key].show(false);
                gr.animMap[tableImage[index]].stop();
			}
		}
	}
    
    function ropeFlashAnimation(sp,aniName){
        gr.animMap[aniName] ={
            timeCount:0,
            isPlaying:false,
            _frameIndex:0,
            timeMax:0,
            start:function(){
                this.timeCount = 0;
                this.isPlaying = true;
                this._frameIndex = 0;
            },
            stop:function(){
                this.isPlaying = false;
            },
            updateStyleIfPlaying:function(timeslot){
                if(!this.isPlaying){
                    return;
                }
                this.timeCount+=timeslot;
                if(this.timeCount<=200){
                    return;
                }else{
                    this.timeCount = 0;
                }             
                sp.setImage(aniName + ropeArray[this._frameIndex%2]);
                this._frameIndex++;          
            }
            
        };
    }
    
    function initRopeFlash(){
        for(var i = 0; i < tableImage.length; i++){
            ropeFlashAnimation(gr.lib['_table0'+(i+1)],tableImage[i]);
        }
    }
    
    function stopAllRopeAnimation(){
        for(var i in tableImage){
            gr.animMap[tableImage[i]].stop();
        }
    }
    
	function displayInactiveHint(){
		clearInactiveTimer();
		gr.lib._winningBox.show(false);
		gr.lib._prizeTableBox.show(false);
		gr.lib._inactiveHint.show(true);
	}
	function displayWinningBox(){
		clearInactiveTimer();
		gr.lib._prizeTableBox.show(false);
		gr.lib._inactiveHint.show(false);
		gr.lib._winningBox.show(true);
	}
	function startInactiveTimer(){
		inactiveTimer = gr.getTimer().setTimeout(function(){
            stopAllRopeAnimation();
			if(winBoxActive){
				displayWinningBox();
			}else{
				displayInactiveHint();
			}
		}, 6000);
	}
	function clearInactiveTimer(){
		gr.getTimer().clearTimeout(inactiveTimer);
	}
	function onPrizeTableActive(e){
		rollOverIndex++;
		clearInactiveTimer();
		var activeSymbol = e.currentTarget;
		var symbolID = activeSymbol.name.match(/\d+/)[0];
		var symbolName = '_table' + symbolID;
		displaySpecifiedTable(symbolName);
		if(lastActiveSymbol !== activeSymbol){
			audio.play('SymbolSelect', rollOverChannel[rollOverIndex % rollOverChannel.length]);
		}
		lastActiveSymbol = e.currentTarget;
	}
	function bindPrizeNavEvent(){
		var nav = gr.lib._symbolList.getChildren();
		for(var symbol in nav){
			var navItem = nav[symbol];
			navItem.pixiContainer.$sprite.interactive = true;
			navItem.pixiContainer.$sprite.cursor = 'pointer';
			navItem.on('mouseover',onPrizeTableActive);
			navItem.on('click',onPrizeTableActive);
		}
		gr.lib._prizeTableContainer.on('mouseout',startInactiveTimer);
        gr.lib._prizeTableContainer.on('mouseup',startInactiveTimer);
		gr.lib._prizeTableBox.on('mouseover',clearInactiveTimer);
        gr.lib._prizeTableBox.on('mousedown',clearInactiveTimer);
	}
	function unbindPrizeNavEvent(){
		var nav = gr.lib._symbolList.getChildren();
		for(var symbol in nav){
			var navItem = nav[symbol];
			navItem.pixiContainer.$sprite.interactive = false;
			navItem.off('mouseover',onPrizeTableActive);
			navItem.off('click',onPrizeTableActive);
		}
		gr.lib._prizeTableContainer.off('mouseout',startInactiveTimer);
        gr.lib._prizeTableContainer.off('mouseup',startInactiveTimer);
		gr.lib._prizeTableBox.off('mouseover',clearInactiveTimer);
        gr.lib._prizeTableContainer.off('mouseup',startInactiveTimer);
	}
    /*fill content for win line details*/
	function fillPrizeTable(prizeData){
		function fillTableContent(index, lineNum, prize){
			var prizeTextStyle = prizeTableTxtStyle;
			var linesNumSpr = gr.lib['_linesNum0' + index + '_x' + lineNum];
			linesNumSpr.setText(loader.i18n.Game.multiSign + lineNum);
            linesNumSpr.autoFontFitText = true;
            gameUtils.fontFitWithAutoWrap(linesNumSpr,22);
			gameUtils.setTextStyle(linesNumSpr, prizeTextStyle);
			var prizeValueSpr = gr.lib['_content0' + index + '_value_x' + lineNum];
			prizeValueSpr.autoFontFitText = true;
			prizeValueSpr.setText(prize);
			gameUtils.setTextStyle(prizeValueSpr, prizeTextStyle);
		}
		prizeMap = {};
		prizeNumMap = {};
		if(Array.isArray(prizeData)){
			prizeData.forEach(function(elem){
				var descArr = elem.description.match(/(\w)(\d)/i);
				var code = descArr[1].toUpperCase();
				var index = symbolCode.indexOf(code) + 1;
				var num = descArr[2];
				var prize = SKBeInstant.formatCurrency(elem.prize).formattedAmount;
				fillTableContent(index, num, prize);
				prizeMap[code + num] = prize;
				prizeNumMap[code + num] = elem.prize;
			});
		}
	}
    
	function fillInactiveHint(){
		var hintStyle = prizeTableTxtStyle;
		gr.lib._hintContent.setText(loader.i18n.Game.prizeTableHint);
		gameUtils.setTextStyle(gr.lib._hintContent, hintStyle);
		gameUtils.fontFitWithAutoWrap(gr.lib._hintContent, 20);
	}
	function fillTitles(){
		var titleStyle = prizeTableTxtStyle;
		gr.lib._prizeTableCaption.autoFontFitText = true;
		gr.lib._prizeTableCaption.setText(loader.i18n.Game.prizeTableTitle);
		gameUtils.setTextStyle(gr.lib._prizeTableCaption, titleStyle);
		gr.lib._winningBoxCaption.autoFontFitText = true;
		gr.lib._winningBoxCaption.setText(loader.i18n.Game.winBoxTitle);
		gameUtils.setTextStyle(gr.lib._winningBoxCaption, titleStyle);
	}
	
	function initWinningBox(){
		winningBox = new WinningBox(gr.lib._winningBoxBody);
		winningBox.symbolTemplate = gr.lib._winBox_gems;
		winningBox.multiValueTemplate = gr.lib._winBox_txt_multi;
        gameUtils.fontFitWithAutoWrap(winningBox.multiValueTemplate,20);
		winningBox.winTextTemplate = gr.lib._winBox_txt_win;       
		winningBox.prizeValueTemplate = gr.lib._winBox_txt_prize;
        gameUtils.fontFitWithAutoWrap(winningBox.prizeValueTemplate,20);
	}
	
	function WinningBox(sprite){
		this.gladSprite = sprite;
        this.subContainer = null;
		this.width = sprite._currentStyle._width;
		this.height = sprite._currentStyle._height;
		this.lineHeight = Math.floor(this.height/maxWinlineNum);
		this.boxLines = {};
		this.boxLineCount = 0;
		this.symbolTemplate = null;
		this.multiValueTemplate = null;
		this.winTextTemplate = null;
		this.prizeValueTemplate = null;
        this.shadow = null;
	}
	WinningBox.prototype.update = function(data){
		for(var symbolCode in data){
			var lineNum = data[symbolCode];
			if(this.boxLines[symbolCode]){
				this.boxLines[symbolCode].update(lineNum);
			}else{
				var wbLine = new WinningBoxLine(this, symbolCode, lineNum);
				wbLine.create();
				this.boxLines[symbolCode] = wbLine;
				this.insertLine(wbLine);
                this.adjustLinesPosition();               
			}
		}
	};
	WinningBox.prototype.insertLine = function(line){
		var lineCtn = line.container;
		lineCtn.y = this.lineHeight * this.boxLineCount;
		this.subContainer.addChild(lineCtn);
		this.boxLineCount++;
	};
    WinningBox.prototype.adjustLinesPosition = function(){
		var newY = (this.gladSprite._currentStyle._height - this.subContainer.height)/2;
		this.subContainer.y = newY;
	};
	WinningBox.prototype.clearWinningBox = function(){
		this.gladSprite.pixiContainer.removeChildren();
		var subCtn = new PIXI.Container();
		subCtn.name = 'subContainer';
		this.subContainer = subCtn;
		this.gladSprite.pixiContainer.addChild(subCtn);
		this.boxLineCount = 0;
		this.boxLines = {};
	};
	function WinningBoxLine(box, symbolCode, lineNum){
		this.box = box;
		this.container = new PIXI.Container();
		this.container.name = 'line_' + symbolCode;
		this.container.width = box.width;
		this.container.height = box.lineHeight;
		this.symbolCode = symbolCode;
		this.winLineNum = lineNum;
		this.prize = prizeNumMap[symbolCode + lineNum];
	}
	WinningBoxLine.prototype.update = function(lineNum){
		this.winLineNum += lineNum;
		this.updateMultiple();
		this.updatePrizeValue();
	};
	WinningBoxLine.prototype.updateMultiple = function(){
		var valueTemp = this.box.multiValueTemplate;
		var ctnName = valueTemp.pixiContainer.name;
		var multiCtn = this.container.getChildByName(ctnName);
		var multiTxt = multiCtn.children[0];
		multiTxt.text = loader.i18n.Game.multiSign + this.winLineNum;        
		this.adjustTextSize(valueTemp, multiTxt);
		this.adjustTextPosition(valueTemp, multiTxt);
	};
	WinningBoxLine.prototype.updatePrizeValue = function(){
		var prizeTemp = this.box.prizeValueTemplate;
		var ctnName = prizeTemp.pixiContainer.name;
		var prizeCtn = this.container.getChildByName(ctnName);
		var prizeTxt = prizeCtn.children[0];
		var winValue = prizeMap[this.symbolCode + this.winLineNum];
		prizeTxt.text = winValue;
		this.adjustTextSize(prizeTemp, prizeTxt);
		this.adjustTextPosition(prizeTemp, prizeTxt);
		this.prize = prizeNumMap[this.symbolCode + this.winLineNum];
	};
	WinningBoxLine.prototype.create = function(){
        if(this.box.shadow !== null){
            var shadow = this.createContainerReferToTemplate(this.box.shadow,shadImg);
            this.container.addChild(shadow);
        }
        
		var symbolImg = symbolImgs[this.symbolCode];
		var symbolCtn = this.createContainerReferToTemplate(this.box.symbolTemplate, symbolImg);
		this.container.addChild(symbolCtn);
        		
		var multiValue = loader.i18n.Game.multiSign + this.winLineNum;
		var multiCtn = this.createContainerReferToTemplate(this.box.multiValueTemplate, multiValue);
		this.container.addChild(multiCtn);
		
		var winText = loader.i18n.Game.winBoxWin;
		var winTextCtn = this.createContainerReferToTemplate(this.box.winTextTemplate, winText);
		this.container.addChild(winTextCtn);
		
		var prizeValue = prizeMap[this.symbolCode + this.winLineNum];
		var prizeCtn = this.createContainerReferToTemplate(this.box.prizeValueTemplate, prizeValue);
       
		this.container.addChild(prizeCtn);
	};
	WinningBoxLine.prototype.createContainerReferToTemplate = function(gladTemp, value){
		var pixiTemp = gladTemp.pixiContainer;
		var tempScale = pixiTemp.scale;
		var tempPivot = pixiTemp.pivot;
		var newContainer = new PIXI.Container();
		newContainer.pivot.x = tempPivot.x;
		newContainer.pivot.y = tempPivot.y;
		newContainer.scale.x = tempScale.x;
		newContainer.scale.y = tempScale.y;
		newContainer.x = pixiTemp.x;
		newContainer.y = pixiTemp.y;
		newContainer.name = pixiTemp.name;
		var subCtns = gladTemp.getChildren();
		var isLeafNode = true;
		for(var ctnName in subCtns){
			isLeafNode = false;
			newContainer.addChild(this.createContainerReferToTemplate(subCtns[ctnName], value));
		}
		if(isLeafNode){
			var contentTemp = pixiTemp.$text || pixiTemp.$sprite;
			this.fillContent(newContainer, gladTemp, contentTemp, value);
		}
		return newContainer;
	};
	WinningBoxLine.prototype.fillContent = function(container, containerTemp, contentTemp, value){
		if(contentTemp instanceof PIXI.Text){
			var txtStyle = contentTemp.style;
			var newText = new PIXI.Text(value, txtStyle);
			newText.style.wordWrap = false;
			this.adjustTextSize(containerTemp, newText);
			this.adjustTextPosition(containerTemp, newText);
			container.addChild(newText);
		}else{
			var newTexture = PIXI.utils.TextureCache[value];
			var newSpr = new PIXI.Sprite(newTexture);
			container.addChild(newSpr);
		}
	};
	WinningBoxLine.prototype.adjustTextSize = function(ctn, txt){
		if(txt.width > ctn._currentStyle._width){
			txt.scale.set(ctn._currentStyle._width/txt.width);
		}
	};
	WinningBoxLine.prototype.adjustTextPosition = function(ctn, txt){
		switch(txt.style.align){
			case 'left':
				txt.x = 0;
				break;
			case 'center':
				txt.x = (ctn._currentStyle._width - txt.width)/2;
				break;
			case 'right':
				txt.x = ctn._currentStyle._width - txt.width;
				break;
			default:
				txt.x = (ctn._currentStyle._width - txt.width)/2;
				break;
		}
		txt.y = (ctn._currentStyle._height - txt.height)/2;
	};
    function onGameParametersUpdated() {
		fillTitles();
		fillInactiveHint();
		displayInactiveHint();
		initWinningBox();
        initRopeFlash();
    }
    function onStartUserInteraction(data) {
		resultData = data;
		curPrize = 0;
		rollOverIndex = 0;
		if(data.price !== lastPrice){
			fillPrizeTable(data.prizeTable);
			lastPrice = data.price;
		}
		winBoxActive = false;
		bindPrizeNavEvent();
		winningBox.clearWinningBox();
        prizeSum = data.prizeValue;
    }

    function onReStartUserInteraction(data) {
        onStartUserInteraction(data);
    }

    function onReInitialize() {
        winBoxActive = false;
		unbindPrizeNavEvent();
		displayInactiveHint();
    }

    function onPlayerWantsPlayAgain() {
		winBoxActive = false;
		unbindPrizeNavEvent();
        displayInactiveHint();
    }

	function onAllRevealed(){
        if(curPrize < prizeSum){
            msgBus.publish('winboxError',{errorCode:'29000',errorDescriptionSpecific: ' '});
            msgBus.publish('stopRevealAll');
		}else if(curPrize > prizeSum){
			return;
		}else{
			msgBus.publish('jLotteryGame.finishAllSymbolRevealed');
			msgBus.publish('jLotteryGame.ticketResultHasBeenSeen', {
				tierPrizeShown: resultData.prizeDivision,
				formattedAmountWonShown: resultData.prizeValue
			});
			msgBus.publish('disableUI');
			msgBus.publish('allRevealed');
		}
	}

	function onUpdateWinningBox(data){
		winBoxActive = true;
		displayWinningBox();
		winningBox.update(data);
		updateWinMeter();
	}
	function getWinBoxData(){
		return winningBox.boxLines;
	}
	function updateWinMeter(){       
		var boxLinesData = winningBox.boxLines;
		curPrize = 0;
		for(var symbolCode in boxLinesData){
			curPrize += boxLinesData[symbolCode].prize;
		}
        if(curPrize > prizeSum){
            msgBus.publish('winboxError',{errorCode:'29000',errorDescriptionSpecific: ' '});  
			msgBus.publish('stopRevealAll'); 
			return;
        }     
        if(!winBoxFlag){
		    gr.lib._winsValue.setText(SKBeInstant.formatCurrency(curPrize).formattedAmount);
		    gameUtils.fixMeter(gr);
        }
	}
    
    function onWinBoxError(){
        winBoxFlag = true;       
    }
    msgBus.subscribe('jLottery.reInitialize', onReInitialize);
    msgBus.subscribe('jLottery.reStartUserInteraction', onReStartUserInteraction);
    msgBus.subscribe('playerWantsPlayAgain', onPlayerWantsPlayAgain);
    msgBus.subscribe('jLottery.startUserInteraction', onStartUserInteraction);
    msgBus.subscribe('SKBeInstant.gameParametersUpdated', onGameParametersUpdated);
	msgBus.subscribe('updateWinningBox',onUpdateWinningBox);
	msgBus.subscribe('allSymbolRevealed', onAllRevealed);
    msgBus.subscribe('winboxError',onWinBoxError);

    return {
		WinningBox: WinningBox,
		getWinBoxData: getWinBoxData
	};
});