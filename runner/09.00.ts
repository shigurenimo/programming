type Props = {
  id: string
  exp: number
  level: number
}

class PlayerEntity {
  readonly id!: string
  readonly exp!: number
  readonly level!: number

  constructor(props: Props) {
    Object.assign(this, props)
    Object.freeze(this)
  }

  addExp(value: number): PlayerEntity {
    const newExp = this.exp + value

    // レベル計算がEntity内に埋め込まれている
    let newLevel = 1
    let requiredExp = 0

    while (requiredExp <= newExp) {
      newLevel++
      requiredExp = newLevel * newLevel * 100
    }

    return new PlayerEntity({
      ...this,
      exp: newExp,
      level: newLevel - 1,
    })
  }
}

const playerEntity = new PlayerEntity({
  id: crypto.randomUUID(),
  exp: 0,
  level: 1,
})

const draft = playerEntity.addExp(1028)

console.log("level", draft.level) // 3
