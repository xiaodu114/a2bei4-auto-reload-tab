document.addEventListener("DOMContentLoaded", () => {
    //  1、定义一些常量(放到了common.js中)

    //  2、获取dom元素
    //      2.1、新建、编辑相关
    let addEditSection = document.querySelector("section[name='addEditConfigSection']");
    let baseInfoForm = document.forms.formBaseInfo;
    //          2.1.1、打开、关闭更多
    let moreSetOpenEle = document.getElementById("moreSetOpen");
    let moreSetCloseEle = document.getElementById("moreSetClose");
    //          2.1.1、更多相关
    let moreOptionBox = addEditSection.querySelector(".divMoreOption");
    let matchTypeForm = document.forms.formMatchType;
    //      2.2、只读查看相关
    let viewSection = document.querySelector("section[name='viewConfigSection']");
    let detailDivBox = viewSection.querySelector(".viewBox");

    //#region   基本配置表单相关：唯一名称、监听方式、监听地址

    baseInfoForm[FORM_MONITOR_TYPE]?.forEach((radio) => {
        radio.onchange = (evt) => {
            baseInfoForm[FORM_MONITOR_URL].value = "";
        };
    });

    function getFormValuesForBaseInfo() {
        return getFormValuesByFormEle(baseInfoForm);
    }

    function setFormValuesForBaseInfo(obj) {
        setFormValuesForFormEle(baseInfoForm, obj);
    }

    //#endregion

    //#region 开启、关闭更多设置

    function handleOpenCloseMoreSet(mode) {
        switch (mode) {
            case "open": {
                moreSetOpenEle.style.display = "none";
                moreSetCloseEle.style.display = "inline-block";
                moreOptionBox.style.display = "block";
                break;
            }
            case "close": {
                moreSetOpenEle.style.display = "inline-block";
                moreSetCloseEle.style.display = "none";
                moreOptionBox.style.display = "none";
                break;
            }
        }
    }
    moreSetOpenEle.addEventListener("click", () => {
        handleOpenCloseMoreSet("open");
    });
    moreSetCloseEle.addEventListener("click", () => {
        handleOpenCloseMoreSet("close");
    });
    function resetOpenCloseMoreOption(moreOption) {
        if (Array.isArray(moreOption?.reloadUrls) && moreOption.reloadUrls.length) {
            handleOpenCloseMoreSet("open");
            matchTypeChangeHandler(moreOption?.matchType);
        } else {
            handleOpenCloseMoreSet("close");
        }
    }

    //#endregion

    //#region 具体更多设置

    //  切换自动刷新地址的匹配方式
    function toggleFieldsetByName(name, isShow) {
        if (!name) return;
        toggleEleBySelector(`fieldset[name='${name}']`, isShow);
    }
    function matchTypeChangeHandler(value) {
        switch (value) {
            case "Host": {
                toggleFieldsetByName("fieldsetContain", false);
                toggleFieldsetByName("fieldsetHost", true);
                break;
            }
            case "Contain": {
                toggleFieldsetByName("fieldsetHost", false);
                toggleFieldsetByName("fieldsetContain", true);
                break;
            }
        }
    }
    matchTypeForm?.matchType?.forEach((radio) => {
        radio.onchange = (evt) => {
            matchTypeChangeHandler(evt.target.value);
        };
    });

    //  添加、删除匹配地址按钮事件绑定
    function bindFieldsetBtnDeleteEvt(name) {
        if (!name) return;
        let btnList = document.querySelectorAll(`fieldset>legend>button[name='${name}']`);
        if (btnList.length === 1) {
            btnList[0].style.display = "none";
        } else {
            btnList.forEach((btn) => {
                btn.style.display = "inline-block";
                btn.onclick = (evt) => {
                    evt.target.parentElement.parentElement.remove();
                    resetFieldsetAddDeleteEvt();
                };
            });
        }
    }
    function bindFieldsetBtnAddEvt(name) {
        if (!name) return;
        document.querySelectorAll(`fieldset>legend>button[name='${name}']`).forEach((btn) => {
            btn.onclick = (evt) => {
                let newFieldset = evt.target.parentElement.parentElement.cloneNode(true);
                newFieldset.querySelector("form")?.reset();
                evt.target.parentElement.parentElement.after(newFieldset);
                resetFieldsetAddDeleteEvt();
            };
        });
    }
    function resetFieldsetAddDeleteEvt() {
        bindFieldsetBtnAddEvt("fieldsetHostAdd");
        bindFieldsetBtnDeleteEvt("fieldsetHostDelete");

        bindFieldsetBtnAddEvt("fieldsetContainAdd");
        bindFieldsetBtnDeleteEvt("fieldsetContainDelete");
    }

    function resetFieldsetMoreOption() {
        ["fieldsetHost", "fieldsetContain"].forEach((fieldsetName) => {
            let nodes = document.querySelectorAll(`fieldset[name='${fieldsetName}']`);
            if (nodes.length <= 1) return;
            for (let index = 1; index < nodes.length; index++) {
                nodes[index].remove();
            }
            nodes[0]?.querySelector("form")?.reset();
        });
    }

    function resetMoreOption() {
        resetFieldsetMoreOption();
        resetFieldsetAddDeleteEvt();
    }

    function getMoreOptionFormValues(fieldsetName) {
        let retArr = [];
        let forms = document.querySelectorAll(`fieldset[name='${fieldsetName}']>form`);
        if (!forms?.length) return retArr;
        forms.forEach((form) => {
            let formObj = getFormValuesByFormEle(form);
            if (Object.getOwnPropertyNames(formObj).length) {
                retArr.push(formObj);
            }
        });
        return retArr;
    }

    function getMoreOptionValue() {
        let option = {
            matchType: matchTypeForm?.matchType?.value,
            reloadUrls: null
        };
        switch (option.matchType) {
            case "Host": {
                option.reloadUrls = getMoreOptionFormValues("fieldsetHost");
                break;
            }
            case "Contain": {
                option.reloadUrls = getMoreOptionFormValues("fieldsetContain");
                break;
            }
        }
        return option.matchType && Array.isArray(option.reloadUrls) && option.reloadUrls.length ? option : null;
    }

    function editMoreOption(moreOption) {
        if (!(moreOption && moreOption.matchType && Array.isArray(moreOption.reloadUrls) && moreOption.reloadUrls.length)) return;

        let fieldset = null;
        matchTypeForm.matchType.value = moreOption.matchType;
        switch (moreOption.matchType) {
            case "Host": {
                fieldset = document.querySelector(`fieldset[name='fieldsetHost']`);
                break;
            }
            case "Contain": {
                fieldset = document.querySelector(`fieldset[name='fieldsetContain']`);
                break;
            }
        }
        if (fieldset) {
            for (let index = 1; index < moreOption.reloadUrls.length; index++) {
                let newFieldset = fieldset.cloneNode(true);
                setFormValuesForFormEle(newFieldset.querySelector("form"), moreOption.reloadUrls[index]);
                fieldset.after(newFieldset);
            }
            setFormValuesForFormEle(fieldset.querySelector("form"), moreOption.reloadUrls[0]);
        }
        resetOpenCloseMoreOption(moreOption);
        resetFieldsetAddDeleteEvt();
    }

    //#endregion

    //#region 保存配置、删除设置

    function broadcastRefreshConfig() {
        chrome.runtime.sendMessage({ type: "event-transfer-click", action: "refresh-extension-config", data: null }, (response) => {});
    }

    document.getElementById("btnSave")?.addEventListener("click", () => {
        function afterSave(item) {
            viewSection.setAttribute("data-item-id", "");
            openViewMode(item);
            broadcastRefreshConfig();
        }
        //  如果是编辑保存需要主键ID
        let id = viewSection.getAttribute("data-item-id");
        let saveItem = getFormValuesForBaseInfo();
        if (saveItem[FORM_MONITOR_TYPE] && saveItem[FORM_MONITOR_URL]) {
            let option = getMoreOptionValue();
            if (option) {
                saveItem[FORM_GROUP_MORE_OPTION] = option;
            }
            saveItem.id = id ? id : Date.now().toString();
            if (id) {
                editConfigItem(saveItem).then(() => {
                    afterSave(saveItem);
                });
            } else {
                addConfigItem(saveItem).then(() => {
                    afterSave(saveItem);
                });
            }
        } else {
            alert("请检查是否输入完整！");
        }
    });

    document.getElementById("btnDelete")?.addEventListener("click", () => {
        let id = viewSection.getAttribute("data-item-id");
        deleteConfigItem(id).then(() => {
            viewSection.setAttribute("data-item-id", "");
            openAddMode();
            broadcastRefreshConfig();
        });
        //chrome.storage.local.clear(() => {});
    });

    document.getElementById("btnEdit")?.addEventListener("click", () => {
        let id = viewSection.getAttribute("data-item-id");
        getConfigItemById(id).then((item) => {
            openEditMode(item);
        });
    });

    //#endregion

    //#region

    function openAddMode() {
        addEditSection.style.display = "block";
        viewSection.setAttribute("data-item-id", "");
        detailDivBox.innerHTML = "";
        viewSection.style.display = "none";

        resetOpenCloseMoreOption();
        resetMoreOption();
    }

    function openViewMode(obj) {
        //  新增相关
        if (document.forms.length) {
            Array.from(document.forms).forEach((form) => {
                form.reset();
            });
        }
        addEditSection.style.display = "none";
        //  详情相关
        viewSection.setAttribute("data-item-id", obj.id);
        detailDivBox.append(buildViewContent(obj));
        viewSection.style.display = "block";

        resetMoreOption();
    }

    function openEditMode(obj) {
        openAddMode();
        viewSection.setAttribute("data-item-id", obj.id);
        setFormValuesForBaseInfo(obj);
        editMoreOption(obj[FORM_GROUP_MORE_OPTION]);
    }
    //#endregion

    getAllConfigItems().then((items) => {
        if (Array.isArray(items) && items.length) {
            openViewMode(items[0]);
        } else {
            openAddMode();
        }
    });
});
