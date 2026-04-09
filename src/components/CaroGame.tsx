import { useState, useEffect } from 'react';
import { Gamepad2, X, PlusCircle, Users, ArrowLeft, Trophy, Bot } from 'lucide-react';
import { db } from '../config/firebase';
import { collection, addDoc, onSnapshot, doc, updateDoc, serverTimestamp, query, where, deleteDoc } from 'firebase/firestore';
import { useAuth } from '../contexts/AuthContext';
import toast from 'react-hot-toast';

const BOARD_SIZE = 15;
const WIN_CONDITION = 5;

// Helper to check win condition on a 15x15 board (1D array)
function checkWin(board: (string | null)[], lastMove: number, player: string) {
    if (lastMove < 0) return null;
    
    // Convert 1D index to 2D
    const row = Math.floor(lastMove / BOARD_SIZE);
    const col = lastMove % BOARD_SIZE;

    const directions = [
        [0, 1],  // ngang
        [1, 0],  // dọc
        [1, 1],  // chéo chính
        [1, -1]  // chéo phụ
    ];

    for (const [dx, dy] of directions) {
        let count = 1;
        let winNodes = [lastMove];

        // Tiến tới
        let r = row + dx;
        let c = col + dy;
        while (r >= 0 && r < BOARD_SIZE && c >= 0 && c < BOARD_SIZE && board[r * BOARD_SIZE + c] === player) {
            count++;
            winNodes.push(r * BOARD_SIZE + c);
            r += dx;
            c += dy;
        }

        // Đi lùi
        r = row - dx;
        c = col - dy;
        while (r >= 0 && r < BOARD_SIZE && c >= 0 && c < BOARD_SIZE && board[r * BOARD_SIZE + c] === player) {
            count++;
            winNodes.push(r * BOARD_SIZE + c);
            r -= dx;
            c -= dy;
        }

        if (count >= WIN_CONDITION) {
            return winNodes; // Trả về mảng index thắng
        }
    }
    return null;
}

// Bot AI Heuristic (Gomoku basic)
function evaluateLine(count: number, blocked: number) {
    if (count >= 5) return 100000;
    if (count === 4) return blocked === 0 ? 10000 : (blocked === 1 ? 1000 : 0);
    if (count === 3) return blocked === 0 ? 1000 : (blocked === 1 ? 100 : 0);
    if (count === 2) return blocked === 0 ? 100 : (blocked === 1 ? 10 : 0);
    return 0;
}

