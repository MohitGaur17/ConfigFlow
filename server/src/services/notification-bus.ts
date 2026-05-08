import { Response } from "express";

type Subscriber = {
  id: string;
  res: Response;
};

const subscribers: Map<string, Subscriber[]> = new Map();

export function subscribe(userId: string, res: Response) {
  res.setHeader("Content-Type", "text/event-stream");
  res.setHeader("Cache-Control", "no-cache");
  res.setHeader("Connection", "keep-alive");
  res.flushHeaders?.();

  const sub: Subscriber = { id: Math.random().toString(36).slice(2), res };

  const list = subscribers.get(userId) || [];
  list.push(sub);
  subscribers.set(userId, list);

  // send a ping to establish connection
  try {
    res.write(`: connected\n\n`);
  } catch (e) {
    // ignore
  }

  const onClose = () => {
    const cur = subscribers.get(userId) || [];
    const filtered = cur.filter((s) => s.id !== sub.id);
    if (filtered.length) subscribers.set(userId, filtered);
    else subscribers.delete(userId);
  };

  res.on("close", onClose);
  res.on("finish", onClose);
}

export function publishToUser(userId: string, event: string, data: unknown) {
  const list = subscribers.get(userId) || [];

  const payload = typeof data === "string" ? data : JSON.stringify(data);

  for (const sub of list) {
    try {
      sub.res.write(`event: ${event}\n`);
      sub.res.write(`data: ${payload}\n\n`);
    } catch (e) {
      // connection may be closed; ignore and let close handlers clean up
    }
  }
}

export function publishToUsers(userIds: string[], event: string, data: unknown) {
  for (const id of userIds) publishToUser(id, event, data);
}

export default { subscribe, publishToUser, publishToUsers };
