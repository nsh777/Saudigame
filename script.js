// Saudi-themed Drawing Game JavaScript
class SaudiDrawingGame {
    constructor() {
        this.canvas = document.getElementById('drawingCanvas');
        this.ctx = this.canvas.getContext('2d');
        this.isDrawing = false;
        this.currentTool = 'brush';
        this.currentColor = '#000000';
        this.brushSize = 5;
        this.players = [];
        this.currentPlayer = null;
        this.gameState = 'waiting'; // waiting, playing, wordSelection, gameOver
        this.currentWord = '';
        this.selectedWord = '';
        this.timer = 60;
        this.timerInterval = null;
        this.score = {};
        this.roomCode = '';
        this.isHost = false;
        this.roomId = null;
        this.websocket = null;
        this.notifications = [];
        this.roomStorageKey = 'saudi_drawing_rooms';
        this.playerStorageKey = 'saudi_drawing_player';
        this.playerId = this.generatePlayerId();
        this.firebaseInitialized = false;
        
        // Saudi-themed word categories
        this.wordCategories = {
            'الطعام السعودي': [
                'كبسة', 'مندي', 'مقلوبة', 'هريس', 'ثريد', 'مرقوق', 'مظبي', 'شيش برك', 'سليق', 'عصيدة',
                'حنيذ', 'مشوي', 'شاورما', 'فلافل', 'حمص', 'متبل', 'خبز عربي', 'تميس', 'سمبوسة', 'لقيمات'
            ],
            'الأماكن السعودية': [
                'مكة المكرمة', 'المدينة المنورة', 'الرياض', 'جدة', 'الدمام', 'الخبر', 'الطائف', 'تبوك',
                'بريدة', 'خميس مشيط', 'حائل', 'نجران', 'جازان', 'القطيف', 'الأحساء', 'عرعر', 'سكاكا', 'الباحة'
            ],
            'الثقافة السعودية': [
                'العود', 'الطرب', 'الخط العربي', 'النسيج', 'الخنجر', 'الشماغ', 'العقال', 'الثوب', 'العباءة',
                'البرقع', 'الطاسة', 'القهوة العربية', 'التمر', 'البلح', 'الرطب', 'الزبيب', 'اللوز', 'الفستق'
            ],
            'التراث السعودي': [
                'الخيمة', 'البيت الشعبي', 'القلعة', 'البرج', 'الواحة', 'الصحراء', 'الكثبان', 'الوادي',
                'الجبال', 'البحر الأحمر', 'الخليج العربي', 'الربع الخالي', 'النجد', 'الحجاز', 'عسير'
            ],
            'الحيوانات': [
                'الجمل', 'الخيل', 'الغنم', 'الماعز', 'الضب', 'الغزال', 'الوعل', 'النمر العربي', 'الذئب',
                'الثعلب', 'القط البري', 'النسر', 'الصقر', 'الحمام', 'البوم', 'الغراب', 'العقاب'
            ],
            'الطبيعة': [
                'النخيل', 'التمر', 'الورد', 'الزهرة', 'الشجرة', 'الوردة', 'البرتقال', 'الليمون', 'الرمان',
                'التفاح', 'الموز', 'العنب', 'الخوخ', 'المشمش', 'الكرز', 'الفراولة', 'البطيخ', 'الشمام'
            ]
        };
        
        this.allWords = Object.values(this.wordCategories).flat();
        
        this.init();
    }
    
    init() {
        this.setupCanvas();
        this.setupEventListeners();
        this.setupDrawing();
        this.initializeFirebase();
        this.checkForRoomCode();
        this.updateUI();
    }
    
    generatePlayerId() {
        return 'player_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
    }
    
    initializeFirebase() {
        // Wait for Firebase to be available
        const checkFirebase = () => {
            if (window.firebaseDatabase) {
                this.firebaseInitialized = true;
                this.showNotification('success', 'متصل!', 'تم الاتصال بخدمة الألعاب المتعددة');
                console.log('Firebase initialized successfully');
                
                // Show test button for debugging
                document.getElementById('testFirebase').style.display = 'inline-block';
            } else {
                console.log('Waiting for Firebase...');
                setTimeout(checkFirebase, 100);
            }
        };
        checkFirebase();
    }
    
    checkForRoomCode() {
        // Check URL parameters for room code
        const urlParams = new URLSearchParams(window.location.search);
        const roomCode = urlParams.get('room');
        const playerName = urlParams.get('name');
        
        if (roomCode) {
            // Try to join existing room
            this.joinRoomByCode(roomCode, playerName || 'لاعب جديد');
        } else {
            // Check localStorage for existing room
            const savedRoom = localStorage.getItem(this.roomStorageKey);
            if (savedRoom) {
                const roomData = JSON.parse(savedRoom);
                this.roomCode = roomData.roomCode;
                this.isHost = roomData.isHost;
                this.roomId = roomData.roomId;
                this.players = roomData.players || [];
                this.score = roomData.score || {};
                
                if (this.isHost) {
                    this.showRoomInfo();
                    this.addPlayer('أنت (المضيف)', true);
                } else {
                    this.addPlayer('أنت', true);
                }
            } else {
                this.addPlayer('أنت', true);
            }
        }
    }
    
