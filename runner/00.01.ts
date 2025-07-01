type Monster = {
  name: string
  hp: number
  mp: number
}

const monster: Monster = {
  name: "slime",
  hp: 16,
  mp: 8,
}

monster.hp += 16 // 32
monster.mp -= 8 // 0

console.log(monster.hp) // 32
