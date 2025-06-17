type Monster = {
  name: string
  hp: number
  mp: number
}

const monster: Monster = Object.freeze({
  name: "slime",
  hp: 16,
  mp: 8,
})

const draftMonster = {
  ...monster,
  hp: monster.hp + 16, // 回復
  mp: monster.mp - 8, // 消費
}

console.log(draftMonster.hp) // 32
console.log(monster.hp) // 16（元の値は保持される）
