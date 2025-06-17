import { z } from "zod/v4"
import { PlayerEntity } from "./domain/entities/player-entity"
import { MonsterEntity } from "./domain/entities/monster-entity"

const zAttackSpellProps = z.object({
  name: z.string(),
  cost: z.number().min(0).max(999),
  damage: z.number().min(1).max(999),
})

export class AttackSpellValue {
  readonly name!: string
  readonly cost!: number
  readonly damage!: number

  constructor(props: z.infer<typeof zAttackSpellProps>) {
    Object.assign(this, zAttackSpellProps.parse(props))
    Object.freeze(this)
  }
}

const zHealSpellProps = z.object({
  name: z.string(),
  cost: z.number().min(0).max(999),
  healAmount: z.number().min(1).max(999),
})

class HealSpellValue {
  readonly name!: string
  readonly cost!: number
  readonly healAmount!: number

  constructor(props: z.infer<typeof zHealSpellProps>) {
    Object.assign(this, zHealSpellProps.parse(props))
    Object.freeze(this)
  }
}

const zBuffSpellProps = z.object({
  name: z.string(),
  cost: z.number().min(0).max(999),
  effect: z.string(),
  duration: z.number().min(1).max(10),
})

class BuffSpellValue {
  readonly name!: string
  readonly cost!: number
  readonly effect!: string
  readonly duration!: number

  constructor(props: z.infer<typeof zBuffSpellProps>) {
    Object.assign(this, zBuffSpellProps.parse(props))
    Object.freeze(this)
  }
}

type SpellValue = AttackSpellValue | HealSpellValue | BuffSpellValue

class BattleService {
  castSpell(props: {
    spell: SpellValue
    caster: PlayerEntity
    target: MonsterEntity | null
  }) {
    if (props.spell instanceof AttackSpellValue) {
      return {
        caster: props.caster.consumeMp(props.spell.cost),
        target: props.target?.takeDamage(props.spell.damage),
      }
    }

    if (props.spell instanceof HealSpellValue) {
      return {
        caster: props.caster
          .consumeMp(props.spell.cost)
          .addHp(props.spell.healAmount),
        target: props.target,
      }
    }

    throw new Error("Unsupported spell type")
  }
}

const service = new BattleService()

const result = service.castSpell({
  spell: new AttackSpellValue({
    name: "Fireball",
    cost: 10,
    damage: 30,
  }),
  caster: PlayerEntity.create(),
  target: MonsterEntity.createFromLevel(1),
})

console.log("result", result)
console.log("caster hp", result.caster.hp.value) // 90
console.log("target hp", result.target?.hp.value) // 0 (if the target was a monster with 30 HP)
