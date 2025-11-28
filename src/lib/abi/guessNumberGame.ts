export const guessNumberGameAbi = [
  {
    inputs: [
      { internalType: "uint256", name: "roundId", type: "uint256" },
      { internalType: "externalEuint16", name: "encryptedGuess", type: "bytes32" },
      { internalType: "bytes", name: "inputProof", type: "bytes" }
    ],
    name: "submitGuess",
    outputs: [],
    stateMutability: "payable",
    type: "function"
  },
  {
    inputs: [{ internalType: "uint256", name: "roundId", type: "uint256" }],
    name: "getRoundInfo",
    outputs: [
      { internalType: "uint256", name: "startTime", type: "uint256" },
      { internalType: "uint256", name: "endTime", type: "uint256" },
      { internalType: "bool", name: "isActive", type: "bool" },
      { internalType: "uint256", name: "totalGuesses", type: "uint256" },
      { internalType: "euint64", name: "potAmount", type: "bytes32" }
    ],
    stateMutability: "view",
    type: "function"
  },
  {
    inputs: [
      { internalType: "uint256", name: "roundId", type: "uint256" },
      { internalType: "address", name: "player", type: "address" }
    ],
    name: "getPlayerState",
    outputs: [
      { internalType: "bool", name: "hasSubmitted", type: "bool" },
      { internalType: "uint40", name: "guessTime", type: "uint40" },
      { internalType: "euint16", name: "encryptedGuess", type: "bytes32" },
      { internalType: "euint16", name: "encryptedHint", type: "bytes32" }
    ],
    stateMutability: "view",
    type: "function"
  },
  {
    inputs: [{ internalType: "uint256", name: "roundId", type: "uint256" }],
    name: "getRevealStatus",
    outputs: [
      { internalType: "bool", name: "isRevealed", type: "bool" },
      { internalType: "bool", name: "revealPending", type: "bool" },
      { internalType: "uint16", name: "revealedSecret", type: "uint16" },
      { internalType: "address", name: "winner", type: "address" },
      { internalType: "uint256", name: "requestId", type: "uint256" }
    ],
    stateMutability: "view",
    type: "function"
  },
  {
    inputs: [],
    name: "currentRoundId",
    outputs: [{ internalType: "uint256", name: "", type: "uint256" }],
    stateMutability: "view",
    type: "function"
  },
  {
    inputs: [{ internalType: "uint256", name: "roundId", type: "uint256" }],
    name: "requestRoundReveal",
    outputs: [{ internalType: "uint256", name: "requestId", type: "uint256" }],
    stateMutability: "nonpayable",
    type: "function"
  },
  {
    inputs: [{ internalType: "uint256", name: "roundId", type: "uint256" }],
    name: "cancelReveal",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function"
  },
  {
    inputs: [
      { internalType: "uint256", name: "roundId", type: "uint256" },
      { internalType: "address", name: "player", type: "address" }
    ],
    name: "hasPlayerWon",
    outputs: [{ internalType: "bool", name: "", type: "bool" }],
    stateMutability: "view",
    type: "function"
  }
] as const;
