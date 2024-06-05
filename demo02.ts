import { ChatOpenAI } from "@langchain/openai";
import { BaseChatMessageHistory, BaseListChatMessageHistory, InMemoryChatMessageHistory } from "@langchain/core/chat_history";
import { ChatPromptTemplate } from "@langchain/core/prompts";
import { RunnablePassthrough, RunnableSequence, RunnableWithMessageHistory } from "@langchain/core/runnables";
import 'dotenv/config'
import { AIMessage, HumanMessage } from "@langchain/core/messages";
import type { BaseMessage } from "@langchain/core/messages";

// model
const model = new ChatOpenAI({model: "gpt-3.5-turbo"});

// message
const messages = [
  new HumanMessage({ content: "こんにちは！私の名前は太郎です" }),
  new AIMessage({ content: "こんにちは！" }),
  new HumanMessage({ content: "私はバニアアイスクリームが好きです" }),
  new AIMessage({ content: "いいですね" }),
  new HumanMessage({ content: "2 + 2 は？" }),
  new AIMessage({ content: "4" }),
  new HumanMessage({ content: "ありがとう" }),
  new AIMessage({ content: "どういたしまして" }),
];

// prompt
const prompt = ChatPromptTemplate.fromMessages([
  [
    "system",
    `あなたは私が送ったメッセージをすべて覚えている親切なアシスタントです。`,
  ],
  ["placeholder", "{chat_history}"],
  // equivalent to the following code:
  // new MessagesPlaceholder("chat_history"),
  ["human", "{input}"],
]);

// chain
const chain = RunnableSequence.from([
  RunnablePassthrough.assign({
    chat_history: ({ chat_history }: { chat_history: BaseMessage[] }) => {
      return chat_history.slice(-10);
    },
  }),
  prompt,
  model,
]);
const messageHistories: Record<string, InMemoryChatMessageHistory> = {};

const withMessageHistory = new RunnableWithMessageHistory({
  runnable: chain,
  getMessageHistory: async (sessionId): Promise<BaseListChatMessageHistory | BaseChatMessageHistory> => {
    if (messageHistories[sessionId] === undefined) {
      const messageHistory = new InMemoryChatMessageHistory();
      await messageHistory.addMessages(messages);
      messageHistories[sessionId] = messageHistory;
    }
    return messageHistories[sessionId]!;
  },
  inputMessagesKey: "input",
  historyMessagesKey: "chat_history",
});

const config = {
  configurable: {
    sessionId: "abc4",
  },
};

const response = await withMessageHistory.invoke(
  {
    input: "私の好きなアイスクリームは？",
  } as { chat_history: BaseMessage[]; input: string },
  config
) 

console.log(response.content);

const response2 = await withMessageHistory.invoke(
  {
    input: "私の好きなアイスクリームは？",
  } as { chat_history: BaseMessage[]; input: string },
  config
) 

console.log(response2.content);