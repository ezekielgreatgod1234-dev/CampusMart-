const messages = [
  {
    id: 1,

    // SELLER INFORMATION
    sellerId: "seller-001",
    name: "Daniel Okoro",

    // PRODUCT
    productId: 1,
    productName: "HP EliteBook 840",

    lastMessage: "Is the laptop still available?",
    time: "10:42 AM",
    unread: 2,
    online: true,

    conversation: [
      {
        id: 1,
        sender: "them",
        text: "Hello, is the HP EliteBook still available?",
        time: "10:40 AM",
      },

      {
        id: 2,
        sender: "me",
        text: "Yes, it is still available.",
        time: "10:41 AM",
      },

      {
        id: 3,
        sender: "them",
        text: "Is the price negotiable?",
        time: "10:42 AM",
      },
    ],
  },

  {
    id: 2,

    sellerId: "seller-002",
    name: "Sarah Williams",

    productId: 2,
    productName: "Nike Air Force",

    lastMessage: "Thank you, I will check it out.",
    time: "9:30 AM",
    unread: 1,
    online: true,

    conversation: [
      {
        id: 1,
        sender: "them",
        text: "Hi, I saw your product on CampusMart.",
        time: "9:25 AM",
      },

      {
        id: 2,
        sender: "me",
        text: "Hello Sarah, which product are you interested in?",
        time: "9:27 AM",
      },

      {
        id: 3,
        sender: "them",
        text: "The Nike Air Force.",
        time: "9:29 AM",
      },

      {
        id: 4,
        sender: "them",
        text: "Thank you, I will check it out.",
        time: "9:30 AM",
      },
    ],
  },

  {
    id: 3,

    sellerId: "seller-003",
    name: "Michael Johnson",

    productId: 3,
    productName: "iPhone 14",

    lastMessage: "Can you reduce the price?",
    time: "Yesterday",
    unread: 0,
    online: false,

    conversation: [
      {
        id: 1,
        sender: "them",
        text: "Can you reduce the price?",
        time: "Yesterday",
      },

      {
        id: 2,
        sender: "me",
        text: "I can give you a little discount.",
        time: "Yesterday",
      },

      {
        id: 3,
        sender: "them",
        text: "How much is your final price?",
        time: "Yesterday",
      },
    ],
  },

  {
    id: 4,

    sellerId: "seller-004",
    name: "Blessing Chukwu",

    productId: 4,
    productName: "JBL Headphones",

    lastMessage: "Where can I meet you on campus?",
    time: "Yesterday",
    unread: 3,
    online: true,

    conversation: [
      {
        id: 1,
        sender: "them",
        text: "Where can I meet you on campus?",
        time: "Yesterday",
      },

      {
        id: 2,
        sender: "me",
        text: "We can meet at the library.",
        time: "Yesterday",
      },

      {
        id: 3,
        sender: "them",
        text: "What time will you be there?",
        time: "Yesterday",
      },
    ],
  },

  {
    id: 5,

    sellerId: "seller-005",
    name: "David Emmanuel",

    productId: 5,
    productName: "Samsung Galaxy S23",

    lastMessage: "Okay, I will make the payment.",
    time: "Monday",
    unread: 0,
    online: false,

    conversation: [
      {
        id: 1,
        sender: "them",
        text: "Okay, I will make the payment.",
        time: "Monday",
      },

      {
        id: 2,
        sender: "me",
        text: "Alright, I'll be waiting.",
        time: "Monday",
      },
    ],
  },
];

export default messages;