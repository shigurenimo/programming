type Props = {
  name: string
  hp: number
  mp: number
}

class Monster implements Props {
  readonly name!: string
  readonly hp!: number
  readonly mp!: number

  constructor(props: Props) {
    Object.assign(this, props)
    Object.freeze(this) // 書き換えを禁止
  }

  castSpell() {
    return new Monster({
      ...this,
      hp: this.hp + 16, // 回復
      mp: this.mp - 8, // 消費
    })
  }

  takeDamage(value: number) {
    return new Monster({
      ...this,
      hp: Math.max(this.hp - value, 0),
    })
  }
}

const monster = new Monster({
  name: "slime",
  hp: 16,
  mp: 8,
})
  .castSpell() // hp: 32, mp: 0
  .takeDamage(28) // hp: 4, mp: 0

console.log("monster", monster.hp) // 4
