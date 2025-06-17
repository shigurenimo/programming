import { HpValue } from "./domain/values/hp-value"
import { MonsterEntity } from "./domain/entities/monster-entity"

class MonsterFactory {
  create(type: string, level: number): MonsterEntity {
    if (type === "slime") {
      return new MonsterEntity({
        id: crypto.randomUUID(),
        hp: new HpValue(level * 8),
        maxHp: new HpValue(level * 8),
        mp: new HpValue(level * 4),
      })
    }

    if (type === "dragon") {
      return new MonsterEntity({
        id: crypto.randomUUID(),
        hp: new HpValue(level * 20),
        maxHp: new HpValue(level * 20),
        mp: new HpValue(level * 15),
      })
    }

    throw new Error(`Unknown monster type: ${type}`)
  }
}

const factory = new MonsterFactory()

const slime = factory.create("slime", 4)

console.log(slime.hp.value) // 16
