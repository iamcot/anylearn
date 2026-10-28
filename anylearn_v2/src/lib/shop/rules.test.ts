import { describe, expect, it } from 'vitest'
import type { Energy, QuizPack } from '@/lib/api/quiz'
import type { ShopEntry } from '@/lib/api/shop'
import {
  buyProblem, canSavePack, countdown, energyLine, energyPercent, gameFromQuery, groupByGame, initialTopics, lobbyEntries, packScope, packTitle,
  priceOf, remainingText, shopTabFromQuery, tickEnergy, toggleTopic, topicsToSave,
} from './rules'

const entry = (over: Partial<ShopEntry>): ShopEntry => ({
  key: 'fifty', game: 'quiz', gameLabel: 'Leo rank', kind: 'item', label: '50:50', description: '', price: 15, enabled: true, dailyCap: 5, left: 5,
  link: '/fun/quiz', linkLabel: 'Dùng ở Leo rank ›', ...over,
})
const pack = (over: Partial<QuizPack>): QuizPack => ({
  id: 1, type: 'level', typeLabel: 'Gói theo cấp độ', difficulty: 4, difficultyLabel: 'Khó', topic: null, topics: null, topicLabels: [], total: 10, remaining: 7,
  configured: true, status: 'active', ...over,
})
const energy = (over: Partial<Energy>): Energy => ({ value: 23, max: 30, nextInSeconds: 192, regenMinutes: 5, cost: 1, ...over })

describe('shop tabs and grouping', () => {
  it('reads the tab and game from the address', () => {
    expect(shopTabFromQuery('sell')).toBe('sell')
    expect(shopTabFromQuery('history')).toBe('history')
    expect(shopTabFromQuery('x')).toBe('buy')
    expect(shopTabFromQuery(null)).toBe('buy')
    expect(gameFromQuery('sticker')).toBe('sticker')
    expect(gameFromQuery('other')).toBeNull()
  })

  it('groups by game in a fixed order and can keep one game', () => {
    const entries = [entry({ key: 'chest_normal', game: 'sticker', kind: 'chest' }), entry({ key: 'fifty' }), entry({ key: 'energy', kind: 'energy' })]
    expect(groupByGame(entries).map(g => [g.game, g.entries.length])).toEqual([['quiz', 2], ['sticker', 1]])
    expect(groupByGame(entries, 'sticker').map(g => g.game)).toEqual(['sticker'])
    expect(groupByGame([entry({})], 'sticker')).toEqual([])
  })

  it('keeps items and packs for the lobby shop, not energy or chests', () => {
    const entries = [entry({ key: 'fifty' }), entry({ key: 'pack_topic', kind: 'pack' }), entry({ key: 'energy', kind: 'energy' }), entry({ key: 'chest_normal', game: 'sticker', kind: 'chest' })]
    expect(lobbyEntries(entries).map(e => e.key)).toEqual(['fifty', 'pack_topic'])
  })
})

describe('buying', () => {
  const level = entry({ key: 'pack_level', kind: 'pack', price: null, needsDifficulty: true, levelPrices: [5, 7, 9, 12, 15] })

  it('prices a level pack from the chosen level, else from the cheapest', () => {
    expect(priceOf(level, 4)).toBe(12)
    expect(priceOf(level, null)).toBe(5)
    expect(priceOf(entry({ price: 15 }), null)).toBe(15)
  })

  it('says why an entry cannot be bought', () => {
    expect(buyProblem(entry({}), 100, null)).toBeNull()
    expect(buyProblem(entry({ enabled: false }), 100, null)).toBe('Tạm ngừng bán')
    expect(buyProblem(level, 100, null)).toBe('Chọn cấp độ')
    expect(buyProblem(level, 10, 4)).toBe('Chưa đủ xu')
    expect(buyProblem(level, 12, 4)).toBeNull()
    expect(buyProblem(entry({ left: 0 }), 100, null)).toBe('Hết lượt hôm nay')
    expect(buyProblem(entry({ qty: 10, stockCap: 10 }), 100, null)).toBe('Kho đầy')
  })
})

