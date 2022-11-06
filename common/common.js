//  定义一些常量
const CRX_EN_NAME = "AutoReloadTabByConfig"; //     插件名称
const CRX_DB_ITEMS = CRX_EN_NAME + "_Items"; //     配置项的存储Key（可以相当于表名）
const CRX_DB_MONITOR_IDS = CRX_EN_NAME + "_MonitorItemIds"; //     配置项的存储Key（可以相当于表名）

const FORM_ID_Name = "idName";
const FORM_MONITOR_TYPE = "monitorType";
const FORM_MONITOR_URL = "monitorUrl";
const FORM_GROUP_MORE_OPTION = "moreOption";

//#region   业务无关通用方法

/**
 * 根据筛选器展示、隐藏元素
 * @param {String} selector   筛选器
 * @param {Boolean} isShow     是否显示
 * @param {String} showValue  显示时的值，默认为：block
 * @param {String} hideValue  隐藏时的值，默认为：none
 * @returns
 */
function toggleEleBySelector(selector, isShow, showValue, hideValue) {
    if (!selector) return;
    let eleList = document.querySelectorAll(selector);
    if (!eleList.length) return;
    if (isShow) {
        eleList.forEach((ele) => {
            ele.style.display = showValue || "block";
        });
    } else {
        eleList.forEach((ele) => {
            ele.style.display = hideValue || "none";
        });
    }
}

/**
 * 根据表单元素获取表单的值
 * @param {HTMLFormElement} formEle
 * @returns
 */
function getFormValuesByFormEle(formEle) {
    //#region   方式一

    // let formObj = {};
    // if (formEle?.length) {
    //     Array.from(formEle).forEach((item) => {
    //         if (!item.name) return;
    //         formObj[item.name] = item.value;
    //     });
    // }
    // return formObj;

    //#endregion

    return Object.fromEntries(new FormData(formEle).entries());
}

/**
 * 设置表单的值
 * @param {HTMLFormElement} formEle
 * @param {Object} formObj
 * @returns
 */
function setFormValuesForFormEle(formEle, formObj) {
    if (formEle?.length && formObj) {
        Array.from(formEle).forEach((item) => {
            if (!(item.name && formObj.hasOwnProperty(item.name))) return;
            formEle[item.name].value = formObj[item.name];
        });
    }
}

//#endregion

//#region   chrome.storage相关

function getDataByKeys(keys) {
    return new Promise((resolve, reject) => {
        if (Array.isArray(keys) && keys.length) {
            chrome.storage.local.get(keys, (obj) => {
                resolve(obj);
            });
        } else {
            resolve({});
        }
    });
}

function getAllConfigItems() {
    return new Promise((resolve, reject) => {
        getDataByKeys([CRX_DB_ITEMS]).then((obj) => {
            resolve(Array.isArray(obj[CRX_DB_ITEMS]) ? obj[CRX_DB_ITEMS] : []);
        });
    });
}

function getConfigItemById(id) {
    return new Promise((resolve, reject) => {
        getDataByKeys([CRX_DB_ITEMS]).then((obj) => {
            resolve(
                [].filter.call(Array.isArray(obj[CRX_DB_ITEMS]) ? obj[CRX_DB_ITEMS] : [], (item) => {
                    return item.id === id;
                })[0]
            );
        });
    });
}

function addConfigItem(item) {
    return new Promise((resolve, reject) => {
        getAllConfigItems().then((items) => {
            items.unshift(item);
            chrome.storage.local.set({ [CRX_DB_ITEMS]: items }, (data) => {
                resolve(item);
            });
        });
    });
}

function editConfigItem(newItem) {
    return new Promise((resolve, reject) => {
        getAllConfigItems().then((items) => {
            let tempIndex = [].findIndex.call(items, (item) => {
                return newItem.id === item.id;
            });
            if (tempIndex >= 0) {
                items.splice(tempIndex, 1, newItem);
                chrome.storage.local.set({ [CRX_DB_ITEMS]: items }, (data) => {
                    resolve(true);
                });
            } else {
                resolve(false);
            }
        });
    });
}

