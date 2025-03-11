/**
 * @module control some game config
 * @description control the customized data of paytable&help page and other customized config
 */
define({
    style: {
        "ticketCostLevelIcon": {
            "_width": "22",
            "_height": "4",
            "_top": "82"
        },
        
        "dropShadow": {
            padding: 2,
            dropShadow: true,
            dropShadowDistance: 2.5
        }
    },
    textAutoFit: {
        "autoPlayText": {
            "isAutoFit": true
        },
        "autoPlayMTMText": {
            "isAutoFit": true
        },
        "buyText": {
            "isAutoFit": true
        },
        "tryText": {
            "isAutoFit": true
        },
        "warningExitText": {
            "isAutoFit": true
        },
        "warningContinueText": {
            "isAutoFit": true
        },
        "errorExitText": {
            "isAutoFit": true
        },
        "errorTitle": {
            "isAutoFit": true
        },
        "exitText": {
            "isAutoFit": true
        },
        "playAgainText": {
            "isAutoFit": true
        },
        "playAgainMTMText": {
            "isAutoFit": true
        },
        "MTMText": {
            "isAutoFit": true
        },
        "win_Text": {
            "isAutoFit": true
        },
        "win_Try_Text": {
            "isAutoFit": true
        },
        "win_Value": {
            "isAutoFit": true
        },
        "closeWinText": {
            "isAutoFit": true
        },
        "nonWin_Text": {
            "isAutoFit": true
        },
        "closeNonWinText": {
            "isAutoFit": true
        },
        "win_Value_color": {
            "isAutoFit": true
        },
        "ticketCostText": {
            "isAutoFit": true
        },
        "ticketCostValue": {
            "isAutoFit": true
        },
        "tutorialTitleText": {
            "isAutoFit": true
        },
        "closeTutorialText": {
            "isAutoFit": true
        },
        "winUpToText": {
            "isAutoFit": true
        },
        "winUpToValue": {
            "isAutoFit": true            
        }
    },
    audio: {
        "ButtonGeneric":{
            "name":"UiClickConfirm",
            "channel":"7"
        },        
        "gameLoop": {
            "name": "LuckyLarry_BGM",
            "channel": "3"
        },
        "gameWin": {
            "name": "SummaryScreen",
            "channel": "5"
        },
        "gameNoWin": {
            "name": "LoseSting",
            "channel": "5"
        },
        "ButtonBetMax": {
            "name": "BetMax",
            "channel": "0"
        },
        "ButtonBetUp": {
            "name": "BetUp",
            "channel": [11,12,13]
        },
        "ButtonBetDown": {
            "name": "BetDown",
            "channel": [0,1,2]
        },
		"PaytableOpen": {
            "name": "UiClick",
            "channel": "9"
		},
		"PaytableClose": {
            "name": "UiClick",
            "channel": "9"
		},
        "RevealAll":{
            "name":"RevealAll",
            "channel":"4"
        },
        "symbolWinLoop":{
            "name":"WinLoop",
            "channel":"6"
        },
        "BoardReveal1":{
            "name":"BoardReveal1",
            "channel":"2"
        },
        "BoardReveal2":{
            "name":"BoardReveal2",
            "channel":"2"
        }
    },
    gladButtonImgName: {
        //audioController
        "buttonAudioOn": "buttonAudioOn",
        "buttonAudioOff": "buttonAudioOff",
        //buyAndTryController
        "buttonTry": "buttonMeter",
        "buttonBuy": "buttonMeter",
        //errorWarningController
        "warningContinueButton": "buttonMeter",
        "warningExitButton": "buttonMeter",
        "errorExitButton": "buttonMeter",
        //exitAndHomeController
        "buttonExit": "buttonMeter",
        "buttonHome": "buttonHome",
        //playAgainController
        "buttonPlayAgain": "buttonMeter",
        "buttonPlayAgainMTM": "buttonMeter",
        //playWithMoneyController
        "buttonMTM": "buttonMeter",
        //resultController
        "buttonWinClose": "buttonMeter",
        "buttonNonWinClose": "buttonMeter",
        //ticketCostController
        "ticketCostPlus": "ticketCostPlus",
        "ticketCostMinus": "ticketCostMinus",
        //tutorialController
        "iconOff": "tutorialPageIconOff",
        "iconOn": "tutorialPageIconOn",
        "tutorialButtonClose": "buttonMeter",
        //revealAllController
        "buttonAutoPlay": "buttonMeter",
        "buttonAutoPlayMTM": "buttonMeter"
    },
    gameParam: {
        //tutorialController
        "pageNum": 3,
        //ticketCostController
        "arrowPlusSpecial": true 
    }
});