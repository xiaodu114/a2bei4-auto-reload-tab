document.addEventListener("DOMContentLoaded", () => {
    /**
     * 构建列表
     * @param {*} items
     * @param {*} monitorIds
     * @returns
     */
    function buildItemNameList(items, monitorIds) {
        if (!Array.isArray(monitorIds)) monitorIds = [];
        if (!(Array.isArray(items) && items.length)) return;

        let cr = document.createRange(),
            fragment = document.createDocumentFragment();
        items.forEach((item) => {
            fragment.appendChild(
                cr.createContextualFragment(`
                <div class="config-item-for-toggle-monitor" data-item-id="${item.id}">
                    <div class="left-text"><label>${item[FORM_ID_Name]}</label></div>
                    <div class="right-operate">
                        ${monitorIds.includes(item.id) ? '<button type="button" data-action="stop">停止</button>' : '<button type="button" data-action="start">开始</button>'}
                    </div>
                </div>`)
            );
        });
        return fragment;
    }

    //  获取Dom
    let divOpenOptionsEle = document.getElementById("divOpenOptions");
    let sectionConfigEle = document.querySelector("section[name='sectionConfig']");
    let viewBoxEle = document.querySelector("section[name='sectionConfig']>.viewBox");
    let sectionMsgEle = document.querySelector("section[name='sectionMsg']");

    //  打开选项页
    divOpenOptionsEle.addEventListener("click", (evt) => {
        chrome.runtime.openOptionsPage(() => {});
    });

    viewBoxEle.addEventListener("click", (evt) => {
        //  evt.currentTarget   定义点击事件的元素，这里指的是viewBoxEle
        //  evt.target          你真正点击的元素
        if (!evt.target.hasAttribute("data-action")) return;
        let itemEle = evt.target.closest(".config-item-for-toggle-monitor[data-item-id]");
        if (!itemEle) return;
        let id = itemEle.dataset.itemId;
        if (!id) return;

        getConfigItemById(id).then((item) => {
            switch (evt.target.dataset.action) {
                case "start": {
                    chrome.runtime.sendMessage({ type: "event-transfer-click", action: "start-monitor", data: item }, (response) => {
                        if (response) {
                            addMonitorItemId(id).then(() => {
                                init();
                            });
                        } else {
                            alert("开启监听失败，请确保服务器端正常。之后重新点击“开始”");
                        }
                    });
                    break;
                }
                case "stop": {
                    chrome.runtime.sendMessage({ type: "event-transfer-click", action: "stop-monitor", data: item }, (response) => {
                        if (response) {
                            deleteMonitorItemId(id).then(() => {
                                init();
                            });
                        } else {
                            alert("停止监听失败");
                        }
                    });
                    break;
                }
            }
        });
    });

    function init() {
        getConfigItemsAndMonitorIds().then((obj) => {
            viewBoxEle.innerHTML = "";
            let fragment = buildItemNameList(obj[CRX_DB_ITEMS], obj[CRX_DB_MONITOR_IDS]);
            if (fragment) {
                viewBoxEle.append(fragment);
                sectionConfigEle.style.display = "block";
                sectionMsgEle.style.display = "none";
            } else {
                viewBoxEle.innerHTML = "";
                sectionConfigEle.style.display = "none";
                sectionMsgEle.style.display = "block";
            }
        });
    }

    init();
});
