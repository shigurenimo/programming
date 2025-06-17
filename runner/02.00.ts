type Monster = {
  name: string
  hp: number
  mp: number
}

function castSpell(monster: Monster): Monster {
  return {
    ...monster,
    hp: monster.hp + 16, // 回復
    mp: monster.mp - 8, // 消費
  }
}

function takeDamage(monster: Monster, value: number): Monster {
  return {
    ...monster,
    hp: Math.max(monster.hp - value, 0), // 0未満にならないよう制限
  }
}

const monster: Monster = Object.freeze({
  name: "slime",
  hp: 16,
  mp: 8,
})

const healedMonster = castSpell(monster)

const damagedMonster = takeDamage(monster, 28)

console.log("healedMonster", healedMonster)

console.log("damagedMonster", damagedMonster)
