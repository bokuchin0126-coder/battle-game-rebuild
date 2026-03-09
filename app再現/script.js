const playerHP = document.getElementById("playerHP");
const playerBar = document.getElementById("player-hp-bar");
const defeat = document.getElementById("defeat");
const playerLevel = document.getElementById("playerLevel");
const exp = document.getElementById("exp");
const enemyName = document.getElementById("enemyName");
const attack = document.getElementById("attack");
const enemyHP = document.getElementById("enemyHP");
const enemyBar = document.getElementById("enemy-hp-bar");

let state = {
    players:[{
        id: 1,
        name: "ヒーロー",
        attack: 40,
        hp: 300,
        maxHP: 300,
        exp: 0,
        level: 1,
        defeat: -1,
    },
    {
        id: 2,
        name: "enemy",
        attack: 0,
        hp: 10,
        maxHP: 10
    }],
    turn: 0,
    logs: [],
    phase: "player"
};

async function getPokemon() {
    const id = Math.floor(Math.random() * 151) + 1;
    const res = await fetch(`https://pokeapi.co/api/v2/pokemon/${id}`);
    const data = await res.json();

    return {
        name: data.name,
        hp: data.stats[0].base_stat,
        attack: data.stats[1].base_stat,
        img: data.sprites.front_default
    };
}

async function attackShock(state, attackerId, targetId, damage) {
    const attaker = state.players.find(p => p.id === attackerId);
    const target = state.players.find(p => p.id === targetId);
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

async function levelUP(state) {
    const newStates = {
        ...state,
        players: state.players.map(p => {
            if (p.id === 1 && p.exp === 100) {
                return {
                    ...p,
                    attack: p.attack + 7,
                    hp: p.hp + 40,
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
                        hp: pokemon.hp * 2,
                        maxHP: pokemon.hp * 2,
                        attack: pokemon.attack / 3
                    };
                }
                return p;
            })
        };
        return await addLog(newStates, `${newStates.players[1].name}が出現！`);
    }
    return state;
}

async function playerAction(state) {
    let newState = state;
    newState = await attackShock(newState, 1, 2, newState.players[0].attack);
    newState = await defeatRewards(newState);
    newState = await levelUP(newState);

    return newState;
}

async function enemyAction(state) {
    let newState = state;
    newState = await spawnEnemy(newState);
    newState = await attackShock(newState, 2, 1, Math.floor(newState.players[1].attack));

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

function textChange() {
    const playerPercent = (state.players[0].hp / state.players[0].maxHP) * 100;
    const enemyPercent = (state.players[1].hp / state.players[1].maxHP) * 100;
    playerBar.style.width = playerPercent  + "%";
    enemyBar.style.width = enemyPercent + "%";
    playerHP.textContent = state.players[0].hp;
    defeat.textContent = state.players[0].defeat;
    playerLevel.textContent = state.players[0].level;
    exp.textContent = state.players[0].exp;
    enemyHP.textContent = state.players[1].hp;
    enemyName.textContent = state.players[1].name;
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
    textChange();
}

attack.addEventListener('click', () => {
    playerTurn();
});