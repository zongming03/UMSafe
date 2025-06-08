 const showNotification = (message) => {
    const notification = document.createElement("div");
    notification.className =
      "fixed top-4 right-4 bg-green-50 text-green-800 px-4 py-3 rounded-lg shadow-lg z-50 flex items-center";
    notification.innerHTML = `<span>${message}</span>`;
    document.body.appendChild(notification);
    setTimeout(() => {
      notification.remove();
    }, 3000);
  };

  export default showNotification;