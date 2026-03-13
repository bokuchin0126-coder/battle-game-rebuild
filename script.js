const playerHP = document.getElementById("playerHP");
const playerMaxHP = document.getElementById("playerMaxHP");
const playerBar = document.getElementById("player-hp-bar");
const defeat = document.getElementById("defeat");
const playerLevel = document.getElementById("playerLevel");
const exp = document.getElementById("exp");
const enemyName = document.getElementById("enemyName");
const enemyLevel = document.getElementById("enemyLevel");
const attack = document.getElementById("attack");
const enemyHP = document.getElementById("enemyHP");
const enemyMaxHP = document.getElementById("enemyMaxHP");
const enemyBar = document.getElementById("enemy-hp-bar");
const stateButton = document.getElementById("stateScreen");

let state = {
    players:[{
        id: 1,
        name: "ヒーロー",
        attack: 60,
        hp: 8,
        maxHP: 800,
        exp: 0,
        level: 1,
        defeat: 0,
    },
    {
        id: 2,
        pokemonId: 0,
        name: "enemy",
        attack: 0,
        hp: 10,
        maxHP: 10,
        level: 1,
        ability: null
    }],
    turn: 0,
    logs: [],
    phase: "player",
    isGameOver: false
};

async function getPokemon(id) {
    if (!id) {
        id =  Math.floor(Math.random() * 100) + 1;
    }

    const res = await fetch(`https://pokeapi.co/api/v2/pokemon/${id}`);
    const data = await res.json();

    return {
        id: id,
        name: data.name,
        hp: data.stats[0].base_stat,
        attack: data.stats[1].base_stat,
        img: data.sprites.front_default
    };
}

async function attackShock(state, attackerId, targetId, damage) {
    const attaker = state.players.find(p => p.id === attackerId);
    const target = state.players.find(p => p.id === targetId);
    const criticalDamage = damage * 2;

    const ifStates  = {
        ...state,
        players: state.players.map(p => {
            if (targetId === p.id) {
                return {
                    ...p,
                    hp: Math.max(0, p.hp - criticalDamage)
                };
            }
            return p;
        })
    };
    if (Math.random() < 0.2) return await addLog(ifStates, `${attaker.name}の攻撃!${target.name}に${criticalDamage}ダメージ!`)

    const newStates = {
        ...state,
        players: state.players.map(p => {
            if (targetId === p.id) {
                return {
                    ...p,
                    hp: Math.max(0, p.hp - damage)
                };
            }
            return p;
        })
    }
    return await addLog(newStates, `${attaker.name}の攻撃!${target.name}に${damage}ダメージ!`);
}

async function defeatRewards(state) {
    const newStates = {
        ...state,
        players: state.players.map(p => {
            if (p.id === 1 && p.exp <= 100) {
                return {
                    ...p,
                    exp: p.exp + 50,
                    defeat: p.defeat + 1
                };
            }
            return p;
        }),
    };
    if (state.players[1].hp <= 0) {
        return await addLog(newStates, `${newStates.players[1].name}を撃破!経験値50獲得!`);
    }
    return state;
}

async function playerLevelUP(state) {
    const newStates = {
        ...state,
        players: state.players.map(p => {
            if (p.id === 1 && p.exp === 100) {
                return {
                    ...p,
                    attack: p.attack + 7,
                    hp: Math.min(p.hp + 50, p.maxHP),
                    maxHP: p.maxHP + 50,
                    exp: p.exp - 100,
                    level: p.level + 1
                };
            }
            return p;
        })
    };
    if (state.players[1].hp <= 0) {
        return await addLog(newStates, `${newStates.players[0].name}のレベルが1上がりました!`);
    }
    return state;
}

async function spawnEnemy(state) {
    if (state.players[1].hp <= 0) {
        const pokemon = await getPokemon();
        document.getElementById("enemyImg").src = pokemon.img;
        const newStates = {
            ...state,
            players: state.players.map(p => {
                if (p.id === 2){
                    return {
                        ...p,
                        name: pokemon.name,
                        pokemonId: pokemon.id,
                        hp: (pokemon.hp * 2) + (state.players[0].defeat * 5),
                        maxHP: (pokemon.hp * 2) + (state.players[0].defeat * 5),
                        attack: pokemon.attack / 3,
                        level: Math.floor(state.players[0].defeat / 3) + 1,
                        ability: "heal"
                    };
                }
                return p;
            })
        };
        return await addLog(newStates, `Lv. ${newStates.players[1].level}の${newStates.players[1].name}が出現！`);
    }
    return state;
}

