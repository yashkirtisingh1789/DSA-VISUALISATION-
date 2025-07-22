const visualization = document.getElementById('visualization');
const startBtn = document.getElementById('start');
const pauseBtn = document.getElementById('pause');
const resetBtn = document.getElementById('reset');
const speedSlider = document.getElementById('speed');
const algorithmSelect = document.getElementById('algorithm');
const graphArea = document.getElementById('graph-area');
const graphSection = document.getElementById('graph-section');
const graphHeading = document.getElementById('graph-heading');
const graphDesc = document.getElementById('graph-desc');

let array = [];
let bars = [];
let isSorting = false;
let isPaused = false;
let speed = 50;
let sortGenerator = null;

function randomArray(size = 40, min = 10, max = 300) {
    return Array.from({ length: size }, () => Math.floor(Math.random() * (max - min + 1)) + min);
}

function renderArray(arr, activeIndices = [], sortedIndices = []) {
    visualization.innerHTML = '';
    const maxVal = Math.max(...arr);
    arr.forEach((val, idx) => {
        const bar = document.createElement('div');
        bar.classList.add('bar');
        bar.style.height = `${(val / maxVal) * 100}%`;
        bar.style.width = `${100 / arr.length - 1}%`;
        if (activeIndices.includes(idx)) bar.classList.add('active');
        if (sortedIndices.includes(idx)) bar.classList.add('sorted');
        visualization.appendChild(bar);
    });
}

function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

async function* bubbleSort(arr) {
    let n = arr.length;
    let sorted = [];
    for (let i = 0; i < n - 1; i++) {
        for (let j = 0; j < n - i - 1; j++) {
            yield { arr: [...arr], active: [j, j + 1], sorted };
            if (arr[j] > arr[j + 1]) {
                [arr[j], arr[j + 1]] = [arr[j + 1], arr[j]];
            }
        }
        sorted.push(n - i - 1);
    }
    sorted = Array.from({ length: n }, (_, i) => i);
    yield { arr: [...arr], active: [], sorted };
}

function showVisualizationArea(type, algoKey) {
    if (type === 'sort') {
        visualization.style.display = '';
        graphSection.style.display = 'none';
    } else if (type === 'graph') {
        visualization.style.display = 'none';
        graphSection.style.display = '';
        if (algoKey && algoInfo[algoKey]) {
            graphHeading.textContent = algoInfo[algoKey].name;
            graphDesc.textContent = algoInfo[algoKey].desc;
        } else {
            graphHeading.textContent = '';
            graphDesc.textContent = '';
        }
    }
}

// Heap Sort
async function* heapSort(arr) {
    let n = arr.length;
    let sorted = [];
    function* heapify(arr, n, i) {
        let largest = i;
        let l = 2 * i + 1;
        let r = 2 * i + 2;
        if (l < n && arr[l] > arr[largest]) largest = l;
        if (r < n && arr[r] > arr[largest]) largest = r;
        if (largest !== i) {
            [arr[i], arr[largest]] = [arr[largest], arr[i]];
            yield { arr: [...arr], active: [i, largest], sorted: [...sorted] };
            yield* heapify(arr, n, largest);
        }
    }
    for (let i = Math.floor(n / 2) - 1; i >= 0; i--) {
        yield* heapify(arr, n, i);
    }
    for (let i = n - 1; i > 0; i--) {
        [arr[0], arr[i]] = [arr[i], arr[0]];
        sorted.push(i);
        yield { arr: [...arr], active: [0, i], sorted: [...sorted] };
        yield* heapify(arr, i, 0);
    }
    sorted = Array.from({ length: n }, (_, i) => i);
    yield { arr: [...arr], active: [], sorted };
}

// Graph/grid setup for BFS, DFS, Dijkstra
const ROWS = 8, COLS = 12;
let grid = [];
let startNode = { row: 0, col: 0 };
let endNode = { row: ROWS - 1, col: COLS - 1 };

function createGrid() {
    grid = Array.from({ length: ROWS }, (_, r) =>
        Array.from({ length: COLS }, (_, c) => ({ row: r, col: c, visited: false, isStart: r === startNode.row && c === startNode.col, isEnd: r === endNode.row && c === endNode.col, isPath: false }))
    );
}

function renderGrid() {
    graphArea.innerHTML = '';
    grid.forEach(row => {
        const rowDiv = document.createElement('div');
        rowDiv.style.display = 'flex';
        row.forEach(cell => {
            const node = document.createElement('div');
            node.classList.add('node');
            if (cell.isStart) node.classList.add('start');
            if (cell.isEnd) node.classList.add('end');
            if (cell.visited) node.classList.add('visited');
            if (cell.isPath) node.classList.add('path');
            rowDiv.appendChild(node);
        });
        graphArea.appendChild(rowDiv);
    });
}

