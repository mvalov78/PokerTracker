import {
  extractPokerStarsLiveFields,
  isPokerStarsLiveTicket,
} from '@/services/ocr/pokerStarsLiveParser'
import { parseFlexibleTicketDate } from '@/services/ocr/parseTicketDate'
import { processTicketImage } from '@/services/ocrService'

const POKERSTARS_LIVE_RECEIPT = `POKERSTARS | LIVE
Player ID:
33
Registration Receipt
Player ID 33
Country Russia
Status
Chips 10,000
Subscription
Issue date 17 August 2026 21:10
Buy-in 600 €
Entry 1st
Entry type Cash
Issued by Strazda Jakub
Tournament
Festival EPT Barcelona 2026
Venue Barcelona
Open tournament`

const POKERSTARS_LIVE_SPLIT_LINES = `POKERSTARS LIVE
Registration Receipt
Player ID
33
Country
Russia
Status
Chips
10,000
Subscription
Issue date
17 August 2026 21:10
Buy-in
600 €
Entry
1st
Entry type
Cash
Issued by
Strazda Jakub
Tournament
Festival
EPT Barcelona 2026
Venue
Barcelona
Open tournament`

// Real OCR Engine 2 output: labels block, then values block (two-column layout)
const POKERSTARS_LIVE_TWO_COLUMN = `21:141
::. 5G 65-
POKERSTARS
NE LIVE
X
Player ID:
33
Registration Receipt
Player ID
Country
Status
Chips
Subscription
Issue date
Buy-in
→
Entry
Entry type
28
Issued by
Tournament
Festival
Venue
80 Open tournament
33
- Russia
10,000
17 August 2026 21:10
600 €
1st
Cash
Strazda Jakub
EPT Barcelona 2026
Barcelona`

const RPC_TICKET = `RPC FINAL 16-21 DECEMBER 2025
CASINO SOCHI 2025
EVENT:#2 OPENER Day 1
AMOUNT: 330    CHIPS: 30000
BUYIN: 300    FEE: 30    KO: 0
DATE: 16.12.2025`

const BARCELONA_TICKET = `CASINO BARCELONA
#WEEKEND_WARRIOR
Totales
Compra (BuyIn): 75,00 €
Total: 165,00 €`

function mockOcrText(parsedText: string) {
  const ocrResponse = {
    ParsedResults: [{ ParsedText: parsedText }],
    IsErroredOnProcessing: false,
  }

  ;(global.fetch as jest.Mock)
    .mockResolvedValueOnce({
      ok: true,
      arrayBuffer: () => Promise.resolve(new ArrayBuffer(100)),
      headers: { get: () => 'image/jpeg' },
    } as unknown as Response)
    .mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve(ocrResponse),
      text: () => Promise.resolve(JSON.stringify(ocrResponse)),
    } as Response)
}

