import { fromEventTime, toEventTime } from "./utils"

test(`fromEventTime`, () => {
  expect(fromEventTime()).toEqual([0, 60 * 24])
  expect(fromEventTime("0000", "2400")).toEqual([0, 24 * 60])
  expect(fromEventTime("0000", "4800")).toEqual([0, 24 * 60])
  expect(fromEventTime("0030", "2330")).toEqual([30, 23 * 60 + 30])
  expect(fromEventTime("0059", "2330")).toEqual([0, 23 * 60 + 30])
  expect(fromEventTime("0999", "0999")).toEqual([9 * 60, 9 * 60])
  expect(fromEventTime("1200", "0000")).toEqual([12 * 60, 12 * 60])
})

test(`toEventTime`, () => {
  expect(toEventTime()).toEqual(["0000", "2400"])
  expect(toEventTime(0, 24 * 60)).toEqual(["0000", "2400"])
  expect(toEventTime(0, 48 * 60)).toEqual(["0000", "2400"])
  expect(toEventTime(30, 23 * 60 + 30)).toEqual(["0030", "2330"])
  expect(toEventTime(12 * 60, 0)).toEqual(["1200", "1200"])
})
