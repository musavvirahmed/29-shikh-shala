(function (root, factory) {
  const api = factory();
  if (typeof module === "object" && module.exports) module.exports = api;
  else root.TwentyNineLessons = api;
})(typeof self !== "undefined" ? self : this, function () {
  const POINTS = { J: 3, 9: 2, A: 1, 10: 1, K: 0, Q: 0, 8: 0, 7: 0 };

  function card(id) {
    const rank = id.slice(0, -1);
    const suit = id.slice(-1);
    return { face: true, id, rank, suit, points: POINTS[rank] };
  }

  function backs(n) {
    return Array.from({ length: n }, () => ({ face: false }));
  }

  function seat(id, label, cards) {
    return { id, label, cards, count: cards.length };
  }

  function scene(partial) {
    return {
      seats: {
        S: seat("S", "You", []),
        E: seat("E", "Right", []),
        N: seat("N", "Partner", []),
        W: seat("W", "Left", []),
      },
      trick: [],
      buried: null,
      dealer: "W",
      turn: null,
      declarer: null,
      bid: 0,
      trump: null,
      trumpKnown: false,
      ourScore: 0,
      theirScore: 0,
      ourPoints: 0,
      theirPoints: 0,
      ribbon: "Play runs to your right",
      ...partial,
    };
  }

  const lessons = [
    {
      id: "seats",
      title: "Across is yours",
      steps: [
        {
          ribbon: "You, then Right, then Partner, then Left",
          coach:
            "Four seats, two sides. Partner sits across the felt. Left and Right play against you. The deal and the play both run to your right.",
          view: scene({
            turn: "S",
            seats: {
              S: seat("S", "You", backs(4)),
              E: seat("E", "Right", backs(4)),
              N: seat("N", "Partner", backs(4)),
              W: seat("W", "Left", backs(4)),
            },
          }),
          choices: [
            {
              label: "Partner plays the next card",
              correct: false,
              why: "Partner plays third. The seat on your right plays second.",
            },
            {
              label: "Right plays the next card",
              correct: true,
              why: "Play runs to your right: you, Right, Partner, Left, then you again.",
            },
            {
              label: "Left plays the next card",
              correct: false,
              why: "Left plays last in the round, just before the lead comes back to you.",
            },
          ],
        },
        {
          ribbon: "Two sides",
          coach: "Points you take and points Partner takes go on the same side of the ledger.",
          view: scene({
            seats: {
              S: seat("S", "You", backs(4)),
              E: seat("E", "Right", backs(4)),
              N: seat("N", "Partner", backs(4)),
              W: seat("W", "Left", backs(4)),
            },
          }),
          choices: [
            {
              label: "You score with Partner",
              correct: true,
              why: "You win and lose the hand together. Left and Right are the other side.",
            },
            {
              label: "You score with Right",
              correct: false,
              why: "Right is an opponent. Your partner is the seat across.",
            },
            {
              label: "Each seat scores alone",
              correct: false,
              why: "It is a partnership game. A bid is a promise made for two people.",
            },
          ],
        },
      ],
    },
    {
      id: "rank",
      title: "The jack outranks the ace",
      steps: [
        {
          ribbon: "No trump named",
          coach:
            "These four spades fell on one trick, and trump was never named. The ace is not the top card in this game.",
          view: scene({
            ribbon: "Spades led · trump not named",
            trick: [
              { seat: "W", card: card("10S") },
              { seat: "S", card: card("AS") },
              { seat: "E", card: card("9S") },
              { seat: "N", card: card("JS") },
            ],
          }),
          choices: [
            {
              label: "The ace of spades",
              correct: false,
              why: "The ace is third. The nine beats it, and the jack beats the nine.",
            },
            {
              label: "The nine of spades",
              correct: false,
              why: "The nine does beat the ace and the ten. The jack still sits above the nine.",
            },
            {
              label: "The jack of spades",
              correct: true,
              why: "In every suit the order runs jack, nine, ace, ten, king, queen, eight, seven.",
            },
          ],
        },
        {
          ribbon: "Hearts led",
          coach: "Same rule, another suit. Highest card of the suit that was led, while trump is still hidden.",
          view: scene({
            ribbon: "Hearts led · trump hidden",
            trick: [
              { seat: "W", card: card("KH") },
              { seat: "S", card: card("AH") },
              { seat: "E", card: card("10H") },
              { seat: "N", card: card("9H") },
            ],
          }),
          choices: [
            { label: "The ace of hearts", correct: false, why: "The ace loses to the nine, and to a jack if one appears." },
            { label: "The nine of hearts", correct: true, why: "No jack was played. The nine is the highest heart on the table." },
            { label: "The king of hearts", correct: false, why: "The king is below the ten, the ace, the nine and the jack." },
          ],
        },
      ],
    },
    {
      id: "points",
      title: "Twenty-eight, counted",
      steps: [
        {
          coach: "Only four ranks are worth anything. How many card points are in this trick?",
          view: scene({
            ribbon: "Count the trick",
            trick: [
              { seat: "W", card: card("JH") },
              { seat: "S", card: card("9C") },
              { seat: "E", card: card("KD") },
              { seat: "N", card: card("7S") },
            ],
          }),
          choices: [
            { label: "5", correct: true, why: "The jack is 3, the nine is 2, and the king and seven are worth nothing." },
            { label: "4", correct: false, why: "That would be a jack and an ace. A nine is worth 2, so jack plus nine is 5." },
            { label: "13", correct: false, why: "Kings and queens are not worth ten here. They score zero." },
          ],
        },
        {
          coach: "A suit is jack 3, nine 2, ace 1, ten 1. Four suits are on the table. How many points are in the pack?",
          view: scene({
            ribbon: "The whole pack",
            seats: {
              S: seat("S", "You", [card("JS"), card("9S"), card("AS"), card("10S")]),
              E: seat("E", "Right", [card("JH"), card("9H"), card("AH"), card("10H")]),
              N: seat("N", "Partner", [card("JD"), card("9D"), card("AD"), card("10D")]),
              W: seat("W", "Left", [card("JC"), card("9C"), card("AC"), card("10C")]),
            },
          }),
          choices: [
            {
              label: "28",
              correct: true,
              why: "Seven points in a suit, four suits, 28. This table does not add a point for the last trick. The name 29 is older than that habit.",
            },
            {
              label: "29",
              correct: false,
              why: "Some older tables gave a point for the last trick, which is where the name comes from. This table counts the cards only: 28.",
            },
            { label: "120", correct: false, why: "That total belongs to other trick-taking games. A jack here is 3, not 1 and not 10." },
          ],
        },
      ],
    },
    {
      id: "bid",
      title: "Sixteen is a promise",
      steps: [
        {
          coach:
            "Left dealt, so you speak first. These are your four cards: jack and nine of hearts, king of spades, seven of diamonds. Five points, and a suit you can name. The smallest bid is 16, out of 28.",
          view: scene({
            ribbon: "Your bid",
            turn: "S",
            seats: {
              S: seat("S", "You", [card("JH"), card("9H"), card("KS"), card("7D")]),
              E: seat("E", "Right", backs(4)),
              N: seat("N", "Partner", backs(4)),
              W: seat("W", "Left", backs(4)),
            },
          }),
          choices: [
            {
              label: "Pass",
              correct: false,
              why: "A jack and nine of the same suit is a real opening. Passing hands the naming of trump to someone else.",
            },
            {
              label: "Bid 16",
              correct: true,
              why: "16 promises that your side will take 16 of the 28. It does not promise the rest of the pack. You still have four cards to come.",
            },
            {
              label: "Bid 28",
              correct: false,
              why: "28 means every point in the pack. Four cards cannot say that.",
            },
          ],
        },
        {
          coach:
            "A different deal. You are on the dealer's right again, and your four cards are a king, a queen, an eight and a seven. No points at all.",
          view: scene({
            ribbon: "A blank hand",
            turn: "S",
            seats: {
              S: seat("S", "You", [card("KH"), card("QD"), card("8C"), card("7S")]),
              E: seat("E", "Right", backs(4)),
              N: seat("N", "Partner", backs(4)),
              W: seat("W", "Left", backs(4)),
            },
          }),
          choices: [
            {
              label: "Bid 16 anyway",
              correct: false,
              why: "The auction never starts. A blank hand in this seat is a misdeal.",
            },
            {
              label: "Pass, and let the others bid",
              correct: false,
              why: "There is nothing to pass on. The cards are gathered and the next player deals.",
            },
            {
              label: "Throw the hand in",
              correct: true,
              why: "If the dealer's right, or the dealer's partner, is dealt no points in the first four, the deal is thrown in. The other two seats can be blank without stopping the hand.",
            },
          ],
        },
      ],
    },
    {
      id: "hidden",
      title: "A heart is not trump yet",
      steps: [
        {
          coach:
            "You won the bid at 17 and named hearts. One heart is face down in front of you. Left led the ten of spades, Right played the jack of hearts without asking, and Partner played the eight of spades. Who is winning?",
          view: scene({
            ribbon: "Hearts named · still face down",
            declarer: "S",
            bid: 17,
            trump: "H",
            trumpKnown: false,
            buried: { seat: "S", face: true, id: "7H", rank: "7", suit: "H", points: 0, hidden: true },
            trick: [
              { seat: "W", card: card("10S") },
              { seat: "E", card: card("JH") },
              { seat: "N", card: card("8S") },
            ],
            turn: "S",
          }),
          choices: [
            {
              label: "The jack of hearts",
              correct: false,
              why: "Hearts have no power while the card stays face down. A heart played now is only a heart.",
            },
            {
              label: "The ten of spades",
              correct: true,
              why: "The highest spade wins. The jack of hearts cannot take a spade trick until someone asks and the suit is turned up.",
            },
            { label: "The eight of spades", correct: false, why: "The eight is the lowest spade in the trick." },
          ],
        },
        {
          coach:
            "Same cards, one change. You have no spade, so you ask. The face-down card is turned up and hearts are trump for this trick and every trick after it. The jack of hearts was already on the table.",
          view: scene({
            ribbon: "Hearts revealed",
            declarer: "S",
            bid: 17,
            trump: "H",
            trumpKnown: true,
            trick: [
              { seat: "W", card: card("10S") },
              { seat: "E", card: card("JH") },
              { seat: "N", card: card("8S") },
            ],
            turn: "S",
          }),
          choices: [
            {
              label: "The jack of hearts takes it",
              correct: true,
              why: "Asking reaches backward through the trick. A heart already played wakes up. You, having asked, must play a heart too if you hold one.",
            },
            {
              label: "The ten of spades still takes it",
              correct: false,
              why: "That was true before the ask. Once the suit is named, the highest heart in the trick beats every spade.",
            },
          ],
        },
        {
          coach:
            "Your four cards are the jack and nine of hearts, the king of spades and the seven of diamonds. You may name a suit, or you may call the seventh card: the third new card you are dealt, still unseen, becomes trump and sits face down.",
          view: scene({
            ribbon: "Name a suit, or call the seventh",
            turn: "S",
            declarer: "S",
            seats: {
              S: seat("S", "You", [card("JH"), card("9H"), card("KS"), card("7D")]),
              E: seat("E", "Right", backs(4)),
              N: seat("N", "Partner", backs(4)),
              W: seat("W", "Left", backs(4)),
            },
          }),
          choices: [
            {
              label: "Name hearts",
              correct: true,
              why: "You can already see a suit worth owning. The seventh card is for a hand split across the suits, when you do not want to marry yourself to any of them.",
            },
            {
              label: "Call the seventh card",
              correct: false,
              why: "You would be giving away the jack and nine of hearts for a card you have not seen.",
            },
          ],
        },
      ],
    },
    {
      id: "ask",
      title: "Ask on purpose",
      steps: [
        {
          coach:
            "Spades were led. Partner's ace is winning the trick, ahead of a king and a seven. You have no spade. Trump is still hidden, and you hold the jack of hearts. What do you do?",
          view: scene({
            ribbon: "Partner is winning · trump hidden",
            turn: "S",
            declarer: "E",
            bid: 16,
            buried: { seat: "E", face: false, hidden: true },
            trick: [
              { seat: "W", card: card("KS") },
              { seat: "N", card: card("AS") },
              { seat: "E", card: card("7D") },
            ],
            seats: {
              S: seat("S", "You", [card("JH"), card("7C"), card("8D")]),
              E: seat("E", "Right", backs(3)),
              N: seat("N", "Partner", backs(3)),
              W: seat("W", "Left", backs(3)),
            },
          }),
          choices: [
            {
              label: "Ask for trump",
              correct: false,
              why: "Partner already has the trick. Asking would name the suit and force you to spend a trump if you have one, on a trick your side was winning anyway.",
            },
            {
              label: "Discard, and leave the suit hidden",
              correct: true,
              why: "A low discard keeps the face-down card face down. Ask when you need the trick, not when Partner has already taken it.",
            },
          ],
        },
        {
          coach:
            "This time Partner's seven is losing to a jack, and a nine is in the trick too. That is five points if nothing changes. You have no card of the led suit, and you do not know the hidden suit.",
          view: scene({
            ribbon: "Five points, and Partner is losing",
            turn: "S",
            declarer: "E",
            bid: 18,
            buried: { seat: "E", face: false, hidden: true },
            trick: [
              { seat: "W", card: card("JC") },
              { seat: "N", card: card("7C") },
              { seat: "E", card: card("9D") },
            ],
            seats: {
              S: seat("S", "You", [card("QH"), card("8S"), card("7H")]),
              E: seat("E", "Right", backs(2)),
              N: seat("N", "Partner", backs(2)),
              W: seat("W", "Left", backs(2)),
            },
          }),
          choices: [
            {
              label: "Ask",
              correct: true,
              why: "The trick is fat and your side is not winning it. If you hold a trump you must play it, and you might not hold one. That is the risk. Five points is the reason to take it.",
            },
            {
              label: "Discard and save the question",
              correct: false,
              why: "Saving the question is right when Partner is already winning. Here the jack and the nine are about to leave on the other side.",
            },
          ],
        },
      ],
    },
    {
      id: "marriage",
      title: "King and queen of trump",
      steps: [
        {
          coach:
            "Hearts are revealed. The bid was 20. You still hold the king and queen of hearts. If you show them, what does the target become?",
          view: scene({
            ribbon: "Bid 20 · hearts revealed",
            declarer: "S",
            bid: 20,
            trump: "H",
            trumpKnown: true,
            seats: {
              S: seat("S", "You", [card("KH"), card("QH"), card("9C"), card("7D")]),
              E: seat("E", "Right", backs(4)),
              N: seat("N", "Partner", backs(4)),
              W: seat("W", "Left", backs(4)),
            },
          }),
          choices: [
            {
              label: "16",
              correct: true,
              why: "A bid of 19 or 20 comes down to 16. Both cards have to be in the hand, and the suit has to be face up.",
            },
            { label: "20", correct: false, why: "20 is the bid. The marriage is what moves it." },
            { label: "24", correct: false, why: "Showing your own king and queen never raises your target." },
          ],
        },
        {
          coach: "Same cards, but the bid was 17.",
          view: scene({
            ribbon: "Bid 17 · hearts revealed",
            declarer: "S",
            bid: 17,
            trump: "H",
            trumpKnown: true,
            seats: {
              S: seat("S", "You", [card("KH"), card("QH"), card("9C")]),
              E: seat("E", "Right", backs(3)),
              N: seat("N", "Partner", backs(3)),
              W: seat("W", "Left", backs(3)),
            },
          }),
          choices: [
            {
              label: "It stays 17",
              correct: true,
              why: "Bids of 16, 17 and 18 get no help from a marriage. The reduction starts at 19.",
            },
            { label: "It falls to 16", correct: false, why: "16 is where a bid of 19 or 20 lands. A 17 does not move." },
            { label: "It falls to 13", correct: false, why: "The marriage never takes four off a low bid. Those bids were already at the floor." },
          ],
        },
        {
          coach: "You are the bidding side. The other side is the one holding the king and queen of trump.",
          view: scene({
            ribbon: "Their king and queen",
            declarer: "S",
            bid: 18,
            trump: "D",
            trumpKnown: true,
            seats: {
              S: seat("S", "You", [card("JD"), card("7C")]),
              E: seat("E", "Right", [card("KD"), card("QD"), card("8S")]),
              N: seat("N", "Partner", backs(3)),
              W: seat("W", "Left", backs(3)),
            },
          }),
          choices: [
            {
              label: "Your target stays where it is",
              correct: true,
              why: "At this table a marriage only helps the bidding side. The defenders' king and queen do not push the target up.",
            },
            {
              label: "Your target rises by 4",
              correct: false,
              why: "That is a rule at some other tables. The Bangladesh marriage, as played here, does not arm the defenders.",
            },
          ],
        },
      ],
    },
    {
      id: "pips",
      title: "Red six, black six",
      steps: [
        {
          coach:
            "You promised 16 and your side took 18 card points. The match is scored in pips, on a red six and a black six, and it ends at six of either colour.",
          view: scene({
            ribbon: "18 card points against a bid of 16",
            ourPoints: 18,
            theirPoints: 10,
            bid: 16,
            declarer: "S",
          }),
          choices: [
            {
              label: "Your side uncovers one red pip",
              correct: true,
              why: "Made. One red pip. Only the bidding side's score moves. The 18 were card points, not 18 pips.",
            },
            {
              label: "Each side uncovers a pip",
              correct: false,
              why: "The defenders' pips stay as they are, whether you make the bid or miss it.",
            },
            {
              label: "Your side uncovers eighteen red pips",
              correct: false,
              why: "Card points and pips are different coins. The hand is worth one pip, or two if it was doubled, or four if it was redoubled.",
            },
          ],
        },
        {
          coach: "Before the second half of the deal, Right doubled. You still made the contract. How many red pips?",
          view: scene({
            ribbon: "Doubled · worth two pips",
            ourPoints: 18,
            theirPoints: 10,
            bid: 16,
            declarer: "S",
          }),
          choices: [
            { label: "Two", correct: true, why: "A double is two pips, won or lost. A redouble would have made it four. Six red pips wins the match. Six black pips loses it." },
            { label: "One", correct: false, why: "One is an undoubled hand. The double was made before anyone saw the other four cards." },
            { label: "Two black pips", correct: false, why: "Black is a miss. You made it, so the pips are red." },
          ],
        },
      ],
    },
  ];

  return { lessons };
});