describe('PokerStars Live ticket parser', () => {
  describe('isPokerStarsLiveTicket', () => {
    it('detects the live registration receipt', () => {
      expect(isPokerStarsLiveTicket(POKERSTARS_LIVE_RECEIPT)).toBe(true)
    })

    it('detects the receipt even if the header logo is cropped', () => {
      expect(
        isPokerStarsLiveTicket(
          `Registration Receipt
Festival EPT Barcelona 2026
Issue date 17 August 2026 21:10
Buy-in 600 €`,
        ),
      ).toBe(true)
    })

    it('does not treat RPC tickets as PokerStars Live', () => {
      expect(isPokerStarsLiveTicket(RPC_TICKET)).toBe(false)
    })

    it('does not treat Casino Barcelona tickets as PokerStars Live', () => {
      expect(isPokerStarsLiveTicket(BARCELONA_TICKET)).toBe(false)
    })
  })

  describe('extractPokerStarsLiveFields', () => {
    it('extracts festival, date, buy-in, venue and chips from a clean receipt', () => {
      const data = extractPokerStarsLiveFields(POKERSTARS_LIVE_RECEIPT)

      expect(data).not.toBeNull()
      expect(data?.name).toBe('EPT Barcelona 2026')
      expect(data?.date).toBe('2026-08-17T21:10')
      expect(data?.buyin).toBe(600)
      expect(data?.venue).toBe('Barcelona')
      expect(data?.startingStack).toBe(10000)
    })

    it('reads labels and values on separate lines', () => {
      const data = extractPokerStarsLiveFields(POKERSTARS_LIVE_SPLIT_LINES)

      expect(data?.name).toBe('EPT Barcelona 2026')
      expect(data?.date).toBe('2026-08-17T21:10')
      expect(data?.buyin).toBe(600)
      expect(data?.venue).toBe('Barcelona')
      expect(data?.startingStack).toBe(10000)
    })

    it('handles real OCR Engine 2 two-column output', () => {
      const data = extractPokerStarsLiveFields(POKERSTARS_LIVE_TWO_COLUMN)

      expect(data).not.toBeNull()
      expect(data?.name).toBe('EPT Barcelona 2026')
      expect(data?.date).toBe('2026-08-17T21:10')
      expect(data?.buyin).toBe(600)
      expect(data?.venue).toBe('Barcelona')
      expect(data?.startingStack).toBe(10000)
    })

    it('does not use POKERSTARS LIVE or Player ID as the tournament name', () => {
      const data = extractPokerStarsLiveFields(POKERSTARS_LIVE_RECEIPT)

      expect(data?.name).not.toMatch(/poker\s*stars/i)
      expect(data?.name).not.toBe('33')
    })

    it('does not use Open tournament chevron as the name', () => {
      const data = extractPokerStarsLiveFields(
        `${POKERSTARS_LIVE_RECEIPT}\nOpen tournament\n>`,
      )

      expect(data?.name).toBe('EPT Barcelona 2026')
    })

    it('uses Open tournament value when the event name is present', () => {
      const data = extractPokerStarsLiveFields(
        `POKERSTARS LIVE
Registration Receipt
Issue date 17 August 2026 21:10
Festival EPT Barcelona 2026
Open tournament Mystery Bounty`,
      )

      expect(data?.name).toBe('Mystery Bounty')
    })

    it('parses buy-in with EUR instead of euro sign', () => {
      const data = extractPokerStarsLiveFields(
        `POKERSTARS LIVE
Registration Receipt
Issue date 17 August 2026
Festival EPT Barcelona 2026
Buy-in 600 EUR`,
      )

      expect(data?.buyin).toBe(600)
    })

    it('parses buy-in with thousands separator', () => {
      const data = extractPokerStarsLiveFields(
        `POKERSTARS LIVE
Registration Receipt
Issue date 17 August 2026
Festival EPT Barcelona 2026
Buy-in 1,100 €`,
      )

      expect(data?.buyin).toBe(1100)
    })

    it('parses chips with a dot thousands separator', () => {
      const data = extractPokerStarsLiveFields(
        `POKERSTARS LIVE
Registration Receipt
Issue date 17 August 2026
Festival EPT Barcelona 2026
Chips 10.000
Buy-in 600 €`,
      )

      expect(data?.startingStack).toBe(10000)
    })

    it('recovers buy-in when OCR reads Buy-ln', () => {
      const data = extractPokerStarsLiveFields(
        `POKERSTARS LIVE
Registration Receipt
Issue date 17 August 2026 21:10
Festival EPT Barcelona 2026
Buy-ln 600 €`,
      )

      expect(data?.buyin).toBe(600)
    })

    it('falls back to EPT City Year when Festival label is missing', () => {
      const data = extractPokerStarsLiveFields(
        `POKERSTARS LIVE
Registration Receipt
Issue date 17 August 2026 21:10
Buy-in 600 €
EPT Barcelona 2026
Venue Barcelona`,
      )

      expect(data?.name).toBe('EPT Barcelona 2026')
    })

    it('does not take Player ID as buy-in or chip count', () => {
      const data = extractPokerStarsLiveFields(POKERSTARS_LIVE_RECEIPT)

      expect(data?.buyin).not.toBe(33)
      expect(data?.startingStack).not.toBe(33)
    })

    it('returns null for unrelated tickets', () => {
      expect(extractPokerStarsLiveFields(RPC_TICKET)).toBeNull()
      expect(extractPokerStarsLiveFields(BARCELONA_TICKET)).toBeNull()
    })
  })

  describe('parseFlexibleTicketDate', () => {
    it('parses English day-month-year with time', () => {
      expect(parseFlexibleTicketDate('17 August 2026 21:10')).toBe(
        '2026-08-17T21:10',
      )
    })

    it('parses abbreviated month without time', () => {
      expect(parseFlexibleTicketDate('17 Aug 2026')).toBe('2026-08-17T18:00')
    })

    it('parses month-first English date', () => {
      expect(parseFlexibleTicketDate('August 17, 2026')).toBe(
        '2026-08-17T18:00',
      )
    })

    it('still parses numeric ticket dates', () => {
      expect(parseFlexibleTicketDate('16.12.2025')).toBe('2025-12-16T18:00')
      expect(parseFlexibleTicketDate('2026-04-10')).toBe('2026-04-10T18:00')
    })
  })
})

describe('PokerStars Live OCR integration', () => {
  beforeEach(() => {
    global.fetch = jest.fn()
    jest.clearAllMocks()
    jest.spyOn(console, 'warn').mockImplementation(() => {})
  })

  afterEach(() => {
    jest.restoreAllMocks()
  })

  it('extracts EPT Barcelona receipt through processTicketImage', async () => {
    mockOcrText(POKERSTARS_LIVE_RECEIPT)

    const result = await processTicketImage(
      'https://example.com/pokerstars-live-ept.jpg',
    )

    expect(result.success).toBe(true)
    expect(result.data?.name).toBe('EPT Barcelona 2026')
    expect(result.data?.buyin).toBe(600)
    expect(result.data?.venue).toBe('Barcelona')
    expect(result.data?.startingStack).toBe(10000)
    expect(result.data?.date).toContain('2026-08-17')
    expect(result.data?.tournamentType).toBe('freezeout')
  })

  it('handles real OCR Engine 2 two-column output end-to-end', async () => {
    mockOcrText(POKERSTARS_LIVE_TWO_COLUMN)

    const result = await processTicketImage(
      'https://example.com/pokerstars-live-ept-real.jpg',
    )

    expect(result.success).toBe(true)
    expect(result.data?.name).toBe('EPT Barcelona 2026')
    expect(result.data?.buyin).toBe(600)
    expect(result.data?.venue).toBe('Barcelona')
    expect(result.data?.startingStack).toBe(10000)
    expect(result.data?.date).toContain('2026-08-17')
  })

  it('still parses Casino Barcelona tickets after PokerStars Live support', async () => {
    mockOcrText(`CASINO BARCELONA
10-04-2026
EFECTIVO
#POKER_IN_2.0
10/4/2026
Totales
Compra (BuyIn): 150,00 €
Incripción: 15,00 €
Total: 165,00 €
Jugador
VALOV, MAKSIM`)

    const result = await processTicketImage(
      'https://example.com/barcelona-ticket.jpg',
    )

    expect(result.success).toBe(true)
    expect(result.data?.name).toBe('POKER_IN_2.0')
    expect(result.data?.buyin).toBe(165)
  })
})