function deleteConfigItem(id) {
    return new Promise((resolve, reject) => {
        getAllConfigItems().then((items) => {
            let tempIndex = [].findIndex.call(items, (item) => {
                return id === item.id;
            });
            if (tempIndex >= 0) {
                items.splice(tempIndex, 1);
                chrome.storage.local.set({ [CRX_DB_ITEMS]: items }, (data) => {
                    resolve(true);
                });
            } else {
                resolve(true);
            }
        });
    });
}

function getConfigItemsAndMonitorIds() {
    return new Promise((resolve, reject) => {
        getDataByKeys([CRX_DB_ITEMS, CRX_DB_MONITOR_IDS]).then((obj) => {
            resolve(obj);
        });
    });
}

function getMonitorItemIds() {
    return new Promise((resolve, reject) => {
        getDataByKeys([CRX_DB_MONITOR_IDS]).then((obj) => {
            resolve(Array.isArray(obj[CRX_DB_MONITOR_IDS]) ? obj[CRX_DB_MONITOR_IDS] : []);
        });
    });
}

function addMonitorItemId(id) {
    return new Promise((resolve, reject) => {
        getMonitorItemIds().then((items) => {
            if (items.includes(id)) {
                resolve(id);
            } else {
                items.push(id);
                chrome.storage.local.set({ [CRX_DB_MONITOR_IDS]: items }, (data) => {
                    resolve(id);
                });
            }
        });
    });
}

function deleteMonitorItemId(id) {
    return new Promise((resolve, reject) => {
        getMonitorItemIds().then((items) => {
            let tempIndex = [].findIndex.call(items, (item) => {
                return id === item;
            });
            if (tempIndex >= 0) {
                items.splice(tempIndex, 1);
                chrome.storage.local.set({ [CRX_DB_MONITOR_IDS]: items }, (data) => {
                    resolve(true);
                });
            } else {
                resolve(true);
            }
        });
    });
}

//#endregion

//#region   构建查看详情

function buildViewContent(obj) {
    //  内部方法
    function createReadonlyFormItem(label, value) {
        return cr.createContextualFragment(`
                <p class="form-item-readonly-mode">
                    <label class="form-item-label">${label}：</label>
                    <label class="form-item-value">${value}</label>
                </p>`);
    }

    let cr = document.createRange(),
        fragment = document.createDocumentFragment();
    let prop2CnName = {
        idName: "唯一名称",
        [FORM_MONITOR_TYPE]: "监听方式",
        [FORM_MONITOR_URL]: "监听地址",
        matchType: "匹配方式",
        urlHostName: "主机名",
        urlPort: "端口",
        urlContainKey: "关键词"
    };
    let monitorTypeText = "";
    switch (obj[FORM_MONITOR_TYPE]) {
        case "sse": {
            monitorTypeText = "Server-sent Events";
            break;
        }
        case "ws": {
            monitorTypeText = "WebSocket";
            break;
        }
    }
    fragment.appendChild(createReadonlyFormItem(prop2CnName.idName, obj.idName));
    fragment.appendChild(createReadonlyFormItem(prop2CnName[FORM_MONITOR_TYPE], monitorTypeText));
    fragment.appendChild(createReadonlyFormItem(prop2CnName[FORM_MONITOR_URL], obj[FORM_MONITOR_URL]));
    if (obj[FORM_GROUP_MORE_OPTION]) {
        let matchTypeText = "";
        switch (obj[FORM_GROUP_MORE_OPTION].matchType) {
            case "Host": {
                matchTypeText = "主机名和端口";
                break;
            }
            case "Contain": {
                matchTypeText = "包含";
                break;
            }
        }
        fragment.appendChild(createReadonlyFormItem(prop2CnName.matchType, matchTypeText));
        if (Array.isArray(obj[FORM_GROUP_MORE_OPTION].reloadUrls) && obj[FORM_GROUP_MORE_OPTION].reloadUrls.length) {
            [].forEach.call(obj[FORM_GROUP_MORE_OPTION].reloadUrls, (formObj, index) => {
                let node = document.createElement("fieldset");
                node.appendChild(cr.createContextualFragment(`<legend>刷新地址->${index + 1}</legend>`));
                for (const key in formObj) {
                    if (Object.hasOwnProperty.call(formObj, key)) {
                        node.appendChild(createReadonlyFormItem(prop2CnName[key], formObj[key]));
                    }
                }
                fragment.appendChild(node);
            });
        }
    }
    return fragment;
}

//#endregion
