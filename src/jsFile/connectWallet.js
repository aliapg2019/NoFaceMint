const connectWalletButtonDesktop = document.getElementById("connect-wallet-desktop");
const connectWalletButtonMobile = document.getElementById("connect-wallet-mobile");

let myPublicKey;
async function test() {

  try {
    const { publicKey } = await window.solana.connect();
    myPublicKey = publicKey.toString();
    connectWalletButtonDesktop.textContent = shortenAddress(myPublicKey); // نمایش آدرس کوتاه شده
    connectWalletButtonMobile.textContent = shortenAddress(myPublicKey);
    // showNotification("Wallet connected successfully");
  } catch (error) {
    console.log(error);
    connectWalletButtonDesktop.textContent = "Error connecting to wallet";
    connectWalletButtonMobile.textContent = shortenAddress(myPublicKey);
    // showNotification("Error connecting to wallet", true);
  }

  return myPublicKey;
}
// تابعی برای کوتاه کردن آدرس
function shortenAddress(address) {
  if (!address) return '';
  const start = address.slice(0, 6); // 6 کاراکتر اول
  const end = address.slice(-4); // 4 کاراکتر آخر
  return `${start}...${end}`;
}

connectWalletButtonDesktop.addEventListener("click", async () => {
  await test()
});
connectWalletButtonMobile.addEventListener("click", async () => {
  await test();
  console.log("ok");
});



export default test;