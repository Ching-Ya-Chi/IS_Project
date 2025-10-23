document.addEventListener('DOMContentLoaded', function() {
    const mainContentArea = document.getElementById('main-content-area');
    const popupOverlay = document.getElementById('popup-overlay');
    const teaGardenSelectionPopupPage = document.getElementById('tea-garden-selection-popup-page');
    const friendFocusSettingsPopupPage = document.getElementById('friend-focus-settings-popup-page');
    const focusCompletionPopupPage = document.getElementById('focus-completion-popup-page');
    const focusEarlyTerminationPopupPage = document.getElementById('focus-early-termination-popup-page');
    const decorationSelectionPopupPage = document.getElementById('decoration-selection-popup-page');
    const teaCollectionPopupPage = document.getElementById('tea-collection-popup-page');

    let pageHistory = [];
    let currentDecorationImage = './img/IdlePerson.png'; // 追蹤主頁當前裝扮圖片 (角色圖片)

    // 新增：用於追蹤本次專注所培育出的茶種和圖片 (用於完成頁面)
    let currentFocusedTeaName = '未知茶種'; // 預設值，將被隨機選擇的茶種名稱覆蓋
    let currentFocusedTeaImageSrc = './img/tea_placeholder.png'; // 預設值，將被隨機選擇的茶種圖片覆蓋


    // ****** 專注時間對應的圖片組 (新增) ******
    const timeBasedImages = [
        './img/white_tea.png', // 1-45 分鐘
        './img/oolong_tea.png', // 46-90 分鐘
        './img/red_tea.png', // 91-135 分鐘
        './img/black_tea.png'  // 136-180 分鐘
    ];
    // 請將上述路徑替換為您實際的圖片路徑
    // ****** 專注時間對應的圖片組結束 ******

    // ****** 成就與裝扮圖片組數據結構 (新增) ******
    const achievementSets = [
        {
            accessory: './img/成就1_服飾.jpg', // 請在這裡輸入第一組配件圖片路徑
            cabinet: './img/red_tea.png',     // 請在這裡輸入第一組茶櫃物品圖片路徑
            character: './img/成就1_idle.png'  // 請在這裡輸入第一組角色+配件的圖片路徑 (用於main page)
        },
        {
            accessory: './img/成就2_服飾.jpg', // 請在這裡輸入第一組配件圖片路徑
            cabinet: './img/yellow_tea.png',     // 請在這裡輸入第一組茶櫃物品圖片路徑
            character: './img/成就2_idle.jpg'
        },
        {
            accessory: './img/成就3_服飾.jpg', // 請在這裡輸入第一組配件圖片路徑
            cabinet: './img/黃茶_文山包種茶.png',     // 請在這裡輸入第一組茶櫃物品圖片路徑
            character: './img/成就3_idle.jpg'
        }
    ];
    let currentAchievementSetIndex = 0; // 當前顯示的組圖索引
    // ****** 成就與裝扮圖片組數據結構結束 ******


    // ****** 茶葉圖片數據結構 (新增了 `name` 屬性) ******
    const teaImagesByCategory = {
        'red_tea': [
            { src: './img/紅茶_日月潭.png', name: '日月潭紅茶' },
            { src: './img/紅茶_蜜香.png', name: '蜜香紅茶' },
            { src: './img/紅茶_錫蘭.png', name: '錫蘭紅茶' },
            { src: './img/紅茶_阿薩姆.png', name: '阿薩姆紅茶' }
        ],
        'green_tea': [
            { src: './img/綠茶_抹茶.png', name: '抹茶' },
            { src: './img/綠茶_煎茶.png', name: '煎茶' },
            { src: './img/綠茶_玉露.png', name: '玉露' },
            { src: './img/綠茶_碧螺春.png', name: '碧螺春' },
            { src: './img/綠茶_龍井.png', name: '龍井' }
        ],
        'yellow_tea': [
            { src: './img/黃茶_凍頂烏龍.png', name: '凍頂烏龍' },
            { src: './img/黃茶_岩茶.png', name: '岩茶' },
            { src: './img/黃茶_文山包種茶.png', name: '文山包種茶' },
            { src: './img/黃茶_東方美人.png', name: '東方美人' },
            { src: './img/黃茶_鐵觀音.png', name: '鐵觀音' },
            { src: './img/黃茶_高山茶.png', name: '高山茶' },
            { src: './img/黃茶_鳳凰單欉.png', name: '鳳凰單欉' },
            
        ]
    };
    // ****** 茶葉圖片數據結構結束 ******


    // ****** 計時器相關變數和函數 ******
    let focusTimerInterval = null;
    let focusTotalSeconds = 0;
    let focusRemainingSeconds = 0;
    let selectedGardenName = '金城茶園';
    // let selectedTeaType = '包種茶'; // 這個變數現在由 currentFocusedTeaName 取代或更新


    function parseTimeToSeconds(timeString) {
        const parts = timeString.split(':');
        if (parts.length === 2) {
            const hours = parseInt(parts[0], 10);
            const minutes = parseInt(parts[1], 10);
            return (hours * 3600) + (minutes * 60);
        }
        return 0;
    }

    // 新增：將總分鐘數轉換為 HH:MM 格式
    function convertMinutesToHHMM(totalMinutes) {
        const hours = Math.floor(totalMinutes / 60);
        const minutes = totalMinutes % 60;
        return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`;
    }

    function formatSecondsToDisplay(seconds) {
        const h = Math.floor(seconds / 3600);
        const m = Math.floor((seconds % 3600) / 60);
        const s = seconds % 60;
        return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
    }

    function formatSecondsToMinutesSeconds(seconds) {
        const m = Math.floor(seconds / 60);
        const s = seconds % 60;
        return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
    }

    function updateFocusDisplay() {
        const remainingTimeDisplay = mainContentArea.querySelector('#remaining-time-display');
        // 確保在個人專注頁面也有 remaining-time-display
        if (!remainingTimeDisplay) { // 如果找不到計時器顯示元素，表示可能頁面已切換
            endFocusSession(false);
            return;
        }

        if (focusRemainingSeconds <= 0) {
            endFocusSession(true);
            return;
        }

        remainingTimeDisplay.textContent = formatSecondsToDisplay(focusRemainingSeconds);
        focusRemainingSeconds--;
    }

    function startFocusCountdown() {
        if (focusTimerInterval) {
            clearInterval(focusTimerInterval);
        }
        focusTimerInterval = setInterval(updateFocusDisplay, 1000);
    }

     function endFocusSession(completed) {
        if (focusTimerInterval) {
            clearInterval(focusTimerInterval);
            focusTimerInterval = null;
        }

        // ****** 新增的邏輯：從 history 中清除專注會話頁面 ******
        // 找出歷史紀錄中是否有 'focus_session' 或 'focus_session_personal' 頁面
        const focusPageIndex = pageHistory.findIndex(page => 
            page === 'focus_session' || page === 'focus_session_personal'
        );

        if (focusPageIndex !== -1) {
            // 如果找到了專注會話頁面，將其及之後的所有頁面從歷史紀錄中移除
            // 這確保了當專注結束時，該頁面不會再被 `goBack` 訪問到
            pageHistory.splice(focusPageIndex, pageHistory.length - focusPageIndex);
        }
        // ****** 新增邏輯結束 ******

        const actualFocusedTime = focusTotalSeconds - focusRemainingSeconds;

        if (completed) {
            showFocusCompletionPopup(focusTotalSeconds);
        } else {
            showFocusEarlyTerminationPopup(actualFocusedTime);
        }
    }
    // ****** 計時器相關變數和函數結束 ******

    function hideAllPopups() {
        teaGardenSelectionPopupPage.classList.remove('active');
        friendFocusSettingsPopupPage.classList.remove('active');
        focusCompletionPopupPage.classList.remove('active');
        focusEarlyTerminationPopupPage.classList.remove('active');
        decorationSelectionPopupPage.classList.remove('active');
        teaCollectionPopupPage.classList.remove('active');
        popupOverlay.classList.remove('active');
    }

    async function loadPage(pageName, addToHistory = true) {
        hideAllPopups(); 

        const filePath = `pages/${pageName}.html`;
        try {
            const response = await fetch(filePath);
            if (!response.ok) {
                throw new Error(`無法載入頁面：${response.statusText}`);
            }
            const htmlContent = await response.text();
            mainContentArea.innerHTML = htmlContent;

            if (addToHistory && pageHistory[pageHistory.length - 1] !== pageName) {
                pageHistory.push(pageName);
            }

            attachEventListenersToLoadedContent();

            // 修改：處理新的個人專注頁面和更新角色圖片
            if ((pageName === 'focus_session' || pageName === 'focus_session_personal') && focusTotalSeconds > 0) {
                const remainingTimeDisplay = mainContentArea.querySelector('#remaining-time-display');
                if (remainingTimeDisplay) {
                    remainingTimeDisplay.textContent = formatSecondsToDisplay(focusRemainingSeconds);
                }

                // 更新專注頁面的角色圖片（無論是單人還是多人，都用 myPlantSprite1）
                const plantSprite1 = mainContentArea.querySelector('#myPlantSprite1');
                if (plantSprite1) {
                    plantSprite1.src = currentDecorationImage;
                }
                // 如果是多人專注頁面，可能還需要更新其他兩個 (非個人專注)
                if (pageName === 'focus_session') {
                    const plantSprite2 = mainContentArea.querySelector('#myPlantSprite2');
                    const plantSprite3 = mainContentArea.querySelector('#myPlantSprite3');
                    if (plantSprite2) plantSprite2.src = currentDecorationImage; // 範例：也用自己的裝扮
                    if (plantSprite3) plantSprite3.src = currentDecorationImage; // 範例：也用自己的裝扮
                    // 實際應用中，這裡應該載入好友的裝扮
                }
                startFocusCountdown();
            }

            // 更新 mainPage 和 achievements 頁面的圖片
            if (pageName === 'main') {
                const mainPlantSprite = mainContentArea.querySelector('#myPlantSprite');
                if (mainPlantSprite) {
                    mainPlantSprite.src = currentDecorationImage;
                }
            } else if (pageName === 'achievements') {
                updateAchievementDisplay(); // 載入成就頁時更新顯示
            }


        } catch (error) {
            console.error('載入頁面失敗:', error);
            mainContentArea.innerHTML = `<div style="padding: 20px; text-align: center; color: red;">載入 ${pageName} 頁面失敗。</div>`;
        }
    }

    // 新增：更新成就頁面組圖顯示
    function updateAchievementDisplay() {
        const accessoryImg = mainContentArea.querySelector('#currentAccessoryImage');
        const cabinetImg = mainContentArea.querySelector('#currentCabinetImage');
        
        if (accessoryImg && cabinetImg) {
            const currentSet = achievementSets[currentAchievementSetIndex];
            accessoryImg.src = currentSet.accessory;
            cabinetImg.src = currentSet.cabinet;
        }
    }

    // 新增：切換成就頁面組圖
    function switchAchievementDisplay() {
        currentAchievementSetIndex = (currentAchievementSetIndex + 1) % achievementSets.length;
        updateAchievementDisplay();
    }


    function showTeaGardenSelectionPopup() {
        hideAllPopups();
        teaGardenSelectionPopupPage.classList.add('active');
        popupOverlay.classList.add('active');
        attachTeaGardenSelectionPopupListeners();
    }

    function hideTeaGardenSelectionPopup() {
        teaGardenSelectionPopupPage.classList.remove('active');
        if (!friendFocusSettingsPopupPage.classList.contains('active') && 
            !focusCompletionPopupPage.classList.contains('active') &&
            !focusEarlyTerminationPopupPage.classList.contains('active') &&
            !decorationSelectionPopupPage.classList.contains('active') &&
            !teaCollectionPopupPage.classList.contains('active')) {
             popupOverlay.classList.remove('active');
        }
    }

    async function showFriendFocusSettingsPopup() {
        hideAllPopups();
        const filePath = `pages/friend_focus_settings.html`;
        try {
            const response = await fetch(filePath);
            if (!response.ok) {
                throw new Error(`無法載入好友專注設定頁面：${response.statusText}`);
            }
            const htmlContent = await response.text();
            friendFocusSettingsPopupPage.innerHTML = htmlContent;
            friendFocusSettingsPopupPage.classList.add('active');
            popupOverlay.classList.add('active');

            attachFriendFocusSettingsPopupListeners();

        } catch (error) {
            console.error('載入好友專注設定頁面失敗:', error);
        }
    }

    function hideFriendFocusSettingsPopup() {
        friendFocusSettingsPopupPage.classList.remove('active');
        if (!teaGardenSelectionPopupPage.classList.contains('active') && 
            !focusCompletionPopupPage.classList.contains('active') &&
            !focusEarlyTerminationPopupPage.classList.contains('active') &&
            !decorationSelectionPopupPage.classList.contains('active') &&
            !teaCollectionPopupPage.classList.contains('active')) {
             popupOverlay.classList.remove('active');
        }
    }

    // 修改：更新 focus_completion 彈出視窗內容
    async function showFocusCompletionPopup(durationInSeconds) {
        hideAllPopups();
        const filePath = `pages/focus_completion.html`;
        try {
            const response = await fetch(filePath);
            if (!response.ok) {
                throw new Error(`無法載入專注完成頁面：${response.statusText}`);
            }
            const htmlContent = await response.text();
            focusCompletionPopupPage.innerHTML = htmlContent;
            focusCompletionPopupPage.classList.add('active');
            popupOverlay.classList.add('active');

            const completionMessage = focusCompletionPopupPage.querySelector('#completion-message-text');
            const completionTeaImage = focusCompletionPopupPage.querySelector('#completion-tea-image'); // 獲取圖片元素

            if (completionMessage) {
                // 使用 currentFocusedTeaName 和 selectedGardenName
                completionMessage.innerHTML = `恭喜！在${selectedGardenName}種<br>${currentFocusedTeaName}成功烘焙出：${currentFocusedTeaName}`;
            }
            if (completionTeaImage) {
                // 使用 currentFocusedTeaImageSrc 更新圖片
                completionTeaImage.src = currentFocusedTeaImageSrc;
            }

            const completionTimeDisplay = focusCompletionPopupPage.querySelector('#completion-time-display-value');
            if (completionTimeDisplay) {
                completionTimeDisplay.textContent = formatSecondsToMinutesSeconds(durationInSeconds);
            }

            attachFocusCompletionPopupListeners();

        } catch (error) {
            console.error('載入專注完成頁面失敗:', error);
        }
    }

    function hideFocusCompletionPopup() {
        focusCompletionPopupPage.classList.remove('active');
        if (!teaGardenSelectionPopupPage.classList.contains('active') && 
            !friendFocusSettingsPopupPage.classList.contains('active') &&
            !focusEarlyTerminationPopupPage.classList.contains('active') &&
            !decorationSelectionPopupPage.classList.contains('active') &&
            !teaCollectionPopupPage.classList.contains('active')) {
             popupOverlay.classList.remove('active');
        }
        loadPage('main', false);
    }

    async function showFocusEarlyTerminationPopup(actualFocusedTime) {
        hideAllPopups();
        const filePath = `pages/focus_early_termination.html`;
        try {
            const response = await fetch(filePath);
            if (!response.ok) {
                throw new Error(`無法載入中途終止頁面：${response.statusText}`);
            }
            const htmlContent = await response.text();
            focusEarlyTerminationPopupPage.innerHTML = htmlContent;
            focusEarlyTerminationPopupPage.classList.add('active');
            popupOverlay.classList.add('active');

            const earlyTerminationMessage = focusEarlyTerminationPopupPage.querySelector('.early-termination-message');
            if (earlyTerminationMessage) {
                // 更改訊息文本
                earlyTerminationMessage.innerHTML = "茶米要隨機偷走你一杯茶";
            }

            const earlyTerminationTimeDisplay = focusEarlyTerminationPopupPage.querySelector('#early-termination-time-display-value');
            if (earlyTerminationTimeDisplay) {
                earlyTerminationTimeDisplay.textContent = formatSecondsToMinutesSeconds(actualFocusedTime);
            }

            const earlyTerminationTeaImagePlaceholder = focusEarlyTerminationPopupPage.querySelector('.early-termination-tea-image-placeholder');
            if (earlyTerminationTeaImagePlaceholder) {
                 // 刪除原有字串，只放置圖片
                earlyTerminationTeaImagePlaceholder.innerHTML = `<img src="${currentFocusedTeaImageSrc}" alt="${currentFocusedTeaName}">`;
            }

            attachFocusEarlyTerminationPopupListeners();

        } catch (error) {
            console.error('載入中途終止頁面失敗:', error);
        }
    }

    function hideFocusEarlyTerminationPopup() {
        focusEarlyTerminationPopupPage.classList.remove('active');
        if (!teaGardenSelectionPopupPage.classList.contains('active') && 
            !friendFocusSettingsPopupPage.classList.contains('active') &&
            !focusCompletionPopupPage.classList.contains('active') &&
            !decorationSelectionPopupPage.classList.contains('active') &&
            !teaCollectionPopupPage.classList.contains('active')) {
             popupOverlay.classList.remove('active');
        }
        loadPage('main', false);
    }

    // 裝扮選擇彈出視窗 (此功能目前被成就頁直接顯示組圖取代，這兩個函數可以保留，但不會被觸發)
    async function showDecorationSelectionPopup() {
        hideAllPopups();
        const filePath = `pages/decoration_selection.html`;
        try {
            const response = await fetch(filePath);
            if (!response.ok) {
                throw new Error(`無法載入裝扮選擇頁面：${response.statusText}`);
            }
            const htmlContent = await response.text();
            decorationSelectionPopupPage.innerHTML = htmlContent;
            decorationSelectionPopupPage.classList.add('active');
            popupOverlay.classList.add('active');
            attachDecorationSelectionPopupListeners();
        } catch (error) {
            console.error('載入裝扮選擇頁面失敗:', error);
        }
    }

    function hideDecorationSelectionPopup() {
        decorationSelectionPopupPage.classList.remove('active');
        if (!teaGardenSelectionPopupPage.classList.contains('active') && 
            !friendFocusSettingsPopupPage.classList.contains('active') &&
            !focusCompletionPopupPage.classList.contains('active') &&
            !focusEarlyTerminationPopupPage.classList.contains('active') &&
            !teaCollectionPopupPage.classList.contains('active')) {
             popupOverlay.classList.remove('active');
        }
        loadPage('achievements', false);
    }

    async function showTeaCollectionPopup(teaCategory) {
        hideAllPopups();
        const filePath = `pages/tea_collection_popup.html`;
        try {
            const response = await fetch(filePath);
            if (!response.ok) {
                throw new Error(`無法載入茶葉收藏頁面：${response.statusText}`);
            }
            const htmlContent = await response.text();
            teaCollectionPopupPage.innerHTML = htmlContent;
            teaCollectionPopupPage.classList.add('active');
            popupOverlay.classList.add('active');
            
            const popupTitle = teaCollectionPopupPage.querySelector('#tea-collection-popup-title');
            if (popupTitle) {
                const categoryNameMap = {
                    'red_tea': '紅茶收藏',
                    'green_tea': '綠茶收藏',
                    'yellow_tea': '黃茶收藏'
                };
                popupTitle.textContent = categoryNameMap[teaCategory] || '茶葉收藏';
            }

            const teaImagesContainer = teaCollectionPopupPage.querySelector('#tea-images-container');
            if (teaImagesContainer && teaImagesByCategory[teaCategory]) {
                teaImagesContainer.innerHTML = '';
                teaImagesByCategory[teaCategory].forEach(tea => {
                    const teaItem = document.createElement('div');
                    teaItem.classList.add('tea-collection-item');
                    
                    const img = document.createElement('img');
                    img.src = tea.src;
                    img.alt = tea.name;

                    const span = document.createElement('span');
                    span.textContent = tea.name;

                    teaItem.appendChild(img);
                    teaItem.appendChild(span);
                    teaImagesContainer.appendChild(teaItem);
                });
            }

            attachTeaCollectionPopupListeners();

        } catch (error) {
            console.error('載入茶葉收藏頁面失敗:', error);
        }
    }

    function hideTeaCollectionPopup() {
        teaCollectionPopupPage.classList.remove('active');
        if (!teaGardenSelectionPopupPage.classList.contains('active') && 
            !friendFocusSettingsPopupPage.classList.contains('active') &&
            !focusCompletionPopupPage.classList.contains('active') &&
            !focusEarlyTerminationPopupPage.classList.contains('active') &&
            !decorationSelectionPopupPage.classList.contains('active')) {
             popupOverlay.classList.remove('active');
        }
        loadPage('tea_cabinet', false);
    }


    function goBack() {
        if (focusTimerInterval) {
            endFocusSession(false);
            return;
        }
        if (teaCollectionPopupPage.classList.contains('active')) {
            hideTeaCollectionPopup();
            return;
        }
        if (decorationSelectionPopupPage.classList.contains('active')) { // 舊的裝扮選擇彈出視窗
            hideDecorationSelectionPopup();
            return;
        }
        if (focusEarlyTerminationPopupPage.classList.contains('active')) {
            hideFocusEarlyTerminationPopup();
            return;
        }
        if (focusCompletionPopupPage.classList.contains('active')) {
            hideFocusCompletionPopup();
            return;
        }
        if (friendFocusSettingsPopupPage.classList.contains('active')) {
            hideFriendFocusSettingsPopup();
            return;
        }
        if (teaGardenSelectionPopupPage.classList.contains('active')) {
            hideTeaGardenSelectionPopup();
            return;
        }

        if (pageHistory.length > 1) {
            pageHistory.pop();
            const previousPage = pageHistory[pageHistory.length - 1];
            loadPage(previousPage, false);
        } else {
            loadPage('main', false);
            pageHistory = ['main'];
        }
    }

    // 新增：根據時間獲取圖片索引
    function getImageIndexForTime(minutes) {
        if (minutes >= 1 && minutes <= 45) return 0;
        if (minutes >= 46 && minutes <= 90) return 1;
        if (minutes >= 91 && minutes <= 135) return 2;
        if (minutes >= 136 && minutes <= 180) return 3;
        return 0; // 默認第一張圖片
    }

    function attachTeaGardenSelectionPopupListeners() {
        const personalStartButton = teaGardenSelectionPopupPage.querySelector('[data-action="start-personal-focus"]');
        const friendStartButton = teaGardenSelectionPopupPage.querySelector('[data-action="open-friend-focus-settings"]');
        const timeInput = teaGardenSelectionPopupPage.querySelector('.time-input'); // 這是隱藏的 HH:MM 輸入框
        const timeSlider = teaGardenSelectionPopupPage.querySelector('#timeSlider'); // 滑桿
        const sliderTimeDisplay = teaGardenSelectionPopupPage.querySelector('#sliderTimeDisplay'); // 顯示滑桿分鐘數的元素
        const teaGardenImage = teaGardenSelectionPopupPage.querySelector('#teaGardenImage'); // 圓圈內的圖片

        // 隨機選擇一種茶作為本次專注的成果 (更新了 currentFocusedTeaName 和 currentFocusedTeaImageSrc)
        function selectRandomTeaResult() {
            const categories = Object.keys(teaImagesByCategory);
            const randomCategory = categories[Math.floor(Math.random() * categories.length)];
            const teasInSelectedCategory = teaImagesByCategory[randomCategory];
            const randomTea = teasInSelectedCategory[Math.floor(Math.random() * teasInSelectedCategory.length)];
            currentFocusedTeaName = randomTea.name;
            currentFocusedTeaImageSrc = randomTea.src;
        }

        // 根據滑桿值更新顯示的函數
        function updateTeaGardenDisplay(minutes) {
            // 更新隱藏的 timeInput (HH:MM 格式)
            if (timeInput) {
                timeInput.value = convertMinutesToHHMM(minutes);
            }
            // 更新可見的分鐘數顯示
            if (sliderTimeDisplay) {
                sliderTimeDisplay.textContent = `${minutes} 分鐘`;
            }
            // 更新茶園圖片
            if (teaGardenImage && timeBasedImages.length > 0) {
                const imageIndex = getImageIndexForTime(minutes);
                teaGardenImage.src = timeBasedImages[imageIndex];
            }
        }

        // 初始化滑桿和顯示
        if (timeSlider) {
            timeSlider.min = "1";
            timeSlider.max = "180";
            // 設置默認值，例如 30 分鐘
            timeSlider.value = "30"; 
            updateTeaGardenDisplay(parseInt(timeSlider.value, 10)); // 初次更新顯示

            timeSlider.oninput = function() {
                updateTeaGardenDisplay(parseInt(this.value, 10));
            };
        } else {
            // 如果滑桿不存在或未初始化，則默認顯示第一張圖片
            if (teaGardenImage && timeBasedImages.length > 0) {
                teaGardenImage.src = timeBasedImages[0];
            }
        }

        if (personalStartButton) {
            personalStartButton.onclick = function() {
                // 從滑桿獲取分鐘數並轉換為秒
                const selectedTimeMinutes = timeSlider ? parseInt(timeSlider.value, 10) : 0;
                const duration = selectedTimeMinutes * 60;
                if (duration <= 0) {
                    alert('請輸入有效的專注時間！');
                    return;
                }
                focusTotalSeconds = duration;
                focusRemainingSeconds = duration;
                selectRandomTeaResult(); // 開始專注前隨機選擇本次成果茶種
                loadPage('focus_session_personal'); // 跳轉到新的個人專注頁面
            };
        }
        if (friendStartButton) {
            friendStartButton.onclick = function() {
                // 從滑桿獲取分鐘數並轉換為秒
                const selectedTimeMinutes = timeSlider ? parseInt(timeSlider.value, 10) : 0;
                const duration = selectedTimeMinutes * 60;
                if (duration <= 0) {
                    alert('請輸入有效的專注時間！');
                    return;
                }
                focusTotalSeconds = duration;
                focusRemainingSeconds = duration;
                selectRandomTeaResult(); // 開始專注前隨機選擇本次成果茶種
                showFriendFocusSettingsPopup();
            };
        }

        const closeTeaGardenSelectionPopupBtn = document.getElementById('closeTeaGardenSelectionPopup');
        if (closeTeaGardenSelectionPopupBtn) {
            closeTeaGardenSelectionPopupBtn.onclick = hideTeaGardenSelectionPopup;
        }
    }

    function attachFriendFocusSettingsPopupListeners() {
        const confirmButton = friendFocusSettingsPopupPage.querySelector('.confirm-friend-focus');
        const friendLimitInput = friendFocusSettingsPopupPage.querySelector('.friend-limit-input');
        const backButton = friendFocusSettingsPopupPage.querySelector('[data-action="close-friend-focus-popup"]');

        if (friendLimitInput) {
            friendLimitInput.value = "0";
        }

        if (confirmButton) {
            confirmButton.onclick = function() {
                // 由於滑桿會更新隱藏的 .time-input，這裡依然可以從 .time-input 讀取值
                const selectedTime = teaGardenSelectionPopupPage.querySelector('.time-input').value;
                const friendLimit = friendLimitInput ? parseInt(friendLimitInput.value, 10) : 0;
                const duration = parseTimeToSeconds(selectedTime);

                if (duration <= 0) {
                    alert('請輸入有效的專注時間！');
                    return;
                }
                if (friendLimit <= 0) {
                    alert('請設定有效的好友人數上限！');
                    return;
                }

                focusTotalSeconds = duration;
                focusRemainingSeconds = duration;
                // currentFocusedTeaName and currentFocusedTeaImageSrc are already set by teaGardenSelectionPopup
                loadPage('focus_session'); // 好友專注還是跳到 focus_session (多人版)
            };
        }
        if (backButton) {
            backButton.onclick = hideFriendFocusSettingsPopup;
        }
    }

    function attachFocusCompletionPopupListeners() {
        const returnButton = focusCompletionPopupPage.querySelector('.return-to-main-button');
        if (returnButton) {
            returnButton.onclick = hideFocusCompletionPopup;
        }
    }

    function attachFocusEarlyTerminationPopupListeners() {
        const returnButton = focusEarlyTerminationPopupPage.querySelector('.early-termination-return-button');
        if (returnButton) {
            returnButton.onclick = hideFocusEarlyTerminationPopup;
        }
    }

    // 舊的裝扮選擇彈出視窗的事件綁定，現在將不會被觸發
    function attachDecorationSelectionPopupListeners() {
        let selectedCostume = currentDecorationImage;

        decorationSelectionPopupPage.querySelectorAll('.costume-item').forEach(item => {
            const imgSrc = item.querySelector('img').src.split('/').pop();
            if (imgSrc === currentDecorationImage.split('/').pop()) {
                item.classList.add('selected');
            }
        });

        decorationSelectionPopupPage.querySelectorAll('.costume-item').forEach(item => {
            item.onclick = function() {
                decorationSelectionPopupPage.querySelectorAll('.costume-item').forEach(el => el.classList.remove('selected'));
                this.classList.add('selected');
                selectedCostume = this.querySelector('img').dataset.imgSrc;
            };
        });

        const confirmButton = decorationSelectionPopupPage.querySelector('.confirm-decoration-button');
        if (confirmButton) {
            confirmButton.onclick = function() {
                currentDecorationImage = selectedCostume;
                hideDecorationSelectionPopup();
            };
        }

        const backButton = decorationSelectionPopupPage.querySelector('.back-button');
        if (backButton) {
            backButton.onclick = hideDecorationSelectionPopup;
        }
    }

    function attachTeaCollectionPopupListeners() {
        const backButton = teaCollectionPopupPage.querySelector('.back-button');
        if (backButton) {
            backButton.onclick = hideTeaCollectionPopup;
        }
    }


    function attachEventListenersToLoadedContent() {
        const settingsIcon = mainContentArea.querySelector('.header-icon .fa-cog');
        const medalIcon = mainContentArea.querySelector('.header-icon .fa-medal');
        const enterButton = mainContentArea.querySelector('.main-content-area-inner .enter-button');
        const mainFriendsButton = mainContentArea.querySelector('.main-content-area-inner .friends-button');
        const plantSpriteImage = mainContentArea.querySelector('#myPlantSprite');
        const teaSetImage = mainContentArea.querySelector('#myTeaSet');

        if (settingsIcon) { settingsIcon.parentElement.addEventListener('click', () => loadPage('settings')); }
        if (medalIcon) { medalIcon.parentElement.addEventListener('click', () => loadPage('ranking')); }
        if (enterButton) { enterButton.addEventListener('click', () => loadPage('map')); }
        if (mainFriendsButton) { mainFriendsButton.addEventListener('click', () => loadPage('friends')); }
        if (plantSpriteImage) {
            plantSpriteImage.addEventListener('click', function() {
                loadPage('achievements');
            });
        }
        if (teaSetImage) {
            teaSetImage.addEventListener('click', function() {
                loadPage('tea_cabinet');
            });
        }

        mainContentArea.querySelectorAll('.map-container .tea-garden-circle').forEach(circle => {
            circle.addEventListener('click', showTeaGardenSelectionPopup);
        });

        const mapFriendsButton = mainContentArea.querySelector('.map-page-container .friends-button');
        if (mapFriendsButton) {
            mapFriendsButton.addEventListener('click', () => loadPage('friends'));
        }

        const stopButton = mainContentArea.querySelector('.focus-session-page-container .stop-button');
        // 修改：確保 focus_session_personal 的 stopButton 也能被監聽
        const personalStopButton = mainContentArea.querySelector('.focus-session-page-container.single-character .stop-button');

        if (stopButton) {
            stopButton.addEventListener('click', () => endFocusSession(false));
        } else if (personalStopButton) { // 如果是個人專注頁面
            personalStopButton.addEventListener('click', () => endFocusSession(false));
        }


        // 修改：成就頁面的「狀態」按鈕和「套用」按鈕事件 (新功能)
        const toggleStatusButton = mainContentArea.querySelector('#toggleAchievementStatus');
        if (toggleStatusButton) {
            toggleStatusButton.addEventListener('click', switchAchievementDisplay);
        }
        const applyDecorationButton = mainContentArea.querySelector('#applyDecoration');
        if (applyDecorationButton) {
            applyDecorationButton.addEventListener('click', function() {
                // 將當前顯示組圖的角色圖片設為全局 currentDecorationImage
                currentDecorationImage = achievementSets[currentAchievementSetIndex].character;
                alert('裝扮已套用！');
                loadPage('main', false); // 套用後回到主頁面
            });
        }
        // 移除原有的 decorationBlock 點擊事件，避免衝突
        // const decorationBlock = mainContentArea.querySelector('.achievement-decoration-page-container .decoration-block');
        // if (decorationBlock) {
        //     decorationBlock.addEventListener('click', showDecorationSelectionPopup);
        // }


        // 茶櫃頁面的「茶葉物品方塊」點擊事件，傳遞茶類別
        mainContentArea.querySelectorAll('.tea-cabinet-page-container .tea-item-block').forEach(block => {
            block.addEventListener('click', function() {
                const teaCategory = this.dataset.teaCategory;
                if (teaCategory) {
                    showTeaCollectionPopup(teaCategory);
                }
            });
        });


        mainContentArea.querySelectorAll('.back-button').forEach(button => {
            const isPopupCloseButton = button.dataset.action === 'close-popup' || button.dataset.action === 'close-friend-focus-popup';
            const isInsideFocusSession = button.closest('.focus-session-page-container');
            const isInsideDecorationSelection = button.closest('.decoration-selection-page');
            const isInsideTeaCollection = button.closest('.tea-collection-popup-page');


            if (!isPopupCloseButton && !isInsideFocusSession && !isInsideDecorationSelection && !isInsideTeaCollection) {
                 button.addEventListener('click', goBack);
            }
        });
    }

    loadPage('main', false);
    pageHistory.push('main');
});