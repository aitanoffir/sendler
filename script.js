// Storage key for saved words
const STORAGE_KEY = 'wordle-creator-words';

// Game state
let currentWord = '';
let currentHint = '';
let currentRow = 0;
let currentGuess = '';
let gameBoard = [];
let gameOver = false;
let validWords = new Set();
let dictionaryLoaded = false;

// DOM Elements
const modeSelection = document.getElementById('mode-selection');
const createMode = document.getElementById('create-mode');
const playMode = document.getElementById('play-mode');
const wordSelection = document.getElementById('word-selection');
const gameArea = document.getElementById('game-area');

// Create mode elements
const wordInput = document.getElementById('word-input');
const hintInput = document.getElementById('hint-input');
const saveWordBtn = document.getElementById('save-word-btn');
const wordError = document.getElementById('word-error');
const hintError = document.getElementById('hint-error');

// Navigation buttons
const createBtn = document.getElementById('create-btn');
const playBtn = document.getElementById('play-btn');
const backToMenuBtn = document.getElementById('back-to-menu-btn');
const backToMenuPlayBtn = document.getElementById('back-to-menu-play-btn');
const backToWordsBtn = document.getElementById('back-to-words-btn');

// Game elements
const wordsList = document.getElementById('words-list');
const hintDisplay = document.getElementById('hint-display');
const gameBoardElement = document.getElementById('game-board');
const keyboardElement = document.getElementById('keyboard');
const gameMessage = document.getElementById('game-message');

// Event Listeners
createBtn.addEventListener('click', showCreateMode);
playBtn.addEventListener('click', showPlayMode);
backToMenuBtn.addEventListener('click', showModeSelection);
backToMenuPlayBtn.addEventListener('click', showModeSelection);
backToWordsBtn.addEventListener('click', showWordSelection);
saveWordBtn.addEventListener('click', saveWord);
wordInput.addEventListener('input', validateWordInput);

// Initialize
init();

async function init() {
    await loadDictionary();
    checkForSharedWord();
}

async function loadDictionary() {
    try {
        const response = await fetch('https://raw.githubusercontent.com/dwyl/english-words/master/words_alpha.txt');
        const text = await response.text();
        // The file is potentially large, but for modern broadband/devices ~4MB text is okay.
        // It contains words separated by newlines \r\n or \n
        const words = text.split(/\r?\n/);

        words.forEach(word => {
            const w = word.trim().toUpperCase();
            if (w.length >= 4 && w.length <= 7) {
                validWords.add(w);
            }
        });

        dictionaryLoaded = true;
        console.log('Dictionary loaded:', validWords.size, 'words');
    } catch (error) {
        console.error('Failed to load dictionary:', error);
    }
}

// Check for shared word in URL
// Check for shared word in URL
function checkForSharedWord() {
    const urlParams = new URLSearchParams(window.location.search);
    if (urlParams.has('play')) {
        const encodedData = urlParams.get('play');
        try {
            // Decode base64 with unicode support (MDN recommended way)
            const binaryString = atob(encodedData);
            const bytes = Uint8Array.from(binaryString, c => c.charCodeAt(0));
            const decodedString = new TextDecoder().decode(bytes);

            const decoded = JSON.parse(decodedString);
            // Validate decoded data
            if (decoded.word && decoded.hint && typeof decoded.word === 'string' && typeof decoded.hint === 'string') {
                const word = decoded.word.toUpperCase();
                // Validate word format
                if (word.length >= 4 && word.length <= 7 && /^[A-Z]+$/.test(word)) {
                    // Hide mode selection and start game directly
                    modeSelection.classList.add('hidden');
                    playMode.classList.remove('hidden');
                    startGame({ word, hint: decoded.hint });
                    return;
                }
            }
        } catch (error) {
            console.error('Invalid share link:', error);
            alert('Invalid share link. Please check the URL and try again.');
        }
    }
    // If no valid share link, show normal mode selection
    showModeSelection();
}

// Navigation Functions
function showModeSelection() {
    modeSelection.classList.remove('hidden');
    createMode.classList.add('hidden');
    playMode.classList.add('hidden');
    resetCreateForm();
}

function showCreateMode() {
    modeSelection.classList.add('hidden');
    createMode.classList.remove('hidden');
    wordInput.focus();
}

