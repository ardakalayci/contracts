// Import ethers from Hardhat package
import readline from "readline";

const { ethers } = require("hardhat");
//nullable int

let chatId = -1;
async function main() {
  const contractABI = [
    "function startChat(string memory message) public returns (uint)",
    "function addMessage(string memory message, uint runId) public",
    "function getMessageHistory(uint chatId) public view returns (tuple(string role, tuple(string contentType,string value)[] content)[] memory)"
  ];

  const contractAddress = "0x079efB8329C1a9e92153DF1E1757bDF823e1CA31";
  const [signer] = await ethers.getSigners();

  // Create a contract instance
  const contract = new ethers.Contract(contractAddress, contractABI, signer);
  const message = await getUserInput();

  // Call the startChat function

  const transactionResponse = chatId != -1 ? await contract.addMessage(message, chatId) : await contract.startChat(message);
  const receipt = await transactionResponse.wait();
  console.log(`Transaction sent, hash: ${receipt.hash}.\nExplorer: https://explorer.galadriel.com/tx/${receipt.hash}`)
  console.log(`Start with message: "${message}"`);

  chatId = chatId != -1 ? chatId : parseInt(BigInt(receipt["logs"][1].topics[2]).toString())

  // loop and sleep by 1000ms, and keep printing `lastResponse` in the contract.
  let lastResponse = await contract.getMessageHistory(chatId);
  let newResponse = lastResponse;

  // print w/o newline
  console.log("Waiting for response: ");
  while (newResponse.toString() === lastResponse.toString()) {
    await new Promise((resolve) => setTimeout(resolve, 1000));
    newResponse = await contract.getMessageHistory(chatId);
    console.log(".");
  }

  console.log(`answer: ${newResponse.toString().split("text,")[newResponse.toString().split("text,").length - 1]}`);
  await main();

}

async function getUserInput(): Promise<string | undefined> {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
  })

  const question = (query: string): Promise<string> => {
    return new Promise((resolve) => {
      rl.question(query, (answer) => {
        resolve(answer)
      })
    })
  }

  try {
    const input = await question("write something: ")
    rl.close()
    return input
  } catch (err) {
    console.error('Error getting user input:', err)
    rl.close()
  }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });