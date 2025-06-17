import { HpValue } from "../../values/hp-value"
import { MonsterEntity } from "../monster-entity"

export class MonsterFactory {
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
