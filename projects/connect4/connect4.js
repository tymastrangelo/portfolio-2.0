

// Modern Connect 4
const ROWS = 6;
const COLS = 7;
const PLAYER_RED = 'R';
const PLAYER_YELLOW = 'Y';

let board = []; // 2D grid [r][c]
let heights = []; // next free row per column (0..ROWS-1 bottom = ROWS-1)
let currentPlayer = PLAYER_RED;
let gameOver = false;
let highlighted = [];
let aiEnabled = false;
let aiDifficulty = 'easy';
let aiIsFirst = false;
let aiThinking = false;

const boardEl = document.getElementById('board');
const winnerEl = document.getElementById('winner');
const playAgainBtn = document.getElementById('playAgain');
const newGameBtn = document.getElementById('newGame');
const currentPieceEl = document.getElementById('current-piece');
const currentPlayerText = document.getElementById('current-player-text');
const redWinsEl = document.getElementById('redWins');
const yellowWinsEl = document.getElementById('yellowWins');
const drawsEl = document.getElementById('draws');
const resetScoresBtn = document.getElementById('resetScores');

function init() {
    loadScores();
    resetGame(false);
    attachControls();
}

function attachControls(){
    playAgainBtn.addEventListener('click', () => resetGame());
    newGameBtn.addEventListener('click', () => resetGame(true));
    resetScoresBtn.addEventListener('click', () => { localStorage.removeItem('c4-scores'); loadScores(true); });

    // AI controls
    const aiCheckbox = document.getElementById('playVsAI');
    const aiDiffSelect = document.getElementById('aiDifficulty');
    const aiFirstCheckbox = document.getElementById('aiFirst');
        const aiSettingsWrap = document.getElementById('ai-settings');
    if (aiCheckbox) aiCheckbox.addEventListener('change', (e)=>{ aiEnabled = e.target.checked; localStorage.setItem('c4-ai', JSON.stringify({enabled:aiEnabled})); if (aiEnabled && aiIsFirst && currentPlayer === PLAYER_YELLOW && !gameOver) scheduleAIMove(); });
    if (aiDiffSelect) aiDiffSelect.addEventListener('change', (e)=>{ aiDifficulty = e.target.value; localStorage.setItem('c4-ai', JSON.stringify({difficulty:aiDifficulty})); });
    if (aiFirstCheckbox) aiFirstCheckbox.addEventListener('change', (e)=>{ aiIsFirst = e.target.checked; localStorage.setItem('c4-ai', JSON.stringify({aiFirst:aiIsFirst})); });

    // load saved AI prefs
    try{
        const saved = JSON.parse(localStorage.getItem('c4-ai') || '{}');
        if (saved.enabled){ aiCheckbox.checked = true; aiEnabled = true; }
        if (saved.difficulty){ aiDiffSelect.value = saved.difficulty; aiDifficulty = saved.difficulty; }
        if (saved.aiFirst){ aiFirstCheckbox.checked = true; aiIsFirst = true; }
    }catch(e){}
        // update ai settings UI visibility
        if (aiSettingsWrap){
            aiSettingsWrap.style.display = aiEnabled ? 'flex' : 'none';
            aiCheckbox.addEventListener('change', ()=>{
                if (aiCheckbox.checked){ aiSettingsWrap.style.display='flex'; } else { aiSettingsWrap.style.display='none'; }
                // persist combined object
                const obj = { enabled: aiCheckbox.checked, difficulty: aiDiffSelect.value, aiFirst: aiFirstCheckbox.checked };
                localStorage.setItem('c4-ai', JSON.stringify(obj));
            });
            // ensure other controls persist full object when changed
            aiDiffSelect.addEventListener('change', ()=>{ const obj = { enabled: aiCheckbox.checked, difficulty: aiDiffSelect.value, aiFirst: aiFirstCheckbox.checked }; localStorage.setItem('c4-ai', JSON.stringify(obj)); });
            aiFirstCheckbox.addEventListener('change', ()=>{ const obj = { enabled: aiCheckbox.checked, difficulty: aiDiffSelect.value, aiFirst: aiFirstCheckbox.checked }; localStorage.setItem('c4-ai', JSON.stringify(obj)); });
        }

    // keyboard: left/right to move preview column, enter/space to drop
    let hoverCol = 0;
    document.addEventListener('keydown', (e) => {
        if (gameOver) return;
        if (e.key === 'ArrowLeft') { hoverCol = Math.max(0, hoverCol - 1); updateColumnPreview(hoverCol);} 
        else if (e.key === 'ArrowRight') { hoverCol = Math.min(COLS - 1, hoverCol + 1); updateColumnPreview(hoverCol);} 
        else if (e.key === 'Enter' || e.key === ' ') { dropInColumn(hoverCol); }
    });

    // for accessibility: clicking outside pieces on a column should drop
    boardEl.addEventListener('click', (e) => {
        if (gameOver) return;
        const cell = e.target.closest('.cell');
        if (!cell) return;
        const col = parseInt(cell.dataset.col, 10);
        dropInColumn(col);
    });

    // touch preview: highlight column on pointermove
    boardEl.addEventListener('pointermove', (e) => {
        if (gameOver) return;
        const cell = e.target.closest('.cell');
        if (!cell) return;
        const col = parseInt(cell.dataset.col, 10);
        updateColumnPreview(col);
    });

    boardEl.addEventListener('pointerleave', () => clearPreview());
}