function showPlayMode() {
    modeSelection.classList.add('hidden');
    playMode.classList.remove('hidden');
    showWordSelection();
}

function showWordSelection() {
    wordSelection.classList.remove('hidden');
    gameArea.classList.add('hidden');
    loadWordsList();
}

function showGameArea() {
    wordSelection.classList.add('hidden');
    gameArea.classList.remove('hidden');
}

// Create Mode Functions
function validateWordInput() {
    const word = wordInput.value.toUpperCase();
    wordInput.value = word.replace(/[^A-Z]/g, '');
}

function saveWord() {
    const word = wordInput.value.trim().toUpperCase();
    const hint = hintInput.value.trim();

    // Clear previous errors
    wordError.textContent = '';
    hintError.textContent = '';

    // Validate word
    if (!word) {
        wordError.textContent = 'Please enter a word';
        return;
    }

    if (word.length < 4 || word.length > 7) {
        wordError.textContent = 'Word must be between 4-7 letters';
        return;
    }

    if (!/^[A-Z]+$/.test(word)) {
        wordError.textContent = 'Word must contain only letters';
        return;
    }

    // Validate hint
    if (!hint) {
        hintError.textContent = 'Please enter a hint';
        return;
    }

    // Validate against dictionary
    if (dictionaryLoaded && !validWords.has(word)) {
        wordError.textContent = 'Please enter a valid English word';
        return;
    }

    // Save to storage
    const words = getStoredWords();
    words.push({ word, hint, createdAt: new Date().toISOString() });
    localStorage.setItem(STORAGE_KEY, JSON.stringify(words));

    // Show share modal
    showShareModal({ word, hint });
}

function resetCreateForm() {
    wordInput.value = '';
    hintInput.value = '';
    wordError.textContent = '';
    hintError.textContent = '';
}

// Storage Functions
function getStoredWords() {
    const stored = localStorage.getItem(STORAGE_KEY);
    return stored ? JSON.parse(stored) : [];
}

function loadWordsList() {
    const words = getStoredWords();
    wordsList.innerHTML = '';

    if (words.length === 0) {
        wordsList.innerHTML = '<p class="no-words">No words created yet. Create some words first!</p>';
        return;
    }

    words.forEach((wordObj, index) => {
        const wordCard = document.createElement('div');
        wordCard.className = 'word-card';
        wordCard.innerHTML = `
            <div class="word-info">
                <span class="word-length">${wordObj.word.length} letters</span>
                <span class="word-hint">${wordObj.hint}</span>
            </div>
            <button class="play-word-btn" data-index="${index}">Play</button>
            <button class="share-word-btn" data-index="${index}">Share</button>
            <button class="delete-word-btn" data-index="${index}">Delete</button>
        `;
        wordsList.appendChild(wordCard);
    });

    // Add event listeners to play buttons
    document.querySelectorAll('.play-word-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            const index = parseInt(e.target.dataset.index);
            startGame(words[index]);
        });
    });

    // Add event listeners to share buttons
    document.querySelectorAll('.share-word-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            const index = parseInt(e.target.dataset.index);
            showShareModal(words[index]);
        });
    });

    // Add event listeners to delete buttons
    document.querySelectorAll('.delete-word-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            const index = parseInt(e.target.dataset.index);
            deleteWord(index);
        });
    });
}

function deleteWord(index) {
    if (confirm('Are you sure you want to delete this word?')) {
        const words = getStoredWords();
        words.splice(index, 1);
        localStorage.setItem(STORAGE_KEY, JSON.stringify(words));
        loadWordsList();
    }
}

// Game Functions
function startGame(wordObj) {
    currentWord = wordObj.word;
    currentHint = wordObj.hint;
    currentRow = 0;
    currentGuess = '';
    gameOver = false;

    // Initialize game board
    const maxAttempts = 6;
    gameBoard = Array(maxAttempts).fill(null).map(() => Array(currentWord.length).fill(''));

    // Display hint
    hintDisplay.innerHTML = `<strong>Hint:</strong> ${currentHint}`;

    // Create game board
    createGameBoard();

    // Create keyboard
    createKeyboard();

    // Clear message
    gameMessage.textContent = '';

    showGameArea();
}

