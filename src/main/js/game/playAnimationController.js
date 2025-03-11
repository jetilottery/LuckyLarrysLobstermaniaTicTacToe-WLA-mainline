/**
 * @module game/playAnimationController
 * @description 
 */
define([
	'skbJet/component/gameMsgBus/GameMsgBus',
	'skbJet/component/howlerAudioPlayer/howlerAudioSpritePlayer',
	'skbJet/component/gladPixiRenderer/gladPixiRenderer',
	'skbJet/component/pixiResourceLoader/pixiResourceLoader',
	'skbJet/component/SKBeInstant/SKBeInstant',
	'skbJet/componentCRDC/gladRenderer/gladButton',
	'skbJet/componentCRDC/IwGameControllers/gameUtils',
	'skbJet/component/utils/Map'
], function (msgBus, audio, gr, loader, SKBeInstant,gladButton,gameUtils, Map) {
	var autoRevealInterval;
	var coverRevealing = false;
	var ticTacGrid;
	var ticTacGridSize = 9;
	var cellCountPerWinline = 3;
    var disappearAniTime = 666;
	var symbolImgs = {
		'A': 'KRound_0000',
		'B': 'QRound_0000',
		'C': 'JRound_0000',
		'D': 'TenRound_0000',
		'E': 'NineRound_0000',
		'F': 'EightRound_0000'
	};
	var winlineLocations = {
		'_winLine00': [1,5,9],
		'_winLine01': [3,5,7],
		'_winLine02': [1,4,7],
		'_winLine03': [2,5,8],
		'_winLine04': [3,6,9],
		'_winLine05': [1,2,3],
		'_winLine06': [4,5,6],
		'_winLine07': [7,8,9]
	};
	var symbolWinlines = {
		'A': {'line':'KWinLine','light':'KReelGem_0000'},
		'B': {'line':'QWinLine','light':'QReelGem_0000'},
		'C': {'line':'JWinLine','light':'JReelGem_0000'},
		'D': {'line':'TenWinLine','light':'TenReelGem_0000'},
		'E': {'line':'NineWinLine','light':'NineReelGem_0000'},
		'F': {'line':'EightWinLine','light':'EightReelGem_0000'}
	};
    var disappearAnim = ['treasureBoxPaper','characterPaper','lobsterPaper'];
    var coverCellImage = ['treasure','character','lobster'];
    var logoSpeed = 0.2;
    var portraitPlaySpeed = 0.3;
    var portraitInterval = 2000;
    var swapMapping = new Map();
	var playAnimTimer = 1000;
	var birdsIntervalTimer = 5000;
	/*get indexes of cells that covered by specific cover*/
	function calcCoveredCellArr(gridSize, coverSize, coverIndex){
		coverIndex = parseInt(coverIndex);
		coverIndex = coverIndex === 0 ? 1 : coverIndex;
		var gridCol = Math.sqrt(gridSize);
		var coverCol = Math.sqrt(coverSize);
		var startIdx = 0;
		for(var i = 1; i <= coverIndex; i++){
			startIdx++;
			var relIdx = startIdx <= gridCol ? startIdx : startIdx - Math.floor(startIdx/gridCol) * gridCol;
			if(relIdx + coverCol - 1 > gridCol){
				startIdx = startIdx + coverCol - 1;
			}
		}
		var cellArr = [];
		var num = gridCol * coverCol;
		for(var j = 0; j < num; j+=gridCol){
			for(var k = j; k < coverCol + j; k++){
				cellArr.push(startIdx + k);
			}
		}
		return cellArr;
	}
	function getCoveredCells(gridSize, coverSize, coverIndex){
		if(coverSize > 1){
			return calcCoveredCellArr(gridSize, coverSize, coverIndex);
		}else{
			return [coverIndex];
		}
	}
	function getSiblings(sprite){
		var sprName = sprite.getName();
		var par = sprite.parent;
		var siblings = par.getChildren();
		var sibArr = [];
		for(var name in siblings){
			if(name !== sprName){
				sibArr.push(siblings[name]);
			}
		}
		return sibArr;
	}
	
	function isEmptyObject(obj){
		for(var key in obj){
			if(key){
				return false;
			}
		}
		return true;
	}
	function parseScenarioData(data){
		var scenarioStr = data.scenario;
		var coverMap = new Map();
		var cellMap = new Map();
		var cover3x3Idx = ['0'];
		coverMap.set(gr.lib._coverLayer3x3, cover3x3Idx);
		var cover2x2Idx = [scenarioStr.match(/(\d+)|/)[0]];
		coverMap.set(gr.lib._coverLayer2x2, cover2x2Idx);
		var cellsStr = scenarioStr.substr(scenarioStr.indexOf('|') + 1);
		var cellsArr = cellsStr.split(',');
		var mappingCells = cellsArr.map(function(elem, index){
			return {
				index: index + 1,
				cell: elem.split('')
			};
		});
		cellMap.set(gr.lib._symbolsLayer, cellsArr);
		var cover1x1Idx = mappingCells.filter(function(elem){
			return elem.cell.length > 1;
		}).map(function(elem){
			return elem.index.toString();
		});
		coverMap.set(gr.lib._coverLayer1x1, cover1x1Idx);
		return {
			coverLayer: coverMap,
			cellLayer: cellMap,
			playResult: data.playResult
		};
	}
	function getIntersection(arr1,arr2){
		var intersection = [];
		if(arr1 && arr2){
			if(!Array.isArray(arr1)){
				arr1 = arr1.split('');
			}
			if(!Array.isArray(arr2)){
				arr2 = arr2.split('');
			}
			arr1.forEach(function(elem){
				if(arr2.indexOf(elem)>=0){
					intersection.push(elem);
				}
			});
		}
		return intersection;
	}
	
	function onStartUserInteraction(data) {
		gr.lib._network.stopPlay();
		gr.lib._network.show(false);        
		if(!data.scenario){
			return;
		}
		var parsedData = parseScenarioData(data);
		ticTacGrid.updateData(parsedData);
		ticTacGrid.updateCovers();
		ticTacGrid.updateCells();
		ticTacGrid.resetWinlines();
        gr.lib._winLine.show(true);      
        losterAnimation();
        //restart click event
        var coversToReveal = ticTacGrid.detectData.coversToReveal;
		coversToReveal.forEach(function(cv){
			cv.bindEventListener();
		});
	}

	//0|A,E,CF,D,F,C,EF,E,CE
	function ticTacToeGrid(size){
		this.size = size;
		this.cellCountPerWinline = cellCountPerWinline;
		this.coverLayers = null;
		this.cellLayer = null;
		this.winlineLayer = null;
		this.scenarioData = null;
		this.coverLayerData = null;
		this.cellLayerData = null;
		this.detectData = null;
	}
	ticTacToeGrid.prototype.init = function(coversArr, cellLayerSpr, winlineLayerSpr){
		if(Array.isArray(coversArr)){
			var arr = [];
			coversArr.forEach(function(elem){
				var coverLayer = new ticTacToeCoverLayer(elem.sprite, elem.perCoverSize, elem.zIndex);
				coverLayer.init();
				arr.push(coverLayer);
			});
			this.coverLayers = arr;
		}
		
		var cellLayer = new ticTacToeCellLayer(cellLayerSpr);
		this.cellLayer = cellLayer;
		
		var winlineLayer = new ticTacToeWinlineLayer(winlineLayerSpr);
		winlineLayer.init();
		this.winlineLayer = winlineLayer;
	};
	ticTacToeGrid.prototype.updateData = function(data){
		this.scenarioData = data;
		this.coverLayerData = data.coverLayer;
		this.cellLayerData = data.cellLayer;
		this.detectData = {
			playResult:data.playResult,
			namesForCellsList:[],
			coversToReveal:[],
			coveredCellsList:[]
		};
	};
	ticTacToeGrid.prototype.updateCovers = function(){
		var coverLayerData = this.coverLayerData;
		var cvlArr = this.coverLayers;     
		cvlArr.forEach(function(cvl){
            cvl.layerSprite.show(true);		
			cvl.activeCoverIndexArr = coverLayerData.get(cvl.layerSprite);
			cvl.handleCovers();
		});
	};
	ticTacToeGrid.prototype.updateCells = function(){
		gr.lib._winLine.show(false);
		var cll = this.cellLayer;
		cll.cellContentArr = this.cellLayerData.get(cll.layerSprite);
		cll.handleCells();
	};
	ticTacToeGrid.prototype.resetWinlines = function(){
		this.winlineLayer.resetWinlines();
	};
	ticTacToeGrid.prototype.resetAll = function(){
		this.winlineLayer.resetWinlines();
		this.coverLayers.forEach(function(coverLayer){
			coverLayer.layerSprite.show(true);
			coverLayer.covers.forEach(function(cover){
				cover.resetCover();
			});
		});
        if(this.cellLayer.cells){
            this.cellLayer.cells.forEach(function(cell){
                cell.stopAnim();
            });
        }
	};
	ticTacToeGrid.prototype.detectWinline = function(){
		if(this.detectData.playResult){
			var coverCellsArr = this.detectData.coveredCellsList;
			var tempArr = coverCellsArr.join(',').split(',');
			var realTimeCells = this.cellLayer.cells;
			var exposedCellMap = new Map();
			for(var i = 0; i < realTimeCells.length; i++){
				var cl = realTimeCells[i];
				if(tempArr.indexOf(cl.cellIndex.toString()) < 0){
					exposedCellMap.set(cl.cellIndex, cl);
				}
			}
			if(exposedCellMap.size >= this.cellCountPerWinline){
				var prevIntersection;
				var matchedObj = {};
				this.winlineLayer.show(true);
				this.winlineLayer.winlines.forEach(function(wl){
					if(!wl.visibility){
						var match = wl.associatedCellIndex.every(function(clIdx, loopIdx){
							var curCell = exposedCellMap.get(clIdx);
							if(curCell){
								wl.associatedCells.push(curCell);
								if(loopIdx === 0){
									prevIntersection = curCell.cellSymbol;
									return curCell !== undefined;
								}else{
									var intersection = getIntersection(curCell.cellSymbol, prevIntersection);
									prevIntersection = intersection;
									return curCell !== undefined && intersection.length > 0;
								}
							}else{
								return false;
							}
						});
						if(match && prevIntersection){
							var matched = prevIntersection[0];
							wl.show(true);
							wl.fill(matched);
							wl.playSymbolAnim(matched);
							wl.playLightAnim(matched);
							matchedObj[matched] = matchedObj[matched] ? matchedObj[matched] + 1 : 1;
						}
					}
				});
				if(!isEmptyObject(matchedObj)){
					this.updateWinningBox(matchedObj);
				}
			}else{
				this.winlineLayer.show(false);
			}
		}else{
			this.winlineLayer.show(false);
		}
		this.checkAllRevealed();
	};
	ticTacToeGrid.prototype.checkAllRevealed = function(){
		if(this.detectData.coveredCellsList.length === 0){
			msgBus.publish('allSymbolRevealed');
		}
	};
	ticTacToeGrid.prototype.updateWinningBox = function(matchedData){
		msgBus.publish('updateWinningBox',matchedData);
		audio.play('WinLoopChimes',6);
	};
	function ticTacToeLayer(sprite){
		this.layerSprite = sprite;
	}
	
	function ticTacToeCoverLayer(sprite, size, zIndex){
		ticTacToeLayer.call(this, sprite);
		this.activeCoverIndexArr = null;
		this.covers = null;
		this.perCoverSize = size;
		this.zIndex = zIndex;
	}
	ticTacToeCoverLayer.prototype.init = function(){
		var cvObjs = this.layerSprite.getChildren();
		var coverSize = this.perCoverSize;
		var zIndex = this.zIndex;
		var arr = [];
		for(var name in cvObjs){
			var cv = new ticTacToeCover(name, coverSize, zIndex);     
			cv.removeEventListener();
			cv.bindEventListener();
			cv.setInactive();    
			arr.push(cv);
		}
		this.covers = arr;
	};
   
	ticTacToeCoverLayer.prototype.handleCovers = function(){
		var cvArr = this.covers;
		var actCvIdxArr = this.activeCoverIndexArr;
		cvArr.forEach(function(cv){
			if(actCvIdxArr.indexOf(cv.coverIndex) >= 0){
				cv.setActive();
                cv.animComplete();
				cv.coverSprite.show(true);
                cv.playSprite.show(true);
				cv.disappearSprite.show(false);
				ticTacGrid.detectData.namesForCellsList.push(cv.coverName);
				ticTacGrid.detectData.coversToReveal.push(cv);
				ticTacGrid.detectData.coveredCellsList.push(cv.coveredCells);
			}else{
				cv.coverSprite.show(false);
                cv.playSprite.show(false);
				cv.disappearSprite.show(false);
			}
		});
	};
	
	function ticTacToeCover(name, coverSize, zIndex){
		this.coverName = name;
        var playName = "_playAnim" + name.substring(6);
		var targetName = "_targetEvent" + name.substring(6);
		this.zIndex = zIndex;
		this.coverSprite = gr.lib[name];
        this.playSprite = gr.lib[playName];
		this.targetSprite = gr.lib[targetName];
		this.disappearSprite = gr.lib["_disappear"+name.substring(6)];
		this.coverIndex = parseInt(name.match(/(\d+)$/)[0]).toString();
		var gridSize = ticTacGridSize;
		this.coveredCells = getCoveredCells(gridSize, coverSize, this.coverIndex);   
        var indexImage = Number(name.match(/(\d+)/)[0])-1;
        this.gladDisappearAnimName = disappearAnim[indexImage];
        this.imagePlate = coverCellImage[indexImage];
		this.active = false;
	}
    ticTacToeCover.prototype.playDisappearAnim = function(){
		var _THIS = this;
		gr.getTimer().setTimeout(function(){
			var gladAnimName = _THIS.gladDisappearAnimName;
			_THIS.playSprite.show(false);
			_THIS.disappearSprite.show(true);
			_THIS.disappearSprite.gotoAndPlay(gladAnimName,0.5);
			_THIS.targetSprite.show(false);
			if(_THIS.zIndex === 3){
				audio.play('BoardReveal1',10);
			}else{
				audio.play('BoardReveal2',14);
			}
			gr.getTimer().setTimeout(function(){               
				_THIS.coverSprite.show(false);
                _THIS.disappearSprite.show(false);
				var index = ticTacGrid.detectData.namesForCellsList.indexOf(_THIS.coverName);
				ticTacGrid.detectData.namesForCellsList.splice(index, 1);
				ticTacGrid.detectData.coveredCellsList.splice(index, 1);
				ticTacGrid.detectWinline();
				coverRevealing = false;
			}, disappearAniTime);
		},300);
	};
       
	ticTacToeCover.prototype.resetCover = function(){
		this.setInactive();
        if(this.playSprite.pixiContainer.$sprite.gotoAndStop){
            this.playSprite.gotoAndStop(0);
        }
        if(this.disappearSprite.pixiContainer.$sprite.gotoAndStop){
            this.disappearSprite.gotoAndStop(0);
        }
		this.coverSprite.show(true);
        this.playSprite.show(true);
		this.targetSprite.show(true);
        this.disappearSprite.show(false);        
        gr.getTimer().clearTimeout(this.animTimer);
	};
	ticTacToeCover.prototype.setActive = function(){
		this.active = true;
		this.targetSprite.pixiContainer.interactive = true;
		this.targetSprite.pixiContainer.$sprite.cursor = 'pointer';
	};
	ticTacToeCover.prototype.setInactive = function(){
		this.active = false;
		this.targetSprite.pixiContainer.interactive = false;
		this.targetSprite.pixiContainer.$sprite.cursor = 'default';
	};
	ticTacToeCover.prototype.bindEventListener = function(){
		var _THIS = this;
		this.eventHandler = function(){
			if(_THIS.active){
				if(_THIS.zIndex === 3 && !coverRevealing){
					coverRevealing = true;
					_THIS.reveal();
				}else if(!coverRevealing){	
                    swapClear();
					layerExchange(_THIS);
					_THIS.reveal();       
				}
			}
		};
		var tarS = this.targetSprite;
		var tarGladButton = new gladButton(tarS,'',{'avoidMultiTouch':true});
		tarGladButton.click(this.eventHandler);		
	};
	ticTacToeCover.prototype.removeEventListener = function(){
		this.targetSprite.off('click', this.eventHandler);
	};
	ticTacToeCover.prototype.reveal = function(){
		this.setInactive();
		var detectData = ticTacGrid.detectData;
		if(detectData.coversToReveal.length === 1){
			msgBus.publish('revealTheLastCover');
		}
		if(detectData.coversToReveal.length > 0){
            var idx = indexForTicTacToe(detectData.coversToReveal,this.coverName);
			detectData.coversToReveal.splice(idx, 1);
		}
        this.playSprite.gotoAndStop(0);
        gr.getTimer().clearTimeout(this.playSprite.animTimer);    
		this.playDisappearAnim(); 
        if(detectData.coversToReveal.length >=1){
            gr.getTimer().setTimeout(function(){
                detectData.coversToReveal.forEach(function(elem){
                    elem.playSprite.gotoAndPlay(elem.imagePlate,portraitPlaySpeed);                 
                });
            },playAnimTimer);  
        }
	};
    
    function indexForTicTacToe(coversArray, name){      
        for(var i = 0; i < coversArray.length; i++){
            if(coversArray[i].coverName === name){
                return i;
            }
        }
    }
    
    ticTacToeCover.prototype.animComplete = function(){
        var _THIS = this;
        _THIS.playSprite.onComplete = function(){
            _THIS.playSprite.animTimer = gr.getTimer().setTimeout(function(){
                _THIS.playSprite.gotoAndPlay(_THIS.imagePlate,portraitPlaySpeed);
            },portraitInterval);
        };
    };
	
	function ticTacToeCellLayer(sprite){
		ticTacToeLayer.call(this, sprite);
		this.cellContentArr = null;
		this.cells = null;
	}
	ticTacToeCellLayer.prototype.handleCells = function(){
		var cellSprs = this.layerSprite.getChildren();
		var arr = [];
		for(var name in cellSprs){
			var suffixNum = name.match(/(\d+)$/)[0];
			var idx = parseInt(suffixNum) - 1;
			var symbolCode = this.cellContentArr[idx];
			if(symbolCode.length === 1){
				var sCell = new singleCell(symbolCode,suffixNum);
				sCell.show();
				sCell.fill();
				arr.push(sCell);
			}else{
				var tCells = new twinCells(symbolCode,suffixNum);
				tCells.show();
				tCells.fill();
				arr.push(tCells);
			}
		}
		this.cells = arr;
	};
	
	function ticTacToeCell(symbol, name){
		this.cellIndex = parseInt(name.match(/(\d+)$/)[0]);
		this.cellSymbol = symbol;
		this.cellSprite = gr.lib[name];
		this.siblingSprite = getSiblings(this.cellSprite);
	}
	ticTacToeCell.prototype.show = function(){
		this.cellSprite.show(true);
		this.siblingSprite.forEach(function(elem){
			elem.show(false);
		});
	};
	
	function singleCell(symbol, index){
		var name = '_singleCell' + index;
		ticTacToeCell.call(this, symbol, name);
	}
	singleCell.prototype = Object.create(ticTacToeCell.prototype);
	singleCell.prototype.constructor = singleCell;
	singleCell.prototype.fill = function(){
		var imgName = symbolImgs[this.cellSymbol];
		this.cellSprite.setImage(imgName);
	};
	singleCell.prototype.playMatchedAnim = function(symbolCode){
		var animName = symbolImgs[symbolCode].match(/^(\w+)_/)[1];
        var speed = 0.3;
		this.cellSprite.gotoAndPlay(animName, speed, true);		
	};
	singleCell.prototype.stopAnim = function(){
		this.cellSprite.stopPlay();
	};
	function twinCells(symbol, index){
		var name = '_twinCells' + index;
		ticTacToeCell.call(this, symbol, name);
	}
	twinCells.prototype = Object.create(ticTacToeCell.prototype);
	twinCells.prototype.constructor = twinCells;
	twinCells.prototype.fill = function(){
		var subCellsObj = this.cellSprite.getChildren();
		var subCellsArr = [];
		for(var name in subCellsObj){
			subCellsArr.push(subCellsObj[name]);
		}
		var symbolArr = this.cellSymbol.split('');
		subCellsArr.forEach(function(elem, index){
			var smb = symbolArr[index];
			if(smb){
				elem.setImage(symbolImgs[smb]);
			}else{
				elem.show(false);
			}
		});
	};
	twinCells.prototype.playMatchedAnim = function(symbolCode){
		var animName = symbolImgs[symbolCode].match(/^(\w+)_/)[1];
        var speed = 0.3;
		var subCells = this.cellSprite.getChildren();
		for(var name in subCells){
			var tempName = subCells[name].getImage().match(/^(\w+)_/)[1];
			if(tempName === animName){
				subCells[name].gotoAndPlay(animName, speed, true);
			}
		}
	};
	twinCells.prototype.stopAnim = function(){
		var subCells = this.cellSprite.getChildren();
		for(var name in subCells){
			subCells[name].stopPlay();
		}
	};
	function ticTacToeWinlineLayer(sprite){
		ticTacToeLayer.call(this, sprite);
		this.winlines = null;
	}
	ticTacToeWinlineLayer.prototype.show = function(visibility){
		this.layerSprite.show(visibility);
	};
	ticTacToeWinlineLayer.prototype.init = function(){
		var wlObjs = this.layerSprite.getChildren();
		var winlineLoc = winlineLocations;
		var arr = [];
		for(var name in wlObjs){
			var cellArr = winlineLoc[name];
			var wl = new Winline(name, cellArr);
			arr.push(wl);
		}
		this.winlines = arr;
	};
	ticTacToeWinlineLayer.prototype.resetWinlines = function(){
		this.winlines.forEach(function(wl){
			wl.show(false);
			wl.stopLightAnim();
			wl.associatedCells = [];
		});
	};
	function Winline(name, cellIdxArr){
		var indexStr = name.match(/(\d+)$/)[0];
		this.winlineIndexStr = indexStr;
		this.winlineSprite = gr.lib[name];
		this.associatedCellIndex = cellIdxArr;
		this.associatedCells = [];
		this.lightSprite = gr.lib['_winLineLight' + indexStr];
		this.lightAnimName = '_winLineLightAnim' + indexStr;
		this.visibility = false;
	}
	Winline.prototype.show = function(visibility){
		this.winlineSprite.show(visibility);
		this.visibility = visibility;
	};
	Winline.prototype.fill = function(symbolCode){
		var lineImg = symbolWinlines[symbolCode].line;
		var lightImg = symbolWinlines[symbolCode].light;
		var wlIdx = parseInt(this.winlineIndexStr);
		if(wlIdx > 1){
			lineImg = lineImg + '_Vertical';
		}
		this.winlineSprite.setImage(lineImg);
		this.lightSprite.setImage(lightImg);
	};
	Winline.prototype.playSymbolAnim = function(symbolCode){
		this.associatedCells.forEach(function(cl){
			cl.playMatchedAnim(symbolCode);
		});
	};
	Winline.prototype.playLightAnim = function(){
		this.lightSprite.show(true);
        var animName = this.lightSprite._currentStyle._background._imagePlate.match(/^(\w+)_/)[1];
        this.lightSprite.gotoAndPlay(animName,0.2,true);
	};
	Winline.prototype.stopLightAnim = function(){
		this.lightSprite.show(false);
        if(this.lightSprite.pixiContainer.$sprite.gotoAndStop){
		    this.lightSprite.gotoAndStop(0);
        }
	};
	function onReStartUserInteraction(data) {
		onStartUserInteraction(data);
	}
	function onReInitialize() {
		ticTacGrid.resetAll();  
        swapClear();
	}
	function onGameParametersUpdated(){
		if (SKBeInstant.config.customBehavior) {
            autoRevealInterval = SKBeInstant.config.customBehavior.autoRevealInterval || 2000;
        } else {
            autoRevealInterval = 2000;
        }// SKBeInstant.config.customBehavior.symbolMamaRevealInterval
		var coverLayers = [{sprite: gr.lib._coverLayer3x3, perCoverSize: 9, zIndex: 3}, 
			{sprite: gr.lib._coverLayer2x2, perCoverSize: 4, zIndex: 2},
			{sprite: gr.lib._coverLayer1x1, perCoverSize: 1, zIndex: 1}];
		var cellLayer = gr.lib._symbolsLayer;
		var winlineLayer = gr.lib._winLine;
        gr.lib._winLine.show(false);
		ticTacGrid = new ticTacToeGrid(ticTacGridSize);
		ticTacGrid.init(coverLayers, cellLayer, winlineLayer);
        waterAnimation();
        logoAnimation();
        birdsAnimation();       
	}

    function layerExchange(sp){
        function swapSprite(par,c1,c2){
            par.swapChildren(c1,c2);
        }  
        
        function calculateIndex(par,c1,c2){
            return par.getChildIndex(c1)-par.getChildIndex(c2);
        }
        
        var coversToReveal = ticTacGrid.detectData.coversToReveal;
        if(coversToReveal.length <= 1){return;}
        var sortedArray = sortCovers(coversToReveal);  
        if(sortedArray.length > 1){    
            for(var i in sortedArray){  
                var elem = sortedArray[i];
                if(sp === elem){break;}
                if(checkIfSwap(sp,elem)){
                    var parLayer = sp.coverSprite.parent === elem.coverSprite.parent?sp.coverSprite.parent:gr.lib._gridArea;
                    var c1Layer = parLayer === gr.lib._gridArea?sp.coverSprite.parent:sp.coverSprite;
                    var c2Layer = parLayer === gr.lib._gridArea?elem.coverSprite.parent:elem.coverSprite;
                    if(calculateIndex(parLayer.pixiContainer,c1Layer.pixiContainer,c2Layer.pixiContainer)> 0) {return;}
                    swapSprite(parLayer.pixiContainer,c1Layer.pixiContainer,c2Layer.pixiContainer);                        
                    swapMapping.set(parLayer.pixiContainer,[c1Layer.pixiContainer, c2Layer.pixiContainer]);            
                }
            }
        }
    }
    
    function calculateGlobalLeft(sp){
        var temp = sp.playSprite.toGlobal({x: 0, y: 0});
        return temp;
    }
    
    function checkIfSwap(sp1,sp2){
        var flag = true;
        var maxW = sp1.playSprite._currentStyle._width > sp2.playSprite._currentStyle._width? sp1.playSprite._currentStyle._width:sp2.playSprite._currentStyle._width;
        var maxH = sp1.playSprite._currentStyle._height > sp2.playSprite._currentStyle._height? sp1.playSprite._currentStyle._height:sp2.playSprite._currentStyle._height;
        var spaceY = Math.abs(calculateGlobalLeft(sp1).y - calculateGlobalLeft(sp2).y);
        var spaceX = Math.abs(calculateGlobalLeft(sp1).x - calculateGlobalLeft(sp2).x);
        if(calculateGlobalLeft(sp1).x < calculateGlobalLeft(sp2).x || spaceY > maxH || spaceX > maxW){
            flag = false;
        }
        return flag;
    }

    
    function sortCovers(coversToReveal){
        function sortPosition(a,b){
            if(calculateGlobalLeft(a).x===calculateGlobalLeft(b).x){
                return calculateGlobalLeft(b).y - calculateGlobalLeft(a).y;
            }
            return calculateGlobalLeft(a).x-calculateGlobalLeft(b).x;
        }
        if(coversToReveal.length > 1){
            coversToReveal.sort(sortPosition);
        }
        return coversToReveal;      
    }
    
    function waterAnimation(){
		var waterName = SKBeInstant.getGameOrientation() === "landscape"?"water":"waterP";
		var waterSpeed = SKBeInstant.getGameOrientation() === "landscape"? 0.3:0.5;
        gr.lib._water.gotoAndPlay(waterName,waterSpeed,true);
    }
    
    function birdsAnimation(){
        gr.lib._bird00.onComplete = function(){
            gr.getTimer().setTimeout(function(){
                gr.lib._bird00.gotoAndPlay('birds',0.3,false);
            },birdsIntervalTimer);
        };
        gr.lib._bird00.gotoAndPlay('birds',0.3,false);
    }
    
    function logoAnimation(){
        gr.lib._logo01.onComplete=function(){
            gr.getTimer().setTimeout(function(){
                 gr.lib._logo01.gotoAndPlay("logo",logoSpeed);
            },portraitInterval);
        };
        gr.lib._logo01.gotoAndPlay("logo",logoSpeed);
    }

	function autoReveal(){
		var coversToReveal = ticTacGrid.detectData.coversToReveal;
		coversToReveal.sort(function(a,b){
			return b.zIndex - a.zIndex;
		});
		var delayTime = 0;
		coversToReveal.forEach(function(cv){
			cv.setInactive();
			cv.autoRevealTimer = gr.getTimer().setTimeout(function(){
				cv.reveal();
			}, delayTime);
			if(cv.zIndex === 3){
				delayTime += autoRevealInterval;
			}
		});
	}
	function stopAutoReveal(){
		var coversToReveal = ticTacGrid.detectData.coversToReveal;
		coversToReveal.forEach(function(cv){
			gr.getTimer().clearTimeout(cv.autoRevealTimer);
			cv.setActive();
			cv.bindEventListener();
		});
	}
    function onPlayerWantsPlayAgain(){
        ticTacGrid.resetAll();
        swapClear();
    }
    
    function swapClear(){
        if(!swapMapping.size){return;}
        swapMapping.forEach(function(item,key){
            key.swapChildren(item[0],item[1]);
        });
        swapMapping.clear();
    }
    
    function losterAnimation(){
        gr.lib._disappear3x3_00.show(false);
        gr.lib._playAnim3x3_00.gotoAndPlay('lobster',portraitPlaySpeed);
    }

	msgBus.subscribe('SKBeInstant.gameParametersUpdated', onGameParametersUpdated);
	msgBus.subscribe('jLottery.reInitialize', onReInitialize);
	msgBus.subscribe('jLottery.reStartUserInteraction', onReStartUserInteraction);
	msgBus.subscribe('jLottery.startUserInteraction', onStartUserInteraction);
    msgBus.subscribe('playerWantsPlayAgain', onPlayerWantsPlayAgain);
	msgBus.subscribe('startRevealAll', autoReveal);
	msgBus.subscribe('stopRevealAll', stopAutoReveal);

	return {};
});