async function boss(state) {
    const player = state.players.find(p => p.id === 1);
    const enemy = state.players.find(p => p.id === 2);
    let pokemon = await getPokemon();

    if (player.defeat === 10) pokemon = await getPokemon(130);

    if (player.defeat === 20) pokemon = await getPokemon(146);

    if (player.defeat === 30) pokemon = await getPokemon(150);

    document.getElementById("enemyImg").src = pokemon.img;

    const firstBoss = {
            ...state,
            players: state.players.map(p => {
                if (p.id === 2){
                    return {
                        ...p,
                        name: pokemon.name,
                        pokemonId: pokemon.id,
                        hp: (pokemon.hp * 2) + (state.players[0].defeat * 10),
                        maxHP: (pokemon.hp * 2) + (state.players[0].defeat * 10),
                        attack: pokemon.attack / 3,
                        level: 5,
                        ability: "heal"
                    };
                }
                return p;
            })
    };

    const middleBoss = {
        ...state,
            players: state.players.map(p => {
                if (p.id === 2){
                    return {
                        ...p,
                        name: pokemon.name,
                        pokemonId: pokemon.id,
                        hp: (pokemon.hp * 2) + (state.players[0].defeat * 15),
                        maxHP: (pokemon.hp * 2) + (state.players[0].defeat * 15),
                        attack: pokemon.attack / 2,
                        level: 10,
                        ability: "heal"
                    };
                }
                return p;
            })
    };

    const lastBoss = {
        ...state,
            players: state.players.map(p => {
                if (p.id === 2){
                    return {
                        ...p,
                        name: pokemon.name,
                        pokemonId: pokemon.id,
                        hp: (pokemon.hp * 2) + (state.players[0].defeat * 20),
                        maxHP: (pokemon.hp * 2) + (state.players[0].defeat * 20),
                        attack: pokemon.attack,
                        level: 15,
                        ability: "heal"
                    };
                }
                return p;
            })
    };

    if(player.defeat === 10 && enemy.pokemonId !== 130) return await addLog(firstBoss, `\u{1F525}ボス出現！ Lv.${firstBoss.players[1].level} ${firstBoss.players[1].name}`);

    if(player.defeat === 20 && enemy.pokemonId !== 146) return await addLog(middleBoss, `\u{1F525}ボス出現！ Lv.${middleBoss.players[1].level} ${middleBoss.players[1].name}`);
    
    if(player.defeat === 30 && enemy.pokemonId !== 150) return await addLog(lastBoss, `\u{1F525}ボス出現！ Lv.${lastBoss.players[1].level} ${lastBoss.players[1].name}`);

    return state;
}

function healing (state, targetId, amout) {
    const target = state.players.find(p => p.id === targetId);
    const newStates = {
        ...state,
        players: state.players.map(p => {
            if (p.id === targetId) {
                return {
                    ...p,
                    hp: Math.min(p.hp + amout, p.maxHP),
                    ability: null
                };
            }
            return p;
        })
    };
    return addLog(newStates, `${target.name}がHPを${amout}回復した！`);
}

async function playerAction(state) {
    if (state.isGameOver) return;
    let newState = state;
    newState = await attackShock(newState, 1, 2, newState.players[0].attack);
    newState = await defeatRewards(newState);
    newState = await playerLevelUP(newState);

    return newState;
}

async function enemyAction(state) {
    if (state.isGameOver) return;
    let newState = state;
    const player = newState.players.find(p => p.id === 1);
    const enemy = newState.players.find(p => p.id === 2);
    if (player.defeat !== 0 && player.defeat % 10 === 0) newState = await boss(newState);
    if (player.defeat % 10 !== 0) newState = await spawnEnemy(newState);
    if (enemy.hp <= 100 && enemy.ability === "heal") return newState = healing(newState, 2, 40);
    newState = await attackShock(newState, 2, 1, Math.floor(enemy.attack));

    return newState;
}

async function nextPhase(state) {
    if (state.phase === "player") {
        const next = await playerAction(state);
        return {
            ...next,
            phase: "enemy"
        }
    }

    if (state.phase === "enemy") {
        const next = await enemyAction(state);
        return {
            ...next,
            turn: state.turn + 1,
            phase: "player"
        }
    }
}

function textReflection(state, logsArea, message) {
    const p = document.createElement('div');
    p.textContent = `[ターン${state.turn}]${message}`;
    logsArea.appendChild(p);
}

async function addLog(state, message) {
   const logsArea = document.getElementById("log");

   logsArea.innerHTML = "";
   textReflection(state, logsArea, message);
   await wait(300)
   return state;
}

function gameClear() {
    state.isGameOver = true;
    document.getElementById("gameClear").style.display = "block"
}

function gameOver() {
    document.getElementById("gameOverScreen").style.display = "block";
}

function gameState() {
    document.getElementById("stateScreen").style.display = "none";
    document.getElementById("gameScreen").style.display = "block";
}

function textChange() {
    const player = state.players.find(p => p.id === 1);
    const enemy = state.players.find(p => p.id === 2);
    const playerPercent = Math.max(0, (player.hp / player.maxHP) * 100);
    const enemyPercent = Math.max(0, (enemy.hp / enemy.maxHP) * 100);
    playerBar.style.width = playerPercent  + "%";
    enemyBar.style.width = enemyPercent + "%";
    playerHP.textContent = player.hp;
    playerMaxHP.textContent = player.maxHP;
    defeat.textContent = player.defeat;
    playerLevel.textContent = player.level;
    exp.textContent = player.exp;
    enemyHP.textContent = enemy.hp;
    enemyLevel.textContent = enemy.level;
    enemyMaxHP.textContent = enemy.maxHP;
    enemyName.textContent = enemy.name;
}

async function playerTurn() {
    if (state.phase !== "player") return;
    setState(await nextPhase(state));
    await wait(500)
    await enemyTurn();
}

async function enemyTurn() {
    if (state.phase !== "enemy") return;
    setState(await nextPhase(state));
}

function wait(ms) {
    return new Promise((resolve) => {
        setTimeout(resolve, ms);
    });
}

function setState(newState) {
    state = newState;
    const player = state.players.find(p => p.id === 1);
    textChange();
    if (player.hp <= 0) {
        gameOver(); 
        return;
    }
    if (player.defeat === 30) {
        gameClear();
        return;
    }

    if (state.isGameOver) return;
}

attack.addEventListener('click', () => {
    playerTurn();
});

stateButton.addEventListener('click', () => {
    gameState();
});