function createGameBoard() {
    gameBoardElement.innerHTML = '';
    gameBoardElement.style.setProperty('--word-length', currentWord.length);

    gameBoard.forEach((row, rowIndex) => {
        const rowElement = document.createElement('div');
        rowElement.className = 'board-row';

        row.forEach((letter, colIndex) => {
            const tile = document.createElement('div');
            tile.className = 'tile';
            tile.id = `tile-${rowIndex}-${colIndex}`;
            rowElement.appendChild(tile);
        });

        gameBoardElement.appendChild(rowElement);
    });
}

function createKeyboard() {
    const rows = [
        ['Q', 'W', 'E', 'R', 'T', 'Y', 'U', 'I', 'O', 'P'],
        ['A', 'S', 'D', 'F', 'G', 'H', 'J', 'K', 'L'],
        ['ENTER', 'Z', 'X', 'C', 'V', 'B', 'N', 'M', 'BACK']
    ];

    keyboardElement.innerHTML = '';

    rows.forEach(row => {
        const rowElement = document.createElement('div');
        rowElement.className = 'keyboard-row';

        row.forEach(key => {
            const button = document.createElement('button');
            button.className = 'key';
            if (key === 'ENTER' || key === 'BACK') {
                button.classList.add('key-large');
            }
            button.textContent = key === 'BACK' ? '←' : key;
            button.dataset.key = key;
            button.addEventListener('click', handleKeyPress);
            rowElement.appendChild(button);
        });

        keyboardElement.appendChild(rowElement);
    });

    // Add physical keyboard support
    document.addEventListener('keydown', handlePhysicalKeyPress);
}

function handlePhysicalKeyPress(e) {
    if (gameOver) return;

    const key = e.key.toUpperCase();

    if (key === 'ENTER') {
        handleKeyPress({ target: { dataset: { key: 'ENTER' } } });
    } else if (key === 'BACKSPACE') {
        handleKeyPress({ target: { dataset: { key: 'BACK' } } });
    } else if (/^[A-Z]$/.test(key)) {
        handleKeyPress({ target: { dataset: { key } } });
    }
}

function handleKeyPress(e) {
    if (gameOver) return;

    const key = e.target.dataset.key;

    if (key === 'ENTER') {
        submitGuess();
    } else if (key === 'BACK') {
        deleteLetter();
    } else {
        addLetter(key);
    }
}

function addLetter(letter) {
    if (currentGuess.length < currentWord.length) {
        currentGuess += letter;
        updateCurrentRow();
    }
}

function deleteLetter() {
    if (currentGuess.length > 0) {
        currentGuess = currentGuess.slice(0, -1);
        updateCurrentRow();
    }
}

function updateCurrentRow() {
    for (let i = 0; i < currentWord.length; i++) {
        const tile = document.getElementById(`tile-${currentRow}-${i}`);
        tile.textContent = currentGuess[i] || '';
        tile.classList.remove('filled');
        if (currentGuess[i]) {
            tile.classList.add('filled');
        }
    }
}

function submitGuess() {
    if (currentGuess.length !== currentWord.length) {
        showMessage('Not enough letters', 'error');
        return;
    }

    // Validate guess against dictionary
    if (dictionaryLoaded && !validWords.has(currentGuess)) {
        showMessage('Not in word list', 'error');
        gameBoardElement.classList.add('shake');
        setTimeout(() => gameBoardElement.classList.remove('shake'), 500);
        return;
    }

    // Check guess
    checkGuess();

    if (currentGuess === currentWord) {
        gameOver = true;
        showMessage('Congratulations! You guessed the word!', 'success');
        return;
    }

    currentRow++;
    currentGuess = '';

    if (currentRow >= gameBoard.length) {
        gameOver = true;
        showMessage(`Game Over! The word was: ${currentWord}`, 'error');
    }
}