describe('energy', () => {
  it('formats a countdown', () => {
    expect(countdown(192)).toBe('03:12')
    expect(countdown(-3)).toBe('00:00')
    expect(countdown(3725)).toBe('62:05')
  })

  it('moves the bar on while the screen is open', () => {
    expect(tickEnergy(energy({}), 100)).toEqual({ value: 23, nextInSeconds: 92 })
    // the next point arrives at 192 s, the one after at 492 s
    expect(tickEnergy(energy({}), 192)).toEqual({ value: 24, nextInSeconds: 300 })
    expect(tickEnergy(energy({}), 500)).toEqual({ value: 25, nextInSeconds: 292 })
  })

  it('never passes the max and stops counting when full', () => {
    expect(tickEnergy(energy({ value: 29 }), 99999)).toEqual({ value: 30, nextInSeconds: 0 })
    expect(tickEnergy(energy({ value: 30, nextInSeconds: 0 }), 50)).toEqual({ value: 30, nextInSeconds: 0 })
  })

  it('writes the line and the bar width', () => {
    expect(energyLine(23, 30, 192)).toBe('23/30 · +1 sau 03:12')
    expect(energyLine(30, 30, 0)).toBe('30/30')
    expect(energyPercent(15, 30)).toBe(50)
    expect(energyPercent(40, 30)).toBe(100)
    expect(energyPercent(1, 0)).toBe(0)
  })
})

describe('training packs', () => {
  it('titles a pack by its type', () => {
    expect(packTitle(pack({}))).toBe('Gói cấp Khó')
    expect(packTitle(pack({ type: 'topic', difficulty: null, difficultyLabel: null, topic: 'math', topics: ['math'], topicLabels: ['Toán'] }))).toBe('Gói chủ đề Toán')
    expect(packTitle(pack({ type: 'topic', difficulty: null, difficultyLabel: null, configured: false }))).toBe('Gói theo chủ đề')
    expect(packTitle(pack({ type: 'topic_level', topicLabels: ['Toán'], topics: ['math'], topic: 'math' }))).toBe('Gói Toán · Khó')
    expect(packTitle(pack({ type: 'topic_level' }))).toBe('Gói chủ đề + cấp Khó')
  })

  it('says what a pack covers and what is left', () => {
    expect(packScope(pack({}))).toBe('Mọi chủ đề')
    expect(packScope(pack({ topicLabels: ['Toán', 'Nhạc'] }))).toBe('Toán, Nhạc')
    expect(packScope(pack({ type: 'topic', configured: false }))).toBe('Chưa chọn chủ đề')
    expect(remainingText(pack({}))).toBe('Còn 7/10 câu')
  })

  const all = ['math', 'music', 'art']

  it('opens the panel with the saved topics, else all (level) or the first one', () => {
    expect(initialTopics(pack({ topics: ['music'] }), all)).toEqual(['music'])
    expect(initialTopics(pack({}), all)).toEqual(all)
    expect(initialTopics(pack({ type: 'topic' }), all)).toEqual(['math'])
  })

  it('ticks many topics for a level pack and exactly one for the others', () => {
    expect(toggleTopic('level', all, 'music')).toEqual(['math', 'art'])
    expect(toggleTopic('level', ['math'], 'math')).toEqual(['math'])
    expect(toggleTopic('level', ['math'], 'art')).toEqual(['math', 'art'])
    expect(toggleTopic('topic', ['math'], 'art')).toEqual(['art'])
    expect(toggleTopic('topic_level', ['math'], 'math')).toEqual(['math'])
  })

  it('sends none for a level pack with every topic, and checks it can be saved', () => {
    expect(topicsToSave('level', all, all)).toEqual([])
    expect(topicsToSave('level', ['math'], all)).toEqual(['math'])
    expect(topicsToSave('topic', ['math'], all)).toEqual(['math'])
    expect(canSavePack('level', ['math'])).toBe(true)
    expect(canSavePack('level', [])).toBe(false)
    expect(canSavePack('topic', ['math'])).toBe(true)
    expect(canSavePack('topic', [])).toBe(false)
    expect(canSavePack('topic_level', ['a', 'b'])).toBe(false)
  })
})
