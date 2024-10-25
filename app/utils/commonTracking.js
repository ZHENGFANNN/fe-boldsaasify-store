export default function (name, data) {
  window.fbq("track", name, data);
  gtag("event", name, data);
}