function buildBoard() {
    boardEl.innerHTML = '';
    boardEl.style.gridTemplateColumns = `repeat(${COLS}, 1fr)`;

    for (let r = 0; r < ROWS; r++){
        for (let c = 0; c < COLS; c++){
            const cell = document.createElement('div');
            cell.className = 'cell';
            cell.dataset.row = r.toString();
            cell.dataset.col = c.toString();
            // slot background
            const slot = document.createElement('div');
            slot.className = 'slot';
            slot.setAttribute('aria-hidden','true');
            cell.appendChild(slot);
            boardEl.appendChild(cell);
        }
    }
}

function resetGame(clearScores=false){
    board = Array.from({length: ROWS}, () => Array(COLS).fill(' '));
    heights = Array(COLS).fill(ROWS - 1);
    currentPlayer = PLAYER_RED;
    gameOver = false;
    highlighted = [];
    winnerEl.textContent = '';
    playAgainBtn.style.display = 'none';
    updateCurrentPlayerUI();
    buildBoard();
    // If AI is enabled and AI first is set, make AI play (AI is Yellow)
    if (aiEnabled && aiIsFirst){
        // set AI to play as yellow and schedule move if starting player is yellow
        currentPlayer = PLAYER_YELLOW;
        updateCurrentPlayerUI();
        scheduleAIMove();
    }
}

function updateCurrentPlayerUI(){
    if (!currentPieceEl) return;
    currentPieceEl.className = 'w-4 h-4 rounded-full border';
    currentPieceEl.classList.add(currentPlayer === PLAYER_RED ? 'red' : 'yellow');
    currentPlayerText.textContent = currentPlayer === PLAYER_RED ? "Red's turn" : "Yellow's turn";
}

function updateColumnPreview(col){
    clearPreview();
    const row = heights[col];
    if (row < 0) return;
    const target = boardEl.querySelector(`.cell[data-row="${row}"][data-col="${col}"] .slot`);
    if (!target) return;
    target.classList.add('preview');
}

function clearPreview(){
    boardEl.querySelectorAll('.slot.preview').forEach(s => s.classList.remove('preview'));
}