async function* bfsTraversal() {
    createGrid();
    let queue = [startNode];
    let visited = Array.from({ length: ROWS }, () => Array(COLS).fill(false));
    visited[startNode.row][startNode.col] = true;
    while (queue.length) {
        let { row, col } = queue.shift();
        grid[row][col].visited = true;
        graphDesc.textContent = `Visiting node (${row + 1}, ${col + 1})`;
        yield renderGrid();
        if (row === endNode.row && col === endNode.col) {
            graphDesc.textContent = 'Reached the end node!';
            break;
        }
        for (let [dr, dc] of [[0,1],[1,0],[0,-1],[-1,0]]) {
            let nr = row + dr, nc = col + dc;
            if (nr >= 0 && nr < ROWS && nc >= 0 && nc < COLS && !visited[nr][nc]) {
                queue.push({ row: nr, col: nc });
                visited[nr][nc] = true;
            }
        }
    }
}

async function* dfsTraversal() {
    createGrid();
    let stack = [startNode];
    let visited = Array.from({ length: ROWS }, () => Array(COLS).fill(false));
    while (stack.length) {
        let { row, col } = stack.pop();
        if (visited[row][col]) continue;
        visited[row][col] = true;
        grid[row][col].visited = true;
        graphDesc.textContent = `Visiting node (${row + 1}, ${col + 1})`;
        yield renderGrid();
        if (row === endNode.row && col === endNode.col) {
            graphDesc.textContent = 'Reached the end node!';
            break;
        }
        for (let [dr, dc] of [[0,1],[1,0],[0,-1],[-1,0]]) {
            let nr = row + dr, nc = col + dc;
            if (nr >= 0 && nr < ROWS && nc >= 0 && nc < COLS && !visited[nr][nc]) {
                stack.push({ row: nr, col: nc });
            }
        }
    }
}

async function* dijkstraTraversal() {
    createGrid();
    let dist = Array.from({ length: ROWS }, () => Array(COLS).fill(Infinity));
    let prev = Array.from({ length: ROWS }, () => Array(COLS).fill(null));
    dist[startNode.row][startNode.col] = 0;
    let pq = [{ row: startNode.row, col: startNode.col, d: 0 }];
    while (pq.length) {
        pq.sort((a, b) => a.d - b.d);
        let { row, col, d } = pq.shift();
        if (grid[row][col].visited) continue;
        grid[row][col].visited = true;
        graphDesc.textContent = `Visiting node (${row + 1}, ${col + 1}), distance: ${d}`;
        yield renderGrid();
        if (row === endNode.row && col === endNode.col) {
            graphDesc.textContent = 'Reached the end node! Tracing shortest path...';
            break;
        }
        for (let [dr, dc] of [[0,1],[1,0],[0,-1],[-1,0]]) {
            let nr = row + dr, nc = col + dc;
            if (nr >= 0 && nr < ROWS && nc >= 0 && nc < COLS && !grid[nr][nc].visited) {
                let alt = dist[row][col] + 1;
                if (alt < dist[nr][nc]) {
                    dist[nr][nc] = alt;
                    prev[nr][nc] = { row, col };
                    pq.push({ row: nr, col: nc, d: alt });
                }
            }
        }
    }
    // Trace path
    let path = [];
    let curr = endNode;
    while (curr && !(curr.row === startNode.row && curr.col === startNode.col)) {
        path.push(curr);
        curr = prev[curr.row][curr.col];
    }
    path.forEach(cell => {
        grid[cell.row][cell.col].isPath = true;
    });
    graphDesc.textContent = 'Shortest path highlighted in purple.';
    yield renderGrid();
}

const algoInfo = {
    bfs: {
        name: 'Breadth-First Search (BFS)',
        desc: 'BFS explores the graph layer by layer, visiting all neighbors at the current depth before moving to the next.'
    },
    dfs: {
        name: 'Depth-First Search (DFS)',
        desc: 'DFS explores as far as possible along each branch before backtracking.'
    },
    dijkstra: {
        name: "Dijkstra's Algorithm",
        desc: 'Dijkstra finds the shortest path from the start node to the end node in a weighted graph.'
    }
};

function getAlgorithmGenerator(name, arr) {
    switch (name) {
        case 'bubble':
            showVisualizationArea('sort');
            return bubbleSort([...arr]);
        case 'selection':
            showVisualizationArea('sort');
            return selectionSort([...arr]);
        case 'insertion':
            showVisualizationArea('sort');
            return insertionSort([...arr]);
        case 'merge':
            showVisualizationArea('sort');
            return mergeSort([...arr]);
        case 'quick':
            showVisualizationArea('sort');
            return quickSort([...arr]);
        case 'heap':
            showVisualizationArea('sort');
            return heapSort([...arr]);
        case 'bfs':
            showVisualizationArea('graph', 'bfs');
            return bfsTraversal();
        case 'dfs':
            showVisualizationArea('graph', 'dfs');
            return dfsTraversal();
        case 'dijkstra':
            showVisualizationArea('graph', 'dijkstra');
            return dijkstraTraversal();
        default:
            showVisualizationArea('sort');
            return bubbleSort([...arr]);
    }
}

// Placeholder implementations for other sorts
async function* selectionSort(arr) {
    let n = arr.length;
    let sorted = [];
    for (let i = 0; i < n - 1; i++) {
        let minIdx = i;
        for (let j = i + 1; j < n; j++) {
            yield { arr: [...arr], active: [minIdx, j], sorted };
            if (arr[j] < arr[minIdx]) minIdx = j;
        }
        [arr[i], arr[minIdx]] = [arr[minIdx], arr[i]];
        sorted.push(i);
    }
    sorted = Array.from({ length: n }, (_, i) => i);
    yield { arr: [...arr], active: [], sorted };
}

