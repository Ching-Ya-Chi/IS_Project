document.addEventListener('DOMContentLoaded', function() {
    const mainContentArea = document.getElementById('main-content-area');
    
    // 全域變數
    const pageCache = {}; 
    const pageHistory = []; 
    let activeInterval = null;
    
    // 模擬資料庫
    const teaDatabase = [
        // 綠茶類 (Green)
        { id: 1, type: 'green', name: '玉露', owned: true },
        { id: 2, type: 'green', name: '龍井', owned: true },
        { id: 3, type: 'green', name: '抹茶', owned: false },
        { id: 4, type: 'green', name: '碧螺春', owned: true },
        { id: 5, type: 'green', name: '煎茶', owned: false },
        
        //青茶/烏龍類 (Oolong - 根據您的表格歸類於中間時長)
        { id: 11, type: 'oolong', name: '文山包種茶', owned: true },
        { id: 12, type: 'oolong', name: '岩茶', owned: false },
        { id: 13, type: 'oolong', name: '東方美人', owned: false },
        { id: 14, type: 'oolong', name: '高山茶', owned: true },
        { id: 15, type: 'oolong', name: '鐵觀音', owned: true },
        { id: 16, type: 'oolong', name: '凍頂烏龍', owned: false },
        { id: 17, type: 'oolong', name: '鳳凰單叢', owned: false },

        // 紅茶類 (Red)
        { id: 21, type: 'red', name: '日月台', owned: true }, // 依照表格文字
        { id: 22, type: 'red', name: '阿薩姆', owned: true },
        { id: 23, type: 'red', name: '蜜香', owned: true }, // 表格寫"蜜香"，可能是蜜香紅茶
        { id: 24, type: 'red', name: '錫蘭', owned: false },
        { id: 25, type: 'red', name: '日月潭', owned: false }
    ];

    // --- 2. 圖片路徑對應表 (集中管理圖片) ---
    const teaImageMap = {
        '玉露': '../img/綠茶_玉露.png',
        '龍井': '../img/綠茶_龍井.png',
        '抹茶': '../img/綠茶_抹茶.png',
        '碧螺春': '../img/綠茶_碧螺春.png',
        '煎茶': '../img/綠茶_煎茶.png',

        '文山包種茶': '../img/青茶_文山包種茶.png',
        '岩茶': '../img/青茶_岩茶.png',
        '東方美人': '../img/青茶_東方美人.png',
        '高山茶': '../img/青茶_高山茶.png',
        '鐵觀音': '../img/青茶_鐵觀音.png',
        '凍頂烏龍': '../img/青茶_凍頂烏龍.png',
        '鳳凰單叢': '../img/青茶_鳳凰單欉.png',

        '阿薩姆': '../img/紅茶_阿薩姆.png',
        '蜜香': '../img/紅茶_蜜香.png',
        '錫蘭': '../img/紅茶_錫蘭.png',
        '日月潭': '../img/紅茶_日月潭.png',
        
        'default': '../img/紅茶_日月潭.png' // 預設圖片
    };

    // --- 3. 茶園產出規則 (Garden Rules) ---
    const gardenRules = {
        'A': {
            'green': ['玉露', '龍井'],
            'yellow': ['文山包種茶', '岩茶'],
            'red': ['日月潭', '阿薩姆']
        },
        'B': {
            'green': ['抹茶', '碧螺春'],
            'yellow': ['東方美人', '高山茶'],
            'red': ['蜜香', '阿薩姆']
        },
        'C': {
            'green': ['玉露', '煎茶'],
            'yellow': ['岩茶', '鐵觀音'],
            'red': ['錫蘭', '日月潭']
        },
        'D': {
            'green': ['碧螺春', '龍井'],
            'yellow': ['凍頂烏龍', '鳳凰單叢'],
            'red': ['蜜香', '錫蘭']
        }
    };

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
        /*main*/ 
        main: () => {
        // --- 角色對話邏輯 ---
        const charBtn = document.getElementById('mainCharacterBtn');
        const bubble = document.getElementById('charSpeechBubble');
        let bubbleTimer = null; // 用來儲存計時器，避免快速點擊時閃爍

        const dialogueList = [
            "「製茶需要耐心，專注也是。我們一起加油！」",
            "「茶香逐漸飄散，你的目標也越來越近了！」",
            "「今天也要趕快一起跟茶米繼續保持專注唷！」"
        ];

        if (charBtn && bubble) {
            charBtn.addEventListener('click', () => {
                // 1. 隨機抽取一句話
                const randomIndex = Math.floor(Math.random() * dialogueList.length);
                bubble.innerText = dialogueList[randomIndex];

                // 2. 顯示氣泡
                bubble.classList.add('show');

                // 3. 重置計時器 (如果還沒消失又被點了一次，要重新倒數)
                if (bubbleTimer) clearTimeout(bubbleTimer);

                // 4. 設定 3 秒後消失
                bubbleTimer = setTimeout(() => {
                    bubble.classList.remove('show');
                }, 3000);
            });
        }
    },

        // ★★★ 地圖頁 (重點修正) ★★★
        map: () => {
            // 1. 取得 DOM 元素
            const modal = document.getElementById('teaModal');
            const timerArea = document.getElementById('timerArea');
            const knobRotator = document.getElementById('knobRotator');
            const displayHr = document.getElementById('displayHr');
            const displayMin = document.getElementById('displayMin');
            const modalTitle = document.getElementById('modalTitle');
            const teaContainer = document.querySelector('.tea-dots-container');
            
            // 2. 定義狀態變數 (放在這裡，讓內部函式都能讀取)
            let currentGardenId = 'A'; // 預設 A 茶園
            let currentMins = 80;      // 預設 80 分鐘 (對應黃茶)

            // --- 核心功能：更新茶種顯示 (顯示全部 + 變暗邏輯) ---
            function updateTeaPreview() {
                if (!teaContainer) return;

                // A. 判斷當前時間屬於哪一類 (Active Category)
                let activeCategory = 'green';
                if (currentMins >= 0 && currentMins <= 60) activeCategory = 'green';
                else if (currentMins > 60 && currentMins <= 120) activeCategory = 'yellow';
                else activeCategory = 'red';

                // B. 取得該茶園的所有規則
                const gardenData = gardenRules[currentGardenId]; // 例如: { green: [...], yellow: [...], red: [...] }
                
                // C. 清空容器
                teaContainer.innerHTML = '';

                if (!gardenData) return;

                // D. 定義順序：綠 -> 黃 -> 紅
                const categories = ['green', 'yellow', 'red'];

                // E. 遍歷所有類別並渲染
                categories.forEach(category => {
                    const teaList = gardenData[category]; // 取得該類別的茶名列表
                    
                    if (teaList) {
                        teaList.forEach(teaName => {
                            const imgSrc = teaImageMap[teaName] || teaImageMap['default'];
                            
                            // 判斷是否為「當前可獲得」
                            // 如果 category 等於 activeCategory，則是正常；否則變暗
                            const isAvailable = (category === activeCategory);
                            const dimClass = isAvailable ? '' : 'dimmed';

                            const itemDiv = document.createElement('div');
                            itemDiv.className = `tea-preview-item ${dimClass}`;
                            
                            // 渲染圖片 (無文字)
                            itemDiv.innerHTML = `
                                <img src="${imgSrc}" class="tea-preview-img" alt="${teaName}" title="${teaName}">
                            `;
                            teaContainer.appendChild(itemDiv);
                        });
                    }
                });
            }

            // --- 旋轉計時器邏輯 ---
            let isDragging = false;

            function updateTimeFromAngle(deg) {
                let normalizedDeg = (deg + 360) % 360;
                if(knobRotator) knobRotator.style.transform = `rotate(${normalizedDeg}deg)`;
                
                const minTime = 1, maxTime = 180;
                let totalMins = Math.round(minTime + (normalizedDeg / 360) * (maxTime - minTime));
                
                // 更新全域變數
                currentMins = totalMins;

                let hr = Math.floor(totalMins / 60);
                let min = totalMins % 60;
                
                if(displayHr) displayHr.innerText = hr;
                if(displayMin) displayMin.innerText = min;

                // 時間改變 -> 更新茶種狀態 (變亮/變暗)
                updateTeaPreview();
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

            // 綁定計時器事件
            if(timerArea) {
                timerArea.addEventListener('mousedown', (e) => { isDragging = true; handleDrag(e.clientX, e.clientY); });
                window.addEventListener('mousemove', (e) => { if(isDragging) { e.preventDefault(); handleDrag(e.clientX, e.clientY); }});
                window.addEventListener('mouseup', () => isDragging = false);
                timerArea.addEventListener('touchstart', (e) => { isDragging = true; handleDrag(e.touches[0].clientX, e.touches[0].clientY); }, {passive:false});
                window.addEventListener('touchmove', (e) => { if(isDragging) { e.preventDefault(); handleDrag(e.touches[0].clientX, e.touches[0].clientY); }}, {passive:false});
                window.addEventListener('touchend', () => isDragging = false);
            }

            // --- Modal 開關邏輯 (修復點擊無反應) ---
            const locationBtns = document.querySelectorAll('.location-btn');
            
            if (locationBtns.length > 0) {
                locationBtns.forEach(btn => {
                    btn.addEventListener('click', (e) => {
                        e.stopPropagation(); // 防止冒泡
                        
                        console.log("茶園按鈕被點擊"); // Debug Log
                        
                        const gardenId = btn.getAttribute('data-id');
                        const title = btn.getAttribute('data-title');
                        
                        // 更新狀態
                        currentGardenId = gardenId;
                        modalTitle.innerText = title || '茶園';
                        
                        // 初始化時間 (預設 80 分鐘)
                        currentMins = 80;
                        updateTimeFromAngle(180); // 旋轉到對應位置
                        
                        // 開啟 Modal
                        if(modal) modal.classList.add('active');
                    });
                });
            } else {
                console.error("找不到 .location-btn 元素");
            }

            if(modal) {
                modal.addEventListener('click', (e) => {
                    if (e.target === modal) modal.classList.remove('active');
                });
            }

            // --- 待辦清單與進入按鈕邏輯 ---
            let todoList = []; 
            const todoInput = document.getElementById('mapTodoInput');
            const addBtn = document.getElementById('mapAddTodoBtn');
            const previewList = document.getElementById('mapTodoPreview');
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
            renderPreview(); // 初始化清單

            // 進入茶園
            if(enterBtn) {
                // 清除舊事件確保乾淨
                const newEnterBtn = enterBtn.cloneNode(true);
                enterBtn.parentNode.replaceChild(newEnterBtn, enterBtn);

                newEnterBtn.addEventListener('click', () => {
                    let totalSecs = currentMins * 60;
                    
                    // 判斷當前時間區間
                    let timeCategory = 'green';
                    if (currentMins > 60 && currentMins <= 120) timeCategory = 'yellow';
                    else if (currentMins > 120) timeCategory = 'red';

                    const sessionSettings = {
                        totalSeconds: totalSecs,
                        checklist: todoList.length > 0 ? todoList : ['專注當下'],
                        // 傳遞目前"有效"的茶給下一頁 (選填，若後續需要)
                        possibleTeas: gardenRules[currentGardenId][timeCategory]
                    };

                    loadPage('focus', true, sessionSettings);
                });
            }
        },

        // 4. 專注頁 (Focus)
        focus: (settings) => {
            console.log("進入專注頁，設定:", settings);
            const sessionData = settings || { totalSeconds: 4800, checklist: ['專注目標'] };
            
            // DOM 元素
            const timerDisplay = document.getElementById('timerDisplay');
            const focusVideo = document.getElementById('focusVideo');
            const speechBubble = document.getElementById('focusSpeechBubble');
            const abortModal = document.getElementById('abortModal');
            const checklistBox = document.querySelector('.checklist-box');

            // 1. 設定影片路徑 (依照階段 1~4)
            const videoSources = [
                '../img/newImage/sunbathe.mp4',   // 階段 1: 剛開始 (0% - 25%)
                '../img/newImage/roasting2.mp4',  // 階段 2: 進行中 (25% - 50%)
                '../img/newImage/roasting3.mp4',  // 階段 3: 深化 (50% - 75%)
                '../img/newImage/rub.mp4'         // 階段 4: 最後衝刺 (75% - 100%)
            ];

            // 2. 設定對話文本
            // 注意：[使用者設定的目標] 會在顯示時被替換
            const dialogues = [
                // 第一階段
                [
                    "「剛開始專注，還滿辛苦的呢！跟這個炎熱的太陽一樣~」",
                    "「趕快進入狀況吧！完成你的『[使用者設定的目標]』，我已經快要被曬乾囉！」"
                ],
                // 第二階段
                [
                    "「呼～茶葉正在慢慢轉化，你也專注地努力著呢！」",
                    "「製茶需要耐心，專注完成『[使用者設定的目標]』也是。我們一起加油！」"
                ],
                // 第三階段
                [
                    "「咦？怎麼了？是不是有什麼重要的事情需要處理呀？」",
                    "「別忘了，茶葉還在烘焙呢。要不要再回到專注中來？」",
                    "「你的『[使用者設定的目標]』還在等著我們呢！」"
                ],
                // 第四階段
                [
                    "「欸，你是不是有點分心了呀？小心茶葉要焦掉囉！」",
                    "「我們約好了要一起完成『[使用者設定的目標]』的，還記得嗎？」",
                    "「哇！你還在考慮嗎？那些茶種可是我們一起努力的成果呢！就差最後一步了，堅持住～」"
                ]
            ];

            // 取得使用者設定的第一個目標，若無則用預設文字
            const userGoal = (sessionData.checklist && sessionData.checklist.length > 0) 
                             ? sessionData.checklist[0] 
                             : "專注任務";

            // 狀態變數
            let currentSeconds = sessionData.totalSeconds;
            let currentPhase = -1; // 追蹤目前階段，避免重複切換影片
            let bubbleTimer = null;

            // 3. 渲染清單 (右上角)
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

            // 4. 更新時間顯示與影片階段
            function updateState() {
                // A. 更新時間 (HH : MM : SS)
                const hr = Math.floor(currentSeconds / 3600);
                const min = Math.floor((currentSeconds % 3600) / 60);
                const sec = currentSeconds % 60;
                
                // 補零函式
                const pad = (num) => num.toString().padStart(2, '0');
                
                if(timerDisplay) {
                    timerDisplay.innerText = `${pad(hr)} : ${pad(min)} : ${pad(sec)}`;
                }

                // B. 計算階段 (0 ~ 3)
                // 進度 = (總時間 - 剩餘) / 總時間
                const elapsed = sessionData.totalSeconds - currentSeconds;
                let progress = elapsed / sessionData.totalSeconds;
                
                // 確保 progress 不會超過 1 (最後一秒)
                if (progress >= 1) progress = 0.99;

                // 0~0.24=0, 0.25~0.49=1, 0.5~0.74=2, 0.75~0.99=3
                const newPhase = Math.floor(progress * 4);

                // C. 如果階段改變，切換影片
                if (newPhase !== currentPhase) {
                    currentPhase = newPhase;
                    console.log(`進入第 ${currentPhase + 1} 階段，播放: ${videoSources[currentPhase]}`);
                    
                    if(focusVideo) {
                        focusVideo.src = videoSources[currentPhase];
                        focusVideo.play().catch(e => console.log("影片播放失敗:", e));
                    }
                }
            }

            // 5. 綁定影片點擊互動 (對話氣泡)
            if (focusVideo && speechBubble) {
                focusVideo.addEventListener('click', () => {
                    // 根據目前階段 (currentPhase) 取得對應文本陣列
                    const phaseTexts = dialogues[currentPhase] || dialogues[0];
                    
                    // 隨機抽取一句
                    const randomIdx = Math.floor(Math.random() * phaseTexts.length);
                    let text = phaseTexts[randomIdx];

                    // 替換目標文字
                    text = text.replace(/\[使用者設定的目標\]/g, userGoal);

                    // 顯示氣泡
                    speechBubble.innerText = text;
                    speechBubble.classList.add('show');

                    // 重置計時器
                    if (bubbleTimer) clearTimeout(bubbleTimer);
                    bubbleTimer = setTimeout(() => {
                        speechBubble.classList.remove('show');
                    }, 3000); // 3秒後消失
                });
            }

            // 初始化一次
            updateState();

            // 6. 啟動計時器
            activeInterval = setInterval(() => {
                if (currentSeconds > 0) {
                    currentSeconds--;
                    updateState(); // 更新時間與檢查階段
                } else {
                    clearInterval(activeInterval);
                    finishSession(true);
                }
            }, 1000); // 測試時可設為 100 加速

            function finishSession(isSuccess) {
                const resultData = {
                    success: isSuccess,
                    totalTime: sessionData.totalSeconds,
                    remainingTime: currentSeconds,
                    checklist: sessionData.checklist
                };
                loadPage('focus_result', true, resultData);
            }

            // 按鈕事件綁定
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
                // 這裡 type 對應到 teaDatabase 裡的 'type'
                // 為了相容原本的按鈕 (white, green, black, dark)，可能需要調整 mapping
                // 假設您的按鈕是: [白茶] [綠茶] [黃/紅/烏龍] 
                // 這裡簡單處理：如果按鈕的 data-type 與 db 的 type 一致就顯示
                
                // 修正 filter 邏輯以符合新資料庫
                // teaDatabase type: green, yellow, red
                // HTML buttons data-type: white, green, black, dark (原本的)
                // 建議修改 tea_cabinet.html 的按鈕 data-type 為: green, yellow, red
                // 或者在這裡做 mapping:
                
                let dbType = type;
                if (type === 'black') dbType = 'red'; // 對應紅色/紅茶按鈕

                const filtered = teaDatabase.filter(t => t.type === dbType);
                const owned = filtered.filter(t => t.owned).length;
                if(progressDisplay) progressDisplay.innerText = `已累積 ${owned} / ${filtered.length} 種`;

                if(filtered.length === 0) {
                    teaGrid.innerHTML = '<div style="grid-column:span 2;text-align:center;margin-top:20px;">無資料</div>';
                    return;
                }
                filtered.forEach(tea => {
                    const card = document.createElement('div');
                    card.className = tea.owned ? 'tea-card owned' : 'tea-card locked';
                    
                    // 取得圖片
                    const imgSrc = teaImageMap[tea.name] || teaImageMap['default'];
                    
                    // 渲染卡片內容
                    let iconHtml = '';
                    if (tea.owned) {
                        // 已擁有：顯示圖片
                        iconHtml = `<img src="${imgSrc}" class="cabinet-tea-img">`;
                    } else {
                        // 未擁有：顯示鎖頭
                        iconHtml = `<i class="fas fa-lock card-icon" style="font-size:40px; color:#333 transform:translateY(-5px);"></i>`;
                    }

                    card.innerHTML = `
                        <div class="card-top">${iconHtml}</div>
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
            // 預設顯示綠茶
            renderTeas('green');
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
            const resultSuccessImage = document.getElementById('resultSuccessVideo');
            const resultFailImage = document.getElementById('resultFailImage');

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
                if(resultMessageEl) resultMessageEl.innerHTML = `你已成功專注 ${timeStr} ！<br>恭喜獲得「玉露」`;
                if(resultFailImage) resultFailImage.style.display = 'none';
                if(resultSuccessImage) {
                    resultSuccessImage.style.display = 'block';
                    resultSuccessImage.play().catch(e => console.log("影片播放失敗", e));
                }
            } else {
                if(resultMessageEl) resultMessageEl.innerHTML = `你專注了 ${timeStr}<br>但失去「文山包種茶」，再接再厲！`;
                if(resultSuccessImage) {
                    resultSuccessImage.style.display = 'none';
                    resultSuccessImage.pause();
                }
                if(resultFailImage) resultFailImage.style.display = 'block';
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