function dropInColumn(col){
    if (gameOver) return;
    if (aiEnabled && aiThinking) return; // block user while AI is thinking
    const r = heights[col];
    if (r < 0) return; // full

    // set logical board
    board[r][col] = currentPlayer;
    heights[col] = r - 1;

    // render piece with drop animation
    const cell = boardEl.querySelector(`.cell[data-row="${r}"][data-col="${col}"]`);
    if (!cell) return;
    const piece = document.createElement('div');
    piece.className = `piece ${currentPlayer === PLAYER_RED ? 'red' : 'yellow'}`;
    cell.appendChild(piece);

    // allow CSS transform from above
    requestAnimationFrame(() => requestAnimationFrame(() => piece.classList.add('drop')));

    // check win/draw after small delay to let animation start
    setTimeout(() => {
        const win = checkWinner();
        if (win) {
            highlightWin(win);
            endGame(win.winner);
        } else if (isBoardFull()){
            endGame(null);
        } else {
            currentPlayer = (currentPlayer === PLAYER_RED ? PLAYER_YELLOW : PLAYER_RED);
            updateCurrentPlayerUI();
                // if AI enabled and it's AI's turn, schedule move
                if (!gameOver && aiEnabled && currentPlayer === PLAYER_YELLOW) scheduleAIMove();
        }
    }, 180);
}

    function scheduleAIMove(){
        if (!aiEnabled || gameOver) return;
        aiThinking = true;
        // small delay to feel human-like
        const thinkTime = aiDifficulty === 'hard' ? 700 : aiDifficulty === 'medium' ? 450 : 250;
        setTimeout(()=>{
            const col = pickAIMove(aiDifficulty);
            aiThinking = false;
            if (typeof col === 'number') dropInColumn(col);
        }, thinkTime + Math.random()*200);
    }

    // AI move strategies
    function pickAIMove(level){
        // level: 'easy' | 'medium' | 'hard'
        if (level === 'easy') return aiRandomMove();
        if (level === 'medium') return aiMediumMove();
        return aiHardMove();
    }

    function aiRandomMove(){
        const cols = [...Array(COLS).keys()].filter(c => heights[c] >= 0);
        if (!cols.length) return null;
        return cols[Math.floor(Math.random()*cols.length)];
    }

    function aiMediumMove(){
        // If winning move exists, take it. Else block opponent's winning move. Else random.
        // try all columns
        for (let c=0;c<COLS;c++){
            const r = heights[c]; if (r < 0) continue;
            board[r][c] = PLAYER_YELLOW;
            const win = checkWinner();
            board[r][c] = ' ';
            if (win && win.winner === PLAYER_YELLOW) return c;
        }
        // block red
        for (let c=0;c<COLS;c++){
            const r = heights[c]; if (r < 0) continue;
            board[r][c] = PLAYER_RED;
            const win = checkWinner();
            board[r][c] = ' ';
            if (win && win.winner === PLAYER_RED) return c;
        }
        return aiRandomMove();
    }

    function aiHardMove(){
        // prioritize center, then medium heuristics, otherwise best score by simple heuristic
        const preferred = [3,2,4,1,5,0,6];
        // winning
        for (let c of preferred){ const r = heights[c]; if (r<0) continue; board[r][c] = PLAYER_YELLOW; const win = checkWinner(); board[r][c] = ' '; if (win && win.winner === PLAYER_YELLOW) return c; }
        // block
        for (let c of preferred){ const r = heights[c]; if (r<0) continue; board[r][c] = PLAYER_RED; const win = checkWinner(); board[r][c] = ' '; if (win && win.winner === PLAYER_RED) return c; }

        // simple heuristic: score columns by centrality and potential connections
        let best = null; let bestScore = -1;
        for (let c=0;c<COLS;c++){
            const r = heights[c]; if (r<0) continue;
            let score = 0;
            score += 10 - Math.abs(3 - c) * 2; // prefer center
            // count adjacent same-color or empty slots as potential
            const dirs = [[0,1],[1,0],[1,1],[-1,1]];
            board[r][c] = PLAYER_YELLOW;
            for (const [dr,dc] of dirs){
                let chain = 1;
                for (let k=1;k<4;k++){
                    const rr = r + dr*k; const cc = c + dc*k; if (rr<0||rr>=ROWS||cc<0||cc>=COLS) break; if (board[rr][cc] === PLAYER_YELLOW) chain++; else if (board[rr][cc] === ' ') chain += 0.5; else break;
                }
                score += chain*2;
            }
            board[r][c] = ' ';
            if (score > bestScore){ bestScore = score; best = c; }
        }
        return (best === null ? aiRandomMove() : best);
    }

function isBoardFull(){
    return heights.every(h => h < 0);
}

// checkWinner returns null or {winner:'R'|'Y', coords:[[r,c], ...4]}
function checkWinner(){
    // directions (dr, dc): horizontal, vertical, diag down-right, diag up-right
    const dirs = [[0,1],[1,0],[1,1],[-1,1]];
    for (let r=0;r<ROWS;r++){
        for (let c=0;c<COLS;c++){
            const p = board[r][c];
            if (p === ' ') continue;
            for (const [dr,dc] of dirs){
                const coords = [[r,c]];
                let rr = r, cc = c;
                for (let k=1;k<4;k++){
                    rr += dr; cc += dc;
                    if (rr < 0 || rr >= ROWS || cc < 0 || cc >= COLS) break;
                    if (board[rr][cc] !== p) break;
                    coords.push([rr,cc]);
                }
                if (coords.length === 4) return {winner: p, coords};
            }
        }
    }
    return null;
}

function highlightWin(win){
    win.coords.forEach(([r,c])=>{
        const slot = boardEl.querySelector(`.cell[data-row="${r}"][data-col="${c}"] .slot`);
        if (slot) slot.classList.add('highlight');
    });
}

function endGame(winner){
    gameOver = true;
    playAgainBtn.style.display = 'inline-flex';
    if (winner === PLAYER_RED){
        winnerEl.textContent = '🔥 Red Player Wins!';
        addScore('red');
    } else if (winner === PLAYER_YELLOW){
        winnerEl.textContent = '💛 Yellow Player Wins!';
        addScore('yellow');
    } else {
        winnerEl.textContent = '🤝 Draw!';
        addScore('draw');
    }
}

function loadScores(reset=false){
    let scores = {red:0,yellow:0,draws:0};
    if (!reset) {
        try { scores = JSON.parse(localStorage.getItem('c4-scores')) || scores; } catch(e){}
    }
    redWinsEl.textContent = scores.red;
    yellowWinsEl.textContent = scores.yellow;
    drawsEl.textContent = scores.draws;
}

function addScore(kind){
    const key = 'c4-scores';
    let scores = JSON.parse(localStorage.getItem(key) || '{}');
    scores.red = scores.red || 0; scores.yellow = scores.yellow || 0; scores.draws = scores.draws || 0;
    if (kind === 'red') scores.red += 1;
    else if (kind === 'yellow') scores.yellow += 1;
    else scores.draws += 1;
    localStorage.setItem(key, JSON.stringify(scores));
    loadScores();
}

// initialize on load
window.addEventListener('load', init);
