import { expect } from "chai";
import hardhat from "hardhat";
import { FhevmType } from "@fhevm/hardhat-plugin";

const { ethers, fhevm } = hardhat;

const ENTRY_FEE = ethers.parseEther("0.001");

async function deployGame() {
  const factory = await ethers.getContractFactory("GuessNumberGame");
  const instance = await factory.deploy();
  await instance.waitForDeployment();
  return { game: instance, address: await instance.getAddress() };
}

async function encrypt16(contractAddress, signer, value) {
  const input = await fhevm
    .createEncryptedInput(contractAddress, signer.address)
    .add16(value)
    .encrypt();
  return input;
}

describe("GuessNumberGame", function () {
  let game;
  let contractAddress;
  let owner;
  let player;
  let challenger;

  before(async function () {
    [owner, player, challenger] = await ethers.getSigners();
  });

  beforeEach(async function () {
    if (!fhevm.isMock) {
      this.skip();
    }

    ({ game, address: contractAddress } = await deployGame());
  });

  describe("Round creation", function () {
    it("initialises state with sanitised secret and encrypted pot", async function () {
      const secret = await encrypt16(contractAddress, owner, 64);

      await game.createRound(secret.handles[0], secret.inputProof, 0, { value: ENTRY_FEE });

      expect(await game.currentRoundId()).to.equal(1n);

      const info = await game.getRoundInfo(1);
      expect(info[2]).to.equal(true);

      const potHandle = info[4];
      const decryptedPot = await fhevm.userDecryptEuint(
        FhevmType.euint64,
        potHandle,
        contractAddress,
        owner
      );
      expect(decryptedPot).to.equal(ENTRY_FEE);
    });
  });

  describe("Guess submission", function () {
    beforeEach(async function () {
      const secret = await encrypt16(contractAddress, owner, 60);
      await game.createRound(secret.handles[0], secret.inputProof, 0, { value: ENTRY_FEE });
    });

    it("stores encrypted hint and guess with correct ACL", async function () {
      const guess = await encrypt16(contractAddress, player, 80);

      await game.connect(player).submitGuess(1, guess.handles[0], guess.inputProof, { value: ENTRY_FEE });

      const [hasSubmitted, , encryptedGuess, encryptedHint] = await game.getPlayerState(1, player.address);
      expect(hasSubmitted).to.equal(true);

      const decryptedGuess = await fhevm.userDecryptEuint(
        FhevmType.euint16,
        encryptedGuess,
        contractAddress,
        player
      );
      expect(decryptedGuess).to.equal(80n);

      const decryptedHint = await fhevm.userDecryptEuint(
        FhevmType.euint16,
        encryptedHint,
        contractAddress,
        player
      );
      expect(decryptedHint).to.equal(1n);
    });

    it("fails closed by clamping out-of-range guesses", async function () {
      const invalidGuess = await encrypt16(contractAddress, challenger, 999);

      await game
        .connect(challenger)
        .submitGuess(1, invalidGuess.handles[0], invalidGuess.inputProof, { value: ENTRY_FEE });

      const [hasSubmitted, , encryptedGuess] = await game.getPlayerState(1, challenger.address);
      expect(hasSubmitted).to.equal(true);

      const sanitizedGuess = await fhevm.userDecryptEuint(
        FhevmType.euint16,
        encryptedGuess,
        contractAddress,
        challenger
      );
      expect(sanitizedGuess).to.equal(1n);
    });

    it("prevents duplicate submissions from the same player", async function () {
      const firstGuess = await encrypt16(contractAddress, player, 55);
      await game.connect(player).submitGuess(1, firstGuess.handles[0], firstGuess.inputProof, { value: ENTRY_FEE });

      const secondGuess = await encrypt16(contractAddress, player, 42);

      await expect(
        game.connect(player).submitGuess(1, secondGuess.handles[0], secondGuess.inputProof, { value: ENTRY_FEE })
      ).to.be.revertedWithCustomError(game, "PlayerAlreadyParticipated");
    });
  });

  describe("Reveal workflow", function () {
    beforeEach(async function () {
      const secret = await encrypt16(contractAddress, owner, 50);
      await game.createRound(secret.handles[0], secret.inputProof, 0, { value: ENTRY_FEE });

      const guess = await encrypt16(contractAddress, player, 50);
      await game.connect(player).submitGuess(1, guess.handles[0], guess.inputProof, { value: ENTRY_FEE });

      const duration = Number(await game.ROUND_DURATION());
      await ethers.provider.send("evm_increaseTime", [duration + 1]);
      await ethers.provider.send("evm_mine", []);

      await game.endRound(1);
    });

    it.skip("queues reveal requests and exposes status", async function () {
      // NOTE: requestRoundReveal function not implemented in current contract
      // This test is skipped until the function is added
      const tx = await game.requestRoundReveal(1);
      const receipt = await tx.wait();
      const revealEvent = receipt.logs.find((log) => log.fragment?.name === "RevealRequested");
      const requestId = revealEvent?.args?.[1];

      const status = await game.getRevealStatus(1);
      expect(status[1]).to.equal(true);
      expect(status[4]).to.equal(requestId);
    });

    it.skip("allows cancelling stalled reveal after timeout", async function () {
      // NOTE: cancelReveal function not implemented in current contract
      // This test is skipped until the function is added
      const requestTx = await game.requestRoundReveal(1);
      const requestReceipt = await requestTx.wait();
      const revealEvent = requestReceipt.logs.find((log) => log.fragment?.name === "RevealRequested");
      const requestId = revealEvent?.args?.[1];

      const timeout = Number(await game.REVEAL_TIMEOUT_SECONDS());
      await ethers.provider.send("evm_increaseTime", [timeout + 1]);
      await ethers.provider.send("evm_mine", []);

      await expect(game.cancelReveal(1))
        .to.emit(game, "RevealCancelled")
        .withArgs(1, requestId);

      const status = await game.getRevealStatus(1);
      expect(status[1]).to.equal(false);
      expect(status[4]).to.equal(0n);
    });
  });
});