async function* insertionSort(arr) {
    let n = arr.length;
    let sorted = [];
    for (let i = 1; i < n; i++) {
        let key = arr[i];
        let j = i - 1;
        while (j >= 0 && arr[j] > key) {
            arr[j + 1] = arr[j];
            yield { arr: [...arr], active: [j, j + 1], sorted };
            j--;
        }
        arr[j + 1] = key;
        sorted.push(i);
    }
    sorted = Array.from({ length: n }, (_, i) => i);
    yield { arr: [...arr], active: [], sorted };
}

async function* mergeSort(arr) {
    let n = arr.length;
    let sorted = [];
    async function* mergeSortHelper(arr, l, r) {
        if (l >= r) return;
        let m = Math.floor((l + r) / 2);
        yield* mergeSortHelper(arr, l, m);
        yield* mergeSortHelper(arr, m + 1, r);
        let left = arr.slice(l, m + 1);
        let right = arr.slice(m + 1, r + 1);
        let i = 0, j = 0, k = l;
        while (i < left.length && j < right.length) {
            if (left[i] <= right[j]) {
                arr[k++] = left[i++];
            } else {
                arr[k++] = right[j++];
            }
            yield { arr: [...arr], active: [k - 1], sorted };
        }
        while (i < left.length) {
            arr[k++] = left[i++];
            yield { arr: [...arr], active: [k - 1], sorted };
        }
        while (j < right.length) {
            arr[k++] = right[j++];
            yield { arr: [...arr], active: [k - 1], sorted };
        }
    }
    yield* mergeSortHelper(arr, 0, n - 1);
    sorted = Array.from({ length: n }, (_, i) => i);
    yield { arr: [...arr], active: [], sorted };
}

async function* quickSort(arr) {
    let n = arr.length;
    let sorted = [];
    async function* quickSortHelper(arr, l, r) {
        if (l >= r) return;
        let pivot = arr[r];
        let i = l;
        for (let j = l; j < r; j++) {
            yield { arr: [...arr], active: [j, r], sorted };
            if (arr[j] < pivot) {
                [arr[i], arr[j]] = [arr[j], arr[i]];
                i++;
            }
        }
        [arr[i], arr[r]] = [arr[r], arr[i]];
        yield { arr: [...arr], active: [i], sorted };
        yield* quickSortHelper(arr, l, i - 1);
        yield* quickSortHelper(arr, i + 1, r);
    }
    yield* quickSortHelper(arr, 0, n - 1);
    sorted = Array.from({ length: n }, (_, i) => i);
    yield { arr: [...arr], active: [], sorted };
}

async function startSort() {
    if (isSorting) return;
    isSorting = true;
    isPaused = false;
    sortGenerator = getAlgorithmGenerator(algorithmSelect.value, array);
    let result = await sortGenerator.next();
    while (!result.done) {
        if (isPaused) {
            await new Promise(resolve => {
                const check = setInterval(() => {
                    if (!isPaused) {
                        clearInterval(check);
                        resolve();
                    }
                }, 100);
            });
        }
        if (algorithmSelect.value === 'bfs' || algorithmSelect.value === 'dfs' || algorithmSelect.value === 'dijkstra') {
            // Graph algorithms
            await sleep(110 - speed);
        } else {
            renderArray(result.value.arr, result.value.active, result.value.sorted);
            await sleep(110 - speed);
        }
        result = await sortGenerator.next();
    }
    if (algorithmSelect.value === 'bfs' || algorithmSelect.value === 'dfs' || algorithmSelect.value === 'dijkstra') {
        // Final render for graph
        renderGrid();
    } else {
        renderArray(result.value.arr, [], result.value.sorted);
    }
    isSorting = false;
}

function pauseSort() {
    isPaused = true;
}

function resumeSort() {
    if (isSorting && isPaused) {
        isPaused = false;
    }
}

function resetSort() {
    isSorting = false;
    isPaused = false;
    if (algorithmSelect.value === 'bfs' || algorithmSelect.value === 'dfs' || algorithmSelect.value === 'dijkstra') {
        showVisualizationArea('graph', algorithmSelect.value);
        createGrid();
        renderGrid();
        if (algoInfo[algorithmSelect.value]) {
            graphDesc.textContent = algoInfo[algorithmSelect.value].desc;
        }
    } else {
        showVisualizationArea('sort');
        array = randomArray();
        renderArray(array);
    }
}

speedSlider.addEventListener('input', (e) => {
    speed = Number(e.target.value);
});

startBtn.addEventListener('click', () => {
    if (isSorting && isPaused) {
        resumeSort();
    } else if (!isSorting) {
        startSort();
    }
});

pauseBtn.addEventListener('click', pauseSort);
resetBtn.addEventListener('click', resetSort);
algorithmSelect.addEventListener('change', resetSort);

// Initial render
resetSort(); 