document.addEventListener('DOMContentLoaded', function() {
    const mainContentArea = document.getElementById('main-content-area');
    const popupOverlay = document.getElementById('popup-overlay');
    const teaGardenSelectionPopupPage = document.getElementById('tea-garden-selection-popup-page');
    const friendFocusSettingsPopupPage = document.getElementById('friend-focus-settings-popup-page');
    const focusCompletionPopupPage = document.getElementById('focus-completion-popup-page');
    const focusEarlyTerminationPopupPage = document.getElementById('focus-early-termination-popup-page'); // 新增：中途終止彈出視窗

    let pageHistory = []; // 儲存頁面路徑的歷史記錄

    // ****** 計時器相關變數和函數 ******
    let focusTimerInterval = null;
    let focusTotalSeconds = 0;
    let focusRemainingSeconds = 0;
    let selectedGardenName = '金城茶園'; // 假設茶園名稱，未來可動態獲取
    let selectedTeaType = '包種茶'; // 假設茶種，未來可動態獲取

    function parseTimeToSeconds(timeString) {
        const parts = timeString.split(':');
        if (parts.length === 2) {
            const hours = parseInt(parts[0], 10);
            const minutes = parseInt(parts[1], 10);
            return (hours * 3600) + (minutes * 60);
        }
        return 0;
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

    // 更新專注頁面上的倒計時顯示
    function updateFocusDisplay() {
        const remainingTimeDisplay = mainContentArea.querySelector('#remaining-time-display');
        if (!remainingTimeDisplay) { // 如果不在專注頁面，則停止計時
            // 如果頁面已經切換走，但計時器還在跑，需要強制終止
            endFocusSession(false); // 視為中途終止
            return;
        }

        if (focusRemainingSeconds <= 0) {
            endFocusSession(true); // 完成專注
            return;
        }

        remainingTimeDisplay.textContent = formatSecondsToDisplay(focusRemainingSeconds);
        focusRemainingSeconds--;
    }

    // 啟動專注計時器
    function startFocusCountdown() {
        if (focusTimerInterval) {
            clearInterval(focusTimerInterval);
        }
        focusTimerInterval = setInterval(updateFocusDisplay, 1000);
    }

    // 結束專注會話
    function endFocusSession(completed) {
        if (focusTimerInterval) {
            clearInterval(focusTimerInterval);
            focusTimerInterval = null;
        }
        
        const actualFocusedTime = focusTotalSeconds - focusRemainingSeconds; // 實際專注時間

        if (completed) {
            showFocusCompletionPopup(focusTotalSeconds); // 專注完成，顯示完成彈出視窗
        } else {
            // alert('專注會話已中途終止。'); // 改為顯示中途終止彈出視窗
            showFocusEarlyTerminationPopup(actualFocusedTime); // 中途終止，顯示中途終止彈出視窗
        }
    }
    // ****** 計時器相關變數和函數結束 ******

    // 新增：一個統一關閉所有彈出視窗和遮罩的函數
    function hideAllPopups() {
        teaGardenSelectionPopupPage.classList.remove('active');
        friendFocusSettingsPopupPage.classList.remove('active');
        focusCompletionPopupPage.classList.remove('active');
        focusEarlyTerminationPopupPage.classList.remove('active'); // 新增：中途終止彈出視窗
        popupOverlay.classList.remove('active');
    }

    // 輔助函數：動態載入頁面內容並注入到主內容區
    async function loadPage(pageName, addToHistory = true) {
        // 在載入任何主內容頁面之前，確保所有彈出視窗和遮罩都已隱藏
        hideAllPopups(); 

        const filePath = `pages/${pageName}.html`;
        try {
            const response = await fetch(filePath);
            if (!response.ok) {
                throw new Error(`無法載入頁面：${response.statusText}`);
            }
            const htmlContent = await response.text();
            mainContentArea.innerHTML = htmlContent;

            // 如果是新頁面且需要加入歷史記錄
            if (addToHistory && pageHistory[pageHistory.length - 1] !== pageName) {
                pageHistory.push(pageName);
            }
            // console.log("Current History:", pageHistory);

            // 重新綁定新載入內容中的事件監聽器
            attachEventListenersToLoadedContent();

            // 如果是專注會話頁面，則啟動計時器
            if (pageName === 'focus_session' && focusTotalSeconds > 0) {
                const remainingTimeDisplay = mainContentArea.querySelector('#remaining-time-display');
                if (remainingTimeDisplay) {
                    remainingTimeDisplay.textContent = formatSecondsToDisplay(focusRemainingSeconds);
                }
                startFocusCountdown();
            }


        } catch (error) {
            console.error('載入頁面失敗:', error);
            mainContentArea.innerHTML = `<div style="padding: 20px; text-align: center; color: red;">載入 ${pageName} 頁面失敗。</div>`;
        }
    }

    // 輔助函數：顯示茶園選擇彈出視窗
    function showTeaGardenSelectionPopup() {
        // 確保在顯示新的彈出視窗前，隱藏其他同層級或上層級的彈出視窗
        hideAllPopups(); // 更通用地隱藏所有，避免狀態衝突
        
        teaGardenSelectionPopupPage.classList.add('active');
        popupOverlay.classList.add('active');
        attachTeaGardenSelectionPopupListeners();
    }

    // 輔助函數：隱藏茶園選擇彈出視窗
    function hideTeaGardenSelectionPopup() {
        teaGardenSelectionPopupPage.classList.remove('active');
        // 只有當沒有其他彈出視窗活躍時才關閉遮罩
        if (!friendFocusSettingsPopupPage.classList.contains('active') && 
            !focusCompletionPopupPage.classList.contains('active') &&
            !focusEarlyTerminationPopupPage.classList.contains('active')) { // 新增
             popupOverlay.classList.remove('active');
        }
    }

    // 輔助函數：顯示好友專注設定彈出視窗
    async function showFriendFocusSettingsPopup() {
        // 確保在顯示新的彈出視窗前，隱藏其他上層級的彈出視窗
        hideAllPopups(); // 更通用地隱藏所有，避免狀態衝突

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

    // 輔助函數：隱藏好友專注設定彈出視窗
    function hideFriendFocusSettingsPopup() {
        friendFocusSettingsPopupPage.classList.remove('active');
        // 只有當沒有其他彈出視窗活躍時才關閉遮罩
        if (!teaGardenSelectionPopupPage.classList.contains('active') && 
            !focusCompletionPopupPage.classList.contains('active') &&
            !focusEarlyTerminationPopupPage.classList.contains('active')) { // 新增
             popupOverlay.classList.remove('active');
        }
    }

    // 輔助函數：顯示專注完成彈出視窗
    async function showFocusCompletionPopup(durationInSeconds) {
        // 確保在顯示這個最高層級彈出視窗前，隱藏其他所有彈出視窗
        hideAllPopups(); // 更通用地隱藏所有，避免狀態衝突

        const filePath = `pages/focus_completion.html`;
        try {
            const response = await fetch(filePath);
            if (!response.ok) {
                throw new Error(`無法載入專注完成頁面：${response.statusText}`);
            }
            const htmlContent = await response.text();
            focusCompletionPopupPage.innerHTML = htmlContent;
            focusCompletionPopupPage.classList.add('active');
            popupOverlay.classList.add('active'); // 確保遮罩層也活躍

            // 更新完成頁面上的動態內容
            const completionMessage = focusCompletionPopupPage.querySelector('#completion-message-text');
            if (completionMessage) {
                // 這裡可以使用實際的茶園名稱和茶種
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

    // 輔助函數：隱藏專注完成彈出視窗
    function hideFocusCompletionPopup() {
        focusCompletionPopupPage.classList.remove('active');
        // 只有當沒有其他彈出視窗活躍時才關閉遮罩
        if (!teaGardenSelectionPopupPage.classList.contains('active') && 
            !friendFocusSettingsPopupPage.classList.contains('active') &&
            !focusEarlyTerminationPopupPage.classList.contains('active')) { // 新增
             popupOverlay.classList.remove('active');
        }
        loadPage('main', false); // 關閉完成視窗後回到主頁面
    }

    // 輔助函數：顯示中途終止彈出視窗 (新增加)
    async function showFocusEarlyTerminationPopup(actualFocusedTime) {
        // 確保在顯示這個最高層級彈出視窗前，隱藏其他所有彈出視窗
        hideAllPopups(); // 更通用地隱藏所有，避免狀態衝突

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

            // 更新中途終止頁面上的動態內容
            const earlyTerminationTimeDisplay = focusEarlyTerminationPopupPage.querySelector('#early-termination-time-display-value');
            if (earlyTerminationTimeDisplay) {
                earlyTerminationTimeDisplay.textContent = formatSecondsToMinutesSeconds(actualFocusedTime);
            }

            attachFocusEarlyTerminationPopupListeners();

        } catch (error) {
            console.error('載入中途終止頁面失敗:', error);
        }
    }

    // 輔助函數：隱藏中途終止彈出視窗 (新增加)
    function hideFocusEarlyTerminationPopup() {
        focusEarlyTerminationPopupPage.classList.remove('active');
        // 只有當沒有其他彈出視窗活躍時才關閉遮罩
        if (!teaGardenSelectionPopupPage.classList.contains('active') && 
            !friendFocusSettingsPopupPage.classList.contains('active') &&
            !focusCompletionPopupPage.classList.contains('active')) {
             popupOverlay.classList.remove('active');
        }
        loadPage('main', false); // 關閉中途終止視窗後回到主頁面
    }


    // 輔助函數：返回上一頁（優先處理最上層的彈出視窗或正在進行的專注會話）
    function goBack() {
        // 1. 如果有專注會話正在進行，則中途終止
        if (focusTimerInterval) {
            endFocusSession(false); // 這會觸發顯示中途終止彈出視窗
            return;
        }
        // 2. 如果中途終止彈出視窗打開，則關閉它並回主頁 (新增加)
        if (focusEarlyTerminationPopupPage.classList.contains('active')) {
            hideFocusEarlyTerminationPopup(); // 這會觸發 loadPage('main', false)
            return;
        }
        // 3. 如果專注完成彈出視窗打開，則關閉它並回主頁
        if (focusCompletionPopupPage.classList.contains('active')) {
            hideFocusCompletionPopup(); // 這會觸發 loadPage('main', false)
            return;
        }
        // 4. 如果好友專注設定彈出視窗打開，則關閉它
        if (friendFocusSettingsPopupPage.classList.contains('active')) {
            hideFriendFocusSettingsPopup();
            return;
        }
        // 5. 如果茶園選擇彈出視窗打開，則關閉它
        if (teaGardenSelectionPopupPage.classList.contains('active')) {
            hideTeaGardenSelectionPopup();
            return;
        }

        // 6. 如果沒有彈出視窗或專注會話，檢查頁面歷史
        if (pageHistory.length > 1) {
            pageHistory.pop();
            const previousPage = pageHistory[pageHistory.length - 1];
            loadPage(previousPage, false); // loadPage 會呼叫 hideAllPopups()
        } else {
            loadPage('main', false); // loadPage 會呼叫 hideAllPopups()
            pageHistory = ['main'];
        }
    }

    // 綁定茶園選擇彈出視窗的事件
    function attachTeaGardenSelectionPopupListeners() {
        const personalStartButton = teaGardenSelectionPopupPage.querySelector('[data-action="start-personal-focus"]');
        const friendStartButton = teaGardenSelectionPopupPage.querySelector('[data-action="open-friend-focus-settings"]');
        const timeInput = teaGardenSelectionPopupPage.querySelector('.time-input');

        if (timeInput) {
            timeInput.value = "00:00";
        }

        if (personalStartButton) {
            personalStartButton.onclick = function() {
                const selectedTime = timeInput ? timeInput.value : "00:00";
                const duration = parseTimeToSeconds(selectedTime);
                if (duration <= 0) {
                    alert('請輸入有效的專注時間！');
                    return;
                }
                focusTotalSeconds = duration;
                focusRemainingSeconds = duration;
                // 不再呼叫 hideTeaGardenSelectionPopup()，因為 loadPage 會呼叫 hideAllPopups()
                loadPage('focus_session'); // 跳轉到專注頁面
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

    // 綁定好友專注設定彈出視窗的事件
    function attachFriendFocusSettingsPopupListeners() {
        const confirmButton = friendFocusSettingsPopupPage.querySelector('.confirm-friend-focus');
        const friendLimitInput = friendFocusSettingsPopupPage.querySelector('.friend-limit-input');
        const backButton = friendFocusSettingsPopupPage.querySelector('[data-action="close-friend-focus-popup"]');

        if (friendLimitInput) {
            friendLimitInput.value = "0";
        }

        if (confirmButton) {
            confirmButton.onclick = function() {
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
                // alert(`好友專注開始！預計時間: ${selectedTime}，人數上限: ${friendLimit}人`); // 這裡不需要 alert
                // 不再呼叫 hideFriendFocusSettingsPopup() 和 hideTeaGardenSelectionPopup()，因為 loadPage 會呼叫 hideAllPopups()
                loadPage('focus_session'); // 跳轉到專注頁面
            };
        }
        if (backButton) {
            backButton.onclick = hideFriendFocusSettingsPopup;
        }
    }

    // 綁定專注完成彈出視窗的事件
    function attachFocusCompletionPopupListeners() {
        const returnButton = focusCompletionPopupPage.querySelector('.return-to-main-button');
        if (returnButton) {
            returnButton.onclick = hideFocusCompletionPopup; // 點擊返回主頁
        }
    }

    // 綁定中途終止彈出視窗的事件 (新增加)
    function attachFocusEarlyTerminationPopupListeners() {
        const returnButton = focusEarlyTerminationPopupPage.querySelector('.early-termination-return-button');
        if (returnButton) {
            returnButton.onclick = hideFocusEarlyTerminationPopup; // 點擊返回主頁
        }
    }


    // 綁定動態載入內容中的事件監聽器
    function attachEventListenersToLoadedContent() {
        // 主頁面導航
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

        // 地圖頁面上的茶園圓圈點擊事件
        mainContentArea.querySelectorAll('.map-container .tea-garden-circle').forEach(circle => {
            circle.addEventListener('click', showTeaGardenSelectionPopup);
        });

        // 地圖頁面底部的好友按鈕跳轉到好友列表
        const mapFriendsButton = mainContentArea.querySelector('.map-page-container .friends-button');
        if (mapFriendsButton) {
            mapFriendsButton.addEventListener('click', () => loadPage('friends'));
        }

        // 專注會話頁面中的「中途終止」按鈕
        const stopButton = mainContentArea.querySelector('.focus-session-page-container .stop-button');
        if (stopButton) {
            stopButton.addEventListener('click', () => endFocusSession(false)); // 中途終止
        }

        // 其他內容頁面內的返回按鈕
        mainContentArea.querySelectorAll('.back-button').forEach(button => {
            // 確保不是彈出視窗的返回按鈕，並且不在專注會話頁面中
            const isPopupCloseButton = button.dataset.action === 'close-popup' || button.dataset.action === 'close-friend-focus-popup';
            const isInsideFocusSession = button.closest('.focus-session-page-container');

            if (!isPopupCloseButton && !isInsideFocusSession) {
                 button.addEventListener('click', goBack);
            }
        });
    }

    // 初始載入主頁面
    loadPage('main', false);
    pageHistory.push('main');
});
