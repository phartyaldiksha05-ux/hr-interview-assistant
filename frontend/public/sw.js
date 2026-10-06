self.addEventListener("push", (event) => {
  let data = {};

  try {
    data = event.data ? event.data.json() : {};
  } catch {
    data = { body: event.data ? event.data.text() : "You have a Meetwise interview reminder." };
  }

  const title = data.title || "Meetwise";
  const body = data.body || "You have an upcoming interview reminder.";
  const interviewId = data.interview_id || data.interviewId;
  const url = interviewId ? `/interviews/${encodeURIComponent(interviewId)}` : "/interviews";

  event.waitUntil(
    self.registration.showNotification(title, {
      body,
      icon: "/meetwise-icon.svg",
      badge: "/meetwise-icon.svg",
      data: { url },
    })
  );
});

self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  const targetUrl = event.notification.data?.url || "/interviews";

  event.waitUntil(
    clients.matchAll({ type: "window", includeUncontrolled: true }).then((clientList) => {
      const absoluteUrl = new URL(targetUrl, self.location.origin).href;
      const existingClient = clientList.find((client) => client.url === absoluteUrl);

      if (existingClient) {
        return existingClient.focus();
      }

      const sameOriginClient = clientList.find((client) => client.url.startsWith(self.location.origin));
      if (sameOriginClient) {
        return sameOriginClient.navigate(absoluteUrl).then((client) => client?.focus());
      }

      return clients.openWindow(absoluteUrl);
    })
  );
});
