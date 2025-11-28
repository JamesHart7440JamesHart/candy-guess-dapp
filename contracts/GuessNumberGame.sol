// SPDX-License-Identifier: MIT
pragma solidity ^0.8.27;

import {
    FHE,
    ebool,
    euint8,
    euint16,
    euint64,
    eaddress,
    externalEuint16
} from "@fhevm/solidity/lib/FHE.sol";
import { ZamaEthereumConfig } from "@fhevm/solidity/config/ZamaConfig.sol";

/**
 * @title GuessNumberGame
 * @dev Privacy-preserving number guessing game powered by Zama fhEVM
 *      Implements fail-closed validation, granular ACL, and secure reveal flow
 */
contract GuessNumberGame is ZamaEthereumConfig {
    struct RoundState {
        euint16 secretNumber;
        euint64 potAmount;
        eaddress winningPlayer;
        uint40 startTime;
        uint40 endTime;
        uint32 totalGuesses;
        bool isActive;
        bool isRevealed;
        bool revealPending;
        uint16 revealedSecret;
        address winner;
    }

    struct PlayerState {
        bool hasSubmitted;
        uint40 guessTime;
        euint16 encryptedGuess;
        euint16 encryptedHint;
    }

    uint64 public constant ENTRY_FEE_WEI = 1_000_000_000_000_000; // 0.001 ETH
    uint16 public constant MIN_GUESS = 1;
    uint16 public constant MAX_GUESS = 100;
    uint40 public constant DEFAULT_ROUND_DURATION = 300;
    uint40 public constant ROUND_DURATION = DEFAULT_ROUND_DURATION;

    address public owner;
    uint256 public currentRoundId;

    mapping(uint256 => RoundState) private rounds;
    mapping(uint256 => mapping(address => PlayerState)) private playerStates;
    mapping(address => uint256) public playerStats;

    euint16 private encryptedZeroHint;

    error NotOwner();
    error InvalidOwner();
    error RoundDoesNotExist();
    error RoundNotActive();
    error RoundExpired();
    error RoundStillOpen();
    error RoundRevealPending();
    error RoundRevealNotPending();
    error RoundAlreadyRevealed();
    error InvalidEntryFee();
    error PlayerAlreadyParticipated();

    event RoundCreated(uint256 indexed roundId, uint40 startTime, uint40 endTime, uint64 initialStake);
    event GuessSubmitted(
        uint256 indexed roundId,
        address indexed player,
        uint40 guessTime,
        bytes32 encryptedGuessHandle,
        bytes32 encryptedHintHandle
    );
    event RoundClosed(uint256 indexed roundId, uint40 closedAt);
    event RevealRequested(uint256 indexed roundId, uint256 requestId);
    event RoundRevealed(uint256 indexed roundId, uint16 secretNumber, address indexed winner);
    event OwnershipTransferred(address indexed previousOwner, address indexed newOwner);

    modifier onlyOwner() {
        if (msg.sender != owner) revert NotOwner();
        _;
    }

    modifier roundActive(uint256 roundId) {
        RoundState storage round = rounds[roundId];
        if (round.startTime == 0) revert RoundDoesNotExist();
        if (!round.isActive) revert RoundNotActive();
        if (block.timestamp > round.endTime) {
            round.isActive = false;
            revert RoundExpired();
        }
        _;
    }

    constructor() {
        owner = msg.sender;
        encryptedZeroHint = FHE.allowThis(FHE.asEuint16(0));
        emit OwnershipTransferred(address(0), owner);
    }

    /**
     * @notice Creates a new game round with an encrypted secret number
     * @dev Secret number is sanitized with fail-closed range checks
     *      Anyone can create a round by paying the entry fee
     */
    function createRound(
        externalEuint16 secretNumber,
        bytes calldata inputProof,
        uint40 durationSeconds
    ) external payable returns (uint256 roundId) {
        if (msg.value != ENTRY_FEE_WEI) revert InvalidEntryFee();

        uint40 duration = durationSeconds == 0 ? DEFAULT_ROUND_DURATION : durationSeconds;
        uint40 start = uint40(block.timestamp);
        uint40 end = start + duration;

        euint16 importedSecret = FHE.fromExternal(secretNumber, inputProof);
        euint16 sanitizedSecret = _sanitizeGuess(importedSecret);
        sanitizedSecret = FHE.allowThis(sanitizedSecret);
        sanitizedSecret = FHE.allow(sanitizedSecret, owner);

        euint64 initialPot = FHE.asEuint64(ENTRY_FEE_WEI);
        initialPot = FHE.allowThis(initialPot);
        initialPot = FHE.allow(initialPot, owner);

        eaddress zeroWinner = FHE.asEaddress(address(0));
        zeroWinner = FHE.allowThis(zeroWinner);
        zeroWinner = FHE.allow(zeroWinner, owner);

        currentRoundId += 1;
        roundId = currentRoundId;

        RoundState storage round = rounds[roundId];
        round.secretNumber = sanitizedSecret;
        round.potAmount = initialPot;
        round.winningPlayer = zeroWinner;
        round.startTime = start;
        round.endTime = end;
        round.totalGuesses = 0;
        round.isActive = true;
        round.isRevealed = false;
        round.revealPending = false;
        round.revealedSecret = 0;
        round.winner = address(0);

        emit RoundCreated(roundId, start, end, ENTRY_FEE_WEI);
    }

    /**
     * @notice Submits an encrypted guess for a specific round
     * @dev Applies fail-closed sanitization and grants ACL permissions per-player
     */
    function submitGuess(
        uint256 roundId,
        externalEuint16 encryptedGuess,
        bytes calldata inputProof
    ) external payable roundActive(roundId) {
        if (msg.value != ENTRY_FEE_WEI) revert InvalidEntryFee();

        RoundState storage round = rounds[roundId];
        PlayerState storage player = playerStates[roundId][msg.sender];
        if (player.hasSubmitted) revert PlayerAlreadyParticipated();

        euint16 importedGuess = FHE.fromExternal(encryptedGuess, inputProof);
        euint16 sanitizedGuess = _sanitizeGuess(importedGuess);
        sanitizedGuess = FHE.allowThis(sanitizedGuess);
        sanitizedGuess = FHE.allow(sanitizedGuess, msg.sender);

        player.hasSubmitted = true;
        player.guessTime = uint40(block.timestamp);
        player.encryptedGuess = sanitizedGuess;

        ebool isCorrect = FHE.eq(sanitizedGuess, round.secretNumber);
        ebool isHigher = FHE.gt(sanitizedGuess, round.secretNumber);

        euint16 hint = FHE.select(
            isCorrect,
            FHE.asEuint16(0),
            FHE.select(isHigher, FHE.asEuint16(1), FHE.asEuint16(2))
        );
        hint = FHE.allowThis(hint);
        hint = FHE.allow(hint, msg.sender);
        player.encryptedHint = hint;

        round.potAmount = FHE.add(round.potAmount, FHE.asEuint64(ENTRY_FEE_WEI));
        round.potAmount = FHE.allowThis(round.potAmount);
        round.potAmount = FHE.allow(round.potAmount, owner);

        round.totalGuesses += 1;

        eaddress candidate = FHE.asEaddress(msg.sender);
        candidate = FHE.allowThis(candidate);
        round.winningPlayer = FHE.select(isCorrect, candidate, round.winningPlayer);
        round.winningPlayer = FHE.allowThis(round.winningPlayer);
        round.winningPlayer = FHE.allow(round.winningPlayer, owner);

        playerStats[msg.sender] += 1;

        emit GuessSubmitted(
            roundId,
            msg.sender,
            player.guessTime,
            FHE.toBytes32(sanitizedGuess),
            FHE.toBytes32(hint)
        );
    }

    /**
     * @notice Closes a round once the deadline has passed
     */
    function endRound(uint256 roundId) external onlyOwner {
        RoundState storage round = _getRound(roundId);
        if (!round.isActive) revert RoundNotActive();
        if (block.timestamp < round.endTime) revert RoundStillOpen();

        round.isActive = false;
        emit RoundClosed(roundId, uint40(block.timestamp));
    }

    /**
     * @notice Make round data publicly decryptable (fhevm 0.9.x Self-Relaying mode)
     * @dev Marks the encrypted values as decryptable, allowing anyone to decrypt off-chain
     */
    function makeRoundDecryptable(uint256 roundId) external onlyOwner {
        RoundState storage round = _getRound(roundId);
        if (round.isActive) revert RoundStillOpen();
        if (round.isRevealed) revert RoundAlreadyRevealed();

        // Mark encrypted values as publicly decryptable
        round.secretNumber = FHE.makePubliclyDecryptable(round.secretNumber);
        round.winningPlayer = FHE.makePubliclyDecryptable(round.winningPlayer);

        round.revealPending = true;

        emit RevealRequested(roundId, 0); // requestId = 0 in v0.9
    }

    /**
     * @notice Reveal round results with decrypted proof (fhevm 0.9.x Self-Relaying mode)
     * @dev Anyone can call this after off-chain decryption. Contract verifies the proof.
     * @param roundId The round to reveal
     * @param secretNumber The decrypted secret number
     * @param winner The decrypted winner address
     * @param decryptionProof The KMS signature proof from off-chain decryption
     */
    function revealRoundWithProof(
        uint256 roundId,
        uint16 secretNumber,
        address winner,
        bytes memory decryptionProof
    ) external {
        RoundState storage round = _getRound(roundId);
        if (!round.revealPending) revert RoundRevealNotPending();
        if (round.isRevealed) revert RoundAlreadyRevealed();

        // Prepare handles and cleartexts for verification
        bytes32[] memory handles = new bytes32[](2);
        handles[0] = FHE.toBytes32(round.secretNumber);
        handles[1] = FHE.toBytes32(round.winningPlayer);

        bytes memory cleartexts = abi.encode(secretNumber, winner);

        // Verify the KMS signatures (fails if invalid)
        FHE.checkSignatures(handles, cleartexts, decryptionProof);

        // Update round state with verified plaintext values
        round.isRevealed = true;
        round.revealPending = false;
        round.revealedSecret = secretNumber;
        round.winner = winner;
        round.isActive = false;

        emit RoundRevealed(roundId, secretNumber, winner);
    }

    /**
     * @notice Returns core round metadata including encrypted pot size
     */
    function getRoundInfo(
        uint256 roundId
    )
        external
        view
        returns (uint256 startTime, uint256 endTime, bool isActive, uint256 totalGuesses, euint64 potAmount)
    {
        RoundState storage round = _getRound(roundId);
        bool active = round.isActive && block.timestamp <= round.endTime;
        return (round.startTime, round.endTime, active, round.totalGuesses, round.potAmount);
    }

    /**
     * @notice Exposes reveal status and plaintext outcomes (post-reveal)
     */
    function getRevealStatus(
        uint256 roundId
    ) external view returns (bool isRevealed, bool revealPending, uint16 revealedSecret, address winner) {
        RoundState storage round = _getRound(roundId);
        return (round.isRevealed, round.revealPending, round.revealedSecret, round.winner);
    }

    /**
     * @notice Returns per-player encrypted state for UI hydration
     */
    function getPlayerState(
        uint256 roundId,
        address player
    ) external view returns (bool hasSubmitted, uint40 guessTime, euint16 encryptedGuess, euint16 encryptedHint) {
        PlayerState storage state = playerStates[roundId][player];
        euint16 hint = state.hasSubmitted ? state.encryptedHint : encryptedZeroHint;
        return (state.hasSubmitted, state.guessTime, state.encryptedGuess, hint);
    }

    /**
     * @notice Convenience helper returning the encrypted hint for a player
     */
    function getHint(uint256 roundId, address player) external view returns (euint16) {
        PlayerState storage state = playerStates[roundId][player];
        return state.hasSubmitted ? state.encryptedHint : encryptedZeroHint;
    }

    /**
     * @notice Legacy getter preserving previous interface compatibility
     */
    function getPlayerGuess(uint256 roundId, address player) external view returns (bool, uint256) {
        PlayerState storage state = playerStates[roundId][player];
        return (state.hasSubmitted, state.guessTime);
    }

    /**
     * @notice Returns plaintext winner status after reveal completes
     */
    function hasPlayerWon(uint256 roundId, address player) external view returns (bool) {
        RoundState storage round = rounds[roundId];
        if (round.startTime == 0 || !round.isRevealed) {
            return false;
        }
        return round.winner == player;
    }

    /**
     * @notice Exposes encrypted pot and winner handles for front-end integrations
     */
    function getEncryptedPot(uint256 roundId) external view returns (euint64) {
        return _getRound(roundId).potAmount;
    }

    function getEncryptedWinner(uint256 roundId) external view returns (eaddress) {
        return _getRound(roundId).winningPlayer;
    }

    /**
     * @notice Transfers contract ownership to a new admin address
     */
    function transferOwnership(address newOwner) external onlyOwner {
        if (newOwner == address(0)) revert InvalidOwner();
        emit OwnershipTransferred(owner, newOwner);
        owner = newOwner;
    }

    /**
     * @notice Withdraws accumulated ETH to the owner or specified recipient
     */
    function withdraw(address payable recipient) external onlyOwner {
        address payable target = recipient == address(0) ? payable(owner) : recipient;
        target.transfer(address(this).balance);
    }

    /**
     * @notice Emergency circuit breaker to pause a round
     */
    function emergencyPause(uint256 roundId) external onlyOwner {
        RoundState storage round = _getRound(roundId);
        round.isActive = false;
    }

    function _getRound(uint256 roundId) private view returns (RoundState storage round) {
        round = rounds[roundId];
        if (round.startTime == 0) revert RoundDoesNotExist();
    }

    function _sanitizeGuess(euint16 value) private returns (euint16) {
        ebool aboveMin = FHE.ge(value, FHE.asEuint16(MIN_GUESS));
        ebool belowMax = FHE.le(value, FHE.asEuint16(MAX_GUESS));
        ebool withinRange = FHE.and(aboveMin, belowMax);
        return FHE.select(withinRange, value, FHE.asEuint16(MIN_GUESS));
    }
}
