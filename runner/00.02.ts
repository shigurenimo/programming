type Monster = {
  name: string
  hp: number
  isDead: boolean
}

const monster: Monster = Object.freeze({
  name: "slime",
  hp: 16,
  isDead: false,
})

monster.hp -= 999 // TypeError: Attempted to assign to readonly property.
