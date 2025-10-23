
document.addEventListener('DOMContentLoaded', function() {
    const mainContentArea = document.getElementById('main-content-area');
    const popupOverlay = document.getElementById('popup-overlay');
    const teaGardenSelectionPopupPage = document.getElementById('tea-garden-selection-popup-page');

    let pageHistory = []; // 儲存頁面路徑的歷史記錄

    // 輔助函數：動態載入頁面內容並注入到主內容區
    async function loadPage(pageName, addToHistory = true) {
        // 如果彈出視窗打開著，先關閉它
        if (teaGardenSelectionPopupPage.classList.contains('active')) {
            hideTeaGardenSelectionPopup();
        }

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

        } catch (error) {
            console.error('載入頁面失敗:', error);
            mainContentArea.innerHTML = `<div style="padding: 20px; text-align: center; color: red;">載入 ${pageName} 頁面失敗。</div>`;
        }
    }

    // 輔助函數：顯示茶園選擇彈出視窗
    function showTeaGardenSelectionPopup() {
        // 確保地圖頁面在背景是活躍的（此處可以根據實際需求判斷）
        // 如果不是從地圖頁面點擊，可以考慮自動載入地圖頁面
        // if (pageHistory[pageHistory.length - 1] !== 'map') {
        //     loadPage('map', true);
        // }
        teaGardenSelectionPopupPage.classList.add('active');
        popupOverlay.classList.add('active');
        attachTimerEventListeners(); // 綁定計時器事件
    }

    // 輔助函數：隱藏茶園選擇彈出視窗
    function hideTeaGardenSelectionPopup() {
        teaGardenSelectionPopupPage.classList.remove('active');
        popupOverlay.classList.remove('active');
        // 清除計時器狀態
        resetTimer();
    }

    // 輔助函數：返回上一頁
    function goBack() {
        // 1. 如果彈出視窗打開，則關閉彈出視窗
        if (teaGardenSelectionPopupPage.classList.contains('active')) {
            hideTeaGardenSelectionPopup();
            return;
        }

        // 2. 如果沒有彈出視窗，檢查頁面歷史
        if (pageHistory.length > 1) { // 至少要有當前頁和前一頁
            pageHistory.pop(); // 移除當前頁
            const previousPage = pageHistory[pageHistory.length - 1]; // 獲取前一頁
            loadPage(previousPage, false); // 載入前一頁，但不加入歷史
        } else {
            // 如果沒有歷史，回到主頁面
            loadPage('main', false); // 回到主頁面，且不將其添加到歷史（因為它是默認的）
            pageHistory = ['main']; // 重置歷史為只有主頁
        }
    }

    // ****** 計時器功能實現 (與 popup 相關，所以邏輯放在這裡) ******
    const timeInput = teaGardenSelectionPopupPage.querySelector('.time-input');
    const teaTypeCircle = teaGardenSelectionPopupPage.querySelector('.tea-type-circle');
    const countdownText = teaTypeCircle.querySelector('.countdown-text');
    let timerInterval = null;
    let totalSeconds = 0;
    let remainingSeconds = 0;

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

    function updateTimerDisplay() {
        if (remainingSeconds <= 0) {
            clearInterval(timerInterval);
            timerInterval = null;
            teaTypeCircle.style.setProperty('--timer-progress', '0%');
            countdownText.textContent = '包種茶'; // 倒數結束後顯示預設文本
            alert('專注時間結束！');
            resetTimerControls(true); // 啟用按鈕和輸入框
            return;
        }

        const progress = (remainingSeconds / totalSeconds) * 100;
        teaTypeCircle.style.setProperty('--timer-progress', `${progress}%`);
        countdownText.textContent = formatSecondsToDisplay(remainingSeconds);

        remainingSeconds--;
    }

    function startTimer() {
        if (timerInterval) {
            clearInterval(timerInterval);
        }

        const selectedTime = timeInput.value;
        totalSeconds = parseTimeToSeconds(selectedTime);

        if (totalSeconds <= 0) {
            alert('請輸入有效的專注時間！');
            return;
        }

        remainingSeconds = totalSeconds;
        resetTimerControls(false); // 禁用按鈕和輸入框

        teaTypeCircle.style.setProperty('--timer-progress', '100%');
        countdownText.textContent = formatSecondsToDisplay(remainingSeconds);

        timerInterval = setInterval(updateTimerDisplay, 1000);
    }

    function resetTimer() {
        if (timerInterval) {
            clearInterval(timerInterval);
            timerInterval = null;
        }
        teaTypeCircle.style.setProperty('--timer-progress', '100%');
        countdownText.textContent = '包種茶'; // 重置為預設文本
        timeInput.value = "00:00"; // 重置時間輸入框
        resetTimerControls(true); // 啟用按鈕和輸入框
    }

    function resetTimerControls(enabled) {
        teaGardenSelectionPopupPage.querySelectorAll('[data-action^="start-"]').forEach(button => {
            button.disabled = !enabled;
        });
        timeInput.disabled = !enabled;
    }

    // 綁定計時器相關事件（在顯示彈出視窗時呼叫）
    function attachTimerEventListeners() {
        if (timeInput) {
            timeInput.value = "00:00"; // 確保每次打開都是 00:00
        }
        teaGardenSelectionPopupPage.querySelector('[data-action="start-personal-focus"]')
            .onclick = startTimer;
        teaGardenSelectionPopupPage.querySelector('[data-action="start-friend-focus"]')
            .onclick = startTimer;
        teaGardenSelectionPopupPage.querySelector('[data-action="close-popup"]')
            .onclick = hideTeaGardenSelectionPopup;
    }
    // ****** 計時器功能結束 ******


    // 綁定所有頁面共用的事件監聽器
    function attachGlobalEventListeners() {
        // 全局返回按鈕邏輯
        document.body.addEventListener('click', function(event) {
            const target = event.target.closest('.back-button');
            if (target && target.dataset.action !== 'close-popup') { // 排除 popup 自身的關閉按鈕
                goBack();
            }
        });
        
        // 彈出視窗關閉按鈕
        const closePopupBtn = document.getElementById('closeTeaGardenSelectionPopup');
        if (closePopupBtn) {
            closePopupBtn.addEventListener('click', hideTeaGardenSelectionPopup);
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

        // 注意：對於其他頁面內的按鈕 (如設置頁面內的 "帳號設定")
        // 如果它們也需要導航，請在此處添加相應的事件監聽器。
        // 例如：
        // const accountSettingsBtn = mainContentArea.querySelector('.settings-page-container .settings-button');
        // if (accountSettingsBtn) {
        //     accountSettingsBtn.addEventListener('click', () => alert('導航到帳號設定詳情頁面'));
        // }
    }


    // 初始載入主頁面並綁定全局事件
    loadPage('main', false); // 首次載入不加入歷史
    pageHistory.push('main'); // 將主頁作為歷史記錄的第一項
    attachGlobalEventListeners();
});