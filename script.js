document.addEventListener('DOMContentLoaded', function() {
    const mainContentArea = document.getElementById('main-content-area');
    
    // 全域變數
    const pageCache = {}; 
    const pageHistory = []; 
    let activeInterval = null;
    
    // 模擬資料庫
    const teaDatabase = [
        { id: 1, type: 'black', name: '日月潭紅玉', owned: true },
        { id: 2, type: 'black', name: '蜜香紅茶', owned: true },
        { id: 11, type: 'green', name: '碧螺春', owned: true },
        { id: 12, type: 'green', name: '龍井', owned: false },
        { id: 21, type: 'white', name: '白毫銀針', owned: false },
        { id: 31, type: 'dark', name: '普洱茶', owned: true },
    ];

    // --- 核心路由函式 (已確認包含 arg) ---
    window.loadPage = async function(pageName, addToHistory = true, arg = null) {
        if (activeInterval) {
            clearInterval(activeInterval);
            activeInterval = null;
        }

        let htmlContent = pageCache[pageName];
        if (!htmlContent) {
            try {
                const response = await fetch(`pages/${pageName}.html`);
                if (!response.ok) throw new Error(`HTTP Error: ${response.status}`);
                htmlContent = await response.text();
                pageCache[pageName] = htmlContent;
            } catch (error) {
                console.error('載入失敗:', error);
                return;
            }
        }

        mainContentArea.innerHTML = htmlContent;

        if (addToHistory && pageHistory[pageHistory.length - 1] !== pageName) {
            pageHistory.push(pageName);
        }

        // 執行對應邏輯
        if (pageControllers[pageName]) {
            console.log(`正在執行 ${pageName} 的控制器...`);
            pageControllers[pageName](arg);
        }
    }

    // --- 全域點擊監聽 ---
    document.body.addEventListener('click', function(e) {
        const targetBtn = e.target.closest('[data-page]');
        if (targetBtn) {
            e.preventDefault();
            const targetPage = targetBtn.getAttribute('data-page');
            const targetArg = targetBtn.getAttribute('data-arg'); 
            loadPage(targetPage, true, targetArg);
        }
        
        const backBtn = e.target.closest('.back-btn, .back-button-black');
        if (backBtn && !backBtn.hasAttribute('data-page')) {
            if (pageHistory.length > 1) {
                pageHistory.pop();
                const previousPage = pageHistory[pageHistory.length - 1];
                loadPage(previousPage, false);
            } else {
                loadPage('firstpage', false);
            }
        }
    });

    // --- 控制器 ---
    const pageControllers = {
        login: () => {
            setupPasswordToggles();
            const loginBtn = document.getElementById('performLoginBtn');
            const usernameInput = document.getElementById('login-username');
            const passwordInput = document.getElementById('login-password');

            if (loginBtn) {
                loginBtn.addEventListener('click', () => {
                    const user = usernameInput.value;
                    const pass = passwordInput.value;
                    if (user === '1' && pass === '1') {
                        loadPage('main');
                    } else {
                        alert('帳號或密碼錯誤！(測試帳號: 1，密碼: 1)');
                    }
                });
            }
        }, 
        register: () => setupPasswordToggles(),
        modify_pw: () => setupPasswordToggles(),
        modify_acc: () => {},
        main: () => {},

        // ★★★ 地圖頁 (重點修正) ★★★
        map: () => {
            const modal = document.getElementById('teaModal');
            const timerArea = document.getElementById('timerArea');
            const knobRotator = document.getElementById('knobRotator');
            const displayHr = document.getElementById('displayHr');
            const displayMin = document.getElementById('displayMin');
            const modalTitle = document.getElementById('modalTitle');

            // Modal 開關
            document.querySelectorAll('.location-btn').forEach(btn => {
                btn.addEventListener('click', (e) => {
                    e.stopPropagation();
                    modalTitle.innerText = btn.getAttribute('data-title') || '茶園';
                    modal.classList.add('active');
                });
            });

            if(modal) {
                modal.addEventListener('click', (e) => {
                    if (e.target === modal) modal.classList.remove('active');
                });
            }

            // 待辦清單邏輯
            let todoList = []; 
            const todoInput = document.getElementById('mapTodoInput');
            const addBtn = document.getElementById('mapAddTodoBtn');
            const previewList = document.getElementById('mapTodoPreview');
            
            // ★ 強制重抓按鈕 ID，確保抓得到
            const enterBtn = document.getElementById('enterGardenBtn'); 

            function renderPreview() {
                if(!previewList) return;
                previewList.innerHTML = '';
                if (todoList.length === 0) {
                    previewList.innerHTML = '<div style="font-size:12px;color:#999;text-align:center;">尚未新增事項</div>';
                    return;
                }
                todoList.forEach(item => {
                    const div = document.createElement('div');
                    div.className = 'preview-item';
                    div.innerText = item;
                    previewList.appendChild(div);
                });
            }

            if(addBtn && todoInput) {
                addBtn.addEventListener('click', () => {
                    const val = todoInput.value.trim();
                    if (val) {
                        todoList.push(val);
                        todoInput.value = '';
                        renderPreview();
                    }
                });
            }
            renderPreview();

            // ★ 綁定進入按鈕
            if(enterBtn) {
                console.log("JS: 成功抓到進入按鈕，已綁定事件");
                // 使用 cloneNode 清除可能殘留的舊事件，確保乾淨綁定
                const newEnterBtn = enterBtn.cloneNode(true);
                enterBtn.parentNode.replaceChild(newEnterBtn, enterBtn);

                newEnterBtn.addEventListener('click', () => {
                    console.log("JS: 進入按鈕被點擊！");
                    
                    let hr = parseInt(displayHr?.innerText || 0);
                    let min = parseInt(displayMin?.innerText || 10);
                    let totalSecs = (hr * 3600) + (min * 60);

                    const sessionSettings = {
                        totalSeconds: totalSecs,
                        checklist: todoList.length > 0 ? todoList : ['專注當下'] 
                    };

                    loadPage('focus', true, sessionSettings);
                });
            } else {
                console.error("JS 錯誤: 找不到 ID 為 enterGardenBtn 的按鈕，請檢查 HTML");
            }

            // 旋轉邏輯 (放在後面，避免影響上方按鈕綁定)
            let isDragging = false;
            function updateTimeFromAngle(deg) {
                let normalizedDeg = (deg + 360) % 360;
                if(knobRotator) knobRotator.style.transform = `rotate(${normalizedDeg}deg)`;
                
                const minTime = 1, maxTime = 180;
                let totalMins = Math.round(minTime + (normalizedDeg / 360) * (maxTime - minTime));
                
                let hr = Math.floor(totalMins / 60);
                let min = totalMins % 60;
                
                if(displayHr) {
                    displayHr.innerText = hr;
                    if(displayHr.parentElement) displayHr.parentElement.style.display = hr > 0 ? 'block' : 'none';
                }
                if(displayMin) displayMin.innerText = min;
            }

            function handleDrag(clientX, clientY) {
                if(!timerArea) return;
                const rect = timerArea.getBoundingClientRect();
                const centerX = rect.left + rect.width / 2;
                const centerY = rect.top + rect.height / 2;
                let rad = Math.atan2(clientY - centerY, clientX - centerX);
                let deg = rad * (180 / Math.PI);
                updateTimeFromAngle(deg - 90);
            }

            if(timerArea) {
                timerArea.addEventListener('mousedown', (e) => { isDragging = true; handleDrag(e.clientX, e.clientY); });
                window.addEventListener('mousemove', (e) => { if(isDragging) { e.preventDefault(); handleDrag(e.clientX, e.clientY); }});
                window.addEventListener('mouseup', () => isDragging = false);
                timerArea.addEventListener('touchstart', (e) => { isDragging = true; handleDrag(e.touches[0].clientX, e.touches[0].clientY); }, {passive:false});
                window.addEventListener('touchmove', (e) => { if(isDragging) { e.preventDefault(); handleDrag(e.touches[0].clientX, e.touches[0].clientY); }}, {passive:false});
                window.addEventListener('touchend', () => isDragging = false);
            }
        },

        // 4. 專注頁 (Focus)
        focus: (settings) => {
            console.log("進入專注頁，參數:", settings);
            const sessionData = settings || { totalSeconds: 4800, checklist: ['預設事項'] };
            const timerHrEl = document.getElementById('timerHr');
            const timerMinEl = document.getElementById('timerMin');
            const abortModal = document.getElementById('abortModal');
            const checklistBox = document.querySelector('.checklist-box');
            
            // 渲染清單
            if (checklistBox) {
                const title = checklistBox.querySelector('.checklist-title');
                checklistBox.innerHTML = ''; 
                if(title) checklistBox.appendChild(title);

                sessionData.checklist.forEach(item => {
                    const div = document.createElement('div');
                    div.className = 'checklist-item';
                    div.innerText = item;
                    checklistBox.appendChild(div);
                });
            }
            
            let currentSeconds = sessionData.totalSeconds;

            function updateDisplay() {
                const hr = Math.floor(currentSeconds / 3600);
                const min = Math.floor((currentSeconds % 3600) / 60);
                if(timerHrEl) timerHrEl.innerText = hr;
                if(timerMinEl) timerMinEl.innerText = min;
            }

            updateDisplay();
            activeInterval = setInterval(() => {
                if (currentSeconds > 0) {
                    currentSeconds--;
                    updateDisplay();
                } else {
                    clearInterval(activeInterval);
                    finishSession(true);
                }
            }, 1000); // 測試時可改為 100 加速

            function finishSession(isSuccess) {
                const resultData = {
                    success: isSuccess,
                    totalTime: sessionData.totalSeconds,
                    remainingTime: currentSeconds,
                    checklist: sessionData.checklist
                };
                loadPage('focus_result', true, resultData);
            }

            if(document.getElementById('focusBackBtn')) {
                document.getElementById('focusBackBtn').addEventListener('click', (e) => {
                    e.stopPropagation();
                    if(abortModal) abortModal.classList.add('active');
                });
            }
            if(document.getElementById('returnFocusBtn')) {
                document.getElementById('returnFocusBtn').addEventListener('click', () => {
                   if(abortModal) abortModal.classList.remove('active');
                });
            }
            if(document.getElementById('confirmAbortBtn')) {
                document.getElementById('confirmAbortBtn').addEventListener('click', () => {
                    finishSession(false);
                });
            }
        },

        // 5. 茶櫃
        tea_cabinet: () => {
            const teaGrid = document.getElementById('teaGrid');
            const progressDisplay = document.getElementById('progressDisplay');
            const filterBtns = document.querySelectorAll('.filter-btn');

            function renderTeas(type) {
                if(!teaGrid) return;
                teaGrid.innerHTML = '';
                const filtered = teaDatabase.filter(t => t.type === type);
                const owned = filtered.filter(t => t.owned).length;
                if(progressDisplay) progressDisplay.innerText = `已累積 ${owned} / ${filtered.length} 種`;

                if(filtered.length === 0) {
                    teaGrid.innerHTML = '<div style="grid-column:span 2;text-align:center;margin-top:20px;">無資料</div>';
                    return;
                }
                filtered.forEach(tea => {
                    const card = document.createElement('div');
                    card.className = tea.owned ? 'tea-card owned' : 'tea-card locked';
                    card.innerHTML = `
                        <div class="card-top"><i class="${tea.owned ? 'far fa-leaf' : 'fas fa-lock'} card-icon" style="font-size:40px; color:${tea.owned?'#4CAF50':'#333'}"></i></div>
                        <div class="card-bottom"><div class="tea-name">${tea.name}</div></div>
                    `;
                    teaGrid.appendChild(card);
                });
            }

            filterBtns.forEach(btn => {
                btn.addEventListener('click', () => {
                    filterBtns.forEach(b => b.classList.remove('active'));
                    btn.classList.add('active');
                    renderTeas(btn.getAttribute('data-type'));
                });
            });
            renderTeas('black');
        },

        costume: () => {
            const items = document.querySelectorAll('.item-box');
            items.forEach(item => {
                item.addEventListener('click', () => {
                    items.forEach(b => b.classList.remove('selected'));
                    item.classList.add('selected');
                });
            });
        },

        // 7. 成就
        achievements: (arg) => {
            const viewMode = arg || 'unlocked';
            const headerTitle = document.getElementById('achieveHeaderTitle');
            const mainDisplay = document.getElementById('mainDisplayArea');
            const gridContainer = document.getElementById('achievementsGrid');
            const modal = document.getElementById('achieveModal');
            const modalContent = document.getElementById('modalContent');

            if (headerTitle) {
                headerTitle.innerHTML = viewMode === 'unlocked' 
                    ? `<span class="page-title">已 解 鎖</span> <i class="far fa-eye" style="font-size:20px; margin-left:10px;"></i>`
                    : `<span class="page-title">未 解 鎖</span> <i class="far fa-eye-slash" style="font-size:20px; margin-left:10px;"></i>`;
            }

            const achievementsData = [
                { id: 1, name: 'OO專家', level: 9, desc: '連續專注 50 小時', rate: '1%', img: 'https://placehold.co/150x150/4CAF50/FFFFFF?text=Avatar', unlocked: (viewMode === 'unlocked') },
                ...Array.from({ length: 8 }, (_, i) => ({ id: i + 2, name: 'OO高手', level: 5, desc: '達成條件未知', rate: '3%', img: '', unlocked: false }))
            ];

            function getAvatarHtml(item, sizeClass) {
                return item.unlocked ? `<img src="${item.img}" class="${sizeClass}">` : `<div class="question-mark">?</div>`;
            }

            function updateMainDisplay(item) {
                if(!mainDisplay) return;
                const isLocked = !item.unlocked;
                mainDisplay.innerHTML = `
                    <div class="achieve-avatar-circle">${getAvatarHtml(item, 'achieve-avatar-img')}</div>
                    <div class="achieve-title">${isLocked ? '???' : item.name}</div>
                    <div class="achieve-level">${isLocked ? 'Lv ?' : 'Lv ' + item.level}</div>
                    <div class="achieve-desc">${isLocked ? '條件尚未達成' : item.desc}</div>
                    <div class="achieve-footer">只有 ${item.rate} 的使用者達成<br>此成就</div>
                `;
            }

            function renderGrid() {
                if(!gridContainer) return;
                gridContainer.innerHTML = '';
                achievementsData.forEach(item => {
                    const card = document.createElement('div');
                    card.className = 'grid-item';
                    const isLocked = !item.unlocked;
                    card.innerHTML = `
                        <div class="grid-avatar-circle">${getAvatarHtml(item, 'achieve-avatar-img')}</div>
                        <div class="grid-title">${isLocked ? '???' : item.name}</div>
                        <div class="grid-level">${isLocked ? '' : 'Lv ' + item.level}</div>
                    `;
                    card.addEventListener('mouseenter', () => updateMainDisplay(item));
                    card.addEventListener('click', () => openModal(item));
                    gridContainer.appendChild(card);
                });
            }

            function openModal(item) {
                if(!modal || !modalContent) return;
                const isLocked = !item.unlocked;
                modalContent.innerHTML = `
                    <div class="modal-content-wrapper">
                        <div class="modal-avatar-large">${getAvatarHtml(item, 'achieve-avatar-img')}</div>
                        <div class="modal-title">${isLocked ? '???' : item.name}</div>
                        <div class="modal-level">${isLocked ? 'Lv ?' : 'Lv ' + item.level}</div>
                        <div class="modal-desc">${isLocked ? '繼續努力種植茶葉<br>即可解鎖此成就！' : item.desc}</div>
                        <div class="modal-rate">已有 ${item.rate} 的人擁有</div>
                    </div>
                `;
                modal.classList.add('active');
            }

            renderGrid();
            if (achievementsData.length > 0) updateMainDisplay(achievementsData[0]);

            if(modal) {
                modal.addEventListener('click', (e) => {
                    if (e.target === modal || e.target.closest('#modalCloseBtn')) modal.classList.remove('active');
                });
            }
        },

        // 8. 結果頁
        focus_result: (data) => {
            const session = data || { success: false, totalTime: 4800, remainingTime: 2400, checklist: ['無待辦事項'] };
            const resultMessageEl = document.getElementById('resultMessage');
            const checklistContainer = document.getElementById('resultChecklistItems');
            const resultVideo = document.getElementById('resultVideo');
            const resultImage = document.getElementById('resultImage');

            const actualSeconds = session.totalTime - session.remainingTime;
            const hr = Math.floor(actualSeconds / 3600);
            const min = Math.floor((actualSeconds % 3600) / 60);
            const timeStr = `${hr} hrs ${min} mins`;

            if(checklistContainer) {
                checklistContainer.innerHTML = '';
                session.checklist.forEach(item => {
                    const div = document.createElement('div');
                    div.className = 'checklist-item-row';
                    div.innerText = item;
                    checklistContainer.appendChild(div);
                });
            }

            if (session.success) {
                if(resultMessageEl) resultMessageEl.innerHTML = `你已成功專注 ${timeStr} ！<br>恭喜獲得「紅茶」`;
                if(resultImage) resultImage.style.display = 'none';
                if(resultVideo) {
                    resultVideo.style.display = 'block';
                    resultVideo.play().catch(e => console.log("影片播放失敗", e));
                }
            } else {
                if(resultMessageEl) resultMessageEl.innerHTML = `你專注了 ${timeStr}<br>但失去「紅茶」，再接再厲！`;
                if(resultVideo) {
                    resultVideo.style.display = 'none';
                    resultVideo.pause();
                }
                if(resultImage) resultImage.style.display = 'block';
            }
        }
    };

    function setupPasswordToggles() {
        const icons = document.querySelectorAll('.toggle-password-icon, .toggle-password');
        icons.forEach(icon => {
            icon.addEventListener('click', function() {
                const input = this.previousElementSibling;
                if (input && input.tagName === 'INPUT') {
                    const type = input.getAttribute('type') === 'password' ? 'text' : 'password';
                    input.setAttribute('type', type);
                    this.classList.toggle('fa-eye');
                    this.classList.toggle('fa-eye-slash');
                }
            });
        });
    }

    loadPage('firstpage');
});