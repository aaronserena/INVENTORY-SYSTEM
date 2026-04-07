# Backtracking Techniques: Problem Analysis

> A structured technical reference covering five classic problems solved optimally through backtracking.

---

## 1. N-Queens Problem

### Problem Definition
Place **N queens** on an N×N chessboard such that **no two queens threaten each other** — meaning no two queens share the same row, column, or diagonal.
- **Input**: An integer `N` (board size).
- **Output**: All valid arrangements of N queens on the board.

### Why Backtracking?
Backtracking is ideal because the problem has overlapping constraint checks (row, column, two diagonals) that prune entire branches immediately upon violation. Queens must be placed incrementally, one row at a time, allowing early conflict detection. Instead of checking all $N!$ permutations, backtracking fundamentally reduces the search space by halting the placement at a specific branch as soon as a threat is encountered.

### Step-by-Step Solution
1. **Initialize** an empty N×N board and start from row 0.
2. **For each column** in the current row:
   - **Check validity**: Ensure no other queen exists in the same column, upper-left diagonal, or upper-right diagonal.
   - If valid, **place the queen** and recurse to the next row (`row + 1`).
   - If the recursion returns without a complete solution, **remove the queen** (backtrack) and try the next column.
3. **Base case**: If `row == N`, all queens are placed successfully; record the solution.
4. **Repeat** until all columns in the current row are exhausted.

---

## 2. Sum of Subset

### Problem Definition
Given a set of **non-negative integers** $S = \{s_1, s_2, ..., s_n\}$ and a target sum $T$, find all subsets of $S$ whose elements sum exactly to $T$.
- **Example**: For $S = \{3, 1, 4, 2, 5\}$ and $T = 6$, valid subsets include $\{1, 5\}$, $\{4, 2\}$, and $\{3, 1, 2\}$.

### Why Backtracking?
This is a variant of the NP-complete Subset Sum problem, meaning no general polynomial solution exists. Backtracking combined with sorting the input allows partial sum tracking: if the running sum exceeds the target $T$, the entire subtree is pruned without further exploration. This constraint-based pruning dramatically reduces the explored search space compared to generating all $2^n$ possible subsets.

### Step-by-Step Solution
1. **Sort** the input set $S$ in ascending order to enable early termination.
2. **Start** with an empty current subset and `current_sum = 0`.
3. At each step, either include or exclude the current element $S[i]$:
   - **Include**: Add $S[i]$ to the running sum and subset, then recurse.
   - **Exclude**: Skip $S[i]$ and recurse to consider the next element.
4. **Prune**: If `current_sum > T`, terminate the current path.
5. **Base case**: If `current_sum == T`, record the current subset as a valid solution.
6. **Backtrack**: Remove the previously added element and continue the search.

---

## 3. Sudoku Solver

### Problem Definition
Fill a **9×9 grid** divided into nine 3×3 sub-boxes such that **every row, column, and 3×3 box** contains the digits **1 through 9 exactly once**. A partially filled grid is given as input.

### Why Backtracking?
Sudoku is a canonical Constraint Satisfaction Problem (CSP). Backtracking is uniquely effective because it simultaneously enforces all three constraint dimensions (row, column, box). The high constraint density of Sudoku means that placing a single invalid digit quickly causes downstream contradictions, allowing for aggressive early pruning of the state space tree. 

### Step-by-Step Solution
1. **Scan** the board to find the next empty cell (usually denoted by `0`).
2. **Try** placing each candidate digit `1–9` in that cell:
   - **Validate**: Check that the digit does not appear in the same row, column, or 3×3 sub-box.
   - If valid, **place the digit** and recurse to the next empty cell.
   - If the recursive call fails, **remove the digit** (backtrack) and try the next candidate.
3. **Base case**: If no empty cells remain, the board is solved. Return `True`.
4. **Failure case**: If no digit `1–9` is valid for a given cell, return `False` to trigger backtracking in the parent call.

---

## 4. Maze Generation

### Problem Definition
Given a grid of cells, generate a **perfect maze** — a structure where there exists exactly **one unique path** between any two cells, with no loops and no isolated regions.

### Why Backtracking?
The Recursive Backtracker (DFS-based) algorithm is extensively used for maze generation because backtracking guarantees a perfect maze. It essentially forms a spanning tree that covers all cells without any cycles / revisits. The deterministic back-end paired with random edge sampling provides guaranteed correctness with a highly random appearance.

### Step-by-Step Solution
1. **Initialize** all cells in the grid as unvisited.
2. **Choose** a random starting cell and mark it as visited.
3. **While** the current cell has unvisited neighbor cells:
   - **Pick** a random unvisited neighbor.
   - **Remove the wall** between the current cell and the chosen neighbor.
   - **Mark** the neighbor as visited and recurse into it.
4. **Backtrack**: When a cell has no unvisited neighbors left, retreat up to the previous cell.
5. **Terminate** when the algorithm has backtracked all the way to the starting cell.

---

## 5. Hamiltonian Cycle

### Problem Definition
Given an undirected graph $G = (V, E)$, determine whether there exists a **Hamiltonian Cycle** — a closed path that visits **every vertex exactly once** and returns to the starting vertex.

### Why Backtracking?
Exhaustive search via backtracking is the standard exact approach for this NP-complete problem. By leveraging constraints (specifically, edge connectivity and uniqueness), backtracking explores only vertices adjacent to the last visited node that aren't already included in the active path. This drastically narrows down the $O(V!)$ search space, avoiding permutations that don't follow the graph's connections.

### Step-by-Step Solution
1. **Initialize** the cycle path with an arbitrary starting vertex (e.g., vertex `0`).
2. **Recursively** attempt to add a new vertex to the cycle:
   - **Check adjacency**: Is there a valid edge between the last node in the path and the candidate vertex?
   - **Check unvisited**: Ensure the candidate vertex isn't already in the current cycle.
   - If both checks pass, **add the vertex** to the path and recurse.
   - If the recursion returns `False`, **remove the vertex** (backtrack).
3. **Base case**: If all $N$ vertices are in the path, check if there is an edge from the last added vertex back to vertex `0`.
   - If so, a Hamiltonian Cycle is established.
4. **Failure case**: Return `False` if no valid neighbor can be added.