function getBestMove(board: (string | null)[]) {
    let bestScore = -1;
    let bestMoves: number[] = [];

    const directions = [ [0, 1], [1, 0], [1, 1], [1, -1] ];

    // Find the bounding box of existing pieces to optimize search space
    let minR = BOARD_SIZE, maxR = 0, minC = BOARD_SIZE, maxC = 0;
    let hasPiece = false;
    for (let i = 0; i < BOARD_SIZE * BOARD_SIZE; i++) {
        if (board[i]) {
            hasPiece = true;
            let r = Math.floor(i / BOARD_SIZE), c = i % BOARD_SIZE;
            if (r < minR) minR = r; if (r > maxR) maxR = r;
            if (c < minC) minC = c; if (c > maxC) maxC = c;
        }
    }
    if (!hasPiece) return Math.floor((BOARD_SIZE * BOARD_SIZE) / 2); // Center naturally if clean board

    minR = Math.max(0, minR - 2); maxR = Math.min(BOARD_SIZE - 1, maxR + 2);
    minC = Math.max(0, minC - 2); maxC = Math.min(BOARD_SIZE - 1, maxC + 2);

    for (let r = minR; r <= maxR; r++) {
        for (let c = minC; c <= maxC; c++) {
            const index = r * BOARD_SIZE + c;
            if (board[index] !== null) continue; // Skip occupied
            
            let totalAttack = 0;
            let totalDefense = 0;

            for (const [dx, dy] of directions) {
                // Test placing 'O' (Attack)
                let atkCount = 1, atkBlocked = 0;
                let tr = r + dx, tc = c + dy;
                while (tr >= 0 && tr < BOARD_SIZE && tc >= 0 && tc < BOARD_SIZE && board[tr * BOARD_SIZE + tc] === 'O') { atkCount++; tr += dx; tc += dy; }
                if (tr < 0 || tr >= BOARD_SIZE || tc < 0 || tc >= BOARD_SIZE || board[tr * BOARD_SIZE + tc] === 'X') atkBlocked++;
                tr = r - dx; tc = c - dy;
                while (tr >= 0 && tr < BOARD_SIZE && tc >= 0 && tc < BOARD_SIZE && board[tr * BOARD_SIZE + tc] === 'O') { atkCount++; tr -= dx; tc -= dy; }
                if (tr < 0 || tr >= BOARD_SIZE || tc < 0 || tc >= BOARD_SIZE || board[tr * BOARD_SIZE + tc] === 'X') atkBlocked++;
                totalAttack += evaluateLine(atkCount, atkBlocked);

                // Test placing 'X' (Defense)
                let defCount = 1, defBlocked = 0;
                tr = r + dx; tc = c + dy;
                while (tr >= 0 && tr < BOARD_SIZE && tc >= 0 && tc < BOARD_SIZE && board[tr * BOARD_SIZE + tc] === 'X') { defCount++; tr += dx; tc += dy; }
                if (tr < 0 || tr >= BOARD_SIZE || tc < 0 || tc >= BOARD_SIZE || board[tr * BOARD_SIZE + tc] === 'O') defBlocked++;
                tr = r - dx; tc = c - dy;
                while (tr >= 0 && tr < BOARD_SIZE && tc >= 0 && tc < BOARD_SIZE && board[tr * BOARD_SIZE + tc] === 'X') { defCount++; tr -= dx; tc -= dy; }
                if (tr < 0 || tr >= BOARD_SIZE || tc < 0 || tc >= BOARD_SIZE || board[tr * BOARD_SIZE + tc] === 'O') defBlocked++;
                totalDefense += evaluateLine(defCount, defBlocked);
            }

            // Defend score is slightly biased higher to prioritize blocking threatening humans
            const cellScore = totalAttack + (totalDefense * 1.2); 
            
            if (cellScore > bestScore) {
                bestScore = cellScore;
                bestMoves = [index];
            } else if (cellScore === bestScore) {
                bestMoves.push(index);
            }
        }
    }
    // Randomize among equal best moves
    return bestMoves[Math.floor(Math.random() * bestMoves.length)] ?? -1;
}

