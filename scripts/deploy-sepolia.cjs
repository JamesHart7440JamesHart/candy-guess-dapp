const { ethers } = require("hardhat");
const hre = require("hardhat");
const { writeFileSync } = require("fs");
const { join } = require("path");

async function main() {
  console.log("🚀 Deploying GuessNumberGame to Sepolia...");

  const [deployer] = await ethers.getSigners();
  console.log(`📝 Deploying from account: ${deployer.address}`);

  const GuessNumberGame = await ethers.getContractFactory("GuessNumberGame");

  // Deploy the contract
  console.log("📦 Deploying contract...");
  const game = await GuessNumberGame.deploy();

  // Wait for deployment to complete
  await game.waitForDeployment();

  const contractAddress = await game.getAddress();
  console.log(`✅ Contract deployed to: ${contractAddress}`);

  // Save deployment info
  const deploymentInfo = {
    contractAddress,
    network: "sepolia",
    chainId: 11155111,
    deployer: deployer.address,
    deploymentTime: new Date().toISOString(),
    transactionHash: game.deploymentTransaction()?.hash,
  };

  // Write to deployment.json
  writeFileSync(
    join(__dirname, "../deployment.json"),
    JSON.stringify(deploymentInfo, null, 2)
  );

  // Write to .env.local for frontend
  const envContent = `NEXT_PUBLIC_CONTRACT_ADDRESS=${contractAddress}
NEXT_PUBLIC_SEPOLIA_RPC_URL=${process.env.NEXT_PUBLIC_SEPOLIA_RPC_URL || "https://ethereum-sepolia-rpc.publicnode.com"}
NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID=${process.env.NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID || ""}
NEXT_PUBLIC_DEFAULT_ROUND_ID=${process.env.NEXT_PUBLIC_DEFAULT_ROUND_ID || "1"}
`;
  writeFileSync(join(__dirname, "../.env.local"), envContent);

  console.log("📝 Deployment info saved to deployment.json");
  console.log("📝 Environment variables saved to .env.local");

  // Verify contract (optional)
  if (process.env.ETHERSCAN_API_KEY) {
    console.log("🔍 Verifying contract on Etherscan...");
    console.log("⏳ Waiting for 30 seconds before verification...");
    await new Promise(resolve => setTimeout(resolve, 30000));

    try {
      await hre.run("verify:verify", {
        address: contractAddress,
        constructorArguments: [],
      });
      console.log("✅ Contract verified on Etherscan");
    } catch (error) {
      console.log("⚠️ Contract verification failed:", error.message);
    }
  }

  console.log("🎉 Deployment completed successfully!");
  console.log(`🔗 View on Etherscan: https://sepolia.etherscan.io/address/${contractAddress}`);
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("❌ Deployment failed:", error);
    process.exit(1);
  });
