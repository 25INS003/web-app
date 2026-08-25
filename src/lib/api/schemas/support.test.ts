import { describe, expect, it } from "vitest";
import { threadSenderNamer, ticketRaiserName } from "./support";

// Naming the people in a thread, which is the whole job of a support screen.
//
// Every message carries `sender_id` as a bare uuid — there is no populated
// sender anywhere in the response — so a screen that reads the id alone can
// only ever print the "User" fallback. The names it needs are on the ticket:
// the raiser, and the participants an admin brought in.

const CUSTOMER = "11111111-1111-4111-8111-111111111111";
const OWNER = "22222222-2222-4222-8222-222222222222";
const ADMIN = "33333333-3333-4333-8333-333333333333";

const ticket = {
  user_id: CUSTOMER,
  user: { id: CUSTOMER, first_name: "Bench", last_name: "Customer" },
  participants: [
    {
      id: "p1",
      user: {
        id: OWNER,
        first_name: "Test",
        last_name: "Seller",
        user_type: "shop_owner",
      },
    },
  ],
};

describe("threadSenderNamer", () => {
  it("names the customer who raised the ticket", () => {
    expect(threadSenderNamer(ticket)(CUSTOMER)).toBe("Bench Customer");
  });

  it("names a shop owner who was brought in", () => {
    // The bug this replaces: the rule was "anyone who is not the raiser is
    // support", which was true until a thread could hold three people. It put
    // "Support" on the shop's replies — on the one screen where an agent needs
    // to tell the shop's answer from their own colleague's.
    expect(threadSenderNamer(ticket)(OWNER)).toBe("Test Seller");
  });

  it("calls anyone else support", () => {
    // Admins are not on the ticket as participants, and the status lines the
    // server writes are posted under an admin's id. Both are support.
    expect(threadSenderNamer(ticket)(ADMIN)).toBe("Support");
  });

  it("calls an unattributed message support rather than 'User'", () => {
    expect(threadSenderNamer(ticket)(null)).toBe("Support");
  });

  it("falls back to an email when a participant has no name", () => {
    const namer = threadSenderNamer({
      user_id: CUSTOMER,
      // Only `user` — the namer reads nothing else off a participant, and the
      // `ticket` above already covers the full row shape.
      participants: [{ user: { id: OWNER, email: "owner@example.com" } }],
    });
    expect(namer(OWNER)).toBe("owner@example.com");
  });

  it("works on a ticket with no participants at all", () => {
    const namer = threadSenderNamer({ user_id: CUSTOMER, user: ticket.user });
    expect(namer(CUSTOMER)).toBe("Bench Customer");
    expect(namer(ADMIN)).toBe("Support");
  });

  it("reads a populated user_id, not only the separate `user`", () => {
    // Older responses populate `user_id` itself; both shapes are in the wild.
    const namer = threadSenderNamer({
      user_id: { id: CUSTOMER, first_name: "Bench", last_name: "Customer" },
    });
    expect(namer(CUSTOMER)).toBe("Bench Customer");
  });
});

describe("ticketRaiserName", () => {
  it("prefers the populated `user` over the bare `user_id`", () => {
    expect(ticketRaiserName(ticket)).toBe("Bench Customer");
  });

  it("falls back to `user_id` when it is the populated one", () => {
    expect(
      ticketRaiserName({ user_id: { id: CUSTOMER, first_name: "Solo" } }),
    ).toBe("Solo");
  });
});