export default function CaroGame() {
    const { currentUser } = useAuth();
    const [isOpen, setIsOpen] = useState(false);
    
    // LOBBY STATE
    const [lobbyGames, setLobbyGames] = useState<any[]>([]);
    
    // PLAYING STATE
    const [currentGameId, setCurrentGameId] = useState<string | null>(null);
    const [gameState, setGameState] = useState<any>(null);
    const [winningLine, setWinningLine] = useState<number[]>([]);

    // Subscribe to Lobby (Waiting games)
    useEffect(() => {
        if (!isOpen) return;
        
        const q = query(
            collection(db, 'caro_games'),
            where('status', '==', 'waiting')
        );
        const unsubscribe = onSnapshot(q, (snapshot) => {
            const games = snapshot.docs.map(doc => ({ id: doc.id, ...(doc.data() as any) }));
            // Sắp xếp tay: Tạo mới nhất lên đầu
            games.sort((a, b) => {
                const tA = a.createdAt?.toMillis ? a.createdAt.toMillis() : 0;
                const tB = b.createdAt?.toMillis ? b.createdAt.toMillis() : 0;
                return tB - tA;
            });
            setLobbyGames(games);
        });
        return () => unsubscribe();
    }, [isOpen]);

    // Subscribe to Current Game
    useEffect(() => {
        if (!currentGameId) return;
        const unsub = onSnapshot(doc(db, 'caro_games', currentGameId), (docSnap) => {
            if (docSnap.exists()) {
                const data = docSnap.data();
                setGameState(data);
                
                // Check win condition if finished
                if (data.status === 'finished' && data.lastMove !== undefined && data.winner !== 'draw') {
                    const winPath = checkWin(data.board, data.lastMove, data.winner);
                    if (winPath) setWinningLine(winPath);
                }
            } else {
                // Game bị xóa
                toast.error('Phòng chơi đã bị hủy!');
                setCurrentGameId(null);
                setGameState(null);
            }
        });
        return () => unsub();
    }, [currentGameId]);

    const handleCreateRoom = async () => {
        if (!currentUser) return;
        try {
            const emptyBoard = Array(BOARD_SIZE * BOARD_SIZE).fill(null);
            const docRef = await addDoc(collection(db, 'caro_games'), {
                status: 'waiting',
                playerX: { id: currentUser.id, name: currentUser.name || currentUser.email || 'Ẩn danh' },
                playerO: null,
                board: emptyBoard,
                turn: 'X',
                winner: null,
                createdAt: serverTimestamp()
            });
            setCurrentGameId(docRef.id);
            setWinningLine([]);
        } catch (err: any) {
            toast.error('Lỗi khi tạo phòng: ' + err.message);
        }
    };

    const handleCreateBotRoom = async () => {
        if (!currentUser) return;
        try {
            const emptyBoard = Array(BOARD_SIZE * BOARD_SIZE).fill(null);
            const docRef = await addDoc(collection(db, 'caro_games'), {
                status: 'playing', // Vô thẳng playing vì đấu máy
                playerX: { id: currentUser.id, name: currentUser.name || currentUser.email || 'Ẩn danh' },
                playerO: { id: 'bot-ai', name: 'Khứa Bot AI' },
                board: emptyBoard,
                turn: 'X',
                winner: null,
                createdAt: serverTimestamp()
            });
            setCurrentGameId(docRef.id);
            setWinningLine([]);
        } catch (err: any) {
            toast.error('Lỗi khi tạo phòng chơi với Máy: ' + err.message);
        }
    };

    const handleJoinRoom = async (gameId: string, gameVal: any) => {
        if (!currentUser) return;
        // Block join self
        if (gameVal.playerX.id === currentUser.id) {
           setCurrentGameId(gameId);
           setWinningLine([]);
           return;
        }
        
        try {
            await updateDoc(doc(db, 'caro_games', gameId), {
                playerO: { id: currentUser.id, name: currentUser.name || currentUser.email || 'Ẩn danh' },
                status: 'playing'
            });
            setCurrentGameId(gameId);
            setWinningLine([]);
        } catch (err: any) {
            toast.error('Không thể vào phòng. Có thể người khác đã nhanh tay hơn!');
        }
    };

    // Bot engine hook
    useEffect(() => {
        if (!gameState || !currentGameId || !currentUser) return;
        if (gameState.status === 'playing' && gameState.turn === 'O' && gameState.playerO?.id === 'bot-ai') {
            const runBot = async () => {
                const bestMove = getBestMove(gameState.board);
                if (bestMove !== -1) {
                    await emulateClick(bestMove, 'O');
                }
            };
            // Phản hồi khựng tự nhiên ~0.6 giây
            const timer = setTimeout(runBot, 600);
            return () => clearTimeout(timer);
        }
    }, [gameState]);

    // Common abstracted step logic
    const emulateClick = async (index: number, symbol: string) => {
        const newBoard = [...gameState.board];
        newBoard[index] = symbol;

        let nextTurn = symbol === 'X' ? 'O' : 'X';
        let newStatus = 'playing';
        let winner = null;

        const winPath = checkWin(newBoard, index, symbol);
        if (winPath) {
            newStatus = 'finished';
            winner = symbol;
        } else if (!newBoard.includes(null)) {
            newStatus = 'finished';
            winner = 'draw';
        }

        const clickAudio = new Audio('data:audio/wav;base64,UklGRjIAAABXQVZFZm10IBIAAAABAAEAQB8AAEAfAAABAAgAAABmYWN0BAAAAAAAAABkYXRhAAAAAA=='); 
        clickAudio.volume = 0.2;
        clickAudio.play().catch(e=>e);

        await updateDoc(doc(db, 'caro_games', currentGameId!), {
            board: newBoard,
            turn: nextTurn,
            status: newStatus,
            winner: winner,
            lastMove: index
        });
    };

    const handleCellClick = async (index: number) => {
        if (!gameState || !currentGameId || !currentUser) return;
        if (gameState.status !== 'playing') return;
        
        // Ai được click?
        const isPlayerX = gameState.playerX.id === currentUser.id;
        const isPlayerO = gameState.playerO?.id === currentUser.id;
        
        if (!isPlayerX && !isPlayerO) return; // Nguoi xem ko dc danh
        
        const mySymbol = isPlayerX ? 'X' : 'O';
        if (gameState.turn !== mySymbol) return; // Chua toi luot
        
        if (gameState.board[index] !== null) return; // O da co nguoi danh

        try {
            await emulateClick(index, mySymbol);
        } catch (err) {
            console.error(err);
        }
    };

    const handleLeaveGame = async () => {
        if (gameState && gameState.status === 'waiting' && gameState.playerX.id === currentUser?.id) {
             // hủy phòng nếu còn đang chờ
             await deleteDoc(doc(db, 'caro_games', currentGameId!));
        } else if (gameState && gameState.status === 'playing') {
             // nhận thua
             const mySymbol = gameState.playerX.id === currentUser?.id ? 'X' : 'O';
             const winnerSym = mySymbol === 'X' ? 'O' : 'X';
             await updateDoc(doc(db, 'caro_games', currentGameId!), {
                 status: 'finished',
                 winner: winnerSym
             });
        }
        setCurrentGameId(null);
        setGameState(null);
        setWinningLine([]);
    };

    if (!isOpen) {
        return (
            <button
                className="btn btn-primary animate-fade-in"
                onClick={() => setIsOpen(true)}
                style={{
                    position: 'fixed',
                    bottom: '6.5rem', // Nằm lên trên nút music (bottom 2rem + 60px size + gap = ~6.5rem)
                    right: '2rem',
                    borderRadius: '50%',
                    width: '60px',
                    height: '60px',
                    padding: 0,
                    zIndex: 1000,
                    boxShadow: '0 10px 25px rgba(245, 158, 11, 0.4)'
                }}
                title="Khởi động Cờ Caro Online"
            >
                <Gamepad2 size={24} />
            </button>
        );
    }

    return (
        <div style={{
            position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh',
            backgroundColor: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)',
            display: 'flex', justifyContent: 'center', alignItems: 'center',
            zIndex: 9999
        }}>
            <div className="animate-fade-in" style={{
                backgroundColor: 'var(--color-surface)', width: '95%', maxWidth: '850px',
                height: '90vh', maxHeight: '750px', borderRadius: '1rem',
                display: 'flex', flexDirection: 'column', overflow: 'hidden', boxShadow: '0 25px 50px -12px rgba(0,0,0,0.5)'
            }}>
                {/* HEAD */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '1rem 1.5rem', borderBottom: '1px solid var(--color-border)', backgroundColor: '#fff3e0' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                        {currentGameId && (
                            <button onClick={handleLeaveGame} style={{ border: 'none', background: 'transparent', cursor: 'pointer', display: 'flex', color: 'var(--color-text)' }}>
                                <ArrowLeft size={20} />
                            </button>
                        )}
                        <Gamepad2 size={24} color="#f97316" />
                        <h2 style={{ margin: 0, fontSize: '1.25rem', fontWeight: 800, color: '#f97316' }}>CARO ARENA</h2>
                    </div>
                    <button onClick={() => { setIsOpen(false); }} style={{ color: 'var(--color-text-light)', border: 'none', background: 'transparent', cursor: 'pointer' }}>
                        <X size={24} />
                    </button>
                </div>

                {/* BODY LOBBY vs PLAYING */}
                {!currentGameId ? (
                    // LOBBY
                    <div style={{ flex: 1, padding: '2rem', display: 'flex', flexDirection: 'column', gap: '1.5rem', overflowY: 'auto' }}>
                         <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                             <h3 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                 <Users size={20} className="text-primary" /> Phòng chờ ({lobbyGames.length})
                             </h3>
                             <div style={{ display: 'flex', gap: '0.75rem' }}>
                                <button onClick={handleCreateBotRoom} className="btn btn-secondary" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', background: '#e0e7ff', color: '#4f46e5', border: '1px solid #c7d2fe' }}>
                                    <Bot size={18} /> Đánh với Máy
                                </button>
                                <button onClick={handleCreateRoom} className="btn btn-primary" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                    <PlusCircle size={18} /> Tạo phòng PvP
                                </button>
                             </div>
                         </div>
                         
                         {lobbyGames.length === 0 ? (
                             <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', color: 'var(--color-text-light)' }}>
                                 <Gamepad2 size={64} style={{ opacity: 0.2, marginBottom: '1rem' }} />
                                 <p>Hiện không có phòng chờ nào. Hãy tạo phòng để chăn gà đi!</p>
                             </div>
                         ) : (
                             <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(250px, 1fr))', gap: '1rem' }}>
                                 {lobbyGames.map((game, i) => (
                                     <div key={i} style={{ padding: '1.5rem', backgroundColor: 'var(--color-background)', border: '1px solid var(--color-border)', borderRadius: '0.75rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                                         <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                                            <div style={{ width: '40px', height: '40px', borderRadius: '50%', backgroundColor: '#fff3e0', color: '#f97316', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: '1.2rem' }}>
                                                {game.playerX.name.charAt(0)}
                                            </div>
                                            <div>
                                                <div style={{ fontWeight: 600, fontSize: '0.95rem' }}>{game.playerX.name}</div>
                                                <div style={{ fontSize: '0.75rem', color: 'var(--color-success)', fontWeight: 600 }}>• Đang chờ...</div>
                                            </div>
                                         </div>
                                         <button 
                                            onClick={() => handleJoinRoom(game.id, game)}
                                            style={{ width: '100%', padding: '0.6rem', border: '1px solid #f97316', borderRadius: '0.5rem', background: '#fff3e0', color: '#f97316', fontWeight: 600, cursor: 'pointer' }}
                                         >
                                             Khiêu chiến Khứa Này
                                         </button>
                                     </div>
                                 ))}
                             </div>
                         )}
                    </div>
                ) : (
                    // PLAYING BOARD
                    <div style={{ flex: 1, display: 'flex', backgroundColor: '#e5e7eb', overflow: 'hidden' }}>
                         
                         {/* Sidebar Left: Player Info */}
                         <div style={{ width: '220px', backgroundColor: 'var(--color-surface)', padding: '1.5rem', display: 'flex', flexDirection: 'column', justifyContent: 'center', gap: '2rem', borderRight: '1px solid var(--color-border)' }}>
                             
                             {/* Player X Info */}
                             <div style={{
                                 padding: '1rem', borderRadius: '0.5rem',
                                 border: gameState?.turn === 'X' && gameState?.status === 'playing' ? '2px solid #ef4444' : '2px solid transparent',
                                 background: gameState?.turn === 'X' && gameState?.status === 'playing' ? '#fef2f2' : 'var(--color-background)',
                                 boxShadow: gameState?.turn === 'X' && gameState?.status === 'playing' ? '0 0 15px rgba(239,68,68,0.3)' : 'none',
                                 transition: 'all 0.3s'
                             }}>
                                 <div style={{ color: '#ef4444', fontSize: '2rem', fontWeight: 900, textAlign: 'center', lineHeight: 1 }}>X</div>
                                 <div style={{ textAlign: 'center', fontWeight: 700, marginTop: '0.5rem', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{gameState?.playerX?.name}</div>
                             </div>

                             <div style={{ textAlign: 'center', color: 'var(--color-text-light)', fontWeight: 700 }}>VS</div>

                             {/* Player O Info */}
                             <div style={{
                                 padding: '1rem', borderRadius: '0.5rem',
                                 border: gameState?.turn === 'O' && gameState?.status === 'playing' ? '2px solid #3b82f6' : '2px solid transparent',
                                 background: gameState?.turn === 'O' && gameState?.status === 'playing' ? '#eff6ff' : 'var(--color-background)',
                                 boxShadow: gameState?.turn === 'O' && gameState?.status === 'playing' ? '0 0 15px rgba(59,130,246,0.3)' : 'none',
                                 transition: 'all 0.3s'
                             }}>
                                 <div style={{ color: '#3b82f6', fontSize: '2rem', fontWeight: 900, textAlign: 'center', lineHeight: 1 }}>O</div>
                                 {gameState?.playerO ? (
                                    <div style={{ textAlign: 'center', fontWeight: 700, marginTop: '0.5rem', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.2rem' }}>
                                        {gameState.playerO.id === 'bot-ai' && <Bot size={16} color="#3b82f6" />}
                                        {gameState?.playerO?.name}
                                    </div>
                                 ) : (
                                    <div style={{ textAlign: 'center', fontSize: '0.85rem', color: '#9ca3af', marginTop: '0.5rem' }}>Đang chờ đối thủ...</div>
                                 )}
                             </div>

                             {gameState?.status === 'finished' && (
                                <div style={{ marginTop: 'auto', backgroundColor: '#fffbeb', padding: '1rem', borderRadius: '0.5rem', border: '1px solid #fde68a', textAlign: 'center' }}>
                                    <Trophy size={32} color="#f59e0b" style={{ margin: '0 auto 0.5rem' }}/>
                                    <h4 style={{ margin: 0, color: '#f59e0b', fontSize: '1.2rem', fontWeight: 800 }}>GAME OVER</h4>
                                    <div style={{ fontWeight: 600, fontSize: '0.9rem', marginTop: '0.2rem' }}>
                                        {gameState?.winner === 'draw' ? 'Hòa nhau' : `Người chiến thắng: ${gameState?.winner === 'X' ? gameState?.playerX?.name : gameState?.playerO?.name}`}
                                    </div>
                                </div>
                             )}
                         </div>

                         {/* Center: The Board */}
                         <div style={{ flex: 1, display: 'flex', justifyContent: 'center', alignItems: 'center', overflow: 'auto', padding: '1rem' }}>
                              <div style={{ 
                                  display: 'grid', 
                                  gridTemplateColumns: `repeat(${BOARD_SIZE}, 1fr)`,
                                  gridTemplateRows: `repeat(${BOARD_SIZE}, 1fr)`,
                                  width: '450px',
                                  height: '450px',
                                  backgroundColor: '#d1d5db',
                                  gap: '1px',
                                  border: '2px solid #9ca3af'
                              }}>
                                  {gameState?.board?.map((cell: string | null, index: number) => {
                                      const isWinningCell = winningLine.includes(index);
                                      return (
                                        <div 
                                            key={index} 
                                            onClick={() => handleCellClick(index)}
                                            style={{
                                                backgroundColor: isWinningCell ? '#fef08a' : '#f9fafb',
                                                display: 'flex', justifyContent: 'center', alignItems: 'center',
                                                cursor: (gameState?.status === 'playing' && !cell) ? 'pointer' : 'default',
                                                fontSize: '1.6rem', fontWeight: 900,
                                                fontFamily: 'monospace',
                                                color: cell === 'X' ? '#ef4444' : '#3b82f6',
                                                transition: 'background-color 0.2s'
                                            }}
                                            className={(gameState?.status === 'playing' && !cell) ? 'hover:bg-gray-100' : ''}
                                        >
                                            {cell}
                                        </div>
                                      );
                                  })}
                              </div>
                         </div>
                    </div>
                )}
            </div>
        </div>
    );
}
