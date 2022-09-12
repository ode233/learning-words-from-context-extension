import 'regenerator-runtime/runtime.js';
import { addNote, createDeck, createModel, getDeckNames, getModelNames } from '../common/api/ankiApi';
import { getYoudaoTranslate } from '../common/api/translateApi';
import { ANKI_DECK_NAME, ANKI_MODEL_NAME } from '../common/constants/ankiConstants';
import { WATCH_NETFLIX_URL, WATCH_URL_LIST } from '../common/constants/watchVideoConstants';
import { PopupProps } from '../content/translate/popup';

console.log('background');

chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
    // read changeInfo data and do something with it (like read the url)
    if (changeInfo.status === 'loading' && tab.url?.match(WATCH_NETFLIX_URL)) {
        chrome.scripting.executeScript({
            target: { tabId: tabId },
            files: ['watchVideo/netflix/content.js']
        });
    }
});

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    switch (request.contentScriptQuery) {
        case 'youdaoTranslate': {
            getYoudaoTranslate(request.content).then((data) => {
                let tgt = data.translateResult[0][0].tgt;
                sendResponse(tgt);
            });
            return true; // Will respond asynchronously.
        }
        case 'captureVisibleTab': {
            chrome.tabs.captureVisibleTab((imgUrl: string) => {
                sendResponse(imgUrl);
            });
            return true;
        }
        case 'ankiExport': {
            addNote(request.content).then((data) => {
                sendResponse(data);
            });
            return true;
        }
        case 'getContextFromVideo': {
            chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
                chrome.tabs.sendMessage(tabs[0].id!, { backgroundQuery: 'getContextFromVideo' }, (data) => {
                    sendResponse(data);
                });
            });
            return true;
        }
    }
});

checkAnkiConfig();

async function checkAnkiConfig() {
    let deckNames: [string] = (await getDeckNames()).result;
    if (!deckNames.includes(ANKI_DECK_NAME)) {
        console.log('createDeck');
        await createDeck();
    }
    let modelNames: [string] = (await getModelNames()).result;
    if (!modelNames.includes(ANKI_MODEL_NAME)) {
        console.log('createModel');
        let resp = await createModel();
    }
}
