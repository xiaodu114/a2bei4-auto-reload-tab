//  https://learn.microsoft.com/zh-cn/microsoft-edge/extensions-chromium/developer-guide/declare-permissions
//  https://juejin.cn/post/7021072232461893639

let myES = null;

function tabIsMatchConfig(tab, items) {
    let isValid = false;
    function fn(inItems) {
        let inIsValid = false;
        for (let index = 0; index < inItems.length; index++) {
            const item = inItems[index];
            if (item && item[FORM_GROUP_MORE_OPTION] && item[FORM_GROUP_MORE_OPTION].matchType && Array.isArray(item[FORM_GROUP_MORE_OPTION].reloadUrls) && item[FORM_GROUP_MORE_OPTION].reloadUrls.length) {
                switch (item[FORM_GROUP_MORE_OPTION].matchType) {
                    case "Host": {
                        let tempURL = new URL(tab.url);
                        inIsValid =
                            [].filter.call(item[FORM_GROUP_MORE_OPTION].reloadUrls, (item) => {
                                return item?.urlHostName?.trim() === tempURL.hostname && item?.urlPort?.trim() === tempURL.port;
                            }).length > 0;
                        break;
                    }
                    case "Contain": {
                        inIsValid =
                            [].filter.call(item[FORM_GROUP_MORE_OPTION].reloadUrls, (item) => {
                                return tab.url?.includes(item?.urlContainKey?.trim());
                            }).length > 0;
                        break;
                    }
                }
            }
            if (inIsValid) {
                break;
            }
        }
        return inIsValid;
    }
    return new Promise((resolve, reject) => {
        if (!(tab && tab.url)) {
            resolve(isValid);
            return;
        }
        if (items === undefined) {
            getAllConfigItems().then((data) => {
                isValid = fn(data);
                resolve(isValid);
            });
        } else {
            if (!Array.isArray(items)) items = [];
            isValid = fn(items);
            resolve(isValid);
        }
    });
}

function toggleBrowserActionIcon(isValid, tabId) {
    if (isValid) {
        chrome.browserAction.setIcon({
            path: {
                128: "images/logo.png"
            },
            tabId
        });
    } else {
        chrome.browserAction.setIcon({
            path: {
                128: "images/logo-gray.png"
            },
            tabId
        });
    }
}

//#region   开启、停止监听

//#region   EventSource相关

//  https://developer.mozilla.org/zh-CN/docs/Web/API/WebSocket
//  https://www.runoob.com/html/html5-websocket.html
//  https://github.com/websockets/ws
//  https://www.cnblogs.com/konghaowei/p/14891570.html

function startEventSource(item, successCallback, errorCallback) {
    if (myES) return;

    myES = new EventSource(item[FORM_MONITOR_URL]);
    myES.addEventListener(
        "open",
        (event) => {
            // chrome.storage.local.set({ [isMonitoring]: true }, (data) => {});
            successCallback && successCallback();
        },
        false
    );

    myES.addEventListener(
        "message",
        (event) => {
            chrome.tabs.query({}, function (tabs) {
                if (Array.isArray(tabs) && tabs.length) {
                    // chrome.tabs.reload(tabs[0].id, { bypassCache: true });
                    tabs.forEach(async (tab) => {
                        let isValid = await tabIsMatchConfig(tab, [item]);
                        if (isValid) {
                            chrome.tabs.reload(tab.id, { bypassCache: true });
                        }
                    });
                }
            });
        },
        false
    );

    myES.addEventListener("error", (event) => {
        myES && myES.close();
        myES = null;
        errorCallback && errorCallback();
    });
}

function stopEventSource(item, successCallback, errorCallback) {
    myES && myES.close();
    myES = null;
    successCallback && successCallback();
}

//#endregion

//#region   WebSocket相关（稍后提供）
//#endregion

//#region   分发：调用EventSource或者WebSocket

function startMonitorHandler(item, successCallback, errorCallback) {
    if (!(item && item[FORM_MONITOR_TYPE] && item[FORM_MONITOR_URL])) {
        errorCallback && errorCallback();
        return;
    }
    switch (item[FORM_MONITOR_TYPE]) {
        case "sse": {
            startEventSource(item, successCallback, errorCallback);
            break;
        }
        case "ws": {
            break;
        }
    }
}

function stopMonitorHandler(item, successCallback, errorCallback) {
    if (!(item && item[FORM_MONITOR_TYPE])) {
        errorCallback && errorCallback();
        return;
    }
    switch (item[FORM_MONITOR_TYPE]) {
        case "sse": {
            stopEventSource(item, successCallback, errorCallback);
            break;
        }
        case "ws": {
            break;
        }
    }
}

//#endregion

//  popup.js 通知开启、停止监听
chrome.runtime.onMessage.addListener(function (request, sender, sendResponse) {
    if (request.type === "event-transfer-click") {
        switch (request.action) {
            case "start-monitor": {
                startMonitorHandler(
                    request.data,
                    () => {
                        sendResponse(true);
                    },
                    () => {
                        sendResponse(false);
                    }
                );
                break;
            }
            case "stop-monitor": {
                stopMonitorHandler(
                    request.data,
                    () => {
                        sendResponse(true);
                    },
                    () => {
                        sendResponse(false);
                    }
                );
                break;
            }
            case "refresh-extension-config": {
                break;
            }
        }
    }
    return true;
});

//#endregion

//#region   切换插件图标

//  方案一：
chrome.tabs.onUpdated.addListener(function (tabId, changeInfo, tab) {
    tabIsMatchConfig(tab).then((isValid) => {
        toggleBrowserActionIcon(isValid, tabId);
    });
});

chrome.tabs.onActivated.addListener(function (tabId, selectInfo) {
    chrome.tabs.query({ active: true }, function (tabs) {
        if (Array.isArray(tabs) && tabs.length) {
            tabs.forEach(async (tab) => {
                let isValid = await tabIsMatchConfig(tab);
                toggleBrowserActionIcon(isValid, tab.id);
            });
        }
    });
});

////  方案二：
// chrome.runtime.onInstalled.addListener(function () {
//     //  感觉这种方式不太好使……
//     //  https://stackoverflow.com/questions/64473519/how-to-disable-gray-out-page-action-for-chrome-extension
//     chrome.declarativeContent.onPageChanged.removeRules(undefined, function () {
//         chrome.declarativeContent.onPageChanged.addRules([
//             {
//                 conditions: [
//                     new chrome.declarativeContent.PageStateMatcher({
//                         pageUrl: { urlContains: "localhost:8000" }
//                     })
//                 ],
//                 actions: [new chrome.declarativeContent.ShowPageAction()]
//             }
//         ]);
//     });
// });

//#endregion