    setupCanvas() {
        this.ctx.lineCap = 'round';
        this.ctx.lineJoin = 'round';
        this.ctx.fillStyle = 'white';
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
    }
    
    setupEventListeners() {
        // Drawing tools
        document.querySelectorAll('.tool-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                document.querySelectorAll('.tool-btn').forEach(b => b.classList.remove('active'));
                btn.classList.add('active');
                this.currentTool = btn.dataset.tool;
            });
        });
        
        // Color palette
        document.querySelectorAll('.color-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                document.querySelectorAll('.color-btn').forEach(b => b.classList.remove('active'));
                btn.classList.add('active');
                this.currentColor = btn.dataset.color;
            });
        });
        
        // Brush size
        const brushSizeSlider = document.getElementById('brushSize');
        const brushSizeValue = document.getElementById('brushSizeValue');
        brushSizeSlider.addEventListener('input', (e) => {
            this.brushSize = parseInt(e.target.value);
            brushSizeValue.textContent = this.brushSize;
        });
        
        // Clear canvas
        document.getElementById('clearCanvas').addEventListener('click', () => {
            this.clearCanvas();
        });
        
        // Game controls
        document.getElementById('startGame').addEventListener('click', () => {
            this.startSinglePlayerGame();
        });
        
        document.getElementById('createRoom').addEventListener('click', () => {
            this.createRoom();
        });
        
        document.getElementById('joinRoom').addEventListener('click', () => {
            this.showJoinRoomModal();
        });
        
        document.getElementById('confirmJoin').addEventListener('click', () => {
            this.joinRoom();
        });
        
        document.getElementById('cancelJoin').addEventListener('click', () => {
            this.hideModal('joinRoomModal');
        });
        
        document.getElementById('leaveGame').addEventListener('click', () => {
            this.leaveGame();
        });
        
        // Room sharing
        document.getElementById('copyRoomCode').addEventListener('click', () => {
            this.copyRoomCode();
        });
        
        document.getElementById('copyRoomUrl').addEventListener('click', () => {
            this.copyRoomUrl();
        });
        
        document.getElementById('shareWhatsApp').addEventListener('click', () => {
            this.shareRoom('whatsapp');
        });
        
        document.getElementById('shareTelegram').addEventListener('click', () => {
            this.shareRoom('telegram');
        });
        
        document.getElementById('shareLink').addEventListener('click', () => {
            this.shareRoom('link');
        });
        
        // Test Firebase button
        document.getElementById('testFirebase').addEventListener('click', () => {
            this.testFirebaseConnection();
        });
        
        // Room controls
        document.getElementById('startRoomGame').addEventListener('click', () => {
            this.startRoomGame();
        });
        
        document.getElementById('leaveRoom').addEventListener('click', () => {
            this.leaveRoom();
        });
        
        // Chat
        document.getElementById('sendMessage').addEventListener('click', () => {
            this.sendMessage();
        });
        
        document.getElementById('chatInput').addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                this.sendMessage();
            }
        });
        
        // Word selection
        document.getElementById('selectWord').addEventListener('click', () => {
            this.selectWord();
        });
        
        // Play again
        document.getElementById('playAgain').addEventListener('click', () => {
            this.playAgain();
        });
    }
    
    setupDrawing() {
        this.canvas.addEventListener('mousedown', (e) => this.startDrawing(e));
        this.canvas.addEventListener('mousemove', (e) => this.draw(e));
        this.canvas.addEventListener('mouseup', () => this.stopDrawing());
        this.canvas.addEventListener('mouseout', () => this.stopDrawing());
        
        // Touch events for mobile
        this.canvas.addEventListener('touchstart', (e) => {
            e.preventDefault();
            const touch = e.touches[0];
            const mouseEvent = new MouseEvent('mousedown', {
                clientX: touch.clientX,
                clientY: touch.clientY
            });
            this.canvas.dispatchEvent(mouseEvent);
        });
        
        this.canvas.addEventListener('touchmove', (e) => {
            e.preventDefault();
            const touch = e.touches[0];
            const mouseEvent = new MouseEvent('mousemove', {
                clientX: touch.clientX,
                clientY: touch.clientY
            });
            this.canvas.dispatchEvent(mouseEvent);
        });
        
        this.canvas.addEventListener('touchend', (e) => {
            e.preventDefault();
            const mouseEvent = new MouseEvent('mouseup', {});
            this.canvas.dispatchEvent(mouseEvent);
        });
    }
    
    startDrawing(e) {
        if (this.gameState !== 'playing' || !this.isCurrentPlayer()) return;
        
        this.isDrawing = true;
        const rect = this.canvas.getBoundingClientRect();
        this.lastX = e.clientX - rect.left;
        this.lastY = e.clientY - rect.top;
    }
    
    draw(e) {
        if (!this.isDrawing || this.gameState !== 'playing' || !this.isCurrentPlayer()) return;
        
        const rect = this.canvas.getBoundingClientRect();
        const currentX = e.clientX - rect.left;
        const currentY = e.clientY - rect.top;
        
        this.ctx.beginPath();
        this.ctx.moveTo(this.lastX, this.lastY);
        this.ctx.lineTo(currentX, currentY);
        
        if (this.currentTool === 'brush') {
            this.ctx.strokeStyle = this.currentColor;
            this.ctx.lineWidth = this.brushSize;
            this.ctx.stroke();
        } else if (this.currentTool === 'eraser') {
            this.ctx.globalCompositeOperation = 'destination-out';
            this.ctx.lineWidth = this.brushSize * 2;
            this.ctx.stroke();
            this.ctx.globalCompositeOperation = 'source-over';
        }
        
        this.lastX = currentX;
        this.lastY = currentY;
    }
    
    stopDrawing() {
        this.isDrawing = false;
    }
    
    clearCanvas() {
        this.ctx.fillStyle = 'white';
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
    }
    
    addPlayer(name, isCurrentPlayer = false) {
        const player = {
            id: this.playerId,
            name: name,
            score: 0,
            isCurrentPlayer: isCurrentPlayer,
            joinedAt: Date.now()
        };
        
        this.players.push(player);
        this.score[player.id] = 0;
        
        if (isCurrentPlayer) {
            this.currentPlayer = player;
        }
        
        this.updatePlayersList();
    }
    
    addPlayerToFirebase(playerName) {
        const player = {
            id: this.playerId,
            name: playerName,
            score: 0,
            isCurrentPlayer: false,
            joinedAt: Date.now()
        };
        
        // Add player to Firebase
        const playersRef = window.firebaseRef(window.firebaseDatabase, `rooms/${this.roomCode}/players/${this.playerId}`);
        window.firebaseSet(playersRef, player);
        
        // Update score
        const scoreRef = window.firebaseRef(window.firebaseDatabase, `rooms/${this.roomCode}/score/${this.playerId}`);
        window.firebaseSet(scoreRef, 0);
    }
    
    createFirebaseRoom() {
        console.log('Creating Firebase room with code:', this.roomCode);
        
        const roomData = {
            roomId: this.roomId,
            roomCode: this.roomCode,
            hostId: this.playerId,
            players: {},
            score: {},
            gameState: 'waiting',
            currentWord: '',
            createdAt: window.firebaseServerTimestamp(),
            lastActivity: window.firebaseServerTimestamp()
        };
        
        // Add host player
        roomData.players[this.playerId] = {
            id: this.playerId,
            name: 'أنت (المضيف)',
            score: 0,
            isCurrentPlayer: true,
            joinedAt: Date.now()
        };
        
        roomData.score[this.playerId] = 0;
        
        console.log('Room data:', roomData);
        
        // Create room in Firebase
        const roomRef = window.firebaseRef(window.firebaseDatabase, `rooms/${this.roomCode}`);
        
        window.firebaseSet(roomRef, roomData)
            .then(() => {
                console.log('Room created successfully in Firebase');
            })
            .catch((error) => {
                console.error('Error creating room in Firebase:', error);
                throw error;
            });
    }
    
    listenToRoomUpdates() {
        if (!this.firebaseInitialized || !this.roomCode) return;
        
        const roomRef = window.firebaseRef(window.firebaseDatabase, `rooms/${this.roomCode}`);
        
        window.firebaseOnValue(roomRef, (snapshot) => {
            const roomData = snapshot.val();
            
            if (roomData) {
                // Update players list
                const players = Object.values(roomData.players || {});
                this.players = players;
                this.score = roomData.score || {};
                
                // Update current player
                const currentPlayer = players.find(p => p.isCurrentPlayer);
                if (currentPlayer) {
                    this.currentPlayer = currentPlayer;
                }
                
                // Update game state
                this.gameState = roomData.gameState || 'waiting';
                this.currentWord = roomData.currentWord || '';
                
                this.updatePlayersList();
                this.updateWordDisplay();
                
                // Update last activity
                const activityRef = window.firebaseRef(window.firebaseDatabase, `rooms/${this.roomCode}/lastActivity`);
                window.firebaseSet(activityRef, window.firebaseServerTimestamp());
            }
        });
    }
    
    updateFirebaseRoom() {
        if (!this.firebaseInitialized || !this.roomCode) return;
        
        const roomRef = window.firebaseRef(window.firebaseDatabase, `rooms/${this.roomCode}`);
        const updates = {
            players: {},
            score: this.score,
            gameState: this.gameState,
            currentWord: this.currentWord,
            lastActivity: window.firebaseServerTimestamp()
        };
        
        // Convert players array to object
        this.players.forEach(player => {
            updates.players[player.id] = player;
        });
        
        window.firebaseSet(roomRef, updates);
    }
    
    updatePlayersList() {
        const playersList = document.getElementById('playersList');
        playersList.innerHTML = '';
        
        this.players.forEach(player => {
            const playerItem = document.createElement('div');
            playerItem.className = 'player-item';
            playerItem.innerHTML = `
                <span class="player-name">${player.name}</span>
                <span class="player-score">${this.score[player.id]}</span>
            `;
            playersList.appendChild(playerItem);
        });
        
        document.getElementById('playerCount').textContent = this.players.length;
    }
    
    startGame() {
        if (this.players.length < 2) {
            // Add AI players for demo
            this.addPlayer('أحمد', false);
            this.addPlayer('فاطمة', false);
            this.addPlayer('محمد', false);
        }
        
        this.gameState = 'wordSelection';
        this.updateFirebaseRoom();
        this.showWordSelection();
        this.hideCanvasOverlay();
    }
    
    joinGame() {
        const playerName = prompt('أدخل اسمك:', 'لاعب جديد');
        if (playerName) {
            this.addPlayer(playerName, false);
            this.addMessage('system', `${playerName} انضم للعبة!`);
        }
    }
    
    startRoomGame() {
        console.log('Starting room game...');
        
        if (this.players.length < 2) {
            this.showNotification('warning', 'تحذير!', 'يجب أن يكون هناك لاعبين على الأقل لبدء اللعبة');
            return;
        }
        
        // Hide room info and start the actual game
        document.getElementById('roomInfo').style.display = 'none';
        document.getElementById('leaveGame').style.display = 'inline-block';
        
        // Start the game
        this.gameState = 'wordSelection';
        this.showWordSelection();
        this.hideCanvasOverlay();
        
        this.showNotification('success', 'بدأت اللعبة!', 'الآن يمكن للاعبين البدء في الرسم والتخمين');
        this.addMessage('system', 'بدأت اللعبة! حظاً سعيداً للجميع!');
        
        // Update Firebase if available
        if (this.firebaseInitialized && this.roomCode) {
            this.updateFirebaseRoom();
        }
    }
    
    leaveRoom() {
        console.log('Leaving room...');
        
        // Remove player from Firebase room
        if (this.firebaseInitialized && this.roomCode) {
            const playerRef = window.firebaseRef(window.firebaseDatabase, `rooms/${this.roomCode}/players/${this.playerId}`);
            window.firebaseRemove(playerRef);
            
            const scoreRef = window.firebaseRef(window.firebaseDatabase, `rooms/${this.roomCode}/score/${this.playerId}`);
            window.firebaseRemove(scoreRef);
        }
        
        // Clear room data
        this.roomCode = '';
        this.isHost = false;
        this.roomId = null;
        this.players = [];
        this.score = {};
        
        // Reset UI
        document.getElementById('roomInfo').style.display = 'none';
        document.getElementById('leaveGame').style.display = 'none';
        document.getElementById('startGame').style.display = 'inline-block';
        document.getElementById('createRoom').style.display = 'inline-block';
        document.getElementById('joinRoom').style.display = 'inline-block';
        
        // Clear URL parameters
        const baseUrl = window.location.origin + window.location.pathname;
        window.history.pushState({}, '', baseUrl);
        
        this.addPlayer('أنت', true);
        this.addMessage('system', 'غادرت الغرفة');
        this.showNotification('info', 'غادرت الغرفة', 'يمكنك الآن إنشاء غرفة جديدة أو الانضمام لغيرها');
    }
    
    showWordSelection() {
        const modal = document.getElementById('wordModal');
        const wordOptions = document.getElementById('wordOptions');
        
        // Select a random category
        const categories = Object.keys(this.wordCategories);
        const randomCategory = categories[Math.floor(Math.random() * categories.length)];
        const words = this.wordCategories[randomCategory];
        
        // Select 3 random words
        const selectedWords = [];
        for (let i = 0; i < 3; i++) {
            const randomWord = words[Math.floor(Math.random() * words.length)];
            if (!selectedWords.includes(randomWord)) {
                selectedWords.push(randomWord);
            }
        }
        
        wordOptions.innerHTML = '';
        selectedWords.forEach(word => {
            const wordOption = document.createElement('div');
            wordOption.className = 'word-option';
            wordOption.textContent = word;
            wordOption.addEventListener('click', () => {
                document.querySelectorAll('.word-option').forEach(opt => opt.classList.remove('selected'));
                wordOption.classList.add('selected');
                this.selectedWord = word;
            });
            wordOptions.appendChild(wordOption);
        });
        
        modal.classList.add('show');
    }
    
    selectWord() {
        if (!this.selectedWord) {
            alert('يرجى اختيار كلمة أولاً');
            return;
        }
        
        this.currentWord = this.selectedWord;
        this.gameState = 'playing';
        this.updateFirebaseRoom();
        this.startTimer();
        this.updateWordDisplay();
        this.hideModal('wordModal');
        this.addMessage('system', `بدأ ${this.currentPlayer.name} في الرسم!`);
    }
    
    startTimer() {
        this.timer = 60;
        this.updateTimer();
        
        this.timerInterval = setInterval(() => {
            this.timer--;
            this.updateTimer();
            
            if (this.timer <= 0) {
                this.endTurn();
            }
        }, 1000);
    }
    
    stopTimer() {
        if (this.timerInterval) {
            clearInterval(this.timerInterval);
            this.timerInterval = null;
        }
    }
    
    updateTimer() {
        document.getElementById('timer').textContent = this.timer;
    }
    
    updateWordDisplay() {
        const wordDisplay = document.getElementById('currentWord');
        const hint = document.getElementById('wordHint');
        
        if (this.isCurrentPlayer()) {
            wordDisplay.textContent = this.currentWord;
            hint.textContent = `تلميح: كلمة سعودية (${this.currentWord.length} حرف)`;
        } else {
            const hiddenWord = this.currentWord.split('').map(() => '_').join(' ');
            wordDisplay.textContent = hiddenWord;
            hint.textContent = `تلميح: كلمة سعودية (${this.currentWord.length} حرف)`;
        }
    }
    
    sendMessage() {
        const input = document.getElementById('chatInput');
        const message = input.value.trim();
        
        if (!message) return;
        
        if (this.gameState === 'playing' && !this.isCurrentPlayer()) {
            this.checkGuess(message);
        }
        
        this.addMessage('player', `${this.currentPlayer.name}: ${message}`);
        input.value = '';
    }
    
    checkGuess(guess) {
        if (guess.toLowerCase() === this.currentWord.toLowerCase()) {
            this.addMessage('correct', `🎉 ${this.currentPlayer.name} خمن الكلمة بشكل صحيح!`);
            this.score[this.currentPlayer.id] += 10;
            
            // Update Firebase with new score
            const scoreRef = window.firebaseRef(window.firebaseDatabase, `rooms/${this.roomCode}/score/${this.currentPlayer.id}`);
            window.firebaseSet(scoreRef, this.score[this.currentPlayer.id]);
            
            this.updatePlayersList();
            this.endTurn();
        } else {
            this.addMessage('guess', `${this.currentPlayer.name} خمن: ${guess}`);
        }
    }
    
    endTurn() {
        this.stopTimer();
        this.nextPlayer();
        
        if (this.gameState === 'playing') {
            this.showWordSelection();
        }
    }
    
    nextPlayer() {
        const currentIndex = this.players.findIndex(p => p.isCurrentPlayer);
        this.players[currentIndex].isCurrentPlayer = false;
        
        const nextIndex = (currentIndex + 1) % this.players.length;
        this.players[nextIndex].isCurrentPlayer = true;
        this.currentPlayer = this.players[nextIndex];
        
        this.updateWordDisplay();
        this.updateFirebaseRoom();
    }
    
    isCurrentPlayer() {
        return this.currentPlayer && this.currentPlayer.isCurrentPlayer;
    }
    
    addMessage(type, message) {
        const chatMessages = document.getElementById('chatMessages');
        const messageDiv = document.createElement('div');
        messageDiv.className = `message ${type}`;
        messageDiv.textContent = message;
        chatMessages.appendChild(messageDiv);
        chatMessages.scrollTop = chatMessages.scrollHeight;
    }
    
    showCanvasOverlay() {
        document.getElementById('canvasOverlay').style.display = 'flex';
    }
    
    hideCanvasOverlay() {
        document.getElementById('canvasOverlay').style.display = 'none';
    }
    
    hideModal(modalId) {
        document.getElementById(modalId).classList.remove('show');
    }
    
    updateUI() {
        // Update button visibility based on game state
        const startBtn = document.getElementById('startGame');
        const createRoomBtn = document.getElementById('createRoom');
        const joinBtn = document.getElementById('joinRoom');
        const leaveBtn = document.getElementById('leaveGame');
        
        if (this.gameState === 'waiting') {
            startBtn.style.display = 'inline-block';
            createRoomBtn.style.display = 'inline-block';
            joinBtn.style.display = 'inline-block';
            leaveBtn.style.display = 'none';
        } else {
            startBtn.style.display = 'none';
            createRoomBtn.style.display = 'inline-block';
            joinBtn.style.display = 'inline-block';
            leaveBtn.style.display = 'inline-block';
        }
    }
    
    playAgain() {
        this.gameState = 'waiting';
        this.clearCanvas();
        this.showCanvasOverlay();
        this.stopTimer();
        this.hideModal('gameOverModal');
        
        // Reset UI to initial state
        document.getElementById('startGame').style.display = 'inline-block';
        document.getElementById('createRoom').style.display = 'inline-block';
        document.getElementById('joinRoom').style.display = 'inline-block';
        document.getElementById('leaveGame').style.display = 'none';
        
        this.addPlayer('أنت', true);
        this.addMessage('system', 'بدأت لعبة جديدة!');
    }
    
    startSinglePlayerGame() {
        console.log('Starting single player game...');
        
        // Add AI players for single player mode
        this.players = [];
        this.score = {};
        this.addPlayer('أنت', true);
        this.addPlayer('أحمد', false);
        this.addPlayer('فاطمة', false);
        this.addPlayer('محمد', false);
        
        // Show multiplayer options
        document.getElementById('startGame').style.display = 'none';
        document.getElementById('createRoom').style.display = 'inline-block';
        document.getElementById('joinRoom').style.display = 'inline-block';
        
        // Start the game
        this.gameState = 'wordSelection';
        this.showWordSelection();
        this.hideCanvasOverlay();
        
        this.showNotification('success', 'بدأت اللعبة!', 'الآن يمكنك إنشاء غرفة متعددة أو الانضمام لغيرها');
        this.addMessage('system', 'بدأت اللعبة! يمكنك الآن إنشاء غرفة متعددة أو الانضمام لغيرها');
    }
    
    // Multiplayer Methods
    createRoom() {
        console.log('Creating room...');
        console.log('Firebase initialized:', this.firebaseInitialized);
        
        // If Firebase is not available, create a local room
        if (!this.firebaseInitialized) {
            this.createLocalRoom();
            return;
        }
        
        this.roomCode = this.generateRoomCode();
        this.isHost = true;
        this.roomId = Date.now().toString();
        
        console.log('Generated room code:', this.roomCode);
        
        // Clear existing players and add host
        this.players = [];
        this.score = {};
        this.addPlayer('أنت (المضيف)', true);
        
        // Create room in Firebase
        try {
            this.createFirebaseRoom();
            console.log('Firebase room created successfully');
        } catch (error) {
            console.error('Error creating Firebase room:', error);
            this.showNotification('error', 'خطأ!', 'فشل في إنشاء الغرفة');
            return;
        }
        
        // Show room info
        this.showRoomInfo();
        this.hideModal('joinRoomModal');
        
        this.showNotification('success', 'تم إنشاء الغرفة!', 'شارك الرابط مع أصدقائك');
        this.addMessage('system', `تم إنشاء غرفة جديدة: ${this.roomCode}`);
        
        // Update URL with room code
        this.updateURL();
        
        // Start listening for room updates
        this.listenToRoomUpdates();
        this.setupRealTimeUpdates();
    }
    
    createLocalRoom() {
        console.log('Creating local room (Firebase not available)');
        
        this.roomCode = this.generateRoomCode();
        this.isHost = true;
        this.roomId = Date.now().toString();
        
        // Clear existing players and add host
        this.players = [];
        this.score = {};
        this.addPlayer('أنت (المضيف)', true);
        
        // Add some AI players for local testing
        this.addPlayer('أحمد', false);
        this.addPlayer('فاطمة', false);
        
        // Show room info
        this.showRoomInfo();
        this.hideModal('joinRoomModal');
        
        this.showNotification('success', 'تم إنشاء الغرفة المحلية!', 'الغرفة تعمل محلياً (بدون Firebase)');
        this.addMessage('system', `تم إنشاء غرفة محلية: ${this.roomCode}`);
        
        // Update URL with room code
        this.updateURL();
    }
    
    showJoinRoomModal() {
        document.getElementById('joinRoomModal').classList.add('show');
    }
    
    joinRoom() {
        const roomCode = document.getElementById('roomCodeInput').value.trim().toUpperCase();
        const playerName = document.getElementById('playerNameInput').value.trim();
        
        if (!roomCode || !playerName) {
            this.showNotification('error', 'خطأ!', 'يرجى إدخال كود الغرفة واسمك');
            return;
        }
        
        this.joinRoomByCode(roomCode, playerName);
    }
    
    joinRoomByCode(roomCode, playerName) {
        if (!this.firebaseInitialized) {
            this.showNotification('error', 'خطأ!', 'جاري الاتصال بالخادم، حاول مرة أخرى');
            return;
        }
        
        // Check if room exists in Firebase
        const roomRef = window.firebaseRef(window.firebaseDatabase, `rooms/${roomCode}`);
        
        window.firebaseOnValue(roomRef, (snapshot) => {
            const roomData = snapshot.val();
            
            if (roomData) {
                // Room exists, join it
                this.roomCode = roomCode;
                this.roomId = roomData.roomId;
                this.isHost = false;
                this.players = roomData.players || [];
                this.score = roomData.score || {};
                
                // Add new player to Firebase
                this.addPlayerToFirebase(playerName);
                
                // Update URL
                this.updateURL();
                
                this.hideModal('joinRoomModal');
                this.showNotification('success', 'تم الانضمام!', `مرحباً ${playerName} في الغرفة`);
                this.addMessage('system', `${playerName} انضم للغرفة!`);
                
                // Show room info for guests too
                this.showRoomInfo();
                
                // Start listening for room updates
                this.listenToRoomUpdates();
                this.setupRealTimeUpdates();
            } else {
                // Room not found
                this.showNotification('error', 'خطأ!', 'كود الغرفة غير صحيح أو انتهت صلاحيته');
            }
        }, { onlyOnce: true });
    }
    
    generateRoomCode() {
        const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
        let result = '';
        for (let i = 0; i < 6; i++) {
            result += chars.charAt(Math.floor(Math.random() * chars.length));
        }
        return result;
    }
    
    showRoomInfo() {
        document.getElementById('roomCode').textContent = this.roomCode;
        const shareableURL = this.generateShareableURL();
        document.getElementById('roomUrl').value = shareableURL;
        document.getElementById('roomInfo').style.display = 'block';
        
        // Hide main control buttons when in room
        document.querySelector('.control-group').style.display = 'none';
        document.getElementById('leaveGame').style.display = 'none';
    }
    
    saveRoomData() {
        const roomData = {
            roomCode: this.roomCode,
            roomId: this.roomId,
            isHost: this.isHost,
            players: this.players,
            score: this.score,
            gameState: this.gameState,
            currentWord: this.currentWord,
            timestamp: Date.now()
        };
        
        localStorage.setItem(this.roomStorageKey, JSON.stringify(roomData));
    }
    
    updateURL() {
        const baseUrl = window.location.origin + window.location.pathname;
        const newUrl = `${baseUrl}?room=${this.roomCode}`;
        window.history.pushState({}, '', newUrl);
    }
    
    generateShareableURL() {
        const baseUrl = window.location.origin + window.location.pathname;
        return `${baseUrl}?room=${this.roomCode}`;
    }
    
    copyRoomCode() {
        navigator.clipboard.writeText(this.roomCode).then(() => {
            this.showNotification('success', 'تم النسخ!', 'كود الغرفة تم نسخه للحافظة');
        }).catch(() => {
            // Fallback for older browsers
            const textArea = document.createElement('textarea');
            textArea.value = this.roomCode;
            document.body.appendChild(textArea);
            textArea.select();
            document.execCommand('copy');
            document.body.removeChild(textArea);
            this.showNotification('success', 'تم النسخ!', 'كود الغرفة تم نسخه للحافظة');
        });
    }
    
    copyRoomUrl() {
        const shareableURL = this.generateShareableURL();
        navigator.clipboard.writeText(shareableURL).then(() => {
            this.showNotification('success', 'تم النسخ!', 'رابط الغرفة تم نسخه للحافظة');
        }).catch(() => {
            // Fallback for older browsers
            const textArea = document.createElement('textarea');
            textArea.value = shareableURL;
            document.body.appendChild(textArea);
            textArea.select();
            document.execCommand('copy');
            document.body.removeChild(textArea);
            this.showNotification('success', 'تم النسخ!', 'رابط الغرفة تم نسخه للحافظة');
        });
    }
    
    shareRoom(platform) {
        const shareableURL = this.generateShareableURL();
        const shareText = `انضم للعبة رسم وتخمين السعودية! 🎨\nكود الغرفة: ${this.roomCode}\nالرابط: ${shareableURL}`;
        
        let shareUrl = '';
        
        switch (platform) {
            case 'whatsapp':
                shareUrl = `https://wa.me/?text=${encodeURIComponent(shareText)}`;
                break;
            case 'telegram':
                shareUrl = `https://t.me/share/url?url=${encodeURIComponent(shareableURL)}&text=${encodeURIComponent(shareText)}`;
                break;
            case 'link':
                this.copyRoomCode();
                return;
        }
        
        if (shareUrl) {
            window.open(shareUrl, '_blank', 'width=600,height=400');
        }
    }
    
    // Debug function to test Firebase connection
    testFirebaseConnection() {
        console.log('Testing Firebase connection...');
        console.log('Firebase Database:', window.firebaseDatabase);
        console.log('Firebase initialized:', this.firebaseInitialized);
        
        if (!window.firebaseDatabase) {
            console.error('Firebase Database not available');
            return;
        }
        
        // Test write to Firebase
        const testRef = window.firebaseRef(window.firebaseDatabase, 'test');
        window.firebaseSet(testRef, { 
            message: 'Hello Firebase!', 
            timestamp: Date.now() 
        })
        .then(() => {
            console.log('Firebase write test successful');
            this.showNotification('success', 'اختبار ناجح!', 'Firebase يعمل بشكل صحيح');
        })
        .catch((error) => {
            console.error('Firebase write test failed:', error);
            this.showNotification('error', 'اختبار فاشل!', 'خطأ في الاتصال بـ Firebase');
        });
    }
    
    // Real-time Firebase updates (replaces simulateWebSocket)
    setupRealTimeUpdates() {
        if (!this.firebaseInitialized) return;
        
        // Listen for player connections/disconnections
        const presenceRef = window.firebaseRef(window.firebaseDatabase, `rooms/${this.roomCode}/presence/${this.playerId}`);
        window.firebaseSet(presenceRef, {
            online: true,
            lastSeen: window.firebaseServerTimestamp()
        });
        
        // Clean up when player leaves
        window.addEventListener('beforeunload', () => {
            window.firebaseRemove(presenceRef);
        });
        
        // Monitor other players' presence
        const presenceListRef = window.firebaseRef(window.firebaseDatabase, `rooms/${this.roomCode}/presence`);
        window.firebaseOnValue(presenceListRef, (snapshot) => {
            const presence = snapshot.val() || {};
            const onlinePlayers = Object.keys(presence).filter(playerId => 
                presence[playerId].online && playerId !== this.playerId
            );
            
            // Update player count
            document.getElementById('playerCount').textContent = onlinePlayers.length + 1;
        });
    }
    
    syncRoomData() {
        // Check for room updates from other players
        const savedRoom = localStorage.getItem(this.roomStorageKey);
        if (savedRoom) {
            const roomData = JSON.parse(savedRoom);
            if (roomData.roomCode === this.roomCode && roomData.roomId === this.roomId) {
                // Update players list if it has changed
                if (JSON.stringify(roomData.players) !== JSON.stringify(this.players)) {
                    this.players = roomData.players;
                    this.score = roomData.score;
                    this.updatePlayersList();
                }
            }
        }
    }
    
    // Notification System
    showNotification(type, title, message) {
        const notification = document.createElement('div');
        notification.className = `notification ${type}`;
        notification.innerHTML = `
            <button class="notification-close" onclick="this.parentElement.remove()">×</button>
            <div class="notification-title">${title}</div>
            <div class="notification-message">${message}</div>
        `;
        
        document.getElementById('notifications').appendChild(notification);
        
        // Auto remove after 5 seconds
        setTimeout(() => {
            if (notification.parentElement) {
                notification.remove();
            }
        }, 5000);
    }
    
    // Enhanced UI Methods
    addFloatingEffect() {
        const icons = document.querySelectorAll('.btn-icon');
        icons.forEach(icon => {
            if (Math.random() < 0.3) {
                icon.classList.add('floating');
            }
        });
    }
    
    addGlowEffect(element) {
        element.classList.add('glow');
        setTimeout(() => {
            element.classList.remove('glow');
        }, 2000);
    }
}

// Initialize the game when the page loads
document.addEventListener('DOMContentLoaded', () => {
    window.game = new SaudiDrawingGame();
    
    // Add modern UI enhancements
    game.addFloatingEffect();
    
    // Add pulse animation to active elements
    setInterval(() => {
        const activeElements = document.querySelectorAll('.active, .selected');
        activeElements.forEach(el => {
            el.classList.add('pulse');
            setTimeout(() => el.classList.remove('pulse'), 500);
        });
    }, 3000);
    
    // Add slide-in animation to new messages
    const observer = new MutationObserver((mutations) => {
        mutations.forEach((mutation) => {
            mutation.addedNodes.forEach((node) => {
                if (node.classList && node.classList.contains('message')) {
                    node.classList.add('slide-in');
                }
            });
        });
    });
    
    const chatMessages = document.getElementById('chatMessages');
    if (chatMessages) {
        observer.observe(chatMessages, { childList: true });
    }
    
    // Add glow effect to important buttons
    const importantButtons = document.querySelectorAll('#createRoom, #joinRoom, .btn-primary');
    importantButtons.forEach(btn => {
        btn.addEventListener('mouseenter', () => {
            game.addGlowEffect(btn);
        });
    });
    
    // Add welcome notification
    setTimeout(() => {
        game.showNotification('info', 'مرحباً!', 'انضم للعبة رسم وتخمين السعودية الممتعة!');
    }, 1000);
});
