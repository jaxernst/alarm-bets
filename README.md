# The Social Alarm Clock 
An onchain 2-player productivity game built to help players wake up earlier...

Demo: [social-alarm.xyz](https://social-alarm.xyz/)

# Quickstart
  Test contracts: (from root)
  `cd contracts`
  `yarn test`

  Run interface/frontend: (from root)
  `cd client`
  `yarn run dev`

## The Game: Overview
The game mechanics are quite simple and play out like so:

  1. Find a friend who is willing to accept the challenge of bettering their sleep schedule by waking up earlier
  2. Agree on a target time of day and days of the week to enforce the alarm
  3. Select on a bet value. While the Social Alarm Clock doesn't require value to be deposited, playing the game as a bet will establish strong incentives for you and your partner to stick with the alarm schedule
  4. Start the alarm
  5. Submit 'Wakeup Confirmations' on the mornings of your alarm BEFORE the alarm time passes. If a player misses their alarm, they will have to pay a penalty which gets sent to their partner
  6. Stick to your schedule. The alarm continues indefinitely until either player withdraws their stake.

### Wakeup Confirmations:
A 'wakeup cofirmation' represents an onchain proof that you have woken up. For the MVP Social Alarm Clock, players 'prove' that they have woken up by submitting a simple transaction to the alarm contract. This early version requires some level of social layer verfication; Your partner could simply submit their transaction and fall back asleep. It is ultimately up to both players to keep eachother honest. If you find that your partner is not holding true to their wakeup commitment, simply withdraw from the alarm and find another partner.

While this 'naive' approach will be used at the start, future versions of the Social Alarm Clock can introduce fun and novel 'proof of wakeup' mechanics. These could include proofs generated from solving puzzles, geolication data submission that requires you to actually leave your house to 'wakeup', or even simple URI submission that link to pictures of yourself out of bed drinking your morning coffee.


# Contracts
The Social Alarm Clock contains a set of simple Solidity smart contracts that facilliate and alarm clock style enforcement schedule, where'confirmations' must be submitted according to the schedule


# Client
The frontend is a svelte app that tracks your alarms and allows you to submit wakeup confirmations. The web app works standalone and does not require and centralized infrastructure to use. 