function checkGuess() {
    const guessLetters = currentGuess.split('');
    const wordLetters = currentWord.split('');
    const letterCount = {};

    // Count letters in the word
    wordLetters.forEach(letter => {
        letterCount[letter] = (letterCount[letter] || 0) + 1;
    });

    const result = Array(currentWord.length).fill('absent');

    // First pass: mark correct letters
    guessLetters.forEach((letter, i) => {
        if (letter === wordLetters[i]) {
            result[i] = 'correct';
            letterCount[letter]--;
        }
    });

    // Second pass: mark present letters
    guessLetters.forEach((letter, i) => {
        if (result[i] === 'absent' && letterCount[letter] > 0) {
            result[i] = 'present';
            letterCount[letter]--;
        }
    });

    // Update tiles with animation
    guessLetters.forEach((letter, i) => {
        const tile = document.getElementById(`tile-${currentRow}-${i}`);
        setTimeout(() => {
            tile.classList.add(result[i]);
            tile.classList.add('flip');
        }, i * 200);

        // Update keyboard
        updateKeyboard(letter, result[i]);
    });
}

function updateKeyboard(letter, status) {
    const key = document.querySelector(`[data-key="${letter}"]`);
    if (!key) return;

    const currentStatus = key.dataset.status;

    // Priority: correct > present > absent
    if (currentStatus === 'correct') return;
    if (currentStatus === 'present' && status === 'absent') return;

    key.dataset.status = status;
    key.classList.remove('correct', 'present', 'absent');
    key.classList.add(status);
}

function showMessage(text, type) {
    gameMessage.textContent = text;
    gameMessage.className = `game-message ${type}`;
    // Clear any existing timeout
    if (gameMessage.timeoutId) {
        clearTimeout(gameMessage.timeoutId);
    }
    gameMessage.timeoutId = setTimeout(() => {
        gameMessage.textContent = '';
        gameMessage.className = 'game-message';
    }, 3000);
}

// Share Modal Functions
const shareModal = document.getElementById('share-modal');
const shareLinkInput = document.getElementById('share-link');
const copyLinkBtn = document.getElementById('copy-link-btn');
const closeModalBtn = document.getElementById('close-modal-btn');

copyLinkBtn.addEventListener('click', copyShareLink);
closeModalBtn.addEventListener('click', closeShareModal);
shareModal.addEventListener('click', (e) => {
    if (e.target === shareModal) closeShareModal();
});

function showShareModal(wordObj) {
    const baseUrl = window.location.origin + window.location.pathname;
    const data = JSON.stringify({ word: wordObj.word, hint: wordObj.hint });

    // Encode with unicode support (MDN recommended way)
    const bytes = new TextEncoder().encode(data);
    const binaryString = Array.from(bytes, byte => String.fromCharCode(byte)).join('');
    const encoded = btoa(binaryString);

    const shareUrl = `${baseUrl}?play=${encoded}`;

    shareLinkInput.value = shareUrl;
    shareModal.classList.remove('hidden');
    shareLinkInput.select();

    // Update button text based on capability
    if (navigator.share) {
        copyLinkBtn.textContent = 'Share Link';
    } else {
        copyLinkBtn.textContent = 'Copy Link';
    }
}

function closeShareModal() {
    shareModal.classList.add('hidden');
    resetCreateForm();
    showModeSelection();
}

async function copyShareLink() {
    const shareUrl = shareLinkInput.value;
    const shareData = {
        title: 'Wordle Creator',
        text: 'Can you guess my word?',
        url: shareUrl
    };

    // 1. Try Web Share API (Mobile/Native)
    if (navigator.share) {
        try {
            await navigator.share(shareData);
            return; // Share sheet opened successfully
        } catch (err) {
            console.log('Share failed or cancelled:', err);
            // Fallback to copy if share fails/cancelled (optional, but good UX)
        }
    }

    // 2. Try Modern Clipboard API
    if (navigator.clipboard && navigator.clipboard.writeText) {
        try {
            await navigator.clipboard.writeText(shareUrl);
            showCopySuccess();
            return;
        } catch (err) {
            console.error('Clipboard API failed:', err);
        }
    }

    // 3. Fallback to Legacy execCommand
    shareLinkInput.select();
    shareLinkInput.setSelectionRange(0, 99999); // For mobile
    try {
        const successful = document.execCommand('copy');
        if (successful) {
            showCopySuccess();
        } else {
            alert('Failed to copy. Please copy the link manually.');
        }
    } catch (err) {
        console.error('execCommand failed:', err);
        alert('Failed to copy. Please copy the link manually.');
    }
}

function showCopySuccess() {
    const originalText = copyLinkBtn.textContent;
    copyLinkBtn.textContent = 'Copied!';
    setTimeout(() => {
        copyLinkBtn.textContent = originalText;
    }, 2000);
}
