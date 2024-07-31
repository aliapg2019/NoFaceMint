const connectWalletButton = document.getElementById("connect-wallet");


let myPublicKey;

// تابعی برای کوتاه کردن آدرس
function shortenAddress(address) {
  if (!address) return '';
  const start = address.slice(0, 6); // 6 کاراکتر اول
  const end = address.slice(-4); // 4 کاراکتر آخر
  return `${start}...${end}`;
}

connectWalletButton.addEventListener("click", async () => {
  try {
    const { publicKey } = await window.solana.connect();
    myPublicKey = publicKey.toString();
    connectWalletButton.textContent = shortenAddress(myPublicKey); // نمایش آدرس کوتاه شده
    // showNotification("Wallet connected successfully");
  } catch (error) {
    console.log(error);
    connectWalletButton.textContent = "Error connecting to wallet";
    // showNotification("Error connecting to wallet", true);
  }
});
