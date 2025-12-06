document.addEventListener('DOMContentLoaded', function() {
    const mainContentArea = document.getElementById('main-content-area');
    
    // 全域變數
    const pageCache = {}; 
    const pageHistory = []; 
    let activeInterval = null; // 用來儲存計時器，切換頁面時要清除
    
    // 模擬資料庫
    const teaDatabase = [
        { id: 1, type: 'black', name: '日月潭紅玉', owned: true },
        { id: 2, type: 'black', name: '蜜香紅茶', owned: true },
        { id: 11, type: 'green', name: '碧螺春', owned: true },
        { id: 12, type: 'green', name: '龍井', owned: false },
        { id: 21, type: 'white', name: '白毫銀針', owned: false },
        { id: 31, type: 'dark', name: '普洱茶', owned: true },
    ];

    // --- 核心路由函式 ---
    window.loadPage = async function(pageName, addToHistory = true,arg =null) {
        // 1. 清理工作 (清除舊頁面的計時器、事件等)
        if (activeInterval) {
            clearInterval(activeInterval);
            activeInterval = null;
        }

        // 2. 載入 HTML
        let htmlContent = pageCache[pageName];
        if (!htmlContent) {
            try {
                const response = await fetch(`pages/${pageName}.html`);
                if (!response.ok) throw new Error(`HTTP Error: ${response.status}`);
                htmlContent = await response.text();
                pageCache[pageName] = htmlContent;
            } catch (error) {
                console.error('載入失敗:', error);
                mainContentArea.innerHTML = `<p style="color:white;text-align:center;">找不到頁面: ${pageName}</p>`;
                return;
            }
        }

        // 3. 渲染
        mainContentArea.innerHTML = htmlContent;

        // 4. 歷史紀錄
        if (addToHistory && pageHistory[pageHistory.length - 1] !== pageName) {
            pageHistory.push(pageName);
        }

        // 5. 執行對應頁面的邏輯
        if (pageControllers[pageName]) {
            pageControllers[pageName](arg);
        }
    }

    // --- 事件委派 (處理所有 data-page 點擊) ---
    document.body.addEventListener('click', function(e) {
        // 尋找是否有 data-page 屬性的按鈕
        const targetBtn = e.target.closest('[data-page]');
        if (targetBtn) {
            e.preventDefault();
            const targetPage = targetBtn.getAttribute('data-page');
                    const targetArg = targetBtn.getAttribute('data-arg'); 
            loadPage(targetPage, true, targetArg);
        }
        
        // 處理返回上一頁 (檢查是否有 .back-btn 且沒有 data-page)
        const backBtn = e.target.closest('.back-btn, .back-button-black');
        if (backBtn && !backBtn.hasAttribute('data-page')) {
            if (pageHistory.length > 1) {
                pageHistory.pop(); // 移除當前頁
                const previousPage = pageHistory[pageHistory.length - 1];
                loadPage(previousPage, false); // false = 不再重複加歷史
            } else {
                loadPage('firstpage', false);
            }
        }
    });

    // --- 頁面邏輯控制器 (Controllers) ---
    const pageControllers = {
        
        // 1. 登入頁 & 註冊頁 (處理密碼眼睛)
        login: () =>{
            // A. 初始化密碼眼睛功能 (保留原本功能)
            setupPasswordToggles();

            // B. 綁定登入按鈕事件
            const loginBtn = document.getElementById('performLoginBtn');
            const usernameInput = document.getElementById('login-username');
            const passwordInput = document.getElementById('login-password');

            if (loginBtn) {
                loginBtn.addEventListener('click', () => {
                    const user = usernameInput.value;
                    const pass = passwordInput.value;

                    // --- 假資料驗證邏輯 ---
                    if (user === '1' && pass === '1') {
                        // 驗證成功 -> 跳轉到主頁
                        console.log("登入成功");
                        loadPage('main');
                    } else {
                        // 驗證失敗 -> 彈出提示
                        alert('帳號或密碼錯誤！\n(測試帳號: 1，密碼: 1)');
                    }
                });
            }
        }, 

        register: () => setupPasswordToggles(),
        modify_pw: () => setupPasswordToggles(),
        modify_acc: () => {}, // 目前無特殊邏輯

        // 2. 主頁 (處理側邊選單)
        main: () => {
            // 這裡的邏輯主要靠 CSS hover，若需要 JS 點擊觸發可在此添加
        },

        // 3. 地圖頁 (Map - 複雜邏輯)
        map: () => {
            const modal = document.getElementById('teaModal');
            const timerArea = document.getElementById('timerArea');
            const knobRotator = document.getElementById('knobRotator');
            const displayHr = document.getElementById('displayHr');
            const displayMin = document.getElementById('displayMin');
            const modalTitle = document.getElementById('modalTitle');

            // 綁定 ABCD 點擊
            document.querySelectorAll('.location-btn').forEach(btn => {
                btn.addEventListener('click', (e) => {
                    e.stopPropagation();
                    modalTitle.innerText = btn.getAttribute('data-title') || '茶園';
                    modal.classList.add('active');
                });
            });

            // 點擊遮罩關閉
            modal.addEventListener('click', (e) => {
                if (e.target === modal) modal.classList.remove('active');
            });

            // 旋轉邏輯
            let isDragging = false;
            
            function updateTimeFromAngle(deg) {
                // 轉換角度邏輯 (保持原本 map_test.html 的邏輯)
                let normalizedDeg = (deg + 360) % 360;
                knobRotator.style.transform = `rotate(${normalizedDeg}deg)`;
                
                const minTime = 1, maxTime = 180;
                let totalMins = Math.round(minTime + (normalizedDeg / 360) * (maxTime - minTime));
                
                let hr = Math.floor(totalMins / 60);
                let min = totalMins % 60;
                
                if(displayHr) {
                    displayHr.innerText = hr;
                    displayHr.parentElement.style.display = hr > 0 ? 'block' : 'none';
                }
                displayMin.innerText = min;
            }

            function handleDrag(clientX, clientY) {
                const rect = timerArea.getBoundingClientRect();
                const centerX = rect.left + rect.width / 2;
                const centerY = rect.top + rect.height / 2;
                let rad = Math.atan2(clientY - centerY, clientX - centerX);
                let deg = rad * (180 / Math.PI);
                updateTimeFromAngle(deg - 90);
            }

            // 綁定拖曳事件
            if(timerArea) {
                timerArea.addEventListener('mousedown', (e) => { isDragging = true; handleDrag(e.clientX, e.clientY); });
                window.addEventListener('mousemove', (e) => { if(isDragging) { e.preventDefault(); handleDrag(e.clientX, e.clientY); }});
                window.addEventListener('mouseup', () => isDragging = false);
                
                // Touch
                timerArea.addEventListener('touchstart', (e) => { isDragging = true; handleDrag(e.touches[0].clientX, e.touches[0].clientY); }, {passive:false});
                window.addEventListener('touchmove', (e) => { if(isDragging) { e.preventDefault(); handleDrag(e.touches[0].clientX, e.touches[0].clientY); }}, {passive:false});
                window.addEventListener('touchend', () => isDragging = false);
            }
            
            // 進入茶園按鈕
            document.querySelector('.enter-btn').addEventListener('click', () => {
                loadPage('focus');
            });
        },

        // 4. 專注頁 (Focus - 計時器)
        focus: () => {
            const timerHrEl = document.getElementById('timerHr');
            const timerMinEl = document.getElementById('timerMin');
            const abortModal = document.getElementById('abortModal');
            
            let totalSeconds = 3; // 模擬 3s

            function updateDisplay() {
                const hr = Math.floor(totalSeconds / 3600);
                const min = Math.floor((totalSeconds % 3600) / 60);
                if(timerHrEl) timerHrEl.innerText = hr;
                if(timerMinEl) timerMinEl.innerText = min;
            }

            activeInterval = setInterval(() => {
                if (totalSeconds > 0) {
                    totalSeconds--;
                    updateDisplay();
                } else {
                    clearInterval(activeInterval);
                    loadPage('focus_result'); // 時間到跳轉
                }
            }, 1000);
            
            updateDisplay();

            // 綁定中斷按鈕
            document.getElementById('focusBackBtn').addEventListener('click', (e) => {
                e.stopPropagation(); // 阻止通用返回邏輯
                abortModal.classList.add('active');
            });
            
            document.getElementById('returnFocusBtn').addEventListener('click', () => {
                abortModal.classList.remove('active');
            });
            
            document.getElementById('confirmAbortBtn').addEventListener('click', () => {
                loadPage('focus_result'); // 這裡假設中斷也去結果頁，或者回 map
            });
        },

        // 5. 茶櫃 (Cabinet - 篩選功能)
        tea_cabinet: () => {
            const teaGrid = document.getElementById('teaGrid');
            const progressDisplay = document.getElementById('progressDisplay');
            const filterBtns = document.querySelectorAll('.filter-btn');

            function renderTeas(type) {
                teaGrid.innerHTML = '';
                const filtered = teaDatabase.filter(t => t.type === type);
                const owned = filtered.filter(t => t.owned).length;
                progressDisplay.innerText = `已累積 ${owned} / ${filtered.length} 種`;

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

            // 初始載入
            renderTeas('black');
        },

        // 6. 裝扮 (Costume)
        costume: () => {
            const items = document.querySelectorAll('.item-box');
            items.forEach(item => {
                item.addEventListener('click', () => {
                    items.forEach(b => b.classList.remove('selected'));
                    item.classList.add('selected');
                });
            });
        },

        // 7. 成就 (Achievements)
        achievements: (arg) => {
            // 接收上一頁傳來的參數 ('unlocked' 或 'locked')，預設為 'unlocked'
            const viewMode = arg || 'unlocked';
            
            // DOM 元素
            const headerTitle = document.getElementById('achieveHeaderTitle');
            const mainDisplay = document.getElementById('mainDisplayArea');
            const gridContainer = document.getElementById('achievementsGrid');
            const modal = document.getElementById('achieveModal');
            const modalContent = document.getElementById('modalContent');

            // 設定標題 (根據 viewMode)
            if (viewMode === 'unlocked') {
                headerTitle.innerHTML = `<span class="page-title">已 解 鎖</span> <i class="far fa-eye" style="font-size:20px; margin-left:10px;"></i>`;
            } else {
                headerTitle.innerHTML = `<span class="page-title">未 解 鎖</span> <i class="far fa-eye-slash" style="font-size:20px; margin-left:10px;"></i>`;
            }

            // --- 1. 假資料庫 (Mock Data) ---
            // 您要求：實作一個有資料，其他為空/鎖定
            const achievementsData = [
                // 第一筆：完整實作的假資料 (如果是 unlocked 模式則顯示，locked 模式則鎖定)
                { 
                    id: 1, 
                    name: 'OO專家', 
                    level: 9, 
                    desc: '連續專注 50 小時', 
                    rate: '1%', 
                    img: 'https://placehold.co/150x150/4CAF50/FFFFFF?text=Avatar', // 假頭像
                    // 如果是在 "已解鎖" 頁面，這筆設為 true；在 "未解鎖" 頁面，設為 false (模擬)
                    unlocked: (viewMode === 'unlocked') 
                },
                // 後續生成的填充資料 (皆為未解鎖或空值)
                ...Array.from({ length: 8 }, (_, i) => ({
                    id: i + 2,
                    name: 'OO高手',
                    level: 5,
                    desc: '達成條件未知',
                    rate: '3%',
                    img: '',
                    unlocked: false // 其他都鎖住
                }))
            ];

            // --- 輔助函式：產生 HTML 內容 ---
            // 根據 unlocked 狀態回傳圖片或問號
            function getAvatarHtml(item, sizeClass) {
                if (item.unlocked) {
                    return `<img src="${item.img}" class="${sizeClass}">`;
                } else {
                    return `<div class="question-mark">?</div>`;
                }
            }

            // --- 2. 渲染上方大展示卡 (Orange Box) ---
            function updateMainDisplay(item) {
                const isLocked = !item.unlocked;
                
                // 鎖定狀態顯示問號，解鎖狀態顯示資訊
                mainDisplay.innerHTML = `
                    <div class="achieve-avatar-circle">
                        ${getAvatarHtml(item, 'achieve-avatar-img')}
                    </div>
                    <div class="achieve-title">${isLocked ? '???' : item.name}</div>
                    <div class="achieve-level">${isLocked ? 'Lv ?' : 'Lv ' + item.level}</div>
                    <div class="achieve-desc">${isLocked ? '條件尚未達成' : item.desc}</div>
                    <div class="achieve-footer">只有 ${item.rate} 的使用者達成<br>此成就</div>
                `;
            }

            // --- 3. 渲染網格 (Grid) ---
            function renderGrid() {
                gridContainer.innerHTML = ''; // 清空

                achievementsData.forEach(item => {
                    const card = document.createElement('div');
                    card.className = 'grid-item';
                    const isLocked = !item.unlocked;

                    card.innerHTML = `
                        <div class="grid-avatar-circle">
                             ${getAvatarHtml(item, 'achieve-avatar-img')}
                        </div>
                        <div class="grid-title">${isLocked ? '???' : item.name}</div>
                        <div class="grid-level">${isLocked ? '' : 'Lv ' + item.level}</div>
                    `;

                    // 事件A: Hover (更新上方橘色區塊)
                    card.addEventListener('mouseenter', () => {
                        updateMainDisplay(item);
                    });
                    
                    // 手機版相容: 點擊第一次更新上方，第二次開 Modal (或直接開 Modal)
                    // 這裡設定：點擊開啟 Modal
                    card.addEventListener('click', () => {
                        openModal(item);
                    });

                    gridContainer.appendChild(card);
                });
            }

            // --- 4. 開啟 Modal ---
            function openModal(item) {
                const isLocked = !item.unlocked;
                
                modalContent.innerHTML = `
                    <div class="modal-content-wrapper">
                        <div class="modal-avatar-large">
                            ${getAvatarHtml(item, 'achieve-avatar-img')}
                        </div>
                        <div class="modal-title">${isLocked ? '???' : item.name}</div>
                        <div class="modal-level">${isLocked ? 'Lv ?' : 'Lv ' + item.level}</div>
                        
                        <div class="modal-desc">
                            ${isLocked ? '繼續努力種植茶葉<br>即可解鎖此成就！' : item.desc}
                        </div>
                        
                        <div class="modal-rate">已有 ${item.rate} 的人擁有</div>
                    </div>
                `;
                modal.classList.add('active');
            }

            // --- 初始化 ---
            renderGrid();
            // 預設顯示第一筆資料
            if (achievementsData.length > 0) {
                updateMainDisplay(achievementsData[0]);
            }

            // --- Modal 關閉邏輯 ---
            modal.addEventListener('click', (e) => {
                // 點擊遮罩或關閉按鈕
                if (e.target === modal || e.target.closest('#modalCloseBtn')) {
                    modal.classList.remove('active');
                }
            });
        }
    };

    // --- 輔助函式：設定密碼眼睛切換 ---
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

    // --- 啟動 ---
    loadPage('firstpage'); // 預設進入首頁
});