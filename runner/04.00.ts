type Props = {
  hp: number
}

class Monster implements Props {
  readonly hp!: number

  constructor(props: Props) {
    Object.assign(this, props)
    Object.freeze(this)
  }

  takeDamage(value: number) {
    return new Monster({
      ...this,
      hp: Math.max(this.hp - value, 0),
    })
  }

  get isDead() {
    return this.hp === 0
  }
}

const monster = new Monster({ hp: 16 }).takeDamage(12).takeDamage(12)

console.log(monster.isDead) // true
