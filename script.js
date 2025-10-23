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

    // ****** 專注時間對應的圖片組 (新增) ******
    const timeBasedImages = [
        './img/紅茶_日月潭.png', // 1-45 分鐘
        './img/紅茶_阿薩姆.png', // 46-90 分鐘
        './img/紅茶_蜜香.png', // 91-135 分鐘
        './img/紅茶_錫蘭.png'  // 136-180 分鐘
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


    // ****** 茶葉圖片數據結構 ******
    const teaImagesByCategory = {
        'red_tea': [
            { src: './img/紅茶_日月潭.png', name: '' },
            { src: './img/紅茶_蜜香.png', name: '' },
            { src: './img/紅茶_錫蘭.png', name: '' },
            { src: './img/紅茶_阿薩姆.png', name: '' }    
        ],
        'green_tea': [
            { src: './img/綠茶_抹茶.png', name: '' },
            { src: './img/綠茶_煎茶.png', name: '' },
            { src: './img/綠茶_玉露.png', name: '' },
            { src: './img/綠茶_碧螺春.png', name: '' },
            { src: './img/綠茶_龍井.png', name: '' }
        ],
        'yellow_tea': [
            { src: './img/黃茶_凍頂烏龍.png', name: '' },
            { src: './img/黃茶_岩茶.png', name: '' },
            { src: './img/黃茶_文山包種茶.png', name: '' },
            { src: './img/黃茶_東方美人.png', name: '' },
            { src: './img/黃茶_鐵觀音.png', name: '' },
            { src: './img/黃茶_高山茶.png', name: '' },
            { src: './img/黃茶_鳳凰單欉.png', name: '' },
            
        ]
    };
    // ****** 茶葉圖片數據結構結束 ******


    // ****** 計時器相關變數和函數 ******
    let focusTimerInterval = null;
    let focusTotalSeconds = 0;
    let focusRemainingSeconds = 0;
    let selectedGardenName = '金城茶園';
    let selectedTeaType = '包種茶';

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
        if (!remainingTimeDisplay) {
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

            if (pageName === 'focus_session' && focusTotalSeconds > 0) {
                const remainingTimeDisplay = mainContentArea.querySelector('#remaining-time-display');
                if (remainingTimeDisplay) {
                    remainingTimeDisplay.textContent = formatSecondsToDisplay(focusRemainingSeconds);
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
            if (completionMessage) {
                completionMessage.textContent = `恭喜！在${selectedGardenName}種${selectedTeaType}成功烘焙出：XXXXXX`;
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

            const earlyTerminationTimeDisplay = focusEarlyTerminationPopupPage.querySelector('#early-termination-time-display-value');
            if (earlyTerminationTimeDisplay) {
                earlyTerminationTimeDisplay.textContent = formatSecondsToMinutesSeconds(actualFocusedTime);
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
        const timeSlider = teaGardenSelectionPopupPage.querySelector('#timeSlider'); // 新增的滑桿
        const sliderTimeDisplay = teaGardenSelectionPopupPage.querySelector('#sliderTimeDisplay'); // 顯示滑桿分鐘數的元素
        const teaGardenImage = teaGardenSelectionPopupPage.querySelector('#teaGardenImage'); // 圓圈內的圖片

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
                loadPage('focus_session');
            };
        }
        if (friendStartButton) {
            friendStartButton.onclick = showFriendFocusSettingsPopup;
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
                loadPage('focus_session');
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
        if (stopButton) {
            stopButton.addEventListener('click', () => endFocusSession(false